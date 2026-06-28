import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// قاعدة بيانات OUI مختصرة لكشف نوع الجهاز من MAC
const OUI_DB: Record<string, { vendor: string; type: string }> = {
  "F8F8F8": { vendor: "TP-Link", type: "Router" },
  "F4F26D": { vendor: "TP-Link", type: "Router" },
  "0019E0": { vendor: "D-Link", type: "Router" },
  "00173F": { vendor: "Belkin", type: "Router" },
  "001A6B": { vendor: "Cisco", type: "Router" },
  "C46115": { vendor: "Huawei", type: "Smartphone" },
  "080F3E": { vendor: "Huawei", type: "Smartphone" },
  "00E04C": { vendor: "ASUSTek", type: "Laptop" },
  "00112F": { vendor: "ASUSTek", type: "Laptop" },
  "F099B6": { vendor: "Apple", type: "iPhone/iPad" },
  "ACDE48": { vendor: "Apple", type: "Mac" },
  "001B63": { vendor: "Apple", type: "Mac" },
  "001FA334": { vendor: "Apple", type: "iPhone" },
  "DCA632": { vendor: "Apple", type: "iPhone" },
  "BC52B7": { vendor: "Apple", type: "iPhone" },
  "3C22FB": { vendor: "Apple", type: "iPad" },
  "002500": { vendor: "Apple", type: "Mac" },
  "001DE0": { vendor: "Samsung", type: "Smartphone" },
  "00265E": { vendor: "Samsung", type: "Smartphone" },
  "0029C5": { vendor: "Samsung", type: "Smart TV" },
  "C0CB38": { vendor: "Samsung", type: "Smartphone" },
  "0050F1": { vendor: "Microsoft", type: "Surface/Xbox" },
  "281878": { vendor: "Microsoft", type: "Surface" },
  "FCC233": { vendor: "Microsoft", type: "Surface" },
  "00235C": { vendor: "Xiaomi", type: "Smartphone" },
  "8CBEBE": { vendor: "Xiaomi", type: "Smartphone" },
  "94D569": { vendor: "Xiaomi", type: "Smartphone" },
  "C47154": { vendor: "Lenovo", type: "Laptop" },
  "0026C7": { vendor: "Lenovo", type: "Laptop" },
  "0090F5": { vendor: "Lenovo", type: "Laptop" },
  "002128": { vendor: "Dell", type: "Laptop" },
  "00234D": { vendor: "Dell", type: "Laptop" },
  "001DE0": { vendor: "Dell", type: "Laptop" },
  "00C0EE": { vendor: "HP", type: "Laptop/Printer" },
  "001083": { vendor: "HP", type: "Printer" },
  "002128": { vendor: "HP", type: "Laptop" },
  "00268A": { vendor: "HP", type: "Laptop" },
  "001EC2": { vendor: "HP", type: "Printer" },
  "0021CC": { vendor: "HP", type: "Printer" },
  "000B82": { vendor: "Sony", type: "PlayStation" },
  "B827EB": { vendor: "Raspberry Pi", type: "SBC" },
  "DC5360": { vendor: "Raspberry Pi", type: "SBC" },
  "E45F01": { vendor: "Raspberry Pi", type: "SBC" },
  "0021CC": { vendor: "Espressif", type: "IoT/ESP32" },
  "5CCF7F": { vendor: "Espressif", type: "IoT/ESP8266" },
  "A4CF12": { vendor: "Espressif", type: "IoT/ESP32" },
  "FCF5C4": { vendor: "Tuya", type: "IoT/Smart Home" },
  "10D561": { vendor: "Tuya", type: "IoT/Smart Home" },
  "D8F15E": { vendor: "Google", type: "Chromecast/Nest" },
  "FCC233": { vendor: "Google", type: "Pixel" },
  "641C46": { vendor: "Google", type: "Pixel" },
  "4201D6": { vendor: "Amazon", type: "Echo/Fire TV" },
  "FC65DE": { vendor: "Amazon", type: "Echo" },
  "0022B0": { vendor: "Amazon", type: "Fire TV" },
};

interface NetworkDevice {
  ip: string;
  mac: string;
  vendor: string;
  type: string;
  oui: string;
  firstSeen: string;
  hostname?: string;
}

async function pingSweep(subnet: string): Promise<string[]> {
  try {
    // نحاول استخدام nmap لو متوفر، وإلا نستخدم ping
    const { stdout } = await execAsync(
      `nmap -sn ${subnet} 2>/dev/null | grep "Nmap scan report" | awk '{print $5}'`,
      { timeout: 30000 }
    );
    return stdout.trim().split("\n").filter(Boolean);
  } catch (e) {
    // لو nmap مش متاح، نرجع بـ empty
    return [];
  }
}

async function getMacFromIp(ip: string): Promise<string | null> {
  try {
    // على Linux/Mac: arp -n <ip>
    // على Windows: arp -a <ip>
    const { stdout } = await execAsync(`arp -n ${ip} 2>/dev/null || arp -a ${ip} 2>/dev/null`);
    const match = stdout.match(/([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}/);
    return match ? match[0] : null;
  } catch (e) {
    return null;
  }
}

async function getHostname(ip: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`nslookup ${ip} 2>/dev/null | grep "name =" | awk -F'= ' '{print $2}'`, { timeout: 5000 });
    return stdout.trim() || null;
  } catch (e) {
    return null;
  }
}

function getVendorFromMac(mac: string): { vendor: string; type: string; oui: string } {
  const oui = mac.replace(/[:\-]/g, "").toUpperCase().substring(0, 6);
  return {
    vendor: OUI_DB[oui]?.vendor || "Unknown",
    type: OUI_DB[oui]?.type || "Unknown",
    oui,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subnet } = body;

    // لو ما حددش subnet، نستخدم الشبكة الافتراضية
    const targetSubnet = subnet || "192.168.1.0/24";

    // نتحقق من صحة subnet
    if (!targetSubnet.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/)) {
      return NextResponse.json(
        { success: false, error: "Invalid subnet format. Example: 192.168.1.0/24" },
        { status: 400 }
      );
    }

    const devices: NetworkDevice[] = [];

    // نحاول عمل ping sweep
    const ips = await pingSweep(targetSubnet);

    if (ips.length === 0) {
      // لو ما قدرنا نعمل scan، نرجع بـ demo data
      return NextResponse.json({
        success: true,
        data: {
          subnet: targetSubnet,
          devices: [],
          note: "تعذّر الفحص التلقائي. هذه الميزة تحتاج backend على نفس الشبكة المحلية مع nmap مثبّت.",
          demoMode: true,
        },
      });
    }

    // نحصل على MAC address لكل IP
    for (const ip of ips) {
      const mac = await getMacFromIp(ip);
      if (mac) {
        const vendorInfo = getVendorFromMac(mac);
        const hostname = await getHostname(ip);
        devices.push({
          ip,
          mac,
          vendor: vendorInfo.vendor,
          type: vendorInfo.type,
          oui: vendorInfo.oui,
          firstSeen: new Date().toISOString(),
          hostname: hostname || undefined,
        });
      } else {
        // نضيف الجهاز بدون MAC
        devices.push({
          ip,
          mac: "Unknown",
          vendor: "Unknown",
          type: "Unknown",
          oui: "Unknown",
          firstSeen: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        subnet: targetSubnet,
        scanTime: new Date().toISOString(),
        devicesCount: devices.length,
        devices,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/devices/scan",
    description: "فحص أجهزة الشبكة المحلية (Network Devices Scanner)",
    usage: {
      method: "POST",
      body: { subnet: "string (optional) - default: 192.168.1.0/24" },
    },
    requirements: [
      "Backend must be on the same local network as target devices",
      "nmap and arp commands should be available",
      "Root/admin privileges may be required for some operations",
    ],
    supportedVendors: [...new Set(Object.values(OUI_DB).map((v) => v.vendor))].length + " vendors in database",
  });
}

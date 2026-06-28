import { NextRequest, NextResponse } from "next/server";
import net from "net";

// فحص البورتات على IP معين
// ملاحظة: هذا الفحص يتم من الخادم (server-side) ويعكس البورتات المفتوحة
// للـ IP العام فقط. للفحص المحلي، يجب تثبيت aircrack-ng على جهاز المستخدم.

const COMMON_PORTS: Record<number, string> = {
  20: "FTP Data",
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  143: "IMAP",
  161: "SNMP",
  389: "LDAP",
  443: "HTTPS",
  445: "SMB",
  514: "Syslog",
  587: "SMTP Submission",
  636: "LDAPS",
  993: "IMAPS",
  995: "POP3S",
  1433: "MSSQL",
  1521: "Oracle",
  3306: "MySQL",
  3389: "RDP",
  5432: "PostgreSQL",
  5900: "VNC",
  6379: "Redis",
  8080: "HTTP Alt",
  8443: "HTTPS Alt",
  8888: "HTTP Proxy",
  27017: "MongoDB",
  7547: "TR-069 (CWMP)",
  49152: "UPnP",
  49153: "UPnP",
};

async function scanPort(ip: string, port: number, timeoutMs = 3000): Promise<{
  port: number;
  service: string;
  isOpen: boolean;
  responseTime?: number;
}> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      const responseTime = Date.now() - start;
      socket.destroy();
      resolve({
        port,
        service: COMMON_PORTS[port] || "Unknown",
        isOpen: true,
        responseTime,
      });
    });
    
    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        port,
        service: COMMON_PORTS[port] || "Unknown",
        isOpen: false,
      });
    });
    
    socket.on("error", () => {
      socket.destroy();
      resolve({
        port,
        service: COMMON_PORTS[port] || "Unknown",
        isOpen: false,
      });
    });
    
    try {
      socket.connect(port, ip);
    } catch (e) {
      resolve({
        port,
        service: COMMON_PORTS[port] || "Unknown",
        isOpen: false,
      });
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetIp, ports } = body;

    if (!targetIp) {
      return NextResponse.json(
        { success: false, error: "Target IP is required" },
        { status: 400 }
      );
    }

    // التحقق من صحة IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(targetIp)) {
      return NextResponse.json(
        { success: false, error: "Invalid IP address format" },
        { status: 400 }
      );
    }

    // البورتات المراد فحصها
    const portsToScan = ports && Array.isArray(ports) && ports.length > 0
      ? ports
      : Object.keys(COMMON_PORTS).map(Number);

    // نفحص البورتات بشكل متوازي (بحد أقصى 20 في نفس الوقت)
    const batchSize = 20;
    const results: any[] = [];

    for (let i = 0; i < portsToScan.length; i += batchSize) {
      const batch = portsToScan.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((port: number) => scanPort(targetIp, port, 2500))
      );
      results.push(...batchResults);
    }

    const openPorts = results.filter((r) => r.isOpen);
    const closedPorts = results.filter((r) => !r.isOpen);

    // تقييم مستوى الأمان
    let securityScore = 100;
    const risks: string[] = [];
    
    // بورتات خطيرة مفتوحة
    const dangerousPorts = [23, 21, 161, 389, 1433, 3389, 7547];
    openPorts.forEach((p) => {
      if (dangerousPorts.includes(p.port)) {
        securityScore -= 15;
        risks.push(`${p.service} (${p.port}) - بورت خطير مفتوح`);
      }
    });

    if (securityScore < 0) securityScore = 0;

    return NextResponse.json({
      success: true,
      data: {
        target: targetIp,
        scanTime: new Date().toISOString(),
        totalPorts: portsToScan.length,
        openPortsCount: openPorts.length,
        closedPortsCount: closedPorts.length,
        openPorts,
        securityScore,
        risks,
        recommendation: getRecommendation(openPorts, securityScore),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getRecommendation(openPorts: any[], score: number): string[] {
  const recs: string[] = [];
  
  if (score >= 80) {
    recs.push("✅ الشبكة آمنة بشكل جيد");
  } else if (score >= 50) {
    recs.push("⚠️ الشبكة تحتاج لتحسينات أمنية");
  } else {
    recs.push("🔴 الشبكة معرضة للخطر، يجب إجراء تحسينات عاجلة");
  }

  openPorts.forEach((p) => {
    if (p.port === 23) recs.push("🔴 عطّل Telnet فوراً واستخدم SSH بدلاً منه");
    if (p.port === 21) recs.push("🔴 عطّل FTP واستخدم SFTP/SCP");
    if (p.port === 161) recs.push("🟡 قيّد SNMP بـ community string قوي أو عطّله");
    if (p.port === 3389) recs.push("🟡 قيّد RDP بـ VPN أو IP whitelist");
    if (p.port === 7547) recs.push("🔴 عطّل TR-069/CWMP لو ما تستخدمه");
    if (p.port === 49152 || p.port === 49153) recs.push("🟡 عطّل UPnP لو ما تحتاجه");
  });

  return recs;
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/scan/ports",
    description: "فحص البورتات المفتوحة على IP معين",
    usage: {
      method: "POST",
      body: {
        targetIp: "string (required) - مثال: 8.8.8.8",
        ports: "array (optional) - مثال: [80, 443, 22]",
      },
    },
    supportedPorts: Object.entries(COMMON_PORTS).map(([port, service]) => ({
      port: Number(port),
      service,
    })),
  });
}

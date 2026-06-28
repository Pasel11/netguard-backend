import { NextRequest, NextResponse } from "next/server";

// قاعدة بيانات ثغرات الراوترات الشائعة (CVE)
// محدثة بأشهر الثغرات المعروفة

interface CVE {
  id: string;
  vendor: string;
  model: string;
  severity: "critical" | "high" | "medium" | "low";
  cvss: number;
  title: string;
  description: string;
  affected: string;
  solution: string;
  published: string;
}

const CVE_DATABASE: CVE[] = [
  {
    id: "CVE-2024-21833",
    vendor: "TP-Link",
    model: "Archer C5400X",
    severity: "critical",
    cvss: 9.8,
    title: "Command Injection Vulnerability",
    description: "ثغرة حقن أوامر تسمح للمهاجم بتنفيذ أوامر نظام على الراوتر عن بُعد",
    affected: "Firmware versions prior to 1.1.6 Build 20190820",
    solution: "حدّث الفيرموير لأحدث إصدار من موقع TP-Link",
    published: "2024-01-15",
  },
  {
    id: "CVE-2023-33642",
    vendor: "D-Link",
    model: "DIR-820LA1",
    severity: "critical",
    cvss: 9.8,
    title: "Buffer Overflow",
    description: "ثغرة تجاوز سعة الذاكرة في معالجة طلبات HTTP تسمح بتنفيذ كود",
    affected: "All firmware versions (End of Life)",
    solution: "الجهاز لم يعد مدعومًا، يُنصح بشراء راوتر جديد",
    published: "2023-06-10",
  },
  {
    id: "CVE-2023-27932",
    vendor: "Netgear",
    model: "R6700",
    severity: "high",
    cvss: 8.8,
    title: "Authentication Bypass",
    description: "تجاوز المصادقة يسمح بالوصول للوحة التحكم بدون كلمة مرور",
    affected: "Firmware 1.0.11.122 and earlier",
    solution: "حدّث للفيرموير 1.0.11.122_1.0.1 أو أحدث",
    published: "2023-04-15",
  },
  {
    id: "CVE-2022-41155",
    vendor: "Huawei",
    model: "HG8245H",
    severity: "high",
    cvss: 8.2,
    title: "WPS PIN Brute Force",
    description: "ثغرة في WPS تسمح بكسر الـ PIN عبر brute force في 2-4 ساعات",
    affected: "All versions with WPS enabled",
    solution: "عطّل WPS من إعدادات الراوتر فوراً",
    published: "2022-11-20",
  },
  {
    id: "CVE-2022-26258",
    vendor: "D-Link",
    model: "DIR-825",
    severity: "critical",
    cvss: 9.1,
    title: "Remote Code Execution",
    description: "تنفيذ كود عن بُعد عبر ملفات تكوين الـ HNAP",
    affected: "Firmware versions before 2.13",
    solution: "حدّث الفيرموير أو استبدل الجهاز (End of Life)",
    published: "2022-04-05",
  },
  {
    id: "CVE-2021-20090",
    vendor: "Arcadyan",
    model: "Multiple (ASUS, BT, Sky routers)",
    severity: "critical",
    cvss: 9.8,
    title: "Authentication Bypass",
    description: "تجاوز المصادقة يسمح بالوصول الإداري بدون كلمة مرور",
    affected: "Multiple Arcadyan-based routers",
    solution: "اتصل بمزود الخدمة للحصول على تحديث",
    published: "2021-07-15",
  },
  {
    id: "CVE-2021-3536",
    vendor: "Zyxel",
    model: "USG/VPN Series",
    severity: "critical",
    cvss: 9.8,
    title: "Hardcoded Credentials",
    description: "بيانات اعتماد ثابتة في النظام تسمح بالوصول الإداري الكامل",
    affected: "ZLD firmware versions before 4.60",
    solution: "حدّث الفيرموير فوراً إلى 4.60 أو أحدث",
    published: "2021-04-28",
  },
  {
    id: "CVE-2020-3331",
    vendor: "Cisco",
    model: "RV110W/RV130W/RV215W",
    severity: "critical",
    cvss: 9.8,
    title: "RCE in Management Interface",
    description: "تنفيذ كود عن بُعد في واجهة الإدارة",
    affected: "All firmware versions",
    solution: "الأجهزة End of Life، استبدلها فوراً",
    published: "2020-06-03",
  },
  {
    id: "CVE-2019-1653",
    vendor: "Cisco",
    model: "RV320/RV325",
    severity: "critical",
    cvss: 10.0,
    title: "Information Disclosure",
    description: "تسريب بيانات الإدارة بما في ذلك كلمات المرور",
    affected: "Firmware versions prior to 1.4.2.28",
    solution: "حدّث الفيرموير فوراً",
    published: "2019-01-23",
  },
  {
    id: "CVE-2018-9995",
    vendor: "TBK",
    model: "DVR-4104/DVR-4216",
    severity: "critical",
    cvss: 9.8,
    title: "Credential Disclosure",
    description: "ثغرة تكشف بيانات الاعتماد عبر كوكي مخصص",
    affected: "All firmware versions",
    solution: "استبدل الجهاز بمنتج مدعوم",
    published: "2018-04-10",
  },
  {
    id: "CVE-2017-17215",
    vendor: "Huawei",
    model: "HG532",
    severity: "critical",
    cvss: 10.0,
    title: "Remote Code Execution via UPnP",
    description: "تنفيذ كود عن بُعد عبر بروتوكول UPnP",
    affected: "All firmware versions with UPnP enabled",
    solution: "عطّل UPnP وحدّث الفيرموير",
    published: "2017-12-08",
  },
  {
    id: "CVE-2016-10372",
    vendor: "Mikrotik",
    model: "RouterOS",
    severity: "high",
    cvss: 7.5,
    title: "DNS Cache Poisoning",
    description: "ثغرة في DNS تسمح بتسميم الكاش وإعادة توجيه المستخدمين",
    affected: "RouterOS versions before 6.38.5",
    solution: "حدّث RouterOS إلى 6.38.5 أو أحدث",
    published: "2016-12-15",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendor = searchParams.get("vendor")?.toLowerCase();
  const model = searchParams.get("model")?.toLowerCase();
  const minSeverity = searchParams.get("severity")?.toLowerCase();

  let results = [...CVE_DATABASE];

  if (vendor) {
    results = results.filter((cve) => cve.vendor.toLowerCase().includes(vendor));
  }
  if (model) {
    results = results.filter((cve) => cve.model.toLowerCase().includes(model));
  }
  if (minSeverity) {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const minLevel = severityOrder[minSeverity as keyof typeof severityOrder] || 0;
    results = results.filter(
      (cve) => severityOrder[cve.severity] >= minLevel
    );
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
    vendors: [...new Set(CVE_DATABASE.map((c) => c.vendor))],
    totalInDatabase: CVE_DATABASE.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendor, model } = body;

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor is required" },
        { status: 400 }
      );
    }

    const results = CVE_DATABASE.filter((cve) => {
      const vendorMatch = cve.vendor.toLowerCase().includes(vendor.toLowerCase());
      const modelMatch = model
        ? cve.model.toLowerCase().includes(model.toLowerCase())
        : true;
      return vendorMatch && modelMatch;
    });

    return NextResponse.json({
      success: true,
      searchQuery: { vendor, model },
      count: results.length,
      data: results,
      recommendation:
        results.length > 0
          ? `⚠️ تم العثور على ${results.length} ثغرة. تحقق من الحلول المقترحة لكل ثغرة.`
          : "✅ لم يتم العثور على ثغرات معروفة لهذا الموديل في قاعدة بياناتنا.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

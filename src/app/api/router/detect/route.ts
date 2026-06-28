import { NextRequest, NextResponse } from "next/server";

// كشف معلومات الراوتر من HTTP headers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routerIp } = body;

    if (!routerIp) {
      return NextResponse.json(
        { success: false, error: "Router IP is required" },
        { status: 400 }
      );
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(routerIp)) {
      return NextResponse.json(
        { success: false, error: "Invalid IP address" },
        { status: 400 }
      );
    }

    const results: any = {
      ip: routerIp,
      detected: false,
      vendor: null,
      model: null,
      firmware: null,
      openPorts: [],
      services: [],
      securityHeaders: {},
      risks: [],
    };

    // محاولة الوصول لصفحة الراوتر
    try {
      const response = await fetch(`http://${routerIp}/`, {
        signal: AbortSignal.timeout(5000),
        redirect: "manual",
      });

      results.httpStatus = response.status;

      // نقرأ الـ headers
      const server = response.headers.get("server");
      const wwwAuthenticate = response.headers.get("www-authenticate");
      const contentType = response.headers.get("content-type");
      const location = response.headers.get("location");

      results.securityHeaders = {
        server,
        wwwAuthenticate,
        contentType,
        location,
        xFrameOptions: response.headers.get("x-frame-options"),
        xContentTypeOptions: response.headers.get("x-content-type-options"),
        strictTransportSecurity: response.headers.get("strict-transport-security"),
      };

      // نحاول نكشف نوع الراوتر من Server header
      if (server) {
        if (/tp-link/i.test(server)) {
          results.vendor = "TP-Link";
          results.detected = true;
        } else if (/d-link/i.test(server)) {
          results.vendor = "D-Link";
          results.detected = true;
        } else if (/netgear/i.test(server)) {
          results.vendor = "Netgear";
          results.detected = true;
        } else if (/huawei/i.test(server)) {
          results.vendor = "Huawei";
          results.detected = true;
        } else if (/cisco/i.test(server)) {
          results.vendor = "Cisco";
          results.detected = true;
        } else if (/mikrotik/i.test(server)) {
          results.vendor = "MikroTik";
          results.detected = true;
        } else if (/asus/i.test(server)) {
          results.vendor = "ASUS";
          results.detected = true;
        } else if (/linksys/i.test(server)) {
          results.vendor = "Linksys";
          results.detected = true;
        } else if (/zyxel/i.test(server)) {
          results.vendor = "Zyxel";
          results.detected = true;
        }
        results.rawServer = server;
      }

      // فحص الـ redirect
      if (location) {
        results.redirectTo = location;
        if (/login|admin|setup/i.test(location)) {
          results.risks.push("الراوتر يعيد التوجيه لصفحة login (طبيعي)");
        }
      }

      // نحاول نقرأ الـ HTML
      const html = await response.text();
      if (html) {
        // البحث عن اسم الموديل
        const modelMatch = html.match(/model[:\s-]*([A-Z0-9-]{3,20})/i);
        if (modelMatch) {
          results.model = modelMatch[1];
        }
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          results.pageTitle = titleMatch[1].trim();
        }
        // البحث عن firmware
        const fwMatch = html.match(/firmware[:\s]*v?(\d+\.\d+\.\d+)/i);
        if (fwMatch) {
          results.firmware = fwMatch[1];
        }
      }
    } catch (e: any) {
      results.connectionError = e.message;
    }

    // تقييم الأمان
    if (results.securityHeaders.server) {
      results.risks.push("ℹ️ الـ Server header مكشوف - يكشف نوع الراوتر");
    }
    if (!results.securityHeaders.xFrameOptions) {
      results.risks.push("🟡 لا يوجد حماية clickjacking (X-Frame-Options)");
    }
    if (!results.securityHeaders.xContentTypeOptions) {
      results.risks.push("🟡 لا يوجد حماية MIME sniffing");
    }
    if (results.httpStatus === 401 && results.securityHeaders.wwwAuthenticate) {
      results.risks.push("🟢 الراوتر محمي بمصادقة HTTP Basic (جيد)");
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

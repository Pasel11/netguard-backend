import { NextRequest, NextResponse } from "next/server";

// الحصول على معلومات شبكة المستخدم الحقيقية
export async function GET(request: NextRequest) {
  try {
    // نحصل على IP العام من headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    
    const publicIp = cfConnectingIp || realIp || forwarded?.split(",")[0]?.trim() || "unknown";

    // نحصل على معلومات إضافية
    const userAgent = request.headers.get("user-agent") || "unknown";
    const acceptLanguage = request.headers.get("accept-language") || "unknown";
    const host = request.headers.get("host") || "unknown";

    // نحاول نحصل على معلومات الـ ISP من IP العام (باستخدام خدمة مجانية)
    let ipInfo: any = null;
    try {
      const ipResponse = await fetch(`https://ipapi.co/${publicIp}/json/`, {
        signal: AbortSignal.timeout(5000),
      });
      if (ipResponse.ok) {
        ipInfo = await ipResponse.json();
      }
    } catch (e) {
      // نتجاهل الخطأ ونكمل
    }

    return NextResponse.json({
      success: true,
      data: {
        publicIp,
        ipInfo: ipInfo ? {
          city: ipInfo.city,
          region: ipInfo.region,
          country: ipInfo.country_name,
          countryCode: ipInfo.country_code,
          isp: ipInfo.org,
          asn: ipInfo.asn,
          timezone: ipInfo.timezone,
          latitude: ipInfo.latitude,
          longitude: ipInfo.longitude,
        } : null,
        request: {
          host,
          userAgent: userAgent.substring(0, 200),
          language: acceptLanguage,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

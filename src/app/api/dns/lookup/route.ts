import { NextRequest, NextResponse } from "next/server";

// فحص DNS عبر DNS-over-HTTPS (DoH)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, recordType = "A" } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: "Domain is required" },
        { status: 400 }
      );
    }

    // نستخدم Cloudflare DNS-over-HTTPS
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType}`;
    
    const response = await fetch(dohUrl, {
      headers: {
        Accept: "application/dns-json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status}`);
    }

    const data = await response.json();

    // نحاول نحصل على معلومات إضافية
    let registrar: any = null;
    try {
      const rdapResponse = await fetch(
        `https://rdap.org/domain/${encodeURIComponent(domain)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (rdapResponse.ok) {
        const rdap = await rdapResponse.json();
        registrar = {
          name: rdap.events?.find((e: any) => e.eventAction === "registration")?.eventDate,
          registrar: rdap.entities?.find((e: any) => e.roles?.includes("registrar"))?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3],
          status: rdap.status,
        };
      }
    } catch (e) {
      // نتجاهل
    }

    return NextResponse.json({
      success: true,
      data: {
        domain,
        recordType,
        answers: data.Answers || [],
        status: data.Status,
        registrar,
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

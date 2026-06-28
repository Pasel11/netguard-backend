import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// AI-powered security recommendations
// يستخدم Z.AI LLM لتحليل نتائج الفحص وتقديم توصيات ذكية

interface ScanData {
  networkInfo?: any;
  portScan?: any;
  passwordAnalysis?: any;
  cveResults?: any[];
  routerInfo?: any;
  wpsResults?: any;
  wifiInfo?: any;
  sslScan?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scanData: ScanData = body.scanData || {};
    const language: "ar" | "en" = body.language || "ar";

    // تحضير ملخص الفحص لـ AI
    const scanSummary = prepareScanSummary(scanData);

    // إنشاء ZAI instance
    const zai = await ZAI.create();

    const systemPrompt = `You are a professional cybersecurity expert specializing in network security auditing. 
Analyze the provided network scan results and provide:
1. An overall security assessment (score 0-100)
2. Top 5 critical findings
3. Specific, actionable recommendations prioritized by importance
4. Risk assessment for common attack vectors
5. Compliance notes (if applicable)

Respond in ${language === "ar" ? "Arabic" : "English"}.
Format the response as JSON with the following structure:
{
  "overallScore": number,
  "riskLevel": "critical" | "high" | "medium" | "low",
  "criticalFindings": string[],
  "recommendations": [{"priority": "high"|"medium"|"low", "title": string, "description": string, "steps": string[]}],
  "attackVectors": [{"vector": string, "risk": string, "mitigation": string}],
  "summary": string
}`;

    const userPrompt = `Analyze this network security scan:\n\n${scanSummary}`;

    const response = await zai.chat.completions.create({
      model: "glm-4-plus",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const aiResponse = response.choices[0]?.message?.content || "";

    // محاولة parse JSON من الرد
    let parsedResponse;
    try {
      // استخراج JSON من الرد
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // إذا فشل parse، نرجّع النص الخام
    }

    return NextResponse.json({
      success: true,
      data: parsedResponse || { rawResponse: aiResponse },
      metadata: {
        model: "glm-4-plus",
        timestamp: new Date().toISOString(),
        language,
        scanDataSize: JSON.stringify(scanData).length,
      },
    });
  } catch (error: any) {
    console.error("AI Recommendations error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        fallback: getFallbackRecommendations(),
      },
      { status: 500 }
    );
  }
}

function prepareScanSummary(data: ScanData): string {
  const lines: string[] = [];

  if (data.networkInfo) {
    lines.push(`Network: IP=${data.networkInfo.publicIp}, ISP=${data.networkInfo.ipInfo?.isp || "Unknown"}`);
  }

  if (data.portScan) {
    lines.push(`Port Scan: ${data.portScan.openPortsCount} open ports out of ${data.portScan.totalPorts}`);
    lines.push(`Open ports: ${data.portScan.openPorts?.map((p: any) => `${p.port}(${p.service})`).join(", ") || "None"}`);
    lines.push(`Security score: ${data.portScan.securityScore}/100`);
    if (data.portScan.risks?.length > 0) {
      lines.push(`Risks: ${data.portScan.risks.join("; ")}`);
    }
  }

  if (data.passwordAnalysis) {
    lines.push(`Password: score=${data.passwordAnalysis.score}/100, strength=${data.passwordAnalysis.strength}`);
    lines.push(`Crack time (offline): ${data.passwordAnalysis.crackTime?.offline}`);
    if (data.passwordAnalysis.issues?.length > 0) {
      lines.push(`Issues: ${data.passwordAnalysis.issues.join("; ")}`);
    }
  }

  if (data.cveResults && data.cveResults.length > 0) {
    lines.push(`CVEs found: ${data.cveResults.length}`);
    lines.push(`Critical: ${data.cveResults.filter(c => c.severity === "critical").length}`);
    data.cveResults.forEach(cve => {
      lines.push(`- ${cve.id}: ${cve.title} (${cve.severity}, CVSS ${cve.cvss})`);
    });
  }

  if (data.routerInfo) {
    lines.push(`Router: ${data.routerInfo.vendor || "Unknown"} ${data.routerInfo.model || ""}`);
    lines.push(`Firmware: ${data.routerInfo.firmware || "Unknown"}`);
    if (data.routerInfo.risks?.length > 0) {
      lines.push(`Router risks: ${data.routerInfo.risks.join("; ")}`);
    }
  }

  if (data.wpsResults?.matchingAlgorithm) {
    lines.push(`WPS: ${data.wpsResults.detectedVendor} - PIN calculable (${data.wpsResults.matchingAlgorithm.vulnerabilityLevel} vulnerability)`);
  }

  if (data.wifiInfo) {
    lines.push(`WiFi: SSID=${data.wifiInfo.ssid}, BSSID=${data.wifiInfo.bssid}`);
    lines.push(`Connection: ${data.wifiInfo.connectionType}`);
  }

  if (data.sslScan) {
    lines.push(`SSL/TLS: score=${data.sslScan.securityScore}/100`);
    if (data.sslScan.issues?.length > 0) {
      lines.push(`SSL issues: ${data.sslScan.issues.join("; ")}`);
    }
  }

  return lines.join("\n");
}

function getFallbackRecommendations() {
  return {
    overallScore: 50,
    riskLevel: "medium",
    criticalFindings: [
      "Unable to perform AI analysis - providing basic recommendations",
    ],
    recommendations: [
      {
        priority: "high",
        title: "Disable WPS",
        description: "WPS is vulnerable to brute force attacks",
        steps: ["Access router admin panel", "Disable WPS option", "Use strong WPA2/WPA3 password"],
      },
      {
        priority: "high",
        title: "Update Router Firmware",
        description: "Outdated firmware contains known vulnerabilities",
        steps: ["Check current version", "Download latest from vendor", "Apply update"],
      },
      {
        priority: "medium",
        title: "Use Strong Password",
        description: "Use 16+ characters with mixed types",
        steps: ["Generate strong password", "Update WiFi password", "Reconnect devices"],
      },
    ],
    summary: "Basic security recommendations applied. Try again later for AI-powered analysis.",
  };
}

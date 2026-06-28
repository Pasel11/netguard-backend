import { NextRequest, NextResponse } from "next/server";

// مولّد تقرير أمان شامل - ينتج JSON قابل للتحويل لـ PDF
// ملاحظة: للتحويل الفعلي لـ PDF، استخدم مكتبة jsPDF على الـ client side

interface ScanResults {
  networkInfo?: any;
  portScan?: any;
  passwordAnalysis?: any;
  cveResults?: any[];
  routerInfo?: any;
  wpsResults?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scanResults: ScanResults = body.scanResults || {};

    // حساب الدرجة النهائية
    let finalScore = 100;
    const allVulnerabilities: any[] = [];
    const allRecommendations: string[] = [];

    // تحليل فحص البورتات
    if (scanResults.portScan) {
      const portScore = scanResults.portScan.securityScore;
      if (portScore !== undefined) {
        // وزن 30% من الدرجة
        const portDeduction = (100 - portScore) * 0.3;
        finalScore -= portDeduction;
      }
      scanResults.portScan.risks?.forEach((risk: string) => {
        allVulnerabilities.push({ category: "Ports", description: risk });
      });
      scanResults.portScan.recommendation?.forEach((rec: string) => {
        allRecommendations.push(rec);
      });
    }

    // تحليل كلمة المرور
    if (scanResults.passwordAnalysis) {
      const pwdScore = scanResults.passwordAnalysis.score;
      if (pwdScore !== undefined) {
        const pwdDeduction = (100 - pwdScore) * 0.3;
        finalScore -= pwdDeduction;
      }
      scanResults.passwordAnalysis.issues?.forEach((issue: string) => {
        allVulnerabilities.push({ category: "Password", description: issue });
      });
      scanResults.passwordAnalysis.suggestions?.forEach((sug: string) => {
        allRecommendations.push(sug);
      });
    }

    // تحليل CVE
    if (scanResults.cveResults && scanResults.cveResults.length > 0) {
      scanResults.cveResults.forEach((cve: any) => {
        const deduction = cve.severity === "critical" ? 15 : cve.severity === "high" ? 10 : 5;
        finalScore -= deduction;
        allVulnerabilities.push({
          category: "CVE",
          description: `${cve.id}: ${cve.title} (${cve.vendor} ${cve.model})`,
          severity: cve.severity,
        });
        allRecommendations.push(`${cve.id}: ${cve.solution}`);
      });
    }

    // تحليل WPS
    if (scanResults.wpsResults?.matchingAlgorithm) {
      const wpsLevel = scanResults.wpsResults.matchingAlgorithm.vulnerLevel;
      const wpsDeduction = wpsLevel === "critical" ? 20 : wpsLevel === "high" ? 15 : 8;
      finalScore -= wpsDeduction;
      allVulnerabilities.push({
        category: "WPS",
        description: `WPS PIN متوقع قابل للكسر (${scanResults.wpsResults.matchingAlgorithm.vendor})`,
        severity: wpsLevel,
      });
      allRecommendations.push("🔴 عطّل WPS فوراً من إعدادات الراوتر");
    }

    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    // تحديد المستوى العام
    let overallGrade: string;
    let gradeColor: string;
    if (finalScore >= 85) {
      overallGrade = "A+";
      gradeColor = "green";
    } else if (finalScore >= 70) {
      overallGrade = "B";
      gradeColor = "green";
    } else if (finalScore >= 55) {
      overallGrade = "C";
      gradeColor = "yellow";
    } else if (finalScore >= 40) {
      overallGrade = "D";
      gradeColor = "orange";
    } else {
      overallGrade = "F";
      gradeColor = "red";
    }

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "2.0",
        tool: "NetGuard Pro",
      },
      summary: {
        finalScore,
        overallGrade,
        gradeColor,
        totalVulnerabilities: allVulnerabilities.length,
        criticalCount: allVulnerabilities.filter((v) => v.severity === "critical").length,
        highCount: allVulnerabilities.filter((v) => v.severity === "high").length,
        mediumCount: allVulnerabilities.filter((v) => v.severity === "medium").length,
        lowCount: allVulnerabilities.filter((v) => v.severity === "low").length,
        openPortsCount: scanResults.portScan?.openPortsCount || 0,
        recommendationsCount: allRecommendations.length,
      },
      details: {
        networkInfo: scanResults.networkInfo,
        portScan: scanResults.portScan,
        passwordAnalysis: scanResults.passwordAnalysis
          ? {
              score: scanResults.passwordAnalysis.score,
              strength: scanResults.passwordAnalysis.strength,
              length: scanResults.passwordAnalysis.length,
              entropy: scanResults.passwordAnalysis.entropy,
              wpaRecommendation: scanResults.passwordAnalysis.wpaRecommendation,
            }
          : null,
        cveResults: scanResults.cveResults?.map((c: any) => ({
          id: c.id,
          title: c.title,
          severity: c.severity,
          cvss: c.cvss,
          vendor: c.vendor,
          model: c.model,
        })),
        routerInfo: scanResults.routerInfo
          ? {
              ip: scanResults.routerInfo.ip,
              vendor: scanResults.routerInfo.vendor,
              model: scanResults.routerInfo.model,
              firmware: scanResults.routerInfo.firmware,
            }
          : null,
        wpsResults: scanResults.wpsResults
          ? {
              detectedVendor: scanResults.wpsResults.detectedVendor,
              matchingAlgorithm: scanResults.wpsResults.matchingAlgorithm,
            }
          : null,
      },
      vulnerabilities: allVulnerabilities,
      recommendations: allRecommendations,
      conclusion: getConclusion(finalScore, allVulnerabilities.length),
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getConclusion(score: number, vulnCount: number): string {
  if (score >= 85) {
    return `🟢 شبكتك آمنة بشكل جيد (الدرجة: ${score}/100). تم اكتشاف ${vulnCount} مشكلة بسيطة. تابع الحفاظ على التحديثات الدورية للراوتر وكلمات المرور.`;
  } else if (score >= 55) {
    return `🟡 شبكتك تحتاج لتحسينات أمنية (الدرجة: ${score}/100). تم اكتشاف ${vulnCount} مشكلة. راجع التوصيات وطبّقها لرفع مستوى الأمان.`;
  } else if (score >= 40) {
    return `🔴 شبكتك معرضة للخطر (الدرجة: ${score}/100). تم اكتشاف ${vulnCount} ثغرة. يجب إجراء تحسينات عاجلة لتفادي الاختراق.`;
  } else {
    return `🚨 شبكتك في خطر كبير (الدرجة: ${score}/100). تم اكتشاف ${vulnCount} ثغرة خطيرة. اتخذ إجراءات فورية لتفادي الاختراق!`;
  }
}

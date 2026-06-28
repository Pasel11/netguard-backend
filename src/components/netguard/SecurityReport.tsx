'use client'

import { useState, useEffect } from "react";
import { FileText, Download, Award, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SecurityReport() {
  const { t, lang } = useI18n();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [storedResults, setStoredResults] = useState<any>({});
  const { toast } = useToast();

  // نجمع نتائج الفحوصات من localStorage
  useEffect(() => {
    try {
      const data = {
        networkInfo: JSON.parse(localStorage.getItem("netguard-network") || "null"),
        portScan: JSON.parse(localStorage.getItem("netguard-ports") || "null"),
        passwordAnalysis: JSON.parse(localStorage.getItem("netguard-password") || "null"),
        cveResults: JSON.parse(localStorage.getItem("netguard-cve") || "null"),
        routerInfo: JSON.parse(localStorage.getItem("netguard-router") || "null"),
        wpsResults: JSON.parse(localStorage.getItem("netguard-wps") || "null"),
      };
      setStoredResults(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanResults: storedResults }),
      });
      const data = await response.json();

      if (data.success) {
        setReport(data.data);
        toast({
          title: lang === "ar" ? "تم توليد التقرير" : "Report generated",
        });
      }
    } catch (e: any) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // عنوان
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("NetGuard Pro - Security Audit Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}`, pageWidth / 2, 28, { align: "center" });
    
    // خط فاصل
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(20, 32, pageWidth - 20, 32);

    // الملخص
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 20, 42);
    
    doc.setFontSize(24);
    const gradeColor: [number, number, number] = 
      report.summary.gradeColor === "green" ? [16, 185, 129] :
      report.summary.gradeColor === "yellow" ? [234, 179, 8] :
      report.summary.gradeColor === "orange" ? [249, 115, 22] :
      [239, 68, 68];
    doc.setTextColor(...gradeColor);
    doc.text(`${report.summary.finalScore}/100 (Grade: ${report.summary.overallGrade})`, 20, 55);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Vulnerabilities: ${report.summary.totalVulnerabilities}`, 20, 65);
    doc.text(`Critical: ${report.summary.criticalCount} | High: ${report.summary.highCount} | Medium: ${report.summary.mediumCount} | Low: ${report.summary.lowCount}`, 20, 72);
    doc.text(`Open Ports: ${report.summary.openPortsCount}`, 20, 79);
    doc.text(`Recommendations: ${report.summary.recommendationsCount}`, 20, 86);

    // جدول الثغرات
    if (report.vulnerabilities.length > 0) {
      autoTable(doc, {
        startY: 95,
        head: [["Category", "Description", "Severity"]],
        body: report.vulnerabilities.map((v: any) => [
          v.category,
          v.description.substring(0, 80),
          v.severity || "—",
        ]),
        theme: "grid",
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 8 },
      });
    }

    // التوصيات
    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations", 20, finalY + 10);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let y = finalY + 18;
    report.recommendations.forEach((rec: string, i: number) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5;
    });

    // الخاتمة
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Conclusion", 20, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const conclusionLines = doc.splitTextToSize(report.conclusion, pageWidth - 40);
    doc.text(conclusionLines, 20, y);

    // الفوتر
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("NetGuard Pro v2.0 | Generated by NetGuard Pro Security Audit Tool", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    doc.save(`netguard-security-report-${Date.now()}.pdf`);
    toast({
      title: lang === "ar" ? "تم تحميل التقرير" : "Report downloaded",
      description: "PDF saved to downloads",
    });
  };

  const collectedScans = Object.values(storedResults).filter(Boolean).length;

  return (
    <Card id="report">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-primary" />
          {t("security_report_title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("security_report_desc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="text-xs">
            ℹ️ {lang === "ar"
              ? `اجمع بيانات الفحوصات أولاً (${collectedScans}/6 متوفر). نفّذ الفحوصات في الأقسام الأخرى ثم ارجع هنا.`
              : `Collect scan data first (${collectedScans}/6 available). Run scans in other sections then come back.`}
          </AlertDescription>
        </Alert>

        <Button onClick={handleGenerate} disabled={loading || collectedScans === 0} className="w-full">
          <FileText className="w-4 h-4 ml-2" />
          {loading ? (lang === "ar" ? "جاري التوليد..." : "Generating...") : t("generate_report")}
        </Button>

        {report && (
          <div className="space-y-3">
            {/* Final Score */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t("final_score")}</span>
                  <Badge variant="outline" className={
                    report.summary.gradeColor === "green" ? "text-primary border-primary" :
                    report.summary.gradeColor === "yellow" ? "text-yellow-500 border-yellow-500" :
                    report.summary.gradeColor === "orange" ? "text-orange-500 border-orange-500" :
                    "text-destructive border-destructive"
                  }>
                    {t("final_score")}: {report.summary.overallGrade}
                  </Badge>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold font-mono">
                    {report.summary.finalScore}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={report.summary.finalScore} className={`h-2 ${
                  report.summary.gradeColor === "green" ? "" :
                  report.summary.gradeColor === "yellow" ? "[&>div]:bg-yellow-500" :
                  report.summary.gradeColor === "orange" ? "[&>div]:bg-orange-500" :
                  "[&>div]:bg-destructive"
                }`} />
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-destructive/20">
                <CardContent className="p-3 text-center">
                  <AlertTriangle className="w-4 h-4 text-destructive mx-auto mb-1" />
                  <p className="text-xl font-bold font-mono text-destructive">
                    {report.summary.totalVulnerabilities}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t("total_vulnerabilities_found")}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="p-3 text-center">
                  <ShieldCheck className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold font-mono text-primary">
                    {report.summary.recommendationsCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t("recommendations_count")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Severity Breakdown */}
            <Card>
              <CardContent className="p-3 space-y-2">
                <h4 className="text-sm font-semibold mb-2">
                  {lang === "ar" ? "تفصيل الثغرات حسب الخطورة" : "Vulnerabilities by Severity"}
                </h4>
                <SeverityBar label={t("critical")} count={report.summary.criticalCount} color="bg-destructive" />
                <SeverityBar label={t("high")} count={report.summary.highCount} color="bg-orange-500" />
                <SeverityBar label={t("medium")} count={report.summary.mediumCount} color="bg-yellow-500" />
                <SeverityBar label={t("low")} count={report.summary.lowCount} color="bg-primary" />
              </CardContent>
            </Card>

            {/* Conclusion */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  {lang === "ar" ? "الخلاصة" : "Conclusion"}
                </h4>
                <p className="text-xs">{report.conclusion}</p>
              </CardContent>
            </Card>

            {/* Download PDF */}
            <Button onClick={handleDownloadPDF} className="w-full" size="lg">
              <Download className="w-4 h-4 ml-2" />
              {t("download_pdf")}
            </Button>
          </div>
        )}

        {collectedScans === 0 && (
          <Card>
            <CardContent className="p-4 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
              {lang === "ar"
                ? "نفّذ فحوصات في الأقسام الأخرى لجمع البيانات، ثم ارجع هنا لتوليد التقرير."
                : "Run scans in other sections to collect data, then return here to generate the report."}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

function SeverityBar({ label, count, color }: { label: string; count: number; color: string }) {
  const max = Math.max(count, 1);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono font-semibold">{count}</span>
      </div>
      <Progress value={(count / max) * 100} className={`h-1.5 [&>div]:${color}`} />
    </div>
  );
}

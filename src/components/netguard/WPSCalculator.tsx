'use client'

import { useState } from "react";
import { Calculator, AlertTriangle, Shield, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";

interface WPSResult {
  vendor: string;
  algorithm: string;
  pin: string;
  vulnerabilityLevel: "critical" | "high" | "medium" | "low";
  exploitTime: string;
  description: string;
}

const severityConfig = {
  critical: { label_ar: "حرجة", label_en: "Critical", color: "text-destructive border-destructive", bg: "bg-destructive/5" },
  high: { label_ar: "عالية", label_en: "High", color: "text-orange-500 border-orange-500", bg: "bg-orange-500/5" },
  medium: { label_ar: "متوسطة", label_en: "Medium", color: "text-yellow-500 border-yellow-500", bg: "bg-yellow-500/5" },
  low: { label_ar: "منخفضة", label_en: "Low", color: "text-primary border-primary", bg: "bg-primary/5" },
};

export default function WPSCalculator() {
  const { t, lang } = useI18n();
  const [macAddress, setMacAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!macAddress) {
      toast({
        title: lang === "ar" ? "MAC مطلوب" : "MAC required",
        description: lang === "ar" ? "ادخل عنوان MAC صحيح" : "Enter a valid MAC address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/wps/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ macAddress }),
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
        localStorage.setItem("netguard-wps", JSON.stringify(data.data));
        toast({
          title: lang === "ar" ? "تم الحساب" : "Calculation complete",
          description: lang === "ar"
            ? `المورد المكتشف: ${data.data.detectedVendor}`
            : `Detected vendor: ${data.data.detectedVendor}`,
        });
      } else {
        toast({
          title: lang === "ar" ? "خطأ" : "Error",
          description: data.error,
          variant: "destructive",
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

  const formatMac = (value: string) => {
    // تحويل تلقائي للصيغة الصحيحة AA:BB:CC:DD:EE:FF
    const cleaned = value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 12; i += 2) {
      parts.push(cleaned.substring(i, i + 2));
    }
    return parts.join(":");
  };

  return (
    <Card id="wps">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          {t("wps_calculator_title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("wps_calculator_desc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-500/30 bg-yellow-500/5">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <AlertDescription className="text-xs">
            ⚠️ {lang === "ar"
              ? "للأغراض التعليمية وفحص شبكتك فقط. الاستخدام على شبكات الآخرين مخالف للقانون."
              : "Educational use only. Using on others' networks without permission is illegal."}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="mac">{t("mac_address")}</Label>
          <div className="flex gap-2">
            <Input
              id="mac"
              placeholder={t("mac_placeholder")}
              value={macAddress}
              onChange={(e) => setMacAddress(formatMac(e.target.value))}
              disabled={loading}
              className="font-mono uppercase"
              dir="ltr"
              maxLength={17}
            />
            <Button onClick={handleCalculate} disabled={loading} className="shrink-0">
              {loading ? "..." : (
                <>
                  <Calculator className="w-4 h-4 ml-2" />
                  {t("calculate_pin")}
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 {lang === "ar"
              ? "تقدر تلاقي MAC راوترك في خلفية الجهاز أو صفحة الإعدادات."
              : "Find your router's MAC on the device label or settings page."}
          </p>
        </div>

        {results && (
          <div className="space-y-3 pt-2">
            {/* Vendor Detection */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      {lang === "ar" ? "المورد المكتشف" : "Detected Vendor"}
                    </p>
                    <p className="text-base font-bold">
                      {results.detectedVendor}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      OUI: {results.oui}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matching Algorithm (الأهم) */}
            {results.matchingAlgorithm && (
              <Card className={`${severityConfig[results.matchingAlgorithm.vulnerabilityLevel].bg} ${severityConfig[results.matchingAlgorithm.vulnerabilityLevel].color.split(" ")[1]}/30`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {lang === "ar" ? "الخوارزمية المطابقة" : "Matching Algorithm"}
                    </h4>
                    <Badge variant="outline" className={severityConfig[results.matchingAlgorithm.vulnerabilityLevel].color}>
                      {severityConfig[results.matchingAlgorithm.vulnerabilityLevel][`label_${lang}`]}
                    </Badge>
                  </div>
                  <div className="bg-background/50 p-3 rounded-md border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {lang === "ar" ? "WPS PIN المتوقع" : "Expected WPS PIN"}
                    </p>
                    <p className="text-3xl font-bold font-mono tracking-wider text-center">
                      {results.matchingAlgorithm.pin}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t("pin_algorithm")}</p>
                      <p className="font-medium">{results.matchingAlgorithm.algorithm}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("exploit_time")}</p>
                      <p className="font-medium text-destructive">{results.matchingAlgorithm.exploitTime}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{results.matchingAlgorithm.description}</p>
                </CardContent>
              </Card>
            )}

            {/* All Algorithms */}
            <div>
              <h4 className="text-sm font-semibold mb-2">
                {lang === "ar" ? "كل الخوارزميات" : "All Algorithms"}
              </h4>
              <div className="space-y-1 max-h-64 overflow-y-auto custom-scroll">
                {results.allAlgorithms.map((algo: WPSResult, i: number) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2 rounded-md border ${severityConfig[algo.vulnerabilityLevel].bg} ${severityConfig[algo.vulnerabilityLevel].color.split(" ")[1]}/20`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{algo.vendor}</p>
                      <p className="text-[10px] text-muted-foreground">{algo.algorithm}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-mono text-sm font-bold">{algo.pin}</p>
                      <Badge variant="outline" className={`text-[9px] ${severityConfig[algo.vulnerabilityLevel].color}`}>
                        {severityConfig[algo.vulnerabilityLevel][`label_${lang}`]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Protection */}
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  {t("protect_yourself")}
                </h4>
                <ul className="space-y-1 text-xs">
                  {results.protectionAdvice.map((advice: string, i: number) => (
                    <li key={i}>{advice}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Alert className="border-destructive/20 bg-destructive/5">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-[11px]">
                {results.legalNotice}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

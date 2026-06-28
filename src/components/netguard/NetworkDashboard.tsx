'use client'

import { useState, useEffect } from "react";
import { Wifi, Shield, Activity, Database, Lock, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/I18nContext";

interface NetworkInfo {
  publicIp: string;
  ipInfo?: {
    city?: string;
    country?: string;
    countryCode?: string;
    isp?: string;
    asn?: string;
    timezone?: string;
  };
}

export default function NetworkDashboard() {
  const { t, lang } = useI18n();
  const [info, setInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/network/info")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInfo(data.data);
          // حفظ النتيجة لاستخدامها في تقرير الأمان
          localStorage.setItem("netguard-network", JSON.stringify(data.data));
        } else {
          setError(data.error);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const connection = typeof navigator !== "undefined"
    ? (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    : null;
  const browserInfo = {
    language: typeof navigator !== "undefined" ? navigator.language : "ar",
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    connection: connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    } : null,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
          <Wifi className="w-8 h-8 text-primary relative" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("app_name")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard_title")}</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-primary rounded-full pulse-dot" />
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("system_active")}</p>
              <p className="text-xs text-muted-foreground">
                {browserInfo.online ? t("connected") : t("disconnected")}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {browserInfo.connection?.effectiveType?.toUpperCase() || "Unknown"}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{lang === "ar" ? "عام" : "Public"}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{t("public_ip")}</p>
            {loading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <p className="text-sm font-mono font-semibold break-all">
                {info?.publicIp || (lang === "ar" ? "غير معروف" : "Unknown")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{lang === "ar" ? "السرعة" : "Speed"}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{t("download_speed")}</p>
            <p className="text-sm font-mono font-semibold">
              {browserInfo.connection?.downlink ? `${browserInfo.connection.downlink} Mbps` : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{lang === "ar" ? "التأخير" : "Latency"}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{t("rtt")}</p>
            <p className="text-sm font-mono font-semibold">
              {browserInfo.connection?.rtt ? `${browserInfo.connection.rtt}ms` : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t("isp_label")}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{t("isp")}</p>
            {loading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <p className="text-sm font-semibold truncate">
                {info?.ipInfo?.isp || (lang === "ar" ? "غير معروف" : "Unknown")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {info?.ipInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t("geographic_info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("country")}:</span>
              <span className="font-medium">
                {info.ipInfo.country} ({info.ipInfo.countryCode})
              </span>
            </div>
            {info.ipInfo.city && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("city")}:</span>
                <span className="font-medium">{info.ipInfo.city}</span>
              </div>
            )}
            {info.ipInfo.asn && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("asn")}:</span>
                <span className="font-mono text-xs">{info.ipInfo.asn}</span>
              </div>
            )}
            {info.ipInfo.timezone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("timezone")}:</span>
                <span className="font-medium text-xs">{info.ipInfo.timezone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SecurityScoreCard />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t("quick_actions")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-auto py-3 justify-start" asChild>
            <a href="#ports">
              <Lock className="w-4 h-4 ml-2" />
              <div className="text-right">
                <p className="text-sm font-medium">{t("port_scanner_title")}</p>
                <p className="text-[10px] text-muted-foreground">{t("port_scanner_desc")}</p>
              </div>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-3 justify-start" asChild>
            <a href="#password">
              <Lock className="w-4 h-4 ml-2" />
              <div className="text-right">
                <p className="text-sm font-medium">{t("password_analyzer_title")}</p>
                <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "اختبر قوة كلمة مرورك" : "Test password strength"}</p>
              </div>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-3 justify-start" asChild>
            <a href="#cve">
              <Database className="w-4 h-4 ml-2" />
              <div className="text-right">
                <p className="text-sm font-medium">{t("cve_title").split("(")[0]}</p>
                <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "قاعدة بيانات CVE" : "CVE Database"}</p>
              </div>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-3 justify-start" asChild>
            <a href="#router">
              <Globe className="w-4 h-4 ml-2" />
              <div className="text-right">
                <p className="text-sm font-medium">{t("router_detector_title")}</p>
                <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "معرفة نوع الراوتر" : "Identify router"}</p>
              </div>
            </a>
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-xs text-destructive">
            ⚠️ {error}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SecurityScoreCard() {
  const { t, lang } = useI18n();
  const [score, setScore] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);

  const calculateScore = () => {
    setScanning(true);
    let s = 50;
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.effectiveType === "4g") s += 10;
      if (connection.rtt < 100) s += 10;
      if (connection.downlink > 10) s += 10;
    }
    if (window.isSecureContext) s += 20;
    setScore(s);
    setTimeout(() => setScanning(false), 1500);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <CardContent className="p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">{t("security_score")}</span>
          </div>
          {scanning && (
            <div className="text-[10px] text-primary flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              {t("scanning")}
            </div>
          )}
        </div>
        {score === null ? (
          <Button onClick={calculateScore} className="w-full" disabled={scanning}>
            <Shield className="w-4 h-4 ml-2" />
            {t("start_security_scan")}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold font-mono">{score}</span>
              <Badge
                variant="outline"
                className={
                  score >= 75
                    ? "text-primary border-primary"
                    : score >= 50
                    ? "text-yellow-500 border-yellow-500"
                    : "text-destructive border-destructive"
                }
              >
                {score >= 75 ? (lang === "ar" ? "آمن" : "Secure") : score >= 50 ? (lang === "ar" ? "متوسط" : "Medium") : (lang === "ar" ? "ضعيف" : "Weak")}
              </Badge>
            </div>
            <Progress value={score} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-2">
              {lang === "ar"
                ? "* درجة مبدئية بناءً على معلومات المتصفح. للفحص الكامل استخدم باقي الأدوات."
                : "* Initial score based on browser info. Use other tools for full scan."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

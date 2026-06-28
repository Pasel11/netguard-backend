'use client'

import { useState } from "react";
import { Router, ScanLine, AlertTriangle, CheckCircle2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";

interface RouterInfo {
  ip: string;
  detected: boolean;
  vendor: string | null;
  model: string | null;
  firmware: string | null;
  httpStatus?: number;
  redirectTo?: string;
  pageTitle?: string;
  rawServer?: string;
  securityHeaders: {
    server?: string | null;
    wwwAuthenticate?: string | null;
    contentType?: string | null;
    location?: string | null;
    xFrameOptions?: string | null;
    xContentTypeOptions?: string | null;
    strictTransportSecurity?: string | null;
  };
  risks: string[];
  connectionError?: string;
}

export default function RouterDetector() {
  const { t, lang } = useI18n();
  const [routerIp, setRouterIp] = useState("192.168.1.1");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [info, setInfo] = useState<RouterInfo | null>(null);
  const { toast } = useToast();

  const handleDetect = async () => {
    if (!routerIp) {
      toast({
        title: "IP مطلوب",
        description: "ادخل عنوان IP الراوتر",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    setProgress(0);
    setInfo(null);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 20, 90));
    }, 400);

    try {
      const response = await fetch("/api/router/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routerIp }),
      });
      const data = await response.json();

      clearInterval(interval);
      setProgress(100);

      if (data.success) {
        setInfo(data.data);
        localStorage.setItem("netguard-router", JSON.stringify(data.data));
        toast({
          title: data.data.detected ? (lang === "ar" ? "تم كشف الراوتر" : "Router detected") : (lang === "ar" ? "تعذّر الكشف الكامل" : "Detection incomplete"),
          description: data.data.vendor
            ? (lang === "ar" ? `النوع: ${data.data.vendor}` : `Vendor: ${data.data.vendor}`)
            : (lang === "ar" ? "تأكد من إنك على نفس شبكة الراوتر" : "Make sure you're on the same network"),
        });
      } else {
        toast({
          title: "فشل الكشف",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      clearInterval(interval);
      toast({
        title: "خطأ",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setScanning(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <Card id="router">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Router className="w-5 h-5 text-primary" />
          كاشف نوع الراوتر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="routerIp">عنوان IP الراوتر</Label>
          <div className="flex gap-2">
            <Input
              id="routerIp"
              placeholder="192.168.1.1"
              value={routerIp}
              onChange={(e) => setRouterIp(e.target.value)}
              disabled={scanning}
              className="font-mono"
              dir="ltr"
            />
            <Button onClick={handleDetect} disabled={scanning} className="shrink-0">
              {scanning ? (
                <>
                  <ScanLine className="w-4 h-4 ml-2 animate-pulse" />
                  جاري...
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4 ml-2" />
                  كشف
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 راوترك غالباً <code className="bg-muted px-1 rounded">192.168.1.1</code> أو <code className="bg-muted px-1 rounded">192.168.0.1</code> أو <code className="bg-muted px-1 rounded">10.0.0.1</code>
          </p>
        </div>

        {scanning && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">جاري الكشف...</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="h-0.5 scan-line rounded" />
          </div>
        )}

        {info && (
          <div className="space-y-3 pt-2">
            {/* النتيجة الرئيسية */}
            <Card className={info.detected ? "border-primary/30 bg-primary/5" : "border-muted"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {info.detected ? (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Router className="w-6 h-6 text-primary" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {info.detected ? info.vendor : "تعذّر الكشف"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{info.ip}</p>
                  </div>
                  {info.detected && (
                    <Badge variant="outline" className="text-primary border-primary ml-auto">
                      تم الكشف
                    </Badge>
                  )}
                </div>

                {info.model && (
                  <div className="text-xs space-y-1">
                    <p>
                      <span className="text-muted-foreground">الموديل:</span>{" "}
                      <span className="font-mono font-semibold">{info.model}</span>
                    </p>
                    {info.firmware && (
                      <p>
                        <span className="text-muted-foreground">الفيرموير:</span>{" "}
                        <span className="font-mono">{info.firmware}</span>
                      </p>
                    )}
                    {info.pageTitle && (
                      <p>
                        <span className="text-muted-foreground">عنوان الصفحة:</span>{" "}
                        <span>{info.pageTitle}</span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* HTTP Info */}
            {info.httpStatus && (
              <Card>
                <CardContent className="p-3 space-y-1 text-xs">
                  <p className="font-semibold mb-1">معلومات HTTP:</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الحالة:</span>
                    <span className="font-mono">{info.httpStatus}</span>
                  </div>
                  {info.rawServer && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Server:</span>
                      <span className="font-mono text-[10px]">{info.rawServer}</span>
                    </div>
                  )}
                  {info.redirectTo && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">Redirect:</span>
                      <span className="font-mono text-[10px] truncate">{info.redirectTo}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Security Headers */}
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-2 mb-1">
                  <Globe className="w-3 h-3" />
                  رؤوس الأمان (Security Headers)
                </p>
                <div className="space-y-1 text-[11px]">
                  <SecurityHeaderRow
                    name="X-Frame-Options"
                    value={info.securityHeaders.xFrameOptions}
                  />
                  <SecurityHeaderRow
                    name="X-Content-Type-Options"
                    value={info.securityHeaders.xContentTypeOptions}
                  />
                  <SecurityHeaderRow
                    name="Strict-Transport-Security"
                    value={info.securityHeaders.strictTransportSecurity}
                  />
                  <SecurityHeaderRow
                    name="WWW-Authenticate"
                    value={info.securityHeaders.wwwAuthenticate}
                  />
                </div>
              </CardContent>
            </Card>

            {/* المخاطر */}
            {info.risks.length > 0 && (
              <Card className="border-primary/20">
                <CardContent className="p-3">
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-primary" />
                    ملاحظات أمنية
                  </h4>
                  <ul className="space-y-1 text-[11px]">
                    {info.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {info.connectionError && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-3">
                  <p className="text-xs text-destructive">
                    ⚠️ تعذّر الاتصال بالراوتر: {info.connectionError}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    تأكد من: 1) إنك على نفس شبكة الراوتر 2) عنوان IP صحيح 3) الراوتر شغّال
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityHeaderRow({ name, value }: { name: string; value?: string | null }) {
  const present = !!value;
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground font-mono">{name}</span>
      {present ? (
        <Badge variant="outline" className="text-primary border-primary text-[10px] font-mono">
          <CheckCircle2 className="w-2.5 h-2.5 ml-1" />
          {value.length > 30 ? value.substring(0, 30) + "..." : value}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground text-[10px]">
          مفقود
        </Badge>
      )}
    </div>
  );
}

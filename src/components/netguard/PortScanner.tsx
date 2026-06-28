'use client'

import { useState } from "react";
import { Lock, ScanLine, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";

interface PortResult {
  port: number;
  service: string;
  isOpen: boolean;
  responseTime?: number;
}

interface ScanResult {
  target: string;
  scanTime: string;
  totalPorts: number;
  openPortsCount: number;
  closedPortsCount: number;
  openPorts: PortResult[];
  securityScore: number;
  risks: string[];
  recommendation: string[];
}

export default function PortScanner() {
  const { t, lang } = useI18n();
  const [targetIp, setTargetIp] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!targetIp) {
      toast({
        title: "IP مطلوب",
        description: "ادخل عنوان IP صحيح",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    setProgress(0);
    setResult(null);

    // محاكاة تقدم الفحص
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 300);

    try {
      const response = await fetch("/api/scan/ports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIp }),
      });
      const data = await response.json();

      clearInterval(interval);
      setProgress(100);

      if (data.success) {
        setResult(data.data);
        localStorage.setItem("netguard-ports", JSON.stringify(data.data));
        toast({
          title: lang === "ar" ? "اكتمل الفحص" : "Scan complete",
          description: lang === "ar"
            ? `تم العثور على ${data.data.openPortsCount} بورت مفتوح`
            : `Found ${data.data.openPortsCount} open ports`,
        });
      } else {
        toast({
          title: "فشل الفحص",
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
    <Card id="ports">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="w-5 h-5 text-primary" />
          فاحص البورتات (Port Scanner)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <AlertDescription className="text-xs">
            ⚠️ استخدم هذه الأداة فقط على شبكتك الخاصة أو بأذن من المالك. الفحص غير المصرّح به يعاقب عليه القانون.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="ip">عنوان IP الهدف</Label>
          <div className="flex gap-2">
            <Input
              id="ip"
              placeholder="مثال: 192.168.1.1 أو 8.8.8.8"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              disabled={scanning}
              className="font-mono"
              dir="ltr"
            />
            <Button onClick={handleScan} disabled={scanning} className="shrink-0">
              {scanning ? (
                <>
                  <ScanLine className="w-4 h-4 ml-2 animate-pulse" />
                  جاري الفحص...
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4 ml-2" />
                  ابدأ الفحص
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 جرّب: <code className="bg-muted px-1 rounded">192.168.1.1</code> (راوترك) أو <code className="bg-muted px-1 rounded">8.8.8.8</code> (Google DNS)
          </p>
        </div>

        {scanning && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">تقدم الفحص...</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="h-0.5 scan-line rounded" />
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-2">
            {/* ملخص */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="border-primary/20">
                <CardContent className="p-3 text-center">
                  <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold font-mono text-primary">
                    {result.openPortsCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">مفتوحة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <XCircle className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold font-mono">
                    {result.closedPortsCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">مغلقة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <ScanLine className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold font-mono">
                    {result.totalPorts}
                  </p>
                  <p className="text-[10px] text-muted-foreground">الإجمالي</p>
                </CardContent>
              </Card>
            </div>

            {/* درجة الأمان */}
            <Card className={result.securityScore >= 80 ? "border-primary/30" : "border-destructive/30"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">درجة أمان الهدف</span>
                  <Badge variant="outline" className={
                    result.securityScore >= 80
                      ? "text-primary border-primary"
                      : result.securityScore >= 50
                      ? "text-yellow-500 border-yellow-500"
                      : "text-destructive border-destructive"
                  }>
                    {result.securityScore}/100
                  </Badge>
                </div>
                <Progress
                  value={result.securityScore}
                  className={`h-2 ${
                    result.securityScore >= 80 ? "" : "[&>div]:bg-destructive"
                  }`}
                />
              </CardContent>
            </Card>

            {/* البورتات المفتوحة */}
            {result.openPorts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  البورتات المفتوحة
                </h4>
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scroll">
                  {result.openPorts.map((p) => (
                    <div
                      key={p.port}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full pulse-dot" />
                        <span className="font-mono text-sm font-semibold">
                          {p.port}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.service}
                        </span>
                      </div>
                      {p.responseTime && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {p.responseTime}ms
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المخاطر */}
            {result.risks.length > 0 && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    المخاطر المكتشفة
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {result.risks.map((risk, i) => (
                      <li key={i} className="text-destructive/90">• {risk}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* التوصيات */}
            {result.recommendation.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    التوصيات الأمنية
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {result.recommendation.map((rec, i) => (
                      <li key={i} className="text-foreground/90">• {rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              توقيت الفحص: {new Date(result.scanTime).toLocaleString("ar-EG")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

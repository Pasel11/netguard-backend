'use client'

import { useState, useEffect } from "react";
import { Activity, Wifi, Gauge, Radio, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function WiFiSignalAnalyzer() {
  const { t, lang } = useI18n();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    setBrowserInfo({
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      } : null,
      supported: !!connection,
    });
  }, []);

  const handleAnalyze = async () => {
    if (!browserInfo.connection) {
      toast({
        title: lang === "ar" ? "غير مدعوم" : "Not supported",
        description: lang === "ar"
          ? "متصفحك لا يدعم Network Information API"
          : "Your browser doesn't support Network Information API",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/wifi/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionInfo: browserInfo.connection }),
      });
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
        toast({
          title: lang === "ar" ? "اكتمل التحليل" : "Analysis complete",
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

  return (
    <Card id="signal">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="w-5 h-5 text-primary" />
          {t("wifi_signal_title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("wifi_signal_desc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!browserInfo.supported && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
            ⚠️ {lang === "ar"
              ? "متصفحك لا يدعم Network Information API. استخدم Chrome على الأندرويد للحصول على أفضل النتائج."
              : "Your browser doesn't support Network Information API. Use Chrome on Android for best results."}
          </div>
        )}

        <Button onClick={handleAnalyze} disabled={loading || !browserInfo.supported} className="w-full">
          <Activity className="w-4 h-4 ml-2" />
          {loading ? (lang === "ar" ? "جاري التحليل..." : "Analyzing...") : (lang === "ar" ? "ابدأ التحليل" : "Start Analysis")}
        </Button>

        {analysis && (
          <div className="space-y-3">
            {/* Quality Score */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t("signal_quality")}</span>
                  <Badge variant="outline" className={
                    analysis.analysis.qualityScore >= 75
                      ? "text-primary border-primary"
                      : analysis.analysis.qualityScore >= 50
                      ? "text-yellow-500 border-yellow-500"
                      : "text-destructive border-destructive"
                  }>
                    {analysis.analysis.signalQuality}
                  </Badge>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold font-mono">
                    {analysis.analysis.qualityScore}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={analysis.analysis.qualityScore} className="h-2" />
                <p className="text-xs mt-2">{analysis.analysis.recommendation}</p>
              </CardContent>
            </Card>

            {/* Connection Details */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Wifi className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{t("network_type")}</span>
                  </div>
                  <p className="text-sm font-mono font-bold uppercase">
                    {analysis.connectionInfo.effectiveType || "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{t("downlink")}</span>
                  </div>
                  <p className="text-sm font-mono font-bold">
                    {analysis.connectionInfo.downlink}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{t("latency")} (RTT)</span>
                  </div>
                  <p className="text-sm font-mono font-bold">
                    {analysis.connectionInfo.rtt}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{t("save_data")}</span>
                  </div>
                  <p className="text-sm font-bold">
                    {analysis.connectionInfo.saveData}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Signal Strength */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground mb-1">{t("signal_strength")}</p>
                <p className="text-sm font-semibold">{analysis.analysis.signalStrength}</p>
                <p className="text-xs mt-2">{analysis.analysis.networkAnalysis}</p>
                <p className="text-xs">{analysis.analysis.speedAnalysis}</p>
              </CardContent>
            </Card>

            {/* Channel Recommendation */}
            <Card>
              <CardContent className="p-3 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  {lang === "ar" ? "توصية قناة WiFi" : "WiFi Channel Recommendation"}
                </h4>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold mb-1">2.4 GHz</p>
                    <div className="flex gap-1 flex-wrap">
                      {analysis.channelRecommendation["2.4GHz"].channels.map((ch: any) => (
                        <Badge
                          key={ch.channel}
                          variant="outline"
                          className={
                            ch.recommendation === "جيد" || ch.recommendation === "Good"
                              ? "text-primary border-primary text-[10px]"
                              : "text-destructive border-destructive text-[10px]"
                          }
                        >
                          Ch{ch.channel} - {ch.recommendation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold mb-1">5 GHz</p>
                    <div className="flex gap-1 flex-wrap">
                      {analysis.channelRecommendation["5GHz"].channels.slice(0, 4).map((ch: any) => (
                        <Badge key={ch.channel} variant="outline" className="text-primary border-primary text-[10px]">
                          Ch{ch.channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground">
                  {analysis.channelRecommendation.general}
                </p>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <h4 className="text-sm font-semibold mb-2">
                  {lang === "ar" ? "نصائح لتحسين الإشارة" : "Signal Improvement Tips"}
                </h4>
                <ul className="space-y-1 text-xs">
                  {analysis.tips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

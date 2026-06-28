'use client'

import { useState } from "react";
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertTriangle, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";

interface PasswordAnalysis {
  password: string;
  score: number;
  strength: string;
  length: number;
  characterSets: {
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
  entropy: number;
  crackTime: {
    online: string;
    offline: string;
  };
  issues: string[];
  suggestions: string[];
  isCommonPassword: boolean;
  wpaRecommendation: string;
}

const strengthConfig: Record<string, { label: string; color: string; barColor: string }> = {
  very_weak: { label: "ضعيفة جداً", color: "text-destructive", barColor: "bg-destructive" },
  weak: { label: "ضعيفة", color: "text-destructive", barColor: "bg-destructive" },
  fair: { label: "مقبولة", color: "text-yellow-500", barColor: "bg-yellow-500" },
  strong: { label: "قوية", color: "text-primary", barColor: "bg-primary" },
  very_strong: { label: "قوية جداً", color: "text-primary", barColor: "bg-primary" },
};

export default function PasswordAnalyzer() {
  const { t, lang } = useI18n();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!password) {
      toast({
        title: "أدخل كلمة مرور",
        description: "اكتب كلمة المرور المراد تحليلها",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
        localStorage.setItem("netguard-password", JSON.stringify(data.data));
        toast({
          title: lang === "ar" ? "اكتمل التحليل" : "Analysis complete",
          description: lang === "ar"
            ? `النتيجة: ${strengthConfig[data.data.strength]?.label}`
            : `Result: ${data.data.strength}`,
        });
      } else {
        toast({
          title: "خطأ",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "خطأ",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const chars = {
      lower: "abcdefghijklmnopqrstuvwxyz",
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      nums: "0123456789",
      syms: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    };
    let pwd = "";
    // ضمان تنوع الأحرف
    pwd += chars.lower[Math.floor(Math.random() * chars.lower.length)];
    pwd += chars.upper[Math.floor(Math.random() * chars.upper.length)];
    pwd += chars.nums[Math.floor(Math.random() * chars.nums.length)];
    pwd += chars.syms[Math.floor(Math.random() * chars.syms.length)];
    const all = chars.lower + chars.upper + chars.nums + chars.syms;
    for (let i = 0; i < 16; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    // خلط
    pwd = pwd.split("").sort(() => Math.random() - 0.5).join("");
    setPassword(pwd);
    setAnalysis(null);
    toast({
      title: "تم توليد كلمة مرور قوية",
      description: "20 حرف - آمنة جداً لـ WPA2/WPA3",
    });
  };

  return (
    <Card id="password">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="w-5 h-5 text-primary" />
          محلّل كلمة مرور WiFi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <AlertDescription className="text-xs">
            🔒 كلمة المرور تُحلّل محلياً ولا تُحفظ ولا تُرسل لأي مكان خارجي. التحليل يتم فقط لقياس القوة.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="password">كلمة مرور WiFi</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="اكتب كلمة المرور هنا..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAnalysis(null);
                }}
                className="pr-10 font-mono"
                dir="ltr"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Button onClick={handleAnalyze} disabled={loading} className="shrink-0">
              {loading ? "جاري التحليل..." : "حلّل"}
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={generateStrongPassword}
          className="w-full"
          size="sm"
        >
          <Zap className="w-4 h-4 ml-2" />
          ولّد كلمة مرور قوية (20 حرف)
        </Button>

        {analysis && (
          <div className="space-y-4 pt-2">
            {/* الدرجة */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">درجة القوة</span>
                  <Badge
                    variant="outline"
                    className={strengthConfig[analysis.strength]?.color}
                  >
                    {strengthConfig[analysis.strength]?.label}
                  </Badge>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold font-mono">
                    {analysis.score}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/100</span>
                </div>
                <Progress
                  value={analysis.score}
                  className={`h-2 [&>div]:${strengthConfig[analysis.strength]?.barColor}`}
                />
              </CardContent>
            </Card>

            {/* التفاصيل */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">الطول</p>
                  <p className="text-lg font-bold font-mono">{analysis.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">الإنتروبيا</p>
                  <p className="text-lg font-bold font-mono">{analysis.entropy}<span className="text-xs"> bits</span></p>
                </CardContent>
              </Card>
            </div>

            {/* أنواع الأحرف */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">أنواع الأحرف المستخدمة:</p>
              <div className="grid grid-cols-2 gap-2">
                <CharSetBadge label="أحرف صغيرة (a-z)" active={analysis.characterSets.lowercase} />
                <CharSetBadge label="أحرف كبيرة (A-Z)" active={analysis.characterSets.uppercase} />
                <CharSetBadge label="أرقام (0-9)" active={analysis.characterSets.numbers} />
                <CharSetBadge label="رموز (!@#$)" active={analysis.characterSets.symbols} />
              </div>
            </div>

            {/* أوقات الكسر */}
            <Card className="border-destructive/20">
              <CardContent className="p-3 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-destructive" />
                  الوقت المتوقع لكسر كلمة المرور
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">هجوم Online (1000 محاولة/ث):</span>
                    <span className="font-mono font-semibold text-destructive">
                      {analysis.crackTime.online}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">هجوم Offline (GPU 10B/ث):</span>
                    <span className="font-mono font-semibold text-destructive">
                      {analysis.crackTime.offline}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* توصية WPA */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3">
                <h4 className="text-sm font-semibold mb-1">مناسبة لـ WPA2/WPA3:</h4>
                <p className="text-sm">{analysis.wpaRecommendation}</p>
              </CardContent>
            </Card>

            {/* المشاكل */}
            {analysis.issues.length > 0 && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    مشاكل مكتشفة
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {analysis.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* الاقتراحات */}
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  اقتراحات للتحسين
                </h4>
                <ul className="space-y-1 text-xs">
                  {analysis.suggestions.map((sug, i) => (
                    <li key={i}>• {sug}</li>
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

function CharSetBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-md border text-xs ${
      active
        ? "border-primary/30 bg-primary/5 text-primary"
        : "border-border bg-muted/30 text-muted-foreground"
    }`}>
      <div className={`w-2 h-2 rounded-full ${active ? "bg-primary" : "bg-muted-foreground/30"}`} />
      {label}
    </div>
  );
}

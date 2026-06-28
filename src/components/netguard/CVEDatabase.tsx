'use client'

import { useState, useEffect } from "react";
import { Database, Search, AlertTriangle, Shield, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";

interface CVE {
  id: string;
  vendor: string;
  model: string;
  severity: "critical" | "high" | "medium" | "low";
  cvss: number;
  title: string;
  description: string;
  affected: string;
  solution: string;
  published: string;
}

const severityConfig = {
  critical: { label: "حرجة", color: "text-destructive border-destructive", bg: "bg-destructive/5" },
  high: { label: "عالية", color: "text-orange-500 border-orange-500", bg: "bg-orange-500/5" },
  medium: { label: "متوسطة", color: "text-yellow-500 border-yellow-500", bg: "bg-yellow-500/5" },
  low: { label: "منخفضة", color: "text-primary border-primary", bg: "bg-primary/5" },
};

export default function CVEDatabase() {
  const { t, lang } = useI18n();
  const [vendor, setVendor] = useState("");
  const [model, setModel] = useState("");
  const [results, setResults] = useState<CVE[]>([]);
  const [allCVEs, setAllCVEs] = useState<CVE[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalInDb, setTotalInDb] = useState(0);
  const [vendors, setVendors] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // تحميل كل الثغرات عند البداية
    fetch("/api/cve/lookup")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAllCVEs(data.data);
          setTotalInDb(data.totalInDatabase);
          setVendors(data.vendors);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cve/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor, model }),
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
        localStorage.setItem("netguard-cve", JSON.stringify(data.data));
        toast({
          title: data.count > 0 ? (lang === "ar" ? `تم العثور على ${data.count} ثغرة` : `Found ${data.count} vulnerabilities`) : (lang === "ar" ? "لا توجد ثغرات" : "No vulnerabilities"),
          description: data.recommendation,
          variant: data.count > 0 ? "destructive" : "default",
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

  const showAll = () => {
    setResults(allCVEs);
    setVendor("");
    setModel("");
    toast({
      title: "عرض كل الثغرات",
      description: `${allCVEs.length} ثغرة في قاعدة البيانات`,
    });
  };

  return (
    <Card id="cve">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="w-5 h-5 text-primary" />
          قاعدة بيانات ثغرات الراوترات (CVE)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* إحصائيات */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-primary/20">
            <CardContent className="p-3 text-center">
              <Database className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold font-mono">{totalInDb}</p>
              <p className="text-[10px] text-muted-foreground">إجمالي الثغرات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <ShieldAlert className="w-4 h-4 text-destructive mx-auto mb-1" />
              <p className="text-lg font-bold font-mono">
                {allCVEs.filter((c) => c.severity === "critical").length}
              </p>
              <p className="text-[10px] text-muted-foreground">حرجة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold font-mono">
                {allCVEs.filter((c) => c.severity === "high").length}
              </p>
              <p className="text-[10px] text-muted-foreground">عالية</p>
            </CardContent>
          </Card>
        </div>

        {/* البحث */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="vendor">الشركة المصنّعة (Vendor)</Label>
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشركة أو اكتبها" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">الموديل (اختياري)</Label>
            <Input
              id="model"
              placeholder="مثال: Archer C7 أو RV320"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="flex-1">
              <Search className="w-4 h-4 ml-2" />
              {loading ? "جاري البحث..." : "ابحث عن ثغرات"}
            </Button>
            <Button onClick={showAll} variant="outline" className="shrink-0">
              عرض الكل
            </Button>
          </div>
        </div>

        {/* النتائج */}
        {results.length > 0 && (
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scroll">
            {results.map((cve) => (
              <Card key={cve.id} className={`${severityConfig[cve.severity].bg} ${severityConfig[cve.severity].color.split(" ")[1]}/30`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-semibold">{cve.id}</span>
                        <Badge variant="outline" className={`text-[10px] ${severityConfig[cve.severity].color}`}>
                          {severityConfig[cve.severity].label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          CVSS: {cve.cvss}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold mb-1">{cve.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{cve.description}</p>
                      <div className="space-y-1 text-[11px]">
                        <p>
                          <span className="text-muted-foreground">الشركة:</span>{" "}
                          <span className="font-medium">{cve.vendor}</span>
                          {" - "}
                          <span className="text-muted-foreground">الموديل:</span>{" "}
                          <span className="font-medium font-mono">{cve.model}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">الإصدارات المتأثرة:</span>{" "}
                          <span className="font-medium">{cve.affected}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">تاريخ النشر:</span>{" "}
                          <span className="font-mono">{cve.published}</span>
                        </p>
                      </div>
                      <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                        <p className="text-[11px] flex items-start gap-1">
                          <Shield className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <span><span className="font-semibold text-primary">الحل:</span> {cve.solution}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && allCVEs.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              ابحث عن ثغرات جهازك أو اضغط "عرض الكل" لتصفح قاعدة البيانات
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

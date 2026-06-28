'use client'

import { useState } from "react";
import { Smartphone, Laptop, Router, Tv, Printer, Gamepad2, Cpu, HelpCircle, RefreshCw, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/I18nContext";

interface Device {
  ip: string;
  mac: string;
  vendor: string;
  type: string;
  oui: string;
  firstSeen: string;
  hostname?: string;
}

function getDeviceIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("phone") || t.includes("smartphone")) return Smartphone;
  if (t.includes("laptop") || t.includes("mac")) return Laptop;
  if (t.includes("router")) return Router;
  if (t.includes("tv") || t.includes("smart tv")) return Tv;
  if (t.includes("printer")) return Printer;
  if (t.includes("playstation") || t.includes("xbox") || t.includes("game")) return Gamepad2;
  if (t.includes("iot") || t.includes("raspberry") || t.includes("sbc")) return Cpu;
  return HelpCircle;
}

export default function DevicesScanner() {
  const { t, lang } = useI18n();
  const [subnet, setSubnet] = useState("192.168.1.0/24");
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const { toast } = useToast();

  const handleScan = async () => {
    setScanning(true);
    setHasScanned(true);
    setDemoMode(false);

    try {
      const response = await fetch("/api/devices/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subnet }),
      });
      const data = await response.json();

      if (data.success) {
        setDevices(data.data.devices || []);
        setDemoMode(data.data.demoMode || false);
        toast({
          title: lang === "ar" ? "اكتمل الفحص" : "Scan complete",
          description: data.data.devices?.length > 0
            ? (lang === "ar" ? `تم العثور على ${data.data.devices.length} جهاز` : `Found ${data.data.devices.length} devices`)
            : (lang === "ar" ? "لم يتم العثور على أجهزة" : "No devices found"),
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
      setScanning(false);
    }
  };

  return (
    <Card id="devices">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wifi className="w-5 h-5 text-primary" />
          {t("devices_scanner_title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("devices_scanner_desc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="text-xs">
            ℹ️ {lang === "ar"
              ? "يجب أن يعمل التطبيق على نفس الشبكة المحلية لفحص الأجهزة."
              : "The app must run on the same local network to scan devices."}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="subnet">{lang === "ar" ? "نطاق الشبكة" : "Network Subnet"}</Label>
          <div className="flex gap-2">
            <Input
              id="subnet"
              placeholder="192.168.1.0/24"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              disabled={scanning}
              className="font-mono"
              dir="ltr"
            />
            <Button onClick={handleScan} disabled={scanning} className="shrink-0">
              {scanning ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 ml-2" />
              )}
              {t("scan_network")}
            </Button>
          </div>
        </div>

        {scanning && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {demoMode && (
          <Alert className="border-yellow-500/30 bg-yellow-500/5">
            <AlertDescription className="text-xs">
              {lang === "ar"
                ? "⚠️ الفحص التلقائي غير متاح في هذا البيئة. هذه الميزة تحتاج backend على شبكتك المحلية."
                : "⚠️ Auto-scan unavailable in this environment. Requires backend on your local network."}
            </AlertDescription>
          </Alert>
        )}

        {!scanning && hasScanned && devices.length === 0 && !demoMode && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              <Wifi className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {lang === "ar" ? "لم يتم العثور على أجهزة" : "No devices found"}
            </CardContent>
          </Card>
        )}

        {devices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {t("devices_found")} ({devices.length})
              </h4>
              <Badge variant="outline">{devices.length}</Badge>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto custom-scroll">
              {devices.map((device, i) => {
                const Icon = getDeviceIcon(device.type);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-md bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold">{device.ip}</span>
                        {device.hostname && (
                          <Badge variant="outline" className="text-[9px]">{device.hostname}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span className="font-mono">{device.mac}</span>
                        <span>•</span>
                        <span>{device.vendor}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {device.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

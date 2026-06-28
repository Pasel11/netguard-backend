'use client'

import { useState, useEffect } from "react";
import { Wifi, Lock, KeyRound, Database, Router, Shield, Github, AlertCircle, Calculator, Smartphone, Radio, FileText, Globe } from "lucide-react";
import NetworkDashboard from "@/components/netguard/NetworkDashboard";
import PortScanner from "@/components/netguard/PortScanner";
import PasswordAnalyzer from "@/components/netguard/PasswordAnalyzer";
import CVEDatabase from "@/components/netguard/CVEDatabase";
import RouterDetector from "@/components/netguard/RouterDetector";
import WPSCalculator from "@/components/netguard/WPSCalculator";
import DevicesScanner from "@/components/netguard/DevicesScanner";
import WiFiSignalAnalyzer from "@/components/netguard/WiFiSignalAnalyzer";
import SecurityReport from "@/components/netguard/SecurityReport";
import AdBanner from "@/components/netguard/AdBanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nContext";

type Tab = "dashboard" | "ports" | "password" | "cve" | "router" | "wps" | "devices" | "signal" | "report";

export default function Home() {
  const { t, lang, toggleLang } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      const validTabs: Tab[] = ["dashboard", "ports", "password", "cve", "router", "wps", "devices", "signal", "report"];
      if (validTabs.includes(hash as Tab)) {
        setActiveTab(hash as Tab);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: t("nav_dashboard"), icon: Wifi },
    { id: "ports", label: t("nav_ports"), icon: Lock },
    { id: "wps", label: t("nav_wps"), icon: Calculator },
    { id: "password", label: t("nav_password"), icon: KeyRound },
    { id: "cve", label: t("nav_cve"), icon: Database },
    { id: "router", label: t("nav_router"), icon: Router },
    { id: "devices", label: t("nav_devices"), icon: Smartphone },
    { id: "signal", label: t("nav_signal"), icon: Radio },
    { id: "report", label: t("nav_report"), icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-md rounded-full" />
              <Shield className="w-6 h-6 text-primary relative" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">{t("app_name")}</h1>
              <p className="text-[10px] text-muted-foreground">{t("app_tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLang}
              className="h-8 px-2 text-xs"
            >
              <Globe className="w-3 h-3 ml-1" />
              {t("language")}
            </Button>
            <a
              href="https://github.com/aircrack-ng/aircrack-ng"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Built on aircrack-ng"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Top Ad */}
      <div className="max-w-2xl mx-auto px-3 pt-3">
        <AdBanner slot="top" />
      </div>

      {/* Tab Navigation */}
      <nav className="sticky top-[57px] z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-2 py-2">
          <div className="flex gap-1 overflow-x-auto custom-scroll">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.location.hash = tab.id;
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground glow-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-3 py-4 pb-20">
        <Alert className="mb-4 border-yellow-500/30 bg-yellow-500/5">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <AlertDescription className="text-[11px] leading-relaxed">
            ⚠️ <strong>{t("legal_warning_title")}:</strong> {t("legal_warning")}
          </AlertDescription>
        </Alert>

        {activeTab === "dashboard" && <NetworkDashboard />}
        {activeTab === "ports" && <PortScanner />}
        {activeTab === "wps" && <WPSCalculator />}
        {activeTab === "password" && <PasswordAnalyzer />}
        {activeTab === "cve" && <CVEDatabase />}
        {activeTab === "router" && <RouterDetector />}
        {activeTab === "devices" && <DevicesScanner />}
        {activeTab === "signal" && <WiFiSignalAnalyzer />}
        {activeTab === "report" && <SecurityReport />}

        {/* Middle Ad */}
        <div className="mt-6">
          <AdBanner slot="middle" />
        </div>
      </main>

      {/* Bottom Ad */}
      <div className="max-w-2xl mx-auto px-3 pb-4">
        <AdBanner slot="bottom" />
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">
            {t("footer_version")} • {t("footer_built_with")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t("footer_privacy")}
          </p>
        </div>
      </footer>
    </div>
  );
}

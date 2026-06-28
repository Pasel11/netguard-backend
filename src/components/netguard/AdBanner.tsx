'use client'

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/I18nContext";

interface AdBannerProps {
  slot?: "top" | "middle" | "bottom" | "sidebar";
  className?: string;
}

// مكوّن إعلان - يدعم Google AdSense للويب
// ملاحظة: لاستخدام Unity Ads، استبدل هذا بـ React Native component في نسخة الموبايل
export default function AdBanner({ slot = "middle", className = "" }: AdBannerProps) {
  const { t } = useI18n();

  // في وضع التطوير، نعرض placeholder
  // في الإنتاج، استبدل هذا بـ <ins className="adsbygoogle" ... />
  
  const heights = {
    top: "h-16",
    middle: "h-24",
    bottom: "h-16",
    sidebar: "h-64",
  };

  return (
    <Card className={`border-dashed border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className={`p-2 ${heights[slot]} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-1">{t("sponsored")}</p>
          {/* 
            استبدل الكود التالي بـ AdSense code في الإنتاج:
            <ins className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="auto"
              data-full-width-responsive="true" />
          */}
          <div className="text-xs text-muted-foreground/70 font-mono">
            Ad Space ({slot})
          </div>
          <p className="text-[9px] text-muted-foreground/50 mt-1">
            Google AdSense / Unity Ads Ready
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

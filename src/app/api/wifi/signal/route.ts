import { NextRequest, NextResponse } from "next/server";

// تحليل إشارة WiFi - يجمع معلومات من Network Information API
// ملاحظة: المعلومات الكاملة متاحة فقط في المتصفح، هذا endpoint يكمّلها

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionInfo } = body;

    // connectionInfo يُرسل من المتصفح (Network Information API)
    const {
      effectiveType,
      downlink,
      rtt,
      saveData,
    } = connectionInfo || {};

    // تحليل قوة الإشارة بناءً على RTT
    let signalQuality = "Unknown";
    let signalStrength = "Unknown";
    let recommendation = "";
    let qualityScore = 0;

    if (rtt !== undefined && rtt !== null) {
      if (rtt < 50) {
        signalQuality = "Excellent";
        signalStrength = "Strong (-50 to -30 dBm)";
        qualityScore = 100;
        recommendation = "🟢 إشارة ممتازة، لا حاجة لأي إجراء.";
      } else if (rtt < 100) {
        signalQuality = "Good";
        signalStrength = "Good (-70 to -50 dBm)";
        qualityScore = 80;
        recommendation = "🟢 إشارة جيدة، مناسب لجميع الاستخدامات.";
      } else if (rtt < 200) {
        signalQuality = "Fair";
        signalStrength = "Fair (-80 to -70 dBm)";
        qualityScore = 60;
        recommendation = "🟡 إشارة متوسطة. حاول الاقتراب من الراوتر أو تقليل العوائق.";
      } else if (rtt < 500) {
        signalQuality = "Poor";
        signalStrength = "Weak (-90 to -80 dBm)";
        qualityScore = 30;
        recommendation = "🔴 إشارة ضعيفة. فكّر في شراء WiFi extender أو نقل الراوتر.";
      } else {
        signalQuality = "Very Poor";
        signalStrength = "Very Weak (< -90 dBm)";
        qualityScore = 10;
        recommendation = "🔴 إشارة سيئة جداً. تحقق من وضع الراوتر والمعطلات.";
      }
    }

    // تحليل نوع الشبكة
    let networkAnalysis = "";
    if (effectiveType) {
      switch (effectiveType) {
        case "4g":
          networkAnalysis = " شبكة 4G - مناسبة لـ HD streaming و gaming";
          qualityScore += 10;
          break;
        case "3g":
          networkAnalysis = " شبكة 3G - مناسبة للتصفح العادي";
          break;
        case "2g":
          networkAnalysis = " شبكة 2G - بطيئة، توقع مشاكل في التطبيقات";
          qualityScore -= 20;
          break;
        case "slow-2g":
          networkAnalysis = " شبكة بطيئة جداً - غير مناسبة لمعظم التطبيقات";
          qualityScore -= 40;
          break;
      }
    }

    // تحليل السرعة
    let speedAnalysis = "";
    if (downlink !== undefined) {
      if (downlink >= 50) {
        speedAnalysis = " سرعة ممتازة - مناسبة لـ 4K streaming";
      } else if (downlink >= 10) {
        speedAnalysis = " سرعة جيدة - مناسبة لـ HD streaming و gaming";
      } else if (downlink >= 1.5) {
        speedAnalysis = " سرعة مقبولة - مناسبة للتصفح والـ SD video";
      } else {
        speedAnalysis = " سرعة بطيئة - قد تواجه مشاكل في الفيديو";
      }
    }

    // توصية قناة WiFi
    const channelRecommendation = getChannelRecommendation();

    return NextResponse.json({
      success: true,
      data: {
        connectionInfo: {
          effectiveType,
          downlink: downlink ? `${downlink} Mbps` : "Unknown",
          rtt: rtt ? `${rtt} ms` : "Unknown",
          saveData: saveData ? "مفعّل" : "معطّل",
        },
        analysis: {
          signalQuality,
          signalStrength,
          qualityScore: Math.max(0, Math.min(100, qualityScore)),
          networkAnalysis,
          speedAnalysis,
          recommendation,
        },
        channelRecommendation,
        tips: [
          "📡 ضع الراوتر في مركز المنزل وبارتفاع 1.5-2 متر",
          "🚫 تجنب وضع الراوتر بجوار الميكروويف أو الهواتف اللاسلكية",
          "🧱 الجدران الخرسانية تقلل الإشارة بنسبة 40-60%",
          "🔄 جرب تغيير قناة WiFi لو فيها ازدحام",
          "⚡ استخدم 5GHz للسرعة، 2.4GHz للمدى الطويل",
          "📱 قلل عدد الأجهزة المتصلة على نفس القناة",
        ],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getChannelRecommendation() {
  // توصية عامة لاختيار القناة الأقل ازدحاماً
  const channels2_4GHz = [
    { channel: 1, congestion: "متوسط", recommendation: "جيد" },
    { channel: 6, congestion: "عالي", recommendation: "تجنّب" },
    { channel: 11, congestion: "متوسط", recommendation: "جيد" },
  ];
  
  const channels5GHz = [
    { channel: 36, congestion: "منخفض", recommendation: "ممتاز" },
    { channel: 40, congestion: "منخفض", recommendation: "ممتاز" },
    { channel: 44, congestion: "منخفض", recommendation: "ممتاز" },
    { channel: 48, congestion: "منخفض", recommendation: "ممتاز" },
    { channel: 149, congestion: "منخفض جداً", recommendation: "الأفضل" },
    { channel: 153, congestion: "منخفض جداً", recommendation: "الأفضل" },
    { channel: 157, congestion: "منخفض جداً", recommendation: "الأفضل" },
    { channel: 161, congestion: "منخفض جداً", recommendation: "الأفضل" },
  ];

  return {
    "2.4GHz": {
      bestChannels: [1, 11],
      channels: channels2_4GHz,
      note: "القنوات 1, 6, 11 هي الوحيدة التي لا تتداخل. اختر الأقل ازدحاماً."
    },
    "5GHz": {
      bestChannels: [149, 153, 157, 161],
      channels: channels5GHz,
      note: "القنوات العالية (149-161) عادة أقل ازدحاماً وأفضل للأداء."
    },
    general: "للحصول على أفضل أداء، استخدم 5GHz لو متاح لأنه أقل ازدحاماً وأسرع."
  };
}

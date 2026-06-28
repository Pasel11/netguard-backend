import { NextRequest, NextResponse } from "next/server";

// تحليل قوة كلمة مرور WiFi - يحلل محلياً بدون إرسال كلمة المرور لأي مكان

interface PasswordAnalysis {
  password: string;
  score: number; // 0-100
  strength: "very_weak" | "weak" | "fair" | "strong" | "very_strong";
  length: number;
  characterSets: {
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
  entropy: number; // bits
  crackTime: {
    online: string;
    offline: string;
  };
  issues: string[];
  suggestions: string[];
  isCommonPassword: boolean;
  wpaRecommendation: string;
}

const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "1234567890", "qwerty123",
  "abc12345", "password1", "iloveyou1", "admin123", "welcome1",
  "12345678a", "00000000", "11111111", "abcdefgh", "qwertyui",
  "12341234", "1q2w3e4r", "letmein1", "monkey123", "sunshine1",
  "princess1", "football1", "charlie1", "shadow12", "michael1",
  "password123", "123456789a", "qwerty1234", "11111111a",
]);

function calculateEntropy(password: string, charSets: any): number {
  let poolSize = 0;
  if (charSets.lowercase) poolSize += 26;
  if (charSets.uppercase) poolSize += 26;
  if (charSets.numbers) poolSize += 10;
  if (charSets.symbols) poolSize += 32;
  if (poolSize === 0) return 0;
  return Math.log2(poolSize) * password.length;
}

function formatCrackTime(entropyBits: number, guessesPerSecond: number): string {
  const seconds = Math.pow(2, entropyBits) / guessesPerSecond;
  
  if (seconds < 1) return "أقل من ثانية";
  if (seconds < 60) return `${Math.round(seconds)} ثانية`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} ساعة`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} يوم`;
  if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} سنة`;
  if (seconds < 31536000 * 1e6) return `${Math.round(seconds / 31536000 / 1000)} ألف سنة`;
  if (seconds < 31536000 * 1e9) return `${Math.round(seconds / 31536000 / 1e6)} مليون سنة`;
  return `أكثر من مليار سنة`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const charSets = {
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^a-zA-Z0-9]/.test(password),
    };

    const entropy = calculateEntropy(password, charSets);
    const isCommon = COMMON_PASSWORDS.has(password.toLowerCase()) || password.length < 8;

    // حساب درجة الأمان
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // الطول
    if (password.length >= 8) score += 20;
    else issues.push("كلمة المرور أقل من 8 أحرف");
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 15;
    if (password.length < 8) suggestions.push("استخدم 8 أحرف على الأقل (يُفضل 12+)");

    // تنوع الأحرف
    let varietyCount = 0;
    if (charSets.lowercase) { score += 10; varietyCount++; }
    if (charSets.uppercase) { score += 10; varietyCount++; }
    else suggestions.push("أضف أحرف كبيرة (A-Z)");
    if (charSets.numbers) { score += 10; varietyCount++; }
    else suggestions.push("أضف أرقام (0-9)");
    if (charSets.symbols) { score += 15; varietyCount++; }
    else suggestions.push("أضف رموز خاصة (!@#$%^&*)");

    if (varietyCount >= 3) score += 5;

    // الانتروبي
    if (entropy >= 60) score += 10;
    if (entropy >= 100) score += 5;

    // كلمات مرور شائعة
    if (isCommon) {
      score = Math.min(score, 20);
      issues.push("كلمة المرور شائعة جداً وقابلة للكسر في ثوانٍ");
      suggestions.push("استخدم كلمة مرور فريدة من نوعها");
    }

    // أنماط ضعيفة
    if (/^(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(password)) {
      score -= 20;
      issues.push("كلمة المرور تحتوي على نمط تسلسلي ضعيف");
    }
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      issues.push("كلمة المرور تحتوي على تكرار نفس الحرف");
    }

    score = Math.max(0, Math.min(100, score));

    let strength: PasswordAnalysis["strength"];
    if (score < 25) strength = "very_weak";
    else if (score < 45) strength = "weak";
    else if (score < 65) strength = "fair";
    else if (score < 85) strength = "strong";
    else strength = "very_strong";

    // أوقات الكسر
    // Online attack: ~1000 محاولة/ثانية
    // Offline attack (GPU): ~10 مليار محاولة/ثانية
    const onlineTime = formatCrackTime(entropy, 1000);
    const offlineTime = isCommon ? "أقل من ثانية" : formatCrackTime(entropy, 10e9);

    // توصية WPA
    let wpaRecommendation = "";
    if (password.length < 8) {
      wpaRecommendation = "🔴 مرفوضة - WPA/WPA2 يتطلب 8 أحرف على الأقل";
    } else if (score < 45) {
      wpaRecommendation = "🔴 ضعيفة - يمكن كسرها بأقل من ساعة باستخدام GPU";
    } else if (score < 65) {
      wpaRecommendation = "🟡 مقبولة لكن يُنصح بتقويتها";
    } else if (score < 85) {
      wpaRecommendation = "🟢 قوية - ستحمي شبكتك بشكل جيد";
    } else {
      wpaRecommendation = "✅ ممتازة - مثالية لـ WPA2/WPA3";
    }

    const analysis: PasswordAnalysis = {
      password: "*".repeat(password.length),
      score,
      strength,
      length: password.length,
      characterSets: charSets,
      entropy: Math.round(entropy * 10) / 10,
      crackTime: {
        online: onlineTime,
        offline: offlineTime,
      },
      issues,
      suggestions: suggestions.length > 0 ? suggestions : ["كلمة المرور قوية، استمر!"],
      isCommonPassword: isCommon,
      wpaRecommendation,
    };

    return NextResponse.json({
      success: true,
      data: analysis,
      note: "🔒 كلمة المرور لم تُحفظ ولم تُرسل لأي مكان خارجي. التحليل تم محلياً.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/analyze/password",
    description: "تحليل قوة كلمة مرور WiFi محلياً بدون حفظ أو إرسال",
    usage: {
      method: "POST",
      body: { password: "string (required)" },
    },
    privacy: "🔒 كلمة المرور تُحلل محلياً ولا تُحفظ في أي قاعدة بيانات",
  });
}

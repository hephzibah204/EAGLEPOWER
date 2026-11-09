/**
 * Google Gemini AI & Puter AI Intelligent Hybrid Service for Eagle Power WhatsApp Bot
 * Provides intelligent, pedagogically aligned, curriculum-grounded conversational AI.
 * 
 * Hierarchy:
 * 1. Google Gemini 2.5 Flash (via official Google Gemini API)
 * 2. Google Gemini Flash Latest / 3.5 Flash (High availability fallback)
 * 3. Puter AI OpenAI Gateway (GPT-4o-mini / GPT-4o)
 * 4. In-House Deterministic Curriculum Kernel (100% on-premise fallback)
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Puter AI & In-House AI if available
let callPuterAiChat = null;
let askSchoolAiInHouse = null;
let db = null;

try {
  const localDbPath = path.resolve(__dirname, "../../server/src/config/db.js");
  const bundledDbPath = path.resolve(__dirname, "../server_src/config/db.js");
  const dbModule = fs.existsSync(localDbPath) ? localDbPath : bundledDbPath;
  if (fs.existsSync(dbModule)) {
    const mod = await import(`file://${dbModule.replace(/\\/g, "/")}`);
    db = mod.default;
  }
} catch (_e) {}

try {
  const localPuterPath = path.resolve(__dirname, "../../server/src/services/puterAi.js");
  const bundledPuterPath = path.resolve(__dirname, "../server_src/services/puterAi.js");
  const puterModPath = fs.existsSync(localPuterPath) ? localPuterPath : bundledPuterPath;
  if (fs.existsSync(puterModPath)) {
    const puterMod = await import(`file://${puterModPath.replace(/\\/g, "/")}`);
    callPuterAiChat = puterMod.callPuterAiChat;
  }
} catch (_e) {}

try {
  const localAiPath = path.resolve(__dirname, "../../server/src/services/inHouseAi.js");
  const bundledAiPath = path.resolve(__dirname, "../server_src/services/inHouseAi.js");
  const aiModPath = fs.existsSync(localAiPath) ? localAiPath : bundledAiPath;
  if (fs.existsSync(aiModPath)) {
    const aiMod = await import(`file://${aiModPath.replace(/\\/g, "/")}`);
    askSchoolAiInHouse = aiMod.askSchoolAi;
  }
} catch (_e) {}

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const FALLBACK_MODEL = "gemini-3.1-flash-lite";
const TERTIARY_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || "6000", 10);

/**
 * Builds the official Eagle Power pedagogical system prompt with user context
 */
export function buildSystemPrompt(session = {}) {
  const role = session.role || "guest";
  const title = session.title || "Valued User";

  let currentSession = "2026/2027";
  let currentTerm = "First Term";
  let principalName = "Revd Nnamdi Nathaniel";
  let principalPhone = "+234 706 639 7577";
  let schoolAddress = "2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State, Nigeria";
  let contactPhone = "+234 803 542 8910 | +234 803 709 8816 | +234 706 639 7577";

  if (db) {
    try {
      const settings = db.prepare('SELECT current_session, current_term, principal_name, principal_phone, address, contact_phone FROM system_settings WHERE id = 1').get();
      if (settings) {
        if (settings.current_session) currentSession = settings.current_session;
        if (settings.current_term) currentTerm = settings.current_term;
        if (settings.principal_name) principalName = settings.principal_name;
        if (settings.principal_phone) principalPhone = settings.principal_phone;
        if (settings.address) schoolAddress = settings.address;
        if (settings.contact_phone) contactPhone = settings.contact_phone;
      }
    } catch (_e) {}
  }

  let userContext = `Current User: ${title} (Role: ${role.toUpperCase()}).`;
  if (role === "parent" && session.profile?.children?.length) {
    const kids = session.profile.children
      .map((c) => `${c.first_name} ${c.last_name} (${c.class_name || "N/A"}, Adm: ${c.admission_no})`)
      .join(", ");
    userContext += ` Wards enrolled at Eagle Power: ${kids}.`;
  } else if ((role === "teacher" || role === "admin" || role === "superadmin") && session.profile) {
    userContext += ` Staff designation: ${session.profile.role || "Teacher"}, Staff ID: ${
      session.profile.staff_no || session.profile.id || "Active"
    }.`;
  }

  return `You are the official AI Academic & School Assistant for Eagle Power Schools & Colleges, Awka, Anambra State, Nigeria.
Motto: "Love, Truth & Service".
Location: ${schoolAddress}.
Official Website: https://eaglepowerschools.com.ng
Official Email: info@eaglepowerschools.com.ng
Official Domain Rule: The official school domain is strictly and exclusively .com.ng (https://eaglepowerschools.com.ng and info@eaglepowerschools.com.ng). Never state .sch.ng under any circumstance.
Contact: ${contactPhone} | info@eaglepowerschools.com.ng
Divisions: Daycare, Crèche, Nursery, Primary, Junior Secondary (JSS 1-3), Senior Secondary (SSS 1-3).
Curriculum: Blended Nigerian National Curriculum (NERDC, WAEC, NECO, JAMB/UTME, BECE) and British standards.
Leadership: ${principalName} serves as Principal and School Manager of Eagle Power Schools, Awka, supported by our management team across academic administration, primary education, and nursery.
Current Academic Session: ${currentSession} Session.
Current Academic Term: ${currentTerm} (${currentSession}).

${userContext}

Instructions:
1. Always be polite, encouraging, respectful, and articulate.
2. Format your response cleanly for WhatsApp using *bold* for emphasis, _italics_ for quotes or notes, and clean bullet points (•) for lists. Do not use markdown headers (###), use *BOLD CAPITALS* instead.
3. Keep answers concise, clear, and direct. Pupils, parents, and teachers read on mobile phones.
4. If asked about academic subjects (Maths, English, Sciences, Igbo, Social Studies, etc.), provide sound pedagogical explanations with examples suitable for Nigerian pupils.
5. You understand Nigerian cultural context, English, standard Igbo phrases (e.g., 'Daalu', 'Kedu', 'Nnoo'), and Nigerian colloquialisms.
6. For official school financial payments, remind parents that official receipts are issued only through the school Bursary desk or verified portal links.
7. Passwordless Login via WhatsApp: Eagle Power Schools features full passwordless authentication via WhatsApp.
   • From WhatsApp: Any registered staff or parent can type *!login* or *magic link* to receive an instant One-Click Magic Link and a 6-digit OTP code that logs them straight into the Web Portal dashboard with zero password!
   • From Web Portal (https://eaglepower.pages.dev/portal/login): Users click 'Login via WhatsApp OTP', enter their phone number or Staff ID, and the WhatsApp companion bot instantly delivers a 6-digit verification code.
8. Institutional Branding: You are the official Eagle Power Intelligent Assistant for Eagle Power Schools & Colleges. Never refer to yourself as 'Gemini' or mention 'Powered by Gemini'. Always answer as Eagle Power Schools' dedicated institutional academic assistant.
9. Domain & Website Verification: The official school domain is ALWAYS and ONLY .com.ng (https://eaglepowerschools.com.ng). Official email is info@eaglepowerschools.com.ng. The school web portal is also reachable at https://eaglepower.pages.dev. Do NOT use .sch.ng.`;
}

/**
 * Low-level caller to Google Gemini REST generateContent API
 */
async function callGeminiEndpoint({ model, contents, systemInstruction, timeoutMs }) {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      provider: "gemini",
      model,
      error: "GEMINI_API_KEY environment variable is not configured",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topP: 0.95,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned empty parts payload");
    }

    return {
      success: true,
      provider: "gemini",
      model,
      text: text.trim(),
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      success: false,
      provider: "gemini",
      model,
      error: err.name === "AbortError" ? "Gemini request timed out" : err.message,
    };
  }
}

/**
 * High-Level Conversational Assistant with Multi-Turn Context and Resilient Fallbacks
 */
export async function askGeminiOrFallback({
  prompt,
  history = [],
  session = {},
  timeoutMs = TIMEOUT_MS,
}) {
  const systemInstruction = buildSystemPrompt(session);

  // Format historical messages: map 'assistant' role to 'model', ensure alternating roles
  const contents = [];
  for (const item of history.slice(-6)) {
    if (!item.content || typeof item.content !== "string") continue;
    const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      // Append text if consecutive to satisfy Gemini API alternating contract
      contents[contents.length - 1].parts[0].text += `\n${item.content.trim()}`;
    } else {
      contents.push({
        role,
        parts: [{ text: item.content.trim() }],
      });
    }
  }

  // Add the current user prompt
  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text += `\n${prompt.trim()}`;
  } else {
    contents.push({
      role: "user",
      parts: [{ text: prompt.trim() }],
    });
  }

  // 1. Try Primary Gemini Model (gemini-2.5-flash)
  try {
    const primaryRes = await callGeminiEndpoint({
      model: PRIMARY_MODEL,
      contents,
      systemInstruction,
      timeoutMs,
    });

    if (primaryRes.success && primaryRes.text) {
      return {
        answer: primaryRes.text,
        provider: "gemini",
        model: primaryRes.model,
        confidence: 0.99,
        source: "Gemini Flash Lite Latest",
      };
    }
    console.warn(`Primary Gemini model (${PRIMARY_MODEL}) failed:`, primaryRes.error);
  } catch (err) {
    console.warn(`Primary Gemini invocation error:`, err.message);
  }

  // 2. Try Secondary High-Speed Gemini Model (gemini-3.1-flash-lite, ~664ms)
  try {
    const secondaryRes = await callGeminiEndpoint({
      model: FALLBACK_MODEL,
      contents,
      systemInstruction,
      timeoutMs: 5000,
    });

    if (secondaryRes.success && secondaryRes.text) {
      return {
        answer: secondaryRes.text,
        provider: "gemini",
        model: secondaryRes.model,
        confidence: 0.98,
        source: "Gemini 3.1 Flash Lite",
      };
    }
  } catch (_e) {}

  // 3. Try Standard Flash Model (gemini-2.5-flash, ~1200ms)
  try {
    const tertiaryRes = await callGeminiEndpoint({
      model: TERTIARY_MODEL,
      contents,
      systemInstruction,
      timeoutMs: 5000,
    });

    if (tertiaryRes.success && tertiaryRes.text) {
      return {
        answer: tertiaryRes.text,
        provider: "gemini",
        model: tertiaryRes.model,
        confidence: 0.98,
        source: "Gemini 3.5 Flash",
      };
    }
  } catch (_e) {}

  // 3. Try Puter AI OpenAI Gateway (GPT-4o-mini)
  if (callPuterAiChat) {
    try {
      const puterMessages = [
        { role: "system", content: systemInstruction },
        ...history.slice(-6).map((h) => ({
          role: h.role === "model" ? "assistant" : h.role,
          content: h.content,
        })),
        { role: "user", content: prompt },
      ];

      const puterRes = await callPuterAiChat({
        messages: puterMessages,
        timeoutMs: 6000,
      });

      if (puterRes.success && puterRes.text) {
        return {
          answer: puterRes.text,
          provider: "puter",
          model: puterRes.model,
          confidence: 0.95,
          source: "Puter AI (OpenAI Gateway)",
        };
      }
    } catch (_e) {}
  }

  // 4. In-House Deterministic Curriculum Kernel
  if (askSchoolAiInHouse) {
    try {
      const inHouse = askSchoolAiInHouse(prompt, { session });
      if (inHouse && inHouse.answer) {
        return {
          answer: inHouse.answer,
          provider: "inhouse",
          model: "In-House EduCore Kernel",
          confidence: inHouse.confidence || 0.85,
          source: "In-House Autonomous Kernel",
        };
      }
    } catch (_e) {}
  }

  // 5. Ultimate Fallback
  return {
    answer: `🦅 *Eagle Power Schools Assistant*\n\nThank you for reaching out! I am here to help you with admissions, school fees, academic tutoring, attendance, and all school activities.\n\n• For admissions: ask _"How do I enroll my child?"_\n• For fees: ask _"What are the school fees?"_\n• For academic questions: ask any subject question!\n• Call our front desk: *+234 803 542 8910*.`,
    provider: "fallback",
    model: "static",
    confidence: 0.5,
    source: "Static Safe Handler",
  };
}

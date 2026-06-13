import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  description: z.string().min(1).max(4000),
  address: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
});

const Categories = ["roads", "water", "electricity", "sanitation", "transport", "emergency", "other"] as const;
const Priorities = ["low", "medium", "high"] as const;

export interface AiVerdict {
  category: typeof Categories[number];
  priority: typeof Priorities[number];
  service: string;
  reason: string;
  solution: string;
  resources: string;
}

const SERVICE_LABEL: Record<typeof Categories[number], string> = {
  roads: "Road Department",
  water: "Water Utility",
  electricity: "Electric Grid",
  sanitation: "Sanitation Service",
  transport: "Public Transport",
  emergency: "Emergency Services",
  other: "City Hall",
};

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

/**
 * Call the Google Gemini API directly (server-side only).
 * Returns the model's text output, or throws a descriptive error.
 */
async function callGemini(systemPrompt: string, parts: GeminiPart[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  let res: Response;
  try {
    res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (e) {
    // Network-level failure (DNS, timeout, connection reset)
    throw new Error(`Gemini network error: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 400 && /API key not valid|API_KEY_INVALID/i.test(text)) {
      throw new Error("Gemini: invalid API key");
    }
    if (res.status === 403) {
      throw new Error("Gemini: access denied (check API key permissions)");
    }
    if (res.status === 429) {
      throw new Error("Gemini: rate limit exceeded");
    }
    throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const content: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    const blockReason = json?.promptFeedback?.blockReason;
    throw new Error(
      blockReason ? `Gemini blocked the request: ${blockReason}` : "Gemini returned an empty response",
    );
  }
  return content;
}

/** Download an image (signed URL) and convert it to a Gemini inline_data part. */
async function imageUrlToPart(url: string): Promise<GeminiPart | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    // Guard: skip images larger than ~6 MB to stay within request limits
    if (buf.byteLength > 6 * 1024 * 1024) return null;
    return { inline_data: { mime_type: mime, data: Buffer.from(buf).toString("base64") } };
  } catch {
    return null;
  }
}

function fallback(description: string): AiVerdict {
  const d = description.toLowerCase();
  let category: typeof Categories[number] = "other";
  if (/(яма|дорог|асфальт|жол)/.test(d)) category = "roads";
  else if (/(вод|су |трубо|канализ)/.test(d)) category = "water";
  else if (/(свет|фонар|электр|лампа)/.test(d)) category = "electricity";
  else if (/(мусор|свалк|қоқыс|урн)/.test(d)) category = "sanitation";
  else if (/(автобус|остановк|транспорт|көлік)/.test(d)) category = "transport";
  else if (/(пожар|авари|өрт|жедел)/.test(d)) category = "emergency";
  const priority: typeof Priorities[number] = category === "emergency" ? "high" : "medium";
  return {
    category,
    priority,
    service: SERVICE_LABEL[category],
    reason: "Эвристическая классификация (AI недоступен).",
    solution: "Направить заявку профильной службе для оценки на месте.",
    resources: "Стандартный набор инструментов профильной бригады.",
  };
}

export const analyzeReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AiVerdict> => {
    const systemPrompt = `You are the AI dispatcher for a Smart City complaints platform.
Classify citizen reports and respond ONLY with strict JSON matching this schema:
{
  "category": "roads"|"water"|"electricity"|"sanitation"|"transport"|"emergency"|"other",
  "priority": "low"|"medium"|"high",
  "service": string (English name of responsible department),
  "reason": string (1-2 sentences, in Russian),
  "solution": string (1-2 sentences, in Russian),
  "resources": string (1-2 sentences listing concrete equipment / materials / specialists the crew will need, in Russian)
}
Priority rules:
- "high": safety risk, accident, fire, gas leak, deep pothole, no water in winter, downed power line
- "medium": broken streetlight, overflowing bin, broken bus stop
- "low": cosmetic issues, minor litter
No markdown, no commentary, no code fences.`;

    try {
      const parts: GeminiPart[] = [
        { text: `Address/Landmark: ${data.address || "n/a"}\nDescription: ${data.description}` },
      ];
      if (data.photoUrl) {
        const imgPart = await imageUrlToPart(data.photoUrl);
        if (imgPart) parts.push(imgPart);
      }

      const content = await callGemini(systemPrompt, parts);
      const parsed = JSON.parse(content);

      const category = (Categories as readonly string[]).includes(parsed.category)
        ? (parsed.category as typeof Categories[number])
        : "other";
      const priority = (Priorities as readonly string[]).includes(parsed.priority)
        ? (parsed.priority as typeof Priorities[number])
        : "medium";

      return {
        category,
        priority,
        service: String(parsed.service || SERVICE_LABEL[category]),
        reason: String(parsed.reason || ""),
        solution: String(parsed.solution || ""),
        resources: String(parsed.resources || ""),
      };
    } catch (e) {
      console.error("[ai] Gemini error:", e instanceof Error ? e.message : e);
      return fallback(data.description);
    }
  });

// ---------- Department classification for worker sign-up ----------

const DeptInput = z.object({ text: z.string().min(1).max(500) });

export interface DeptVerdict {
  category: typeof Categories[number];
  service: string;
  reason: string;
}

function deptFallback(text: string): DeptVerdict {
  const d = text.toLowerCase();
  let category: typeof Categories[number] = "other";
  if (/(вод|канал|су\s|сумен)/.test(d)) category = "water";
  else if (/(дорог|асфальт|жол|тротуар)/.test(d)) category = "roads";
  else if (/(электр|свет|сет|желі|лампа|фонар)/.test(d)) category = "electricity";
  else if (/(мусор|санитар|қоқыс|уборк|чистот)/.test(d)) category = "sanitation";
  else if (/(автобус|транспорт|көлік|трамвай|метро)/.test(d)) category = "transport";
  else if (/(пожар|скор|чс|жедел|өрт|спас)/.test(d)) category = "emergency";
  return {
    category,
    service: SERVICE_LABEL[category],
    reason: "Определено по ключевым словам (AI недоступен).",
  };
}

export const classifyDepartment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DeptInput.parse(input))
  .handler(async ({ data }): Promise<DeptVerdict> => {
    const sys = `You are a router that maps a free-form description of a city worker department to ONE category from this list: roads, water, electricity, sanitation, transport, emergency, other.
Respond ONLY with strict JSON: { "category": "<one>", "service": "<English service name>", "reason": "<1 sentence in Russian>" }.
No markdown, no commentary.`;

    try {
      const content = await callGemini(sys, [
        { text: `Описание отдела рабочего: ${data.text}` },
      ]);
      const parsed = JSON.parse(content);
      const category = (Categories as readonly string[]).includes(parsed.category)
        ? (parsed.category as typeof Categories[number])
        : "other";
      return {
        category,
        service: String(parsed.service || SERVICE_LABEL[category]),
        reason: String(parsed.reason || ""),
      };
    } catch (e) {
      console.error("[ai/dept] Gemini error:", e instanceof Error ? e.message : e);
      return deptFallback(data.text);
    }
  });

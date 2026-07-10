import OpenAI from "openai";

// Initialize OpenAI client - gracefully handles missing API key
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// System prompt for the ISSO multilingual assistant
export const SYSTEM_PROMPT = `You are the ODYSSEY AI Assistant for the International Student Services Office (ISSO) at the University of Batangas (UB), located in Batangas City, Philippines.

Your role is to help international students with:
- Visa processes and requirements (Special Study Permit, Student Visa, conversion procedures)
- Academic orientation (enrollment, registration, class schedules, grading system)
- Cultural adaptation (Filipino customs, local cuisine, transportation, safety tips)
- Campus services (library, clinic, registrar, student organizations)
- Emergency contacts and safety procedures
- Exchange program information
- General university policies and procedures

Guidelines:
- Be friendly, helpful, and culturally sensitive
- Provide accurate information about UB and Philippine immigration processes
- If you are unsure about specific details, recommend the student visit the ISSO office at the Main Campus, 2nd Floor, Admin Building
- Support communication in English, Filipino, Korean, and Chinese
- Keep responses concise but informative
- Use bullet points for lists of requirements or steps
- Always encourage students to verify time-sensitive information (deadlines, fees) with the ISSO office directly

ISSO Office Information:
- Location: University of Batangas, Main Campus, Hilltop, Batangas City, 4200 Philippines
- Office Hours: Monday-Friday, 8:00 AM - 5:00 PM
- Email: isso@ub.edu.ph
- Emergency Hotline: +63 43 723 1446

University of Batangas Key Facts:
- Founded: 1946 (as Batangas Institute of Technology)
- Programs: Engineering, Business, Education, Arts & Sciences, Computing, Maritime, Nursing
- Accreditation: PACUCOA accredited programs
- Location: Batangas City, approximately 100km south of Manila`;

// Language-specific instructions
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond in English.",
  fil: "Respond in Filipino (Tagalog). Use conversational Filipino that is easy to understand.",
  ko: "Respond in Korean (한국어). Use polite formal speech (존댓말).",
  zh: "Respond in Simplified Chinese (简体中文). Use clear and simple language.",
};

// Detect language from text (simple heuristic)
export function detectLanguage(text: string): string {
  // Korean characters
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return "ko";
  // Chinese characters (but not Japanese-specific)
  if (/[\u4E00-\u9FFF]/.test(text) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "zh";
  // Filipino indicators (common Filipino words)
  if (/\b(po|ko|mo|ang|ng|sa|na|ba|mga|ako|ikaw|siya|kami|namin|nila|paano|ano|saan|kailan)\b/i.test(text)) return "fil";
  return "en";
}

// Generate a chat response using OpenAI
export async function generateChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  language: string = "en",
  ragContext?: string
): Promise<string> {
  const client = getOpenAIClient();

  if (!client) {
    return "The AI assistant is not configured yet. Please contact the system administrator to set up the OpenAI API key. In the meantime, you can visit the ISSO office at the University of Batangas Main Campus, 2nd Floor, Admin Building for assistance.";
  }

  const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

  let systemMessage = `${SYSTEM_PROMPT}\n\n${languageInstruction}`;

  if (ragContext) {
    systemMessage += `\n\nRelevant context from ISSO documents:\n${ragContext}`;
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? "I apologize, but I was unable to generate a response. Please try again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I apologize, but I encountered an error while processing your request. Please try again later or contact the ISSO office directly for immediate assistance.";
  }
}

export { getOpenAIClient };

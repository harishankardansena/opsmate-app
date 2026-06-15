// lib/ai.ts
// AI Fallback Chain: Gemini Key 1 → Key 2 → Key 3 → GROQ → Offline Engine

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

const GROQ_KEY = process.env.GROQ_API_KEY;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

export type AIStatus = 'gemini' | 'groq' | 'offline';

interface AIResponse {
  text: string;
  status: AIStatus;
  keyIndex?: number;
}

// ── Gemini call ───────────────────────────────────────────────────────────────
async function callGemini(apiKey: string, messages: { role: string; content: string }[]): Promise<string> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── GROQ call ─────────────────────────────────────────────────────────────────
async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY not configured');

  const res = await fetch(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GROQ error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Offline Engine ────────────────────────────────────────────────────────────
function offlineResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('task')) return '📋 Task management is available. Please check your Tasks module for details. (Offline mode — AI unavailable)';
  if (p.includes('lead')) return '🎯 Lead management is available in the Leads module. (Offline mode — AI unavailable)';
  if (p.includes('follow')) return '🔔 Check your Follow-ups module for reminders. (Offline mode — AI unavailable)';
  if (p.includes('incentive') || p.includes('salary')) return '💰 Open the Incentive Calculator to compute your earnings. (Offline mode — AI unavailable)';
  if (p.includes('performance')) return '📊 Your performance data is available in the Performance module. (Offline mode — AI unavailable)';
  if (p.includes('note') || p.includes('meeting')) return '📝 Access your notes in the Notes & Meetings module. (Offline mode — AI unavailable)';
  if (p.includes('email')) return '✉️ Use the Email Assistant module to generate professional emails. (Offline mode — AI unavailable)';
  if (p.includes('document') || p.includes('resume')) return '📁 Access your documents in the Document Vault. (Offline mode — AI unavailable)';
  return '🤖 I\'m currently in offline mode. All AI features are temporarily unavailable. Your data is safe and all manual features work normally. Please try again when connectivity is restored.';
}

// ── Main AI Chat with fallback chain ──────────────────────────────────────────
export async function aiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<AIResponse> {
  const allMessages = systemPrompt
    ? [{ role: 'user', content: `System: ${systemPrompt}\n\nUser: ${messages[messages.length - 1].content}` }, ...messages.slice(0, -1)]
    : messages;

  // Try each Gemini key
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const text = await callGemini(GEMINI_KEYS[i], allMessages);
      if (text) return { text, status: 'gemini', keyIndex: i + 1 };
    } catch (err) {
      console.warn(`Gemini key ${i + 1} failed:`, err);
    }
  }

  // Try GROQ
  try {
    const text = await callGroq(allMessages);
    if (text) return { text, status: 'groq' };
  } catch (err) {
    console.warn('GROQ fallback failed:', err);
  }

  // Offline engine
  const lastUserMsg = messages.findLast((m) => m.role === 'user')?.content ?? '';
  return { text: offlineResponse(lastUserMsg), status: 'offline' };
}

// ── Convenience wrappers ──────────────────────────────────────────────────────
export async function summarizeText(text: string): Promise<AIResponse> {
  return aiChat([
    { role: 'user', content: `Summarize the following text concisely with key points as bullet points:\n\n${text}` },
  ]);
}

export async function extractActionItems(text: string): Promise<AIResponse> {
  return aiChat([
    { role: 'user', content: `Extract all action items from the following meeting notes. Return as a numbered list:\n\n${text}` },
  ]);
}

export async function generateEmail(params: {
  type: string;
  recipient: string;
  context: string;
  tone: string;
}): Promise<AIResponse> {
  return aiChat([
    {
      role: 'user',
      content: `Generate a professional ${params.type} email.
Recipient: ${params.recipient}
Context: ${params.context}
Tone: ${params.tone}

Write the complete email with Subject line, greeting, body, and closing. Make it professional and concise.`,
    },
  ]);
}

export async function answerFromContext(question: string, context: string): Promise<AIResponse> {
  return aiChat([
    {
      role: 'user',
      content: `Based on the following data, answer the question accurately and concisely.

DATA:
${context}

QUESTION: ${question}

Answer:`,
    },
  ]);
}

export async function improveResume(resumeText: string): Promise<AIResponse> {
  return aiChat([
    {
      role: 'user',
      content: `You are a professional career coach. Review and improve the following resume. Provide:
1. Key improvements needed
2. Stronger action verbs
3. Better phrasing for achievements
4. Missing sections to add

RESUME:
${resumeText}`,
    },
  ]);
}

export async function interviewPrep(role: string, skills: string): Promise<AIResponse> {
  return aiChat([
    {
      role: 'user',
      content: `Prepare me for a ${role} interview. I have skills in: ${skills}.
Provide:
1. Top 10 likely interview questions with ideal answers
2. Key topics to study
3. Questions to ask the interviewer
4. Common mistakes to avoid`,
    },
  ]);
}

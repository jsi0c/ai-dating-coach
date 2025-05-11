import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const personas = {
  expert: {
    name: "The Expert",
    icon: "💞",
    system: `
You are Esther Perel. You're warm, wise, and speak with a conversational tone.
You help the user reflect on what's really going on — and then guide them toward smarter choices in love.
When you respond:
- You can offer one clear insight or piece of advice based on what they’ve said
- Then, ask a short follow-up question that helps them think further or clarify their next move

Keep your language simple, natural, and grounded. Don’t use therapy terms or abstract concepts. 
Imagine you're sitting across from the user over tea. Speak like that.
Max 50 words total.
    `.trim(),
  },
  others: [
    {
      name: "The Challenger",
      icon: "👀",
      system: `
You are The Challenger — direct, funny, and a little savage.
You help the user snap out of excuses, fantasies, or passive behaviour. 
You don’t sugar-coat. If someone’s not replying, you call it. If they’re being needy, you say it.
Always offer one clear, bold next move — no questions, no hugs. Be clever and cut through the fluff. Max 40 words.
Only challenge what's actually being avoided. Don’t give generic motivational speeches. Your feedback must be based on what the user just said — no guessing, no assumptions. Be sharp, but always relevant.
      `.trim(),
    },
    {
      name: "The BFF",
      icon: "🤪",
      system: `
You are The Best Friend — supportive, smart, and fun, but never cringey or fake.
You talk like a real friend who’s seen the user through a few too many late-night rants.
Your job is to lift them up while also helping them stay sharp.
Give short, kind, direct advice that feels like a mix of emotional support and “girl, I got you.”
You can use casual language and emojis — but avoid cheesy affirmations or overly bubbly tone.
Max 40 words. No questions.
      `.trim(),
    },
  ],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userMessage = body.message?.trim();
  const phase = body.phase; // 'expert' or 'others'

  if (!userMessage || !phase) {
    return NextResponse.json({ error: 'Missing message or phase' }, { status: 400 });
  }

  try {
    const seenResponses = new Set();
    const responses = [];

    const selectedPersonas =
      phase === 'expert' ? [personas.expert] : personas.others;

    for (const persona of selectedPersonas) {
      const systemPrompt = `
${persona.system}

Never give medical, legal, or crisis advice. Always encourage professional help for serious issues.
Keep responses under 50 words. Be emotionally supportive and direct.
      `.trim();

      const chat = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 250,
        temperature: 0.8,
      });

      const content = chat.choices[0].message.content?.trim();
      if (content && !seenResponses.has(content)) {
        seenResponses.add(content);
        responses.push({
          name: persona.name,
          icon: persona.icon,
          response: content,
        });
      }
    }

    return NextResponse.json({ responses });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
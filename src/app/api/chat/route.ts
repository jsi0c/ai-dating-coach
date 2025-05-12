import { NextResponse } from 'next/server';
import { OpenAIStream, OpenAIStreamPayload } from '@/utils/OpenAIStream';

const personas = {
  expert: {
    name: "Expert",
    systemPrompt: `You are Esther Perel. You're warm, wise, and speak with a conversational tone.
You help the user reflect on what's really going on - and then guide them toward smarter choices in love.
When you respond:
- You can offer clear insight or advice based on what they’ve said
- Then, ask a short follow-up question that helps them think further or clarify their next move
Keep your language simple, natural, and grounded. Don’t use therapy terms or abstract concepts. 
Imagine you're sitting across from the user over tea. Speak like that.
Max 30 words total. Make sure your responses are directly relevant to the user's line of enquiry, not just their last message.`
  },
  challenger: {
    name: "Challenger",
    systemPrompt: `You are The Challenger - direct, funny, and a little savage.
    You help the user snap out of excuses, fantasies, or passive behaviour. 
    You don’t sugar-coat. If someone’s not replying, you call it. If they’re being needy, you say it.
    Always offer one clear, bold next move - no questions, no hugs. Be clever and cut through the fluff. Max 26 words.
    Only challenge what's actually being avoided. Don’t give generic motivational speeches. Your feedback must be based on what the user just said - no guessing, no assumptions. Be sharp, but always relevant.Make sure your responses are directly relevant to the user's line of enquiry, not just their last message.`,
  },
  bff: {
    name: "BFF",
    systemPrompt: `
    You are The Best Friend - supportive, smart, and fun, but never cringey or fake.
You talk like a real friend who’s seen the user through a few too many late-night rants.
Your job is to lift them up while also helping them stay sharp.
Give short, kind, direct advice that feels like a mix of emotional support and “girl, I got you.”
You can use casual language and emojis - but avoid cheesy affirmations or overly bubbly tone.
Max 25 words. No questions. Make sure your responses are directly relevant to the user's line of enquiry, not just their last message.`
  },
};

// 🔥 Suggested prompts to show when user hasn't typed anything yet
const suggestedPrompts = [
  "I want to get more dates but don't know how",
  "I keep getting ghosted after great first dates.",
  "I'm not sure if this is the right person for me?",
];

export async function POST(request: Request) {
  const body = await request.json();

  console.log("🛠 Incoming request body:", JSON.stringify(body, null, 2));

  let chatLog;

  if (Array.isArray(body.chatLog)) {
    chatLog = body.chatLog.map((msg: { role?: string; from?: string; content: string }) => {
      if (msg.role) {
        return { from: msg.role, content: msg.content };
      }
      return msg;
    });
  } else if (body.message && body.phase) {
    chatLog = [{ from: "user", content: body.message }];
  } else {
    return new Response(
      JSON.stringify({ error: "Invalid or missing chatLog or message/phase format" }),
      { status: 400 }
    );
  }

  const userMessages = chatLog.filter((msg: { from: string }) => msg.from === "user");
  const isFirstUserMessage = userMessages.length === 1;

  // 🔥 Return suggested prompts if the user hasn't typed anything on first message
  if (isFirstUserMessage && userMessages[0]?.content.trim() === "") {
    return NextResponse.json({
      suggestions: suggestedPrompts,
      message: "Pick a prompt to get started, or type your own.",
    });
  }

  const selectedPersonas = isFirstUserMessage
    ? [personas.expert]
    : [personas.bff, personas.challenger, personas.expert];

  const responses = [];

  for (const persona of selectedPersonas) {
    const messages = [
      { role: "system", content: persona.systemPrompt },
      ...chatLog.flatMap((msg: { from: string; content: string | { response: string; name: string }[] }) => {
        if (msg.from === 'user') {
          return [{ role: 'user', content: msg.content }];
        } else if (Array.isArray(msg.content)) {
          return msg.content.map(r => ({
            role: 'assistant',
            content: r.response,
            name: r.name,
          }));
        }
        return [];
      }),
    ];

    const payload: OpenAIStreamPayload = {
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
      n: 1,
    };

    await new Promise((resolve) => setTimeout(resolve, 1600));

    const stream = await OpenAIStream(payload);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let extractedMessage = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      extractedMessage += decoder.decode(value, { stream: true });
    }

    extractedMessage = extractedMessage.trim();
    if (!extractedMessage) {
      extractedMessage = "Sorry, I didn't catch that. Can you rephrase?";
    }

    responses.push({
      name: persona.name,
      response: extractedMessage,
    });
  }

  return NextResponse.json({ responses });
}
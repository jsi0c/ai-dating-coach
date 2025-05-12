import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export async function POST(request: Request) {
  const { chatLog } = await request.json();

  // Count the number of user messages
  const userMessages = chatLog.filter(msg => msg.role === "user");
  const isFirstUserMessage = userMessages.length === 1;

  // Debugging: Uncomment these lines if you want to see what's happening
  // console.log("chatLog:", chatLog.map(msg => ({role: msg.role, name: msg.name, content: msg.content})));
  // console.log("userMessages.length:", userMessages.length);
  // console.log("isFirstUserMessage:", isFirstUserMessage);

  // Select personas based on whether it's the first user message or not
  const selectedPersonas = isFirstUserMessage
    ? [personas.expert]
    : [personas.expert, personas.challenger, personas.bff];

  const responses = [];

  for (const persona of selectedPersonas) {
    const messages = [
      { role: "system", content: persona.systemPrompt },
      ...chatLog,
    ];

    const payload: OpenAIStreamPayload = {
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
      n: 1,
    };

    // Simulate typing delay before each response
    await new Promise((resolve) => setTimeout(resolve, 1600));

    const stream = await OpenAIStream(payload);
    const reader = stream.getReader();

    let done = false;
    let personaResponse = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = new TextDecoder().decode(value);
        personaResponse += chunk;
      }
    }

    responses.push({
      name: persona.name,
      response: personaResponse.trim(),
    });
  }

  return NextResponse.json({ responses });
}
import OpenAI from 'openai';
import { ChatCompletionCreateParams } from 'openai/resources/chat/completions';

export type OpenAIStreamPayload = ChatCompletionCreateParams & { stream: true };

export async function OpenAIStream(payload: OpenAIStreamPayload): Promise<ReadableStream> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const response = await openai.chat.completions.create({
    ...payload,
    stream: true,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      }
      controller.close();
    },
  });

  return stream;
}
import { OpenAI } from 'openai-edge';
import { Stream } from 'openai-edge/stream';

export type OpenAIStreamPayload = {
  model: string;
  messages: { role: string; content: string }[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
  n: number;
};

export async function OpenAIStream(payload: OpenAIStreamPayload): Promise<ReadableStream> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const response = await openai.chat.completions.create(payload);
  return response as unknown as ReadableStream;
}
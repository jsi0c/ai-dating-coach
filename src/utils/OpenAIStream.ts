import OpenAI from 'openai';
import { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat';

export type OpenAIStreamPayload = ChatCompletionCreateParamsStreaming;

export async function OpenAIStream(payload: OpenAIStreamPayload): Promise<ReadableStream> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  // Ensure stream: true is always set
  const response = await openai.chat.completions.create({
    ...payload,
    stream: true,
  });
  return response as unknown as ReadableStream;
}
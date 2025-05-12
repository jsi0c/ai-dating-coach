'use client';

import { useState, useEffect, useRef } from 'react';

type PersonaResponse = {
  name: string;
  icon: string;
  response: string;
};

type MessageBlock = {
  from: 'user' | 'ai';
  content: string | PersonaResponse[];
};

export default function Home() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<MessageBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationPhase, setConversationPhase] = useState<'expert' | 'awaiting-user-response' | 'others'>('expert');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;

    const newUserBlock: MessageBlock = { from: 'user', content: input };
    setChatLog((prev) => [...prev, newUserBlock]);
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatLog: [
            ...chatLog,
            { from: 'user', content: input }
          ],
        }),
      });

      const data: { responses: PersonaResponse[]; error?: string } = await res.json();

      if (res.ok) {
        const newAIBlock: MessageBlock = { from: 'ai', content: data.responses };
        setChatLog((prev) => [...prev, newAIBlock]);

        if (conversationPhase === 'expert') {
          setConversationPhase('awaiting-user-response');
        } else if (conversationPhase === 'awaiting-user-response') {
          setConversationPhase('others');
        } else {
          setConversationPhase('expert');
        }
      } else {
        console.error(data.error || 'Something went wrong');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-white flex flex-col items-center px-4 pt-8 pb-28 relative">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-green-400">💬 Dating drama?</h1>
        <p className="text-md text-gray-400">Get clarity with your personal sounding board.</p>

        {chatLog.map((block, index) => {
          if (block.from === 'user') {
            return (
              <div key={index} className="flex justify-end mt-2">
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg max-w-[80%] text-sm shadow">
                  {typeof block.content === 'string' ? block.content : ''}
                </div>
              </div>
            );
          }

          const responses = block.content as PersonaResponse[];
          return (
            <div key={index} className="space-y-3 mt-6">
              {responses.map((r, i) => (
                <div key={i} className="bg-[#2d2d2d] border border-gray-700 p-4 rounded-lg shadow-md flex gap-3">
                  <div className="text-2xl">{r.icon}</div>
                  <div>
                    <div className="text-green-400 font-semibold text-sm mb-1">{r.name}</div>
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{r.response}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {loading && (
          <div className="mt-3 flex items-center gap-2 text-gray-400 font-mono animate-pulse">
            <span className="text-green-400">💬</span> Typing...
          </div>
        )}

        <div ref={chatBottomRef} className="h-1" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(message);
        }}
        className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-800 px-4 py-3"
      >
        <div className="max-w-md mx-auto flex items-center gap-2">
          <input
            className="flex-1 rounded-md bg-[#2a2a2a] border border-gray-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md transition"
          >
            Send
          </button>
        </div>
      </form>
    </main>
  );
}
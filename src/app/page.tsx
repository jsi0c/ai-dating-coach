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
  const [suggestions, setSuggestions] = useState<string[]>([]); // 🔥 for prompt suggestions
  const [conversationPhase, setConversationPhase] = useState<'expert' | 'awaiting-user-response' | 'others'>('expert');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (input: string) => {
    if (!input.trim()) {
      if (chatLog.length === 0) {
        // 🔥 fetch suggestions if empty initial input
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatLog: [{ from: 'user', content: '' }],
            }),
          });

          const data = await res.json();
          if (data.suggestions) {
            setSuggestions(data.suggestions);
          }
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
        }
      }
      return;
    }

    const newUserBlock: MessageBlock = { from: 'user', content: input };
    setChatLog((prev) => [...prev, newUserBlock]);
    setMessage('');
    setSuggestions([]); // 🔥 hide prompts when user sends something
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatLog: [...chatLog, { from: 'user', content: input }],
        }),
      });

      const data: { responses?: PersonaResponse[]; suggestions?: string[]; error?: string } = await res.json();

      if (res.ok) {
        if (data.suggestions) {
          setSuggestions(data.suggestions);
          return;
        }

        if (data.responses) {
          const newAIBlock: MessageBlock = { from: 'ai', content: data.responses };
          setChatLog((prev) => [...prev, newAIBlock]);

          if (conversationPhase === 'expert') {
            setConversationPhase('awaiting-user-response');
          } else if (conversationPhase === 'awaiting-user-response') {
            setConversationPhase('others');
          } else {
            setConversationPhase('expert');
          }
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

  useEffect(() => {
    sendMessage(''); // 🔥 trigger suggestions on load
  }, []);

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-white flex flex-col items-center px-4 pt-8 pb-28 relative">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-green-400">💬 Dating drama?</h1>
        <p className="text-md text-gray-400">Get clarity with your personal sounding board.</p>

        {/* Chat log */}
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

      {/* Input form and suggestions */}
      <div
        className={`w-full ${
          chatLog.length === 0
            ? 'fixed inset-0 flex items-center justify-center flex-col gap-4 bg-[#1e1e1e]'
            : 'fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-800 px-4 py-3'
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(message);
          }}
          className={`${
            chatLog.length === 0 ? 'w-full max-w-md' : 'max-w-md mx-auto'
          } flex items-center gap-2`}
        >
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
        </form>

        {suggestions.length > 0 && chatLog.length === 0 && (
          <div className="w-full max-w-md px-4 mt-4">
            <div className="bg-[#1e1e1e] space-y-2">
            <h1 className="text-3xl font-bold text-green-400 text-center">💬 Dating drama?</h1>
<p className="text-md text-gray-400 text-center">Get clarity with your personal sounding board.</p>
<p className="text-gray-400 text-sm">Does one of these fit? Or share in your own words.</p>              
<div className="flex flex-wrap gap-2">
                {suggestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sendMessage(prompt);
                      setSuggestions([]);
                    }}
                    className="text-sm bg-gray-700 hover:bg-green-700 text-white px-3 py-2 rounded-md transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
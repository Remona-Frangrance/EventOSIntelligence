"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Bot, X, Send, Loader2 } from "lucide-react";

export default function AiChatbot() {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string; time: string }[]>([
    {
      role: "assistant",
      text: "👋 Hi! I'm your EventOS AI Concierge. Ask me anything like \"Where is the AI booth?\", \"Show me healthcare projects\", \"What are the ticket prices?\", or \"Which stalls have the most votes?\"!",
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  async function handleSendChat(customText?: string) {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = {
      role: "user" as const,
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await res.json();
      const botMsg = {
        role: "assistant" as const,
        text: data.reply || "I couldn't locate that specific stall. Please explore the project feed!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm having trouble connecting to the floor AI right now. Please browse the main exhibition list!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      {!chatOpen ? (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-5 py-3.5 text-xs font-bold text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition border border-white/20"
          aria-label="Open AI Concierge Chatbot"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Ask Event AI Guide</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </button>
      ) : (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-3xl border border-slate-700/50 bg-[#070913]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden max-h-[580px] h-[520px]">
          {/* Chatbot Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-md">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-xs font-bold text-white">EventOS AI Concierge</h3>
                  <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-white/50">Claude 3.5 Sonnet &amp; Floor Guide</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
              aria-label="Close Chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="flex gap-1.5 overflow-x-auto p-2.5 border-b border-white/10 bg-black/30 scrollbar-none">
            {[
              "🤖 AI & ML booths",
              "🏥 Healthcare stalls",
              "💰 FinTech projects",
              "🔥 Most popular stalls",
              "🎟️ Ticket packages",
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendChat(chip)}
                disabled={chatLoading}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/80 hover:bg-white/15 hover:text-white transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-white/10 text-white/90 border border-white/10 rounded-bl-xs"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="mt-1 text-[9px] text-white/40 px-1">{msg.time}</span>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-white/50 p-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                <span>AI Concierge is locating booths…</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="border-t border-white/10 bg-black/40 p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 focus-within:border-indigo-400 transition">
              <input
                type="text"
                placeholder="Ask about stalls, tracks, or tickets…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

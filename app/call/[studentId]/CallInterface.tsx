"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { Student } from "@/lib/students";

type Message = { role: "user" | "assistant"; content: string };
type CallState = "idle" | "connecting" | "active" | "speaking" | "listening" | "ended";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = any;
declare global {
  interface Window { SpeechRecognition: AnyRec; webkitSpeechRecognition: AnyRec; }
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  "Active":              { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Low Attendance Risk": { bg: "bg-amber-50",   text: "text-amber-700"  },
  "At Risk of Churn":    { bg: "bg-red-50",      text: "text-red-700"    },
};

const scenarioQuickReplies: Record<string, string[]> = {
  anxious: ["Kya fail ho jayega?", "Main kya karoon, yeh sunta hi nahi", "Mera paisa waste ho raha hai"],
  churn:   ["Bohot mehenga hai, main cancel kar raha hoon", "Online se kuch nahi hota", "Kuch samajh nahi aata"],
  busy:    ["Haan theek hai", "Main office mein hoon", "Aap dekh lo, baad mein baat karo"],
};

export default function CallInterface({ student }: { student: Student }) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentSpeech, setCurrentSpeech] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, currentSpeech]);

  useEffect(() => {
    if (["active","speaking","listening"].includes(callState)) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  const speakText = useCallback(async (text: string) => {
    setCallState("speaking"); setCurrentSpeech(text);
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve) => { audio.onended = () => resolve(); audio.onerror = () => resolve(); audio.play(); });
      URL.revokeObjectURL(url);
    } catch (e) { console.error("TTS error:", e); }
    finally { setCurrentSpeech(""); setCallState("active"); }
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages); setCallState("active");
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: student.id, messages: newMessages }) });
      const data = await res.json();
      const assistantText: string = data.text;
      setMessages([...newMessages, { role: "assistant", content: assistantText }]);
      await speakText(assistantText);
    } catch (e) { console.error("Chat error:", e); setCallState("active"); }
  }, [messages, student.id, speakText]);

  const startListening = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { alert("Speech recognition not supported. Use Chrome."); return; }
    const rec = new SpeechRec();
    rec.continuous = false; rec.interimResults = true; rec.lang = "hi-IN";
    recognitionRef.current = rec;
    rec.onstart = () => { setIsListening(true); setCallState("listening"); setTranscript(""); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => { const t = Array.from(e.results).map((r: any) => r[0].transcript).join(""); setTranscript(t); };
    rec.onend = () => {
      setIsListening(false);
      const finalTranscript = transcript;
      setTranscript("");
      if (finalTranscript.trim()) sendMessage(finalTranscript.trim());
      else setCallState("active");
    };
    rec.onerror = () => { setIsListening(false); setCallState("active"); };
    rec.start();
  }, [transcript, sendMessage]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); }, []);

  const startCall = useCallback(async () => {
    setCallState("connecting");
    await new Promise((r) => setTimeout(r, 1500));
    setCallState("active"); setMessages([]);
    const openingLine = `Namaste! Main Vedantu se Ananya bol rahi hoon. ${student.parentName} ji, kya main thodi der baat kar sakti hoon? ${student.studentName} ke baare mein kuch share karni thi.`;
    setMessages([{ role: "assistant", content: openingLine }]);
    await speakText(openingLine);
  }, [student.parentName, student.studentName, speakText]);

  const endCall = useCallback(() => {
    recognitionRef.current?.stop(); audioRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState("ended"); setIsListening(false);
  }, []);

  const sc = statusConfig[student.status] ?? { bg: "bg-gray-50", text: "text-gray-600" };
  const inCall = ["active","speaking","listening"].includes(callState);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{student.studentName[0]}</div>
            <span className="font-medium text-gray-700">{student.studentName}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">{student.grade}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-4">

        {/* Call card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Ananya header */}
          <div className="px-6 pt-6 pb-5 text-center border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl mx-auto mb-3 ring-4 ring-indigo-50">
              👩
            </div>
            <p className="font-bold text-gray-900 text-base">Ananya</p>
            <p className="text-sm text-gray-400">Vedantu Student Success Mentor</p>
            <div className="mt-2 h-5 flex items-center justify-center">
              {callState === "idle" && <span className="text-xs text-gray-400">Ready to call {student.parentName} ji</span>}
              {callState === "connecting" && <span className="text-xs text-amber-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/>Connecting…</span>}
              {inCall && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>{formatDuration(duration)}</span>}
              {callState === "ended" && <span className="text-xs text-gray-400">Call ended · {formatDuration(duration)}</span>}
            </div>
          </div>

          {/* Info strip */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-3 text-xs">
            <div><p className="text-gray-400 mb-0.5">Parent</p><p className="font-semibold text-gray-800">{student.parentName}</p></div>
            <div><p className="text-gray-400 mb-0.5">Status</p><span className={`inline-block px-2 py-0.5 rounded-full font-medium text-[10px] ${sc.bg} ${sc.text}`}>{student.status}</span></div>
            <div><p className="text-gray-400 mb-0.5">Scenario</p><p className="font-medium text-gray-700 truncate">{student.scenarioLabel}</p></div>
          </div>

          {/* Conversation */}
          <div className="px-4 py-4 space-y-3 min-h-[200px] max-h-[320px] overflow-y-auto">
            {messages.length === 0 && callState === "idle" && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                </div>
                <p className="text-sm text-gray-400">Press Start Call to begin the demo</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.role === "assistant" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600"}`}>
                  {m.role === "assistant" ? "A" : "P"}
                </div>
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "assistant" ? "bg-indigo-50 text-gray-800 rounded-tl-sm" : "bg-gray-100 text-gray-700 rounded-tr-sm"}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {callState === "speaking" && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">A</div>
                <div className="bg-indigo-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                  {[0,150,300].map((d) => <span key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
                </div>
              </div>
            )}
            {callState === "listening" && (
              <div className="flex gap-2 flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">P</div>
                <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-gray-500 italic max-w-[82%]">
                  {transcript || "Listening…"}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-center gap-3">
            {callState === "idle" && (
              <button onClick={startCall} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-7 py-2.5 rounded-full transition-colors shadow-sm text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                Start Call
              </button>
            )}
            {callState === "connecting" && (
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"/>Connecting to {student.parentName} ji…
              </div>
            )}
            {inCall && (
              <>
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={callState === "speaking"}
                  className={`w-13 h-13 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shadow-sm ${
                    isListening ? "bg-indigo-600 ring-4 ring-indigo-100 scale-105" :
                    callState === "speaking" ? "bg-gray-100 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <svg className={`w-5 h-5 ${isListening ? "text-white" : "text-gray-500"}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </button>
                <button onClick={endCall} className="w-[52px] h-[52px] rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm">
                  <svg className="w-5 h-5 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                </button>
              </>
            )}
            {callState === "ended" && (
              <div className="flex gap-2">
                <button onClick={() => { setCallState("idle"); setMessages([]); setDuration(0); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-full text-sm transition-colors">Call Again</button>
                <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-full text-sm transition-colors">Try Another</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mic hint */}
        {inCall && messages.length > 0 && (
          <p className="text-center text-xs text-gray-400">
            Press mic and speak as <span className="font-medium text-gray-600">{student.parentName} ji</span> — Hindi, English, or Hinglish
          </p>
        )}

        {/* Quick replies */}
        {callState === "active" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick responses</p>
            <div className="flex flex-wrap gap-2">
              {(scenarioQuickReplies[student.scenario] ?? []).map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors text-gray-600">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

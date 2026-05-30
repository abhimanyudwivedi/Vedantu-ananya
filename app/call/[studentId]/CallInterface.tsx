"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { Student } from "@/lib/students";

type Message = { role: "user" | "assistant"; content: string };
type CallState = "idle" | "connecting" | "active" | "speaking" | "listening" | "ended";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = any;

declare global {
  interface Window {
    SpeechRecognition: AnyRec;
    webkitSpeechRecognition: AnyRec;
  }
}

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSpeech]);

  useEffect(() => {
    if (callState === "active" || callState === "speaking" || callState === "listening") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const speakText = useCallback(async (text: string) => {
    setCallState("speaking");
    setCurrentSpeech(text);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play();
      });
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("TTS error:", e);
    } finally {
      setCurrentSpeech("");
      setCallState("active");
    }
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setCallState("active");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, messages: newMessages }),
      });
      const data = await res.json();
      const assistantText: string = data.text;
      setMessages([...newMessages, { role: "assistant", content: assistantText }]);
      await speakText(assistantText);
    } catch (e) {
      console.error("Chat error:", e);
      setCallState("active");
    }
  }, [messages, student.id, speakText]);

  const startListening = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition not supported. Use Chrome.");
      return;
    }
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "hi-IN";
    recognitionRef.current = rec;

    rec.onstart = () => { setIsListening(true); setCallState("listening"); setTranscript(""); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
    };
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

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startCall = useCallback(async () => {
    setCallState("connecting");
    await new Promise((r) => setTimeout(r, 1500));
    setCallState("active");
    setMessages([]);

    // Ananya opens the call
    const openingLine = `Namaste! Main Vedantu se Ananya bol rahi hoon. ${student.parentName}, kya main thodi der baat kar sakti hoon? ${student.studentName} ke baare mein kuch achhi baat share karni thi.`;
    setMessages([{ role: "assistant", content: openingLine }]);
    await speakText(openingLine);
  }, [student.parentName, student.studentName, speakText]);

  const endCall = useCallback(() => {
    recognitionRef.current?.stop();
    audioRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState("ended");
    setIsListening(false);
  }, []);

  const statusColorMap = {
    "Active": "text-green-400",
    "Low Attendance Risk": "text-yellow-400",
    "At Risk of Churn": "text-red-400",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">← Back</Link>
        <div className="flex-1" />
        <div className="text-right">
          <p className="text-xs text-gray-500">Student</p>
          <p className="text-sm font-medium">{student.studentName} · {student.grade}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 gap-4">
        {/* Phone card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Call header */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 text-center border-b border-gray-800">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl mx-auto mb-3">
              👩
            </div>
            <p className="font-semibold text-lg">Ananya</p>
            <p className="text-sm text-gray-400">Vedantu Student Success Mentor</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              {callState === "idle" && <span className="text-xs text-gray-500">Ready to call {student.parentName}</span>}
              {callState === "connecting" && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Connecting…
                </span>
              )}
              {(callState === "active" || callState === "speaking" || callState === "listening") && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> {formatDuration(duration)}
                </span>
              )}
              {callState === "ended" && <span className="text-xs text-gray-500">Call ended · {formatDuration(duration)}</span>}
            </div>
          </div>

          {/* Context strip */}
          <div className="px-4 py-3 border-b border-gray-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500">Parent</p>
              <p className="text-white font-medium">{student.parentName}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className={`font-medium ${statusColorMap[student.status]}`}>{student.status}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-0.5">Scenario</p>
              <p className="text-gray-300">{student.scenarioLabel}</p>
            </div>
          </div>

          {/* Conversation */}
          <div className="p-4 space-y-3 min-h-[200px] max-h-[320px] overflow-y-auto">
            {messages.length === 0 && callState === "idle" && (
              <div className="text-center text-gray-600 text-sm py-8">
                Press "Start Call" to begin the demo
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  m.role === "assistant" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                }`}>
                  {m.role === "assistant" ? "A" : "P"}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "assistant"
                    ? "bg-gray-800 text-gray-100 rounded-tl-sm"
                    : "bg-blue-600/20 text-blue-100 rounded-tr-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {callState === "speaking" && currentSpeech && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs flex-shrink-0">A</div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-400 italic flex items-center gap-2">
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                  </span>
                  Speaking…
                </div>
              </div>
            )}
            {callState === "listening" && (
              <div className="flex gap-2 flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs flex-shrink-0">P</div>
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-blue-300 italic max-w-[85%]">
                  {transcript || "Listening…"}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-4">
            {callState === "idle" && (
              <button
                onClick={startCall}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-3 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                Start Call
              </button>
            )}

            {callState === "connecting" && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                Connecting to {student.parentName}…
              </div>
            )}

            {(callState === "active" || callState === "speaking" || callState === "listening") && (
              <>
                {/* Mic button */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={callState === "speaking"}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-blue-500 scale-110 shadow-lg shadow-blue-500/30"
                      : callState === "speaking"
                      ? "bg-gray-700 cursor-not-allowed opacity-50"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </button>

                {/* End call */}
                <button
                  onClick={endCall}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </button>
              </>
            )}

            {callState === "ended" && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setCallState("idle"); setMessages([]); setDuration(0); }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-full text-sm transition-colors"
                >
                  Call Again
                </button>
                <Link href="/" className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-full text-sm transition-colors">
                  Try Another
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Hint for listening */}
        {callState === "active" && messages.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Press the mic 🎤 and speak as <span className="text-blue-400">{student.parentName}</span> — respond in Hindi, English, or Hinglish
          </div>
        )}

        {/* Quick scenario triggers */}
        {callState === "active" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Quick responses (click to send)</p>
            <div className="flex flex-wrap gap-2">
              {student.scenario === "anxious" && [
                "Kya fail ho jayega?",
                "Main kya karoon, yeh toh sunta hi nahi",
                "Mera paisa waste ho raha hai",
              ].map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  disabled={callState !== "active"}
                  className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-full transition-colors text-gray-300 disabled:opacity-50"
                >{q}</button>
              ))}
              {student.scenario === "churn" && [
                "Bohot mehenga hai, main cancel kar raha hoon",
                "Online se kuch nahi hota",
                "Bachchi bol rahi hai kuch samajh nahi aata",
              ].map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  disabled={callState !== "active"}
                  className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-full transition-colors text-gray-300 disabled:opacity-50"
                >{q}</button>
              ))}
              {student.scenario === "busy" && [
                "Haan theek hai",
                "Main office mein hoon",
                "Aap dekh lo, main baad mein baat karta hoon",
              ].map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  disabled={callState !== "active"}
                  className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-full transition-colors text-gray-300 disabled:opacity-50"
                >{q}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

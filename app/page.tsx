"use client";
import { useState } from "react";
import Link from "next/link";
import { STUDENTS } from "@/lib/students";

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  "Active":                { label: "Active",         dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
  "Low Attendance Risk":   { label: "Low Attendance", dot: "bg-amber-500",   bg: "bg-amber-50",    text: "text-amber-700"   },
  "At Risk of Churn":      { label: "At Risk",        dot: "bg-red-500",     bg: "bg-red-50",      text: "text-red-700"     },
};

type CallStatus = "idle" | "calling" | "connected" | "done" | "error";

const TOPICS = ["Attendance concern", "Test performance", "Homework not submitted", "Topic is too hard", "Progress update", "Other"];

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
}

export default function Home() {
  const [callStatus, setCallStatus] = useState<Record<string, CallStatus>>({});
  const [phoneInput, setPhoneInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"scheduled" | "counselling">("scheduled");
  const [counsellingPhone, setCounsellingPhone] = useState("");
  const [counsellingStatus, setCounsellingStatus] = useState<"idle" | "requesting" | "confirmed">("idle");
  const [selectedTopic, setSelectedTopic] = useState("");

  async function triggerCall(studentId: string) {
    const phone = phoneInput[studentId];
    if (!phone) { alert("Please enter a phone number"); return; }
    setCallStatus((s) => ({ ...s, [studentId]: "calling" }));
    try {
      const res = await fetch("/api/call/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, phoneOverride: phone }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCallStatus((s) => ({ ...s, [studentId]: "connected" }));
      setTimeout(() => setCallStatus((s) => ({ ...s, [studentId]: "done" })), 30000);
    } catch (e) {
      console.error(e);
      setCallStatus((s) => ({ ...s, [studentId]: "error" }));
    }
  }

  function requestCounselling() {
    if (!counsellingPhone) { alert("Please enter your phone number"); return; }
    setCounsellingStatus("requesting");
    setTimeout(() => setCounsellingStatus("confirmed"), 1500);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans text-slate-900">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FF6F00] flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                  <path d="M4 5l6 10 6-10" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">vedantu</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500 font-medium">Ananya</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Agent live
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-8">

        {/* ── Page title ──────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#C24A00] bg-[#FFF0E5] border border-[#FFCCA8] rounded-full px-2.5 py-1 mb-3">
            <span className="w-1 h-1 rounded-full bg-[#FF6F00]" />
            AI Parent Engagement Agent
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ananya is on call.</h1>
          <p className="text-base text-slate-500 mt-2 leading-relaxed max-w-xl">
            Proactive Hinglish progress calls to parents — personalised insights, gentle coaching, and the right Vedantu upgrade at the right moment.
          </p>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-0 border-b border-slate-200 mb-6">
          {(["scheduled", "counselling"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-3 pt-1 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab
                  ? "border-[#FF6F00] text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab === "scheduled" ? "Scheduled Calls" : "Parent Counselling"}
            </button>
          ))}
        </div>

        {/* ── Scheduled Calls ───────────────────────────────────── */}
        {activeTab === "scheduled" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Today &amp; Upcoming</p>
              <span className="text-xs font-medium text-slate-500">{STUDENTS.length} parents scheduled</span>
            </div>

            {STUDENTS.map((s) => {
              const cs = callStatus[s.id] ?? "idle";
              const isToday = s.scheduledAt.startsWith("Today");
              const sc = statusConfig[s.status];

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition-shadow overflow-hidden">

                  {/* Card top */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFCCA8] to-[#FF6F00] flex items-center justify-center text-slate-900 font-bold text-base flex-shrink-0 shadow-sm">
                          {s.studentName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-[15px]">{s.studentName}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs font-medium text-slate-500">{s.grade}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Parent: <span className="text-slate-700 font-medium">{s.parentName}</span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span className="text-slate-600">{s.targetExam}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          isToday ? "bg-[#FFF0E5] text-[#C24A00] border border-[#FFCCA8]" : "bg-slate-100 text-slate-500"
                        }`}>
                          {s.scheduledAt}
                        </span>
                      </div>
                    </div>

                    {/* Insight pills */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="bg-red-50/70 rounded-xl p-3 border border-red-100/60">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Needs Attention</p>
                        <p className="text-xs text-red-800 leading-snug font-medium">{s.corePainPoint.split(" - ")[0]}</p>
                      </div>
                      <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-100/60">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Bright Spot</p>
                        <p className="text-xs text-emerald-800 leading-snug font-medium">{s.brightSpot.split(" - ")[0]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Call row */}
                  <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="tel"
                      placeholder="+91 phone number"
                      value={phoneInput[s.id] ?? ""}
                      onChange={(e) => setPhoneInput((p) => ({ ...p, [s.id]: e.target.value }))}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6F00]/40 focus:border-[#FF6F00] min-w-0 transition-all"
                    />
                    <button
                      onClick={() => triggerCall(s.id)}
                      disabled={cs === "calling" || cs === "connected"}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all flex-shrink-0 ${
                        cs === "calling" || cs === "connected"
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md"
                      }`}
                    >
                      {cs === "calling"
                        ? <><span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" /> Calling…</>
                        : <><PhoneIcon className="w-3.5 h-3.5" /> Call Now</>
                      }
                    </button>
                    <Link
                      href={`/call/${s.id}`}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white border border-slate-200 transition-colors flex-shrink-0"
                    >
                      Demo ↗
                    </Link>
                  </div>

                  {/* Status banner */}
                  {cs === "connected" && (
                    <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-800">Call connected — Ananya is speaking with {s.parentName}</span>
                    </div>
                  )}
                  {cs === "done" && (
                    <div className="px-5 py-2.5 bg-[#FFF0E5] border-t border-[#FFCCA8] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8A3500]">✓ Call completed</span>
                      <span className="text-xs font-medium text-[#C24A00]">Next call in 7 days</span>
                    </div>
                  )}
                  {cs === "error" && (
                    <div className="px-5 py-2.5 bg-red-50 border-t border-red-100">
                      <span className="text-xs font-semibold text-red-700">Call failed — please check the number and try again</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Parent Counselling ────────────────────────────────── */}
        {activeTab === "counselling" && (
          <div className="space-y-4">

            {/* Info banner */}
            <div className="bg-gradient-to-br from-[#FFF0E5] to-white border border-[#FFCCA8]/70 rounded-2xl p-5 flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FF6F00] flex items-center justify-center flex-shrink-0 shadow-sm">
                <PhoneIcon className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">On-demand parent calls</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">Parents can request a live call with Ananya anytime — outside the 7-day cycle. Ask questions, raise a concern, get clarity instantly.</p>
              </div>
            </div>

            {counsellingStatus === "confirmed" ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-slate-900 text-lg mb-1">Call Requested</p>
                <p className="text-sm text-slate-500">Ananya will call <span className="font-semibold text-slate-800">{counsellingPhone}</span> within 2 minutes.</p>
                <button
                  onClick={() => { setCounsellingStatus("idle"); setCounsellingPhone(""); setSelectedTopic(""); }}
                  className="mt-5 text-xs text-slate-700 hover:text-slate-900 font-semibold transition-colors"
                >
                  + Request another call
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <p className="font-bold text-slate-900">Request a call from Ananya</p>
                  <p className="text-xs text-slate-500 mt-1">Ananya will call back within 2 minutes in the parent's preferred language.</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={counsellingPhone}
                    onChange={(e) => setCounsellingPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6F00]/40 focus:border-[#FF6F00] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Topic</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setSelectedTopic(topic === selectedTopic ? "" : topic)}
                        className={`text-xs px-3 py-2 rounded-lg border text-left transition-all font-semibold ${
                          selectedTopic === topic
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={requestCounselling}
                  disabled={counsellingStatus === "requesting"}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  {counsellingStatus === "requesting"
                    ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" /> Requesting…</>
                    : <><PhoneIcon className="w-4 h-4" /> Call Me Now</>
                  }
                </button>
              </div>
            )}

            {/* Next scheduled */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0E5] border border-[#FFCCA8] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#C24A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Next scheduled call</p>
                <p className="text-xs text-slate-500 mt-1">Ananya automatically calls every <span className="font-semibold text-slate-700">7 days</span> with a full progress update.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-10 text-xs text-slate-400">
        Vedantu · Ananya AI · Powered by Gemini · Bolna.ai
      </footer>
    </div>
  );
}

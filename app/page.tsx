"use client";
import { useState } from "react";
import Link from "next/link";
import { STUDENTS } from "@/lib/students";

const statusColorMap: Record<string, string> = {
  "Active": "bg-green-500/10 text-green-400",
  "Low Attendance Risk": "bg-yellow-500/10 text-yellow-400",
  "At Risk of Churn": "bg-red-500/10 text-red-400",
};

const scenarioBorder: Record<string, string> = {
  amber: "border-amber-500/20 hover:border-amber-500/50",
  red: "border-red-500/20 hover:border-red-500/50",
  blue: "border-blue-500/20 hover:border-blue-500/50",
};

type CallStatus = "idle" | "calling" | "connected" | "done" | "error";

export default function Home() {
  const [callStatus, setCallStatus] = useState<Record<string, CallStatus>>({});
  const [phoneInput, setPhoneInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"scheduled" | "counselling">("scheduled");
  const [counsellingPhone, setCounsellingPhone] = useState("");
  const [counsellingStatus, setCounsellingStatus] = useState<"idle" | "requesting" | "confirmed">("idle");

  async function triggerCall(studentId: string) {
    const phone = phoneInput[studentId];
    if (!phone) { alert("Please enter a phone number to call"); return; }

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

  const statusLabel: Record<CallStatus, { label: string; color: string }> = {
    idle: { label: "", color: "" },
    calling: { label: "Calling…", color: "text-yellow-400" },
    connected: { label: "Call Connected ✓", color: "text-green-400" },
    done: { label: "Call Completed", color: "text-gray-400" },
    error: { label: "Call Failed", color: "text-red-400" },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm">V</div>
          <div>
            <p className="font-semibold text-sm">Vedantu · Ananya</p>
            <p className="text-xs text-gray-500">AI Parent Engagement Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Agent Active
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "scheduled" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            📅 Scheduled Calls
          </button>
          <button
            onClick={() => setActiveTab("counselling")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "counselling" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            💬 Parent Counselling
          </button>
        </div>

        {/* Scheduled Calls Tab */}
        {activeTab === "scheduled" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Today &amp; Upcoming</p>
              <p className="text-xs text-gray-600">3 calls scheduled</p>
            </div>

            {STUDENTS.map((s) => {
              const status = callStatus[s.id] ?? "idle";
              const isToday = s.scheduledAt.startsWith("Today");
              return (
                <div
                  key={s.id}
                  className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${scenarioBorder[s.scenarioColor]}`}
                >
                  {/* Card header */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-base flex-shrink-0">
                      {s.studentName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{s.studentName}</p>
                        <span className="text-xs text-gray-500">·</span>
                        <p className="text-sm text-gray-400">{s.grade}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColorMap[s.status]}`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Parent: {s.parentName} · {s.targetExam}</p>
                    </div>
                    <div className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                      isToday ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-gray-800 text-gray-400"
                    }`}>
                      {s.scheduledAt}
                    </div>
                  </div>

                  {/* Data strip */}
                  <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/60 rounded-lg p-2.5">
                      <p className="text-gray-500 mb-1">⚠ Needs Attention</p>
                      <p className="text-gray-300">{s.corePainPoint.split(" - ")[0]}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-2.5">
                      <p className="text-gray-500 mb-1">✓ Bright Spot</p>
                      <p className="text-gray-300">{s.brightSpot.split(" - ")[0]}</p>
                    </div>
                  </div>

                  {/* Call trigger */}
                  <div className="px-4 pb-4 border-t border-gray-800/60 pt-3 flex items-center gap-3">
                    <input
                      type="tel"
                      placeholder="+91 phone number"
                      value={phoneInput[s.id] ?? ""}
                      onChange={(e) => setPhoneInput((p) => ({ ...p, [s.id]: e.target.value }))}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 min-w-0"
                    />
                    <button
                      onClick={() => triggerCall(s.id)}
                      disabled={status === "calling" || status === "connected"}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                        status === "calling" || status === "connected"
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-400 text-white"
                      }`}
                    >
                      {status === "calling" ? (
                        <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Calling…</>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                          </svg>
                          Call Now
                        </>
                      )}
                    </button>
                    <Link
                      href={`/call/${s.id}`}
                      className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-colors flex-shrink-0"
                      title="Demo conversation"
                    >
                      Demo ↗
                    </Link>
                  </div>

                  {/* Status line */}
                  {status !== "idle" && (
                    <div className={`px-4 pb-3 text-xs font-medium ${statusLabel[status].color}`}>
                      {statusLabel[status].label}
                      {status === "done" && (
                        <span className="text-gray-500 ml-2">· Next call scheduled in 7 days</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Parent Counselling Tab */}
        {activeTab === "counselling" && (
          <div className="space-y-4">
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 mb-6">
              <p className="text-sm text-orange-300 font-medium mb-1">📞 What is Parent Counselling?</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Parents can request a live call with Ananya anytime — outside the scheduled 7-day cycle. Ask questions, get deeper clarity, or raise a concern.
              </p>
            </div>

            {counsellingStatus === "confirmed" ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-2xl mx-auto mb-3">✓</div>
                <p className="text-green-400 font-semibold mb-1">Call Requested!</p>
                <p className="text-sm text-gray-400">Ananya will call <span className="text-white">{counsellingPhone}</span> within 2 minutes.</p>
                <button
                  onClick={() => { setCounsellingStatus("idle"); setCounsellingPhone(""); }}
                  className="mt-4 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Request another call
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="font-semibold mb-1">Request a call from Ananya</p>
                <p className="text-sm text-gray-400 mb-5">Enter your registered phone number and Ananya will call you back within 2 minutes.</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Your Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={counsellingPhone}
                      onChange={(e) => setCounsellingPhone(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">What would you like to discuss?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Attendance concern", "Test performance", "Homework not submitted", "Topic is too hard", "Want progress update", "Other"].map((topic) => (
                        <button key={topic} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/30 px-3 py-2 rounded-lg transition-colors text-gray-300 text-left">
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={requestCounselling}
                    disabled={counsellingStatus === "requesting"}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {counsellingStatus === "requesting" ? (
                      <><span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" /> Requesting…</>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        Call Me Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Next scheduled info */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">📅</div>
              <div>
                <p className="text-sm font-medium">Next scheduled call</p>
                <p className="text-xs text-gray-400">Ananya will automatically call in <span className="text-white font-medium">7 days</span> with your child's progress update.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-gray-700 text-xs py-6">
        Vedantu Hackathon · Ananya AI · Powered by Claude + ElevenLabs + vobiz.ai
      </p>
    </div>
  );
}

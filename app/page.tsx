"use client";
import Link from "next/link";
import { STUDENTS } from "@/lib/students";

const colorMap: Record<string, string> = {
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  red: "bg-red-500/10 border-red-500/30 text-red-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
};

const statusColorMap: Record<string, string> = {
  "Active": "bg-green-500/10 text-green-400",
  "Low Attendance Risk": "bg-yellow-500/10 text-yellow-400",
  "At Risk of Churn": "bg-red-500/10 text-red-400",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Vedantu · Hackathon Demo
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4">
            Meet <span className="text-orange-400">Ananya</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            AI parent engagement agent that calls parents in Hinglish — like talking to the class teacher, not reading a dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-medium mb-6">Select a demo scenario</p>
          {STUDENTS.map((s) => (
            <Link
              key={s.id}
              href={`/call/${s.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/40 hover:bg-gray-900/80 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">
                      {s.studentName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{s.studentName}</p>
                      <p className="text-sm text-gray-400">{s.grade} · {s.targetExam}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${colorMap[s.scenarioColor]}`}>
                      🎭 {s.scenarioLabel}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusColorMap[s.status]}`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/60 rounded-lg p-2.5">
                      <p className="text-gray-500 mb-1">Pain Point</p>
                      <p className="text-gray-300 leading-tight">{s.corePainPoint.split(" - ")[0]}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-2.5">
                      <p className="text-gray-500 mb-1">Bright Spot</p>
                      <p className="text-gray-300 leading-tight">{s.brightSpot.split(" - ")[0]}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 group-hover:bg-orange-500/20 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-500">Parent: <span className="text-gray-300">{s.parentName}</span></p>
                <p className="text-sm text-orange-400 font-medium group-hover:translate-x-1 transition-transform">
                  Start call →
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-gray-700 text-sm mt-10">
          Built at Vedantu Hackathon · Powered by Claude AI + ElevenLabs
        </p>
      </div>
    </div>
  );
}

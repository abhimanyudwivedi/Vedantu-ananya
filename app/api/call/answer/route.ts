import { NextRequest } from "next/server";
import { STUDENTS, type Student } from "@/lib/students";

// Returns Voice XML consumed by vobiz.ai when the parent picks up
export async function GET(req: NextRequest) {
  return handleAnswer(req);
}
export async function POST(req: NextRequest) {
  return handleAnswer(req);
}

function handleAnswer(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") ?? "arjun";
  const student = STUDENTS.find((s) => s.id === studentId);

  // If WS_SERVER_URL is set, use real-time streaming mode
  const wsUrl = process.env.WS_SERVER_URL?.trim();
  if (wsUrl) {
    const streamWsUrl = `${wsUrl}?studentId=${studentId}`;
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host = req.headers.get("host") ?? "vedantu-ananya.vercel.app";
    const greetingUrl = `${proto}://${host}/api/voice/${student?.id ?? "arjun"}?greeting=1`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${greetingUrl}</Play>
    <Connect>
        <Stream url="${streamWsUrl}" />
    </Connect>
</Response>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml" } });
  }

  // Use ElevenLabs-generated audio served from our /api/voice/[studentId] endpoint
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "vedantu-ananya.vercel.app";
  const audioUrl = `${proto}://${host}/api/voice/${student?.id ?? "arjun"}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${audioUrl}</Play>
</Response>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}

function buildMessage(student: Student): string[] {
  const lines: string[] = [];

  // Opening
  lines.push(
    `Namaste, ${student.parentName}! Main Vedantu ki taraf se Ananya bol rahi hoon. ` +
    `${student.studentName} ke baare mein kuch important update share karna tha. Ek minute hai aapke paas?`
  );

  // Pause
  lines.push("__PAUSE_1__");

  // Bright spot first
  const brightSubject = student.brightSpot.split(" - ")[0];
  lines.push(
    `Pehle ek achhi baat. ${student.studentName} ka ${brightSubject} mein performance bahut achha chal raha hai. ` +
    `${student.brightSpot.split(" - ")[1] ?? "Yeh dekh ke bohot khushi hui"}. Aap dono ki mehnat rang la rahi hai.`
  );

  // Pain point — translated to plain language
  const painSubject = student.corePainPoint.split(" - ")[0];
  lines.push("__PAUSE_1__");
  lines.push(
    `Ek cheez dhyan mein rakhni hai. ${painSubject} mein thoda aur focus karna hoga. ` +
    `${student.attendance}. Hum isko milkar theek kar sakte hain — abhi bhi kafi time hai ${student.targetExam} ke liye.`
  );

  // Next call
  lines.push("__PAUSE_1__");
  lines.push(
    `Aapki agli scheduled call 7 din baad hogi. Agar pehle baat karni ho, ` +
    `toh Vedantu app mein Parent Counselling section mein jaake direct call kar sakte hain. ` +
    `Hum hamesha available hain.`
  );

  // Close
  lines.push("__PAUSE_1__");
  lines.push(
    `${student.studentName} ko hamare taraf se ek achha message dena. Dhanyawaad, ${student.parentName} ji. ` +
    `Vedantu mein aapka aur ${student.studentName} ka bhavishya ujjwal hai. Namaste!`
  );

  return lines;
}

function buildXml(messageParts: string[]): string {
  const elements = messageParts
    .map((part) => {
      if (part === "__PAUSE_1__") return `<Wait length="1"/>`;
      return `<Speak language="hi-IN" voice="Polly.Aditi">${escapeXml(part)}</Speak>`;
    })
    .join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    ${elements}
</Response>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { NextRequest } from "next/server";
import { STUDENTS } from "@/lib/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFullMessage(studentId: string): string {
  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return "Namaste. Yeh Vedantu ka call hai.";

  const brightParts = student.brightSpot.split(" - ");
  const painParts = student.corePainPoint.split(" - ");

  return [
    `Namaste, ${student.parentName}! Main Vedantu ki taraf se Ananya bol rahi hoon. ${student.studentName} ke baare mein kuch important update share karna tha. Ek minute hai aapke paas?`,
    `Pehle ek achhi baat. ${student.studentName} ka ${brightParts[0]} mein performance bahut achha chal raha hai. ${brightParts[1] ?? "Yeh dekh ke bohot khushi hui"}. Aap dono ki mehnat rang la rahi hai.`,
    `Ek cheez dhyan mein rakhni hai. ${painParts[0]} mein thoda aur focus karna hoga. ${student.attendance}. Hum isko milkar theek kar sakte hain, abhi bhi kafi time hai ${student.targetExam} ke liye.`,
    `Aapki agli scheduled call saat din baad hogi. Agar pehle baat karni ho, toh Vedantu app mein Parent Counselling section mein jaake direct call kar sakte hain. Hum hamesha available hain.`,
    `${student.studentName} ko hamare taraf se ek achha message dena. Dhanyawaad, ${student.parentName} ji. Vedantu mein aapka aur ${student.studentName} ka bhavishya ujjwal hai. Namaste!`,
  ].join(" ");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const text = buildFullMessage(studentId);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID ?? "9BWtsMINqrJLrRacOk9x"}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return new Response(`ElevenLabs error: ${err}`, { status: 500 });
  }

  const audioBuffer = await response.arrayBuffer();
  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

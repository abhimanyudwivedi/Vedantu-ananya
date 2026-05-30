import { NextRequest } from "next/server";
import { STUDENTS } from "@/lib/students";
import textToSpeech from "@google-cloud/text-to-speech";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

function getTtsClient() {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credsJson) {
    return new textToSpeech.TextToSpeechClient({
      credentials: JSON.parse(credsJson),
    });
  }
  return new textToSpeech.TextToSpeechClient();
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const text = buildFullMessage(studentId);

  try {
    const client = getTtsClient();
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: "hi-IN",
        name: "hi-IN-Neural2-A",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,
        pitch: 0.5,
      },
    });

    const audio = response.audioContent;
    if (!audio) return new Response("No audio", { status: 500 });

    return new Response(audio as Buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(`TTS error: ${(err as Error).message}`, { status: 500 });
  }
}

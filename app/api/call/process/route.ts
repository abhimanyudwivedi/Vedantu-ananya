import { NextRequest } from "next/server";
import { STUDENTS } from "@/lib/students";
import { buildSystemPrompt } from "@/lib/prompt";
import { VertexAI } from "@google-cloud/vertexai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getVertex() {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const project = process.env.GOOGLE_CLOUD_PROJECT!.trim();
  const location = "us-central1";
  if (credsJson) {
    const creds = JSON.parse(credsJson);
    return new VertexAI({ project, location, googleAuthOptions: { credentials: creds } });
  }
  return new VertexAI({ project, location });
}

async function generateReply(studentId: string, history: { role: string; text: string }[], userSaid: string): Promise<string> {
  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return "Maaf kijiye, kuch technical issue hai. Hum aapko dobara call karenge.";

  const vertex = getVertex();
  const model = vertex.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: { role: "system", parts: [{ text: buildSystemPrompt(student) + "\n\nIMPORTANT: Keep your reply to 1-2 short Hinglish sentences. This is a phone call, not a chat. Be conversational and warm." }] },
    generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
  });

  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: userSaid }] },
  ];

  const result = await model.generateContent({ contents });
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "Ji haan, samajh gayi.";
  return text.trim();
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const speechResult = (form.get("SpeechResult") as string) || (form.get("Digits") as string) || "";
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") ?? "arjun";
  const turn = parseInt(url.searchParams.get("turn") ?? "1");

  // Encode conversation history in query string (compact)
  const historyParam = url.searchParams.get("h") ?? "";
  const history: { role: string; text: string }[] = historyParam
    ? historyParam.split("||").map((p) => {
        const [role, ...textParts] = p.split(":");
        return { role, text: decodeURIComponent(textParts.join(":")) };
      })
    : [];

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "vedantu-ananya.vercel.app";
  const baseUrl = `${proto}://${host}`;

  // If no speech captured, end gracefully
  if (!speechResult) {
    const goodbye = encodeURIComponent("Theek hai, baad mein baat karte hain. Dhanyawaad!");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${baseUrl}/api/voice/say?text=${goodbye}</Play>
    <Hangup/>
</Response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  // Generate Ananya's reply
  let reply: string;
  try {
    reply = await generateReply(studentId, history, speechResult);
  } catch (err) {
    console.error("[process] Gemini error:", err);
    reply = "Theek hai. Hum next call mein detail mein baat karenge.";
  }

  // Append to history
  const newHistory = [
    ...history,
    { role: "user", text: speechResult },
    { role: "model", text: reply },
  ];
  // Trim history to last 6 turns to keep URL short
  const trimmed = newHistory.slice(-6);
  const newHistoryParam = trimmed
    .map((m) => `${m.role}:${encodeURIComponent(m.text)}`)
    .join("||");

  const replyEncoded = encodeURIComponent(reply);
  const nextUrl = `${baseUrl}/api/call/process?studentId=${studentId}&turn=${turn + 1}&h=${encodeURIComponent(newHistoryParam)}`;

  // After max 8 turns, wrap up
  if (turn >= 8) {
    const close = encodeURIComponent("Aapka time dene ke liye dhanyawaad. Aapki agli scheduled call saat din baad hogi. Namaste!");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${baseUrl}/api/voice/say?text=${replyEncoded}</Play>
    <Play>${baseUrl}/api/voice/say?text=${close}</Play>
    <Hangup/>
</Response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${baseUrl}/api/voice/say?text=${replyEncoded}</Play>
    <Gather input="speech" language="hi-IN" speechTimeout="auto" timeout="6" action="${nextUrl}" method="POST"/>
    <Redirect>${nextUrl}</Redirect>
</Response>`,
    { headers: { "Content-Type": "application/xml" } }
  );
}

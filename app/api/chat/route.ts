import { VertexAI } from "@google-cloud/vertexai";
import { NextRequest } from "next/server";
import { STUDENTS } from "@/lib/students";
import { buildSystemPrompt } from "@/lib/prompt";

function getVertex() {
  const project = process.env.GOOGLE_CLOUD_PROJECT!;
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";

  // On Vercel: credentials come from JSON env var
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credsJson) {
    const creds = JSON.parse(credsJson);
    return new VertexAI({ project, location, googleAuthOptions: { credentials: creds } });
  }

  // Local: uses GOOGLE_APPLICATION_CREDENTIALS file path or ADC
  return new VertexAI({ project, location });
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { studentId, messages }: { studentId: string; messages: ChatMessage[] } = await req.json();

  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

  const systemPrompt = buildSystemPrompt(student);

  const vertex = getVertex();
  const model = vertex.preview.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
    systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
  });

  // Convert messages: "assistant" → "model" for Gemini
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContent({ contents });
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return Response.json({ text });
}

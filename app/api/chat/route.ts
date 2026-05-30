import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { STUDENTS } from "@/lib/students";
import { buildSystemPrompt } from "@/lib/prompt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { studentId, messages } = await req.json();

  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

  const systemPrompt = buildSystemPrompt(student);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: systemPrompt,
    messages,
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  return Response.json({ text });
}

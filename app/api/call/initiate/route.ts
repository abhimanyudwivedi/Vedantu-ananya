import { NextRequest } from "next/server";
import { STUDENTS } from "@/lib/students";
import { initiateBolnaCall } from "@/lib/bolna";

export async function POST(req: NextRequest) {
  const { studentId, phoneOverride } = await req.json();

  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

  const toNumber = phoneOverride || student.parentPhone;

  try {
    const result = await initiateBolnaCall(student, toNumber);
    return Response.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

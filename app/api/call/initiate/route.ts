import { NextRequest } from "next/server";
import { STUDENTS } from "@/lib/students";
import { initiateCall } from "@/lib/vobiz";

export async function POST(req: NextRequest) {
  const { studentId, phoneOverride } = await req.json();

  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

  const toNumber = phoneOverride || student.parentPhone;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vedantu-ananya.vercel.app";
  const answerUrl = `${appUrl}/api/call/answer?studentId=${studentId}`;

  try {
    const result = await initiateCall(toNumber, answerUrl);
    return Response.json({ success: true, callUuid: result.call_uuid ?? result.request_uuid });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

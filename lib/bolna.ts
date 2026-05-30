import type { Student } from "./students";

export async function initiateBolnaCall(student: Student, toNumber: string) {
  const apiKey = process.env.BOLNA_API_KEY?.trim();
  const agentId = process.env.BOLNA_AGENT_ID?.trim();
  if (!apiKey || !agentId) throw new Error("BOLNA_API_KEY or BOLNA_AGENT_ID missing");

  const brightSubject = student.brightSpot.split(" - ")[0];
  const brightDetail = student.brightSpot.split(" - ")[1] ?? "";
  const painSubject = student.corePainPoint.split(" - ")[0];
  const painDetail = student.corePainPoint.split(" - ")[1] ?? "";

  const userData = {
    parent_name: student.parentName,
    student_name: student.studentName,
    grade: student.grade,
    target_exam: student.targetExam,
    bright_spot: `${brightSubject} - ${brightDetail}`,
    pain_point: `${painSubject} - ${painDetail}`,
    attendance: student.attendance,
    status: student.status,
  };

  const res = await fetch("https://api.bolna.ai/call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      recipient_phone_number: toNumber,
      user_data: userData,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bolna call failed: ${res.status} ${text}`);
  }

  return res.json();
}

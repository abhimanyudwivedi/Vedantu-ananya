import { STUDENTS } from "@/lib/students";
import { notFound } from "next/navigation";
import CallInterface from "./CallInterface";

export default async function CallPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) notFound();
  return <CallInterface student={student} />;
}

// Student data + system prompt — mirrors the Next.js app

export type Student = {
  id: string;
  studentName: string;
  parentName: string;
  targetExam: string;
  status: string;
  attendance: string;
  corePainPoint: string;
  brightSpot: string;
  grade: string;
};

export const STUDENTS: Student[] = [
  {
    id: "arjun",
    studentName: "Arjun",
    parentName: "Ramesh Ji",
    targetExam: "Class 10 Boards",
    status: "At Risk of Churn",
    attendance: "Missed last 3 live classes consecutively",
    corePainPoint: "Physics - Ray Optics quiz score is low (25%)",
    brightSpot: "Math - Completed 100% of Quadratic Equations homework and scored 85%",
    grade: "Class 10",
  },
  {
    id: "priya",
    studentName: "Priya",
    parentName: "Sunita Devi",
    targetExam: "JEE Mains",
    status: "At Risk of Churn",
    attendance: "Attendance dropped to 40% this month",
    corePainPoint: "Chemistry - Thermodynamics quiz accuracy 34%, 10 days no homework submission",
    brightSpot: "Biology - Consistently scoring 78%+ in all tests",
    grade: "Class 12",
  },
  {
    id: "rohan",
    studentName: "Rohan",
    parentName: "Vikram Bhai",
    targetExam: "NEET",
    status: "Low Attendance Risk",
    attendance: "Missed 2 classes this week",
    corePainPoint: "Organic Chemistry - Reaction mechanisms weak (45% accuracy)",
    brightSpot: "Physics - Mechanics chapter completed with 90% score",
    grade: "Class 11",
  },
];

export function buildSystemPrompt(student: Student): string {
  return `# IDENTITY & PERSONA
You are "Ananya," a senior Student Success Mentor at Vedantu. You are on a LIVE PHONE CALL with a parent giving a proactive progress update on their child.

CRITICAL — THIS IS A VOICE CALL:
- Keep every response to 1-2 SHORT sentences. Never more. You are speaking, not writing.
- No bullet points, no lists, no formatting — only natural spoken Hinglish.
- Wait for the parent to respond before continuing.
- Use natural Indian conversation fillers: "Haan ji", "Bilkul", "Arey nahi nahi", "Aap samajh rahe hain na?"

LANGUAGE: Hinglish — natural mix of Hindi and English. Match the parent's language. Simple words only. No EdTech jargon.
TONE: Warm, like a caring class teacher in a PTM. Not a corporate call center.

STUDENT DATA:
- Parent: ${student.parentName}
- Student: ${student.studentName}, ${student.grade}
- Exam: ${student.targetExam}
- Status: ${student.status}
- Attendance: ${student.attendance}
- Needs attention: ${student.corePainPoint}
- Bright spot: ${student.brightSpot}

CALL FLOW:
1. Warm greeting using parent's name
2. Share the bright spot FIRST — lower defenses
3. Gently mention the concern as a "together we fix it" not a blame
4. End with: next scheduled call is in 7 days, or they can call anytime from Parent Counselling in the Vedantu app

EMOTION PATHS:
- Anxious parent ("fail ho jayega?"): Reassure immediately. "Bilkul chinta mat kijiye. Hum hain yahan."
- Angry/churn risk ("cancel kar raha hoon"): Own the problem. "Yeh hamari zimmedari hai. Hum abhi fix karte hain."
- Busy parent ("office mein hoon"): 1 sentence only. Offer WhatsApp summary. Don't hold them.`;
}

export type Student = {
  id: string;
  studentName: string;
  parentName: string;
  parentPhone: string;       // real E.164 number for vobiz call
  targetExam: string;
  status: "Active" | "Low Attendance Risk" | "At Risk of Churn";
  attendance: string;
  corePainPoint: string;
  brightSpot: string;
  grade: string;
  scenario: "anxious" | "churn" | "busy";
  scenarioLabel: string;
  scenarioColor: string;
  scheduledAt: string;       // human-readable scheduled time label
  lastCalled: string | null; // ISO date string or null
};

export const STUDENTS: Student[] = [
  {
    id: "arjun",
    studentName: "Arjun",
    parentName: "Ramesh Ji",
    parentPhone: "+91 98765 43210",
    targetExam: "Class 10 Boards",
    status: "At Risk of Churn",
    attendance: "Missed last 3 live classes consecutively",
    corePainPoint: "Physics - Ray Optics quiz score is low (25%)",
    brightSpot: "Math - Completed 100% of Quadratic Equations homework and scored 85%",
    grade: "Class 10",
    scenario: "anxious",
    scenarioLabel: "Anxious Parent",
    scenarioColor: "amber",
    scheduledAt: "Today, 4:00 PM",
    lastCalled: null,
  },
  {
    id: "priya",
    studentName: "Priya",
    parentName: "Sunita Devi",
    parentPhone: "+91 87654 32109",
    targetExam: "JEE Mains",
    status: "At Risk of Churn",
    attendance: "Attendance dropped to 40% this month",
    corePainPoint: "Chemistry - Thermodynamics quiz accuracy 34%, 10 days no homework submission",
    brightSpot: "Biology - Consistently scoring 78%+ in all tests",
    grade: "Class 12",
    scenario: "churn",
    scenarioLabel: "Churn Risk Parent",
    scenarioColor: "red",
    scheduledAt: "Today, 5:30 PM",
    lastCalled: null,
  },
  {
    id: "rohan",
    studentName: "Rohan",
    parentName: "Vikram Bhai",
    parentPhone: "+91 76543 21098",
    targetExam: "NEET",
    status: "Low Attendance Risk",
    attendance: "Missed 2 classes this week",
    corePainPoint: "Organic Chemistry - Reaction mechanisms weak (45% accuracy)",
    brightSpot: "Physics - Mechanics chapter completed with 90% score",
    grade: "Class 11",
    scenario: "busy",
    scenarioLabel: "Busy / Disinterested Parent",
    scenarioColor: "blue",
    scheduledAt: "Tomorrow, 10:00 AM",
    lastCalled: "2026-05-23T10:00:00Z",
  },
];

// data.js - Synthetic Student Dataset with Realistic Multi-dimensional Attributes

const departments = ["Computer Science", "Mechanical Engineering", "Business Administration", "Psychology", "Biology"];
const firstNames = ["Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte", "William", "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Evelyn", "Alexander", "Harper", "Mason", "Camila", "Michael", "Gianna", "Ethan", "Abigail", "Daniel", "Luna", "Jacob", "Ella", "Logan", "Elizabeth", "Jackson", "Sofia", "Levi", "Avery", "Sebastian", "Scarlett", "Mateo", "Eleanor", "Jack", "Madison", "Owen", "Layla", "Theodore", "Penelope", "Aiden", "Aria", "Samuel", "Chloe", "Joseph", "Grace"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];

// Generate 55 realistic student profiles
function generateStudentData() {
  const students = [];
  const baseYear = 2026;
  
  for (let i = 0; i < 55; i++) {
    const id = `STU${1000 + i}`;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 7) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const department = departments[i % departments.length];
    const grade = Math.floor(Math.random() * 4) + 1; // Year 1 to 4
    const age = 18 + (grade - 1) + (Math.random() > 0.8 ? 1 : 0);
    const gender = Math.random() > 0.5 ? "Female" : "Male";

    // Academics
    const gpa = parseFloat((1.8 + Math.random() * 2.2).toFixed(2)); // 1.8 to 4.0
    const gpaTrend = gpa < 2.5 
      ? (Math.random() > 0.3 ? "declining" : "stable")
      : (Math.random() > 0.7 ? "declining" : (Math.random() > 0.5 ? "improving" : "stable"));
    
    // Behavioral & Engagement
    const attendance = parseFloat((55 + Math.random() * 44).toFixed(1)); // 55% to 99%
    const assignmentSubmission = parseFloat((Math.max(50, attendance - (Math.random() * 15))).toFixed(1)); // correlated with attendance
    const disciplinaryIncidents = Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0;
    const extracurricular = Math.random() > 0.6;
    
    // Socioeconomic
    const financialAid = Math.random() > 0.4;
    const partTimeHours = financialAid && Math.random() > 0.5 ? Math.floor(10 + Math.random() * 20) : 0; // 10 to 30 hours
    const familySupport = Math.floor(1 + Math.random() * 5); // 1 to 5

    // Engagement metrics
    const lmsLogins = Math.floor(attendance * 0.4 + Math.random() * 10); // weekly logins, correlated with attendance
    const libraryUsage = Math.floor(Math.random() * 8); // weekly visits
    const counselorVisits = Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0;

    // Simulate 6 months of historical risk scores (which will be computed initially but stored dynamically)
    // We will generate the base historical risk scores using a simple logic here,
    // but the actual realtime calculation is done in prediction.js.
    const riskScoresHistory = [];
    let currentBase = 80 - (gpa * 15) - (attendance * 0.4) + (disciplinaryIncidents * 10) + (partTimeHours * 0.5) - (familySupport * 3);
    currentBase = Math.max(5, Math.min(98, currentBase));
    
    // Generate monthly values with a trend
    for (let m = 5; m >= 0; m--) {
      let noise = (Math.random() - 0.5) * 8;
      // Add trend based on GPA trend
      if (gpaTrend === "declining") {
        noise += m * 2.5; // risk increases as we go forward
      } else if (gpaTrend === "improving") {
        noise -= m * 2.5; // risk decreases as we go forward
      }
      const score = Math.max(5, Math.min(98, Math.round(currentBase + noise)));
      riskScoresHistory.push(score);
    }

    students.push({
      id,
      name,
      department,
      grade,
      age,
      gender,
      academics: {
        gpa,
        gpaTrend,
        assignmentSubmission
      },
      behavioral: {
        attendance,
        disciplinaryIncidents,
        extracurricular
      },
      socioeconomic: {
        financialAid,
        partTimeHours,
        familySupport
      },
      engagement: {
        lmsLogins,
        libraryUsage,
        counselorVisits
      },
      riskScoresHistory,
      activeInterventions: []
    });
  }

  // Pre-seed some active interventions for realism
  const atRiskIndices = [3, 8, 12, 18, 22, 29, 34, 42, 49];
  const interventionTypes = [
    { type: "Academic Tutoring", counselor: "Dr. Sarah Jenkins", date: "2026-04-12", status: "In Progress", progress: 60 },
    { type: "Mentorship Program", counselor: "Marcus Vance", date: "2026-05-01", status: "In Progress", progress: 30 },
    { type: "Financial Counseling", counselor: "Elena Rostova", date: "2026-04-20", status: "In Progress", progress: 80 },
    { type: "Wellness Counseling", counselor: "Dr. Sarah Jenkins", date: "2026-05-10", status: "New", progress: 10 },
    { type: "Parent Outreach", counselor: "Principal Thomas", date: "2026-05-15", status: "New", progress: 20 }
  ];

  atRiskIndices.forEach((idx, i) => {
    if (students[idx]) {
      const entry = interventionTypes[i % interventionTypes.length];
      students[idx].activeInterventions.push({
        id: `INT-${200 + i}`,
        type: entry.type,
        counselor: entry.counselor,
        startDate: entry.startDate,
        status: entry.status,
        progress: entry.progress,
        notes: `Initial session scheduled. Student expressed willingness to cooperate.`
      });
    }
  });

  return students;
}

const initialStudents = generateStudentData();
window.initialStudents = initialStudents;

// prediction.js - ML Simulation, Feature Attribution & Early Intervention Recommendations

const DEFAULT_WEIGHTS = {
  gpaTrend: 20,
  attendance: 18,
  assignmentSubmission: 15,
  lmsEngagement: 12,
  behavioralIncidents: 10,
  financialStress: 10,
  socialIntegration: 8,
  familySupport: 7
};

const DEFAULT_THRESHOLDS = {
  moderate: 25,
  high: 50,
  critical: 75
};

/**
 * Calculates a normalized risk score between 0 and 100 based on student features and custom weights.
 */
function calculateRiskScore(student, weights = DEFAULT_WEIGHTS) {
  // Normalize individual factors to a 0-100 scale where 100 is high risk and 0 is low risk

  // 1. GPA Trend (Declining = 100, Stable = 40, Improving = 0. Also factor in actual GPA: lower GPA increases base risk)
  let gpaRisk = (4.0 - student.academics.gpa) * 25; // 0 GPA = 100 risk, 4.0 GPA = 0 risk
  if (student.academics.gpaTrend === "declining") gpaRisk = Math.min(100, gpaRisk + 30);
  if (student.academics.gpaTrend === "improving") gpaRisk = Math.max(0, gpaRisk - 20);

  // 2. Attendance (100% = 0 risk, 50% or below = 100 risk)
  const attendanceRisk = Math.max(0, Math.min(100, (100 - student.behavioral.attendance) * 2));

  // 3. Assignment Submission (100% = 0 risk, 50% or below = 100 risk)
  const assignmentRisk = Math.max(0, Math.min(100, (100 - student.academics.assignmentSubmission) * 2));

  // 4. LMS Engagement (25+ visits/week = 0 risk, 0 visits = 100 risk)
  const lmsRisk = Math.max(0, Math.min(100, (25 - student.engagement.lmsLogins) * 4));

  // 5. Disciplinary Incidents (0 = 0 risk, 3+ = 100 risk)
  const behavioralRisk = Math.min(100, student.behavioral.disciplinaryIncidents * 33.3);

  // 6. Financial Stress (aid + part-time hours. 20+ hours = 100 risk, 0 hours = 0 risk)
  let financialRisk = 0;
  if (student.socioeconomic.financialAid) {
    financialRisk = Math.min(100, student.socioeconomic.partTimeHours * 4 + 20);
  }

  // 7. Social Integration (Extracurricular participation, counselor visits)
  // No extracurricular + high/low counselor visits
  let socialRisk = student.behavioral.extracurricular ? 10 : 70;
  // Adjustment based on library visits (proxy for engagement on campus)
  socialRisk = Math.max(0, Math.min(100, socialRisk - (student.engagement.libraryUsage * 5)));

  // 8. Family Support (1 = 100 risk, 5 = 0 risk)
  const familyRisk = (5 - student.socioeconomic.familySupport) * 25;

  // Weighted Average
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = 
    (gpaRisk * weights.gpaTrend) +
    (attendanceRisk * weights.attendance) +
    (assignmentRisk * weights.assignmentSubmission) +
    (lmsRisk * weights.lmsEngagement) +
    (behavioralRisk * weights.behavioralIncidents) +
    (financialRisk * weights.financialStress) +
    (socialRisk * weights.socialIntegration) +
    (familyRisk * weights.familySupport);

  return Math.round(weightedSum / totalWeight);
}

/**
 * Classifies risk score into tiers
 */
function getRiskTier(score, thresholds = DEFAULT_THRESHOLDS) {
  if (score >= thresholds.critical) return { name: "Critical", class: "risk-critical", color: "#ef4444" };
  if (score >= thresholds.high) return { name: "High", class: "risk-high", color: "#f97316" };
  if (score >= thresholds.moderate) return { name: "Moderate", class: "risk-moderate", color: "#eab308" };
  return { name: "Low", class: "risk-low", color: "#10b981" };
}

/**
 * Calculates feature attribution (SHAP values style) showing positive and negative drivers of risk.
 */
function getFeatureAttribution(student, weights = DEFAULT_WEIGHTS) {
  // Compute individual normalized risk metrics again to calculate relative contributions
  const gpaRisk = Math.min(100, Math.max(0, (4.0 - student.academics.gpa) * 25 + (student.academics.gpaTrend === "declining" ? 30 : -20)));
  const attendanceRisk = Math.max(0, Math.min(100, (100 - student.behavioral.attendance) * 2));
  const assignmentRisk = Math.max(0, Math.min(100, (100 - student.academics.assignmentSubmission) * 2));
  const lmsRisk = Math.max(0, Math.min(100, (25 - student.engagement.lmsLogins) * 4));
  const behavioralRisk = Math.min(100, student.behavioral.disciplinaryIncidents * 33.3);
  let financialRisk = 0;
  if (student.socioeconomic.financialAid) {
    financialRisk = Math.min(100, student.socioeconomic.partTimeHours * 4 + 20);
  }
  let socialRisk = student.behavioral.extracurricular ? 10 : 70;
  socialRisk = Math.max(0, Math.min(100, socialRisk - (student.engagement.libraryUsage * 5)));
  const familyRisk = (5 - student.socioeconomic.familySupport) * 25;

  const rawFactors = [
    { name: "Academic Trend (GPA)", value: gpaRisk, weight: weights.gpaTrend, icon: "graduation-cap", category: "Academic" },
    { name: "Attendance Rate", value: attendanceRisk, weight: weights.attendance, icon: "calendar-check", category: "Behavioral" },
    { name: "Assignment Compliance", value: assignmentRisk, weight: weights.assignmentSubmission, icon: "file-signature", category: "Academic" },
    { name: "LMS Engagement", value: lmsRisk, weight: weights.lmsEngagement, icon: "mouse-pointer", category: "Engagement" },
    { name: "Disciplinary Incidents", value: behavioralRisk, weight: weights.behavioralIncidents, icon: "exclamation-triangle", category: "Behavioral" },
    { name: "Financial Hardship", value: financialRisk, weight: weights.financialStress, icon: "hand-holding-usd", category: "Socioeconomic" },
    { name: "Campus Social Integration", value: socialRisk, weight: weights.socialIntegration, icon: "users", category: "Engagement" },
    { name: "Family Support Level", value: familyRisk, weight: weights.familySupport, icon: "home", category: "Socioeconomic" }
  ];

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // Map into positive and negative risk contributors
  // A factor contributes to risk if its score is higher than 35 (baseline).
  // Otherwise, it represents a protective factor.
  const attributions = rawFactors.map(factor => {
    const contribution = ((factor.value - 35) * (factor.weight / totalWeight));
    return {
      name: factor.name,
      contribution: parseFloat(contribution.toFixed(1)),
      valStr: factor.value.toFixed(0),
      category: factor.category,
      rawVal: factor.value
    };
  });

  // Sort: highest risk contributors first, then protective factors
  return attributions.sort((a, b) => b.contribution - a.contribution);
}

/**
 * Recommends action plans based on the top risk drivers.
 */
function getInterventionRecommendations(student, weights = DEFAULT_WEIGHTS) {
  const attributions = getFeatureAttribution(student, weights);
  const recommendations = [];

  // Look for drivers with high positive contribution or high raw values
  attributions.forEach(attr => {
    if (attr.rawVal > 45) {
      if (attr.name.includes("Academic") && recommendations.length < 3) {
        recommendations.push({
          title: "Assign Academic Peer Tutoring",
          category: "Academic",
          impact: "High",
          description: `Set up 2 hours of weekly peer tutoring. Student's current GPA is ${student.academics.gpa} with a ${student.academics.gpaTrend} trend.`,
          actionCode: "ACAD_TUTOR"
        });
      }
      if (attr.name.includes("Attendance") && recommendations.length < 3) {
        recommendations.push({
          title: "Attendance Support & Attendance Contract",
          category: "Behavioral",
          impact: "Critical",
          description: `Schedule a mandatory meeting to identify transportation or scheduling barriers. Current attendance is ${student.behavioral.attendance}%.`,
          actionCode: "ATTEND_CONTRACT"
        });
      }
      if (attr.name.includes("Assignment") && recommendations.length < 3) {
        recommendations.push({
          title: "Study Skills Seminar & Work Review",
          category: "Academic",
          impact: "Medium",
          description: `Refer student to the Student Success Center for assignment tracking and study planning support. Submission rate is ${student.academics.assignmentSubmission}%.`,
          actionCode: "STUDY_SKILLS"
        });
      }
      if (attr.name.includes("LMS") && recommendations.length < 3) {
        recommendations.push({
          title: "LMS Engagement Outreach",
          category: "Engagement",
          impact: "Medium",
          description: `Auto-trigger a check-in message via the student portal. Current login rate is exceptionally low (${student.engagement.lmsLogins} times/week).`,
          actionCode: "LMS_OUTREACH"
        });
      }
      if (attr.name.includes("Disciplinary") && recommendations.length < 3) {
        recommendations.push({
          title: "Conflict Resolution & Behavioral Counseling",
          category: "Behavioral",
          impact: "High",
          description: `Schedule counselor wellness interview. Student has ${student.behavioral.disciplinaryIncidents} active behavioral flag(s).`,
          actionCode: "BEHAV_COUNSEL"
        });
      }
      if (attr.name.includes("Financial") && recommendations.length < 3) {
        recommendations.push({
          title: "Emergency Grant & Financial Aid Review",
          category: "Socioeconomic",
          impact: "High",
          description: `Schedule a review of current scholarships and part-time workload. Working ${student.socioeconomic.partTimeHours} hours/week is impacting academics.`,
          actionCode: "FIN_AID"
        });
      }
      if (attr.name.includes("Social") && recommendations.length < 3) {
        recommendations.push({
          title: "Campus Mentorship Pairing",
          category: "Engagement",
          impact: "Medium",
          description: `Pair student with an upperclassman mentor to increase sense of belonging and campus integration.`,
          actionCode: "MENTOR_PAIR"
        });
      }
      if (attr.name.includes("Family") && recommendations.length < 3) {
        recommendations.push({
          title: "Family Engagement Outreach & Meeting",
          category: "Socioeconomic",
          impact: "Medium",
          description: `Facilitate a family-student counselor conference to strengthen academic support at home.`,
          actionCode: "FAMILY_ENGAGE"
        });
      }
    }
  });

  // Fallback if student has low risk overall but we want to be proactive
  if (recommendations.length === 0) {
    recommendations.push({
      title: "Routine Progress Check-in",
      category: "General",
      impact: "Low",
      description: "Send a supportive motivational email celebrating academic progress and offering resource links.",
      actionCode: "ROUTINE_CHECK"
    });
  }

  return recommendations;
}

// Attach tools to the global window object
window.DEFAULT_WEIGHTS = DEFAULT_WEIGHTS;
window.DEFAULT_THRESHOLDS = DEFAULT_THRESHOLDS;
window.calculateRiskScore = calculateRiskScore;
window.getRiskTier = getRiskTier;
window.getFeatureAttribution = getFeatureAttribution;
window.getInterventionRecommendations = getInterventionRecommendations;

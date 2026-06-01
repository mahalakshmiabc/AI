// app.js - Main Application Controller, Router, State Management, and UI Logic

// 1. Initial State Definition
const state = {
  students: [],
  weights: { ...window.DEFAULT_WEIGHTS },
  thresholds: { ...window.DEFAULT_THRESHOLDS },
  activeView: "dashboard",
  selectedStudent: null,
  filters: {
    search: "",
    risk: "all",
    department: "all",
    grade: "all"
  }
};

// Toast notification helper
function showToast(message, type = "success") {
  const toast = document.getElementById("notification-toast");
  const text = document.getElementById("notification-text");
  
  toast.className = `toast toast-${type} active`;
  text.textContent = message;
  
  setTimeout(() => {
    toast.classList.remove("active");
  }, 4000);
}

// 2. Initial Data Hydration
function initializeData() {
  // Deep clone initial students from data.js
  state.students = JSON.parse(JSON.stringify(window.initialStudents));
  
  // Calculate initial risk scores based on default weights
  recalculateAllRiskScores();
  
  // Setup global event listener for search bar
  document.getElementById("global-search").addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    if (state.activeView === "students") {
      renderStudentsView();
    } else if (state.activeView === "dashboard") {
      // If searching from dashboard, auto-navigate to students view
      window.location.hash = "#students";
      state.filters.search = e.target.value;
      const searchBox = document.getElementById("global-search");
      searchBox.value = e.target.value;
      renderStudentsView();
    }
  });

  // Setup refresh button listener
  document.getElementById("btn-refresh-data").addEventListener("click", () => {
    recalculateAllRiskScores();
    renderCurrentView();
    showToast("Application metrics synchronized.", "info");
  });
}

// Recalculates student scores and tiers
function recalculateAllRiskScores() {
  state.students.forEach(student => {
    // Current Risk
    const score = window.calculateRiskScore(student, state.weights);
    student.riskScore = score;
    student.riskTier = window.getRiskTier(score, state.thresholds);
    
    // Recalculate monthly trends with noise
    student.riskScoresHistory[student.riskScoresHistory.length - 1] = score;
  });
}

// 3. SPA Routing & View Management
function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    state.activeView = hash;
    
    // Update Navigation styling
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });
    
    const activeNav = document.getElementById(`nav-${hash}`);
    if (activeNav) activeNav.classList.add("active");
    
    // Show/Hide page views
    document.querySelectorAll(".view-section").forEach(view => {
      view.classList.remove("active");
    });
    
    const activeViewSection = document.getElementById(`view-${hash}`);
    if (activeViewSection) activeViewSection.classList.add("active");
    
    // Update header texts
    updateHeader(hash);
    
    // Render the specific view
    renderCurrentView();
  };

  window.addEventListener("hashchange", handleRouting);
  // Trigger initial routing
  handleRouting();
}

function updateHeader(view) {
  const title = document.getElementById("page-title");
  const subtitle = document.getElementById("page-subtitle");
  
  switch(view) {
    case "dashboard":
      title.textContent = "Aegis Command Center";
      subtitle.textContent = "Real-time AI dropout risk monitoring and early intervention tracking.";
      break;
    case "students":
      title.textContent = "Student Population Center";
      subtitle.textContent = "Search, filter, and inspect predictive metrics for individual profiles.";
      break;
    case "interventions":
      title.textContent = "Active Care Interventions";
      subtitle.textContent = "Monitor active counseling sessions, tutoring programs, and family support tasks.";
      break;
    case "analytics":
      title.textContent = "System Analytics & Feature Mapping";
      subtitle.textContent = "Deconstruct dropout predictor correlations, scatter maps, and department matrices.";
      break;
    case "settings":
      title.textContent = "Model Parameter Settings";
      subtitle.textContent = "Fine-tune AI predictor feature weights and risk tier classification boundaries.";
      break;
  }
}

function renderCurrentView() {
  switch(state.activeView) {
    case "dashboard":
      renderDashboardView();
      break;
    case "students":
      renderStudentsView();
      break;
    case "interventions":
      renderInterventionsView();
      break;
    case "analytics":
      renderAnalyticsView();
      break;
    case "settings":
      renderSettingsView();
      break;
  }
}

// 4. RENDER VIEWS
// ==========================================
// A. DASHBOARD VIEW
// ==========================================
function renderDashboardView() {
  const total = state.students.length;
  const critical = state.students.filter(s => s.riskTier.name === "Critical").length;
  const high = state.students.filter(s => s.riskTier.name === "High").length;
  
  // Total active interventions count across all students
  const activeInterventionsCount = state.students.reduce((acc, s) => acc + s.activeInterventions.length, 0);

  // Animate statistics counters
  animateCounter("stat-total-students", total);
  animateCounter("stat-critical-count", critical);
  animateCounter("stat-high-count", high);
  animateCounter("stat-active-interventions", activeInterventionsCount);

  // Render Donut Chart: Risk Distribution
  const moderate = state.students.filter(s => s.riskTier.name === "Moderate").length;
  const low = state.students.filter(s => s.riskTier.name === "Low").length;
  
  const segments = [
    { label: "Critical", value: critical, color: "#ef4444" },
    { label: "High", value: high, color: "#f97316" },
    { label: "Moderate", value: moderate, color: "#eab308" },
    { label: "Low", value: low, color: "#10b981" }
  ];
  
  const donutCanvas = document.getElementById("chart-risk-dist");
  window.drawDonutChart(donutCanvas, segments);

  // Render Aegis Index Trend Line Chart
  // Calculate average monthly score across all students
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const averageTrends = [0, 0, 0, 0, 0, 0];
  
  state.students.forEach(s => {
    for (let i = 0; i < 6; i++) {
      averageTrends[i] += s.riskScoresHistory[i] || 0;
    }
  });
  
  const finalTrends = averageTrends.map(val => Math.round(val / total));
  const trendCanvas = document.getElementById("chart-index-trend");
  window.drawAreaChart(trendCanvas, months, finalTrends, "#6366f1");

  // Populate Critical Alerts Panel
  const alertsList = document.getElementById("dashboard-alerts-list");
  alertsList.innerHTML = "";
  
  const criticalStudents = state.students
    .filter(s => s.riskTier.name === "Critical")
    .sort((a, b) => b.riskScore - a.riskScore);

  if (criticalStudents.length === 0) {
    alertsList.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
        <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: var(--risk-low); margin-bottom: 0.5rem;"></i>
        <p>No critical dropout risks detected. Good work!</p>
      </div>`;
  } else {
    criticalStudents.forEach(s => {
      // Find top risk contributor
      const attributions = window.getFeatureAttribution(s, state.weights);
      const topDriver = attributions[0]?.name || "Academics";
      
      const item = document.createElement("div");
      item.className = "alert-item";
      item.onclick = () => openStudentModal(s.id);
      item.style.cursor = "pointer";
      item.innerHTML = `
        <div class="alert-info">
          <h4>${s.name}</h4>
          <p>Risk Driver: ${topDriver} • GPA: ${s.academics.gpa}</p>
        </div>
        <span class="badge badge-critical">${s.riskScore}% Risk</span>
      `;
      alertsList.appendChild(item);
    });
  }

  // Populate Recent Interventions Table on Dashboard
  const recentTable = document.querySelector("#dashboard-recent-interventions-table tbody");
  recentTable.innerHTML = "";
  
  // Gather active interventions
  const activeInts = [];
  state.students.forEach(s => {
    s.activeInterventions.forEach(int => {
      activeInts.push({ ...int, studentName: s.name, studentId: s.id });
    });
  });
  
  // Sort by date descending
  activeInts.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  
  const slice = activeInts.slice(0, 4);
  if (slice.length === 0) {
    recentTable.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No active interventions registered.</td></tr>`;
  } else {
    slice.forEach(int => {
      const row = document.createElement("tr");
      row.onclick = () => openStudentModal(int.studentId);
      row.style.cursor = "pointer";
      row.innerHTML = `
        <td><strong>${int.studentName}</strong></td>
        <td><span style="color: var(--color-primary); font-weight: 500;">${int.type}</span></td>
        <td>${int.counselor}</td>
        <td><span class="badge ${int.progress > 70 ? 'badge-low' : 'badge-moderate'}">${int.status}</span></td>
        <td style="width: 100px;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="int-progress-bar" style="flex-grow: 1; height: 4px; background: rgba(255,255,255,0.05);">
              <div class="int-progress-fill" style="width: ${int.progress}%; height: 100%; background: var(--color-primary);"></div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 600;">${int.progress}%</span>
          </div>
        </td>
      `;
      recentTable.appendChild(row);
    });
  }

  // Connect View All Interventions button
  document.getElementById("btn-view-all-interventions").onclick = () => {
    window.location.hash = "#interventions";
  };
}

// B. STUDENTS VIEW
// ==========================================
function renderStudentsView() {
  const tableBody = document.getElementById("students-table-body");
  tableBody.innerHTML = "";
  
  // Filters Setup
  const riskFilter = document.getElementById("filter-risk");
  const deptFilter = document.getElementById("filter-department");
  const gradeFilter = document.getElementById("filter-grade");

  const applyFilters = () => {
    state.filters.risk = riskFilter.value;
    state.filters.department = deptFilter.value;
    state.filters.grade = gradeFilter.value;
    
    // Filter logic
    const filtered = state.students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                            student.id.toLowerCase().includes(state.filters.search.toLowerCase());
      
      const matchesRisk = state.filters.risk === "all" || student.riskTier.name === state.filters.risk;
      const matchesDept = state.filters.department === "all" || student.department === state.filters.department;
      const matchesGrade = state.filters.grade === "all" || student.grade.toString() === state.filters.grade;
      
      return matchesSearch && matchesRisk && matchesDept && matchesGrade;
    });

    // Populate table rows
    tableBody.innerHTML = "";
    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">No matching students found.</td></tr>`;
      return;
    }

    filtered.forEach(s => {
      const row = document.createElement("tr");
      row.onclick = () => openStudentModal(s.id);
      
      const nameParts = s.name.split(" ");
      const initials = `${nameParts[0]?.[0] || ""}${nameParts[1]?.[0] || ""}`;
      
      // Determine gpa trend arrow
      let trendIcon = '<i class="fa-solid fa-arrows-left-right trend-stable"></i>';
      if (s.academics.gpaTrend === "declining") {
        trendIcon = '<i class="fa-solid fa-arrow-trend-down trend-down"></i>';
      } else if (s.academics.gpaTrend === "improving") {
        trendIcon = '<i class="fa-solid fa-arrow-trend-up trend-up"></i>';
      }

      row.innerHTML = `
        <td>
          <div class="student-row-info">
            <div class="student-initials">${initials}</div>
            <div>
              <h4>${s.name}</h4>
              <p>Year ${s.grade} • Age ${s.age}</p>
            </div>
          </div>
        </td>
        <td><code>${s.id}</code></td>
        <td>${s.department}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <strong>${s.academics.gpa}</strong>
            ${trendIcon}
          </div>
        </td>
        <td>
          <div style="font-weight: 500;">${s.behavioral.attendance}%</div>
          <div class="int-progress-bar" style="width: 60px; height: 3px; margin-top: 3px;">
            <div class="int-progress-fill" style="width: ${s.behavioral.attendance}%; background: ${s.behavioral.attendance > 85 ? 'var(--risk-low)' : (s.behavioral.attendance > 70 ? 'var(--risk-moderate)' : 'var(--risk-critical)')}"></div>
          </div>
        </td>
        <td>
          <span class="badge badge-${s.riskTier.name.toLowerCase()}">${s.riskScore}% Risk</span>
        </td>
        <td>
          <canvas id="spark-${s.id}" width="80" height="25" style="width: 80px; height: 25px;"></canvas>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openInterventionModalWithStudent('${s.id}')">
            <i class="fa-solid fa-hand-holding-hand"></i> Care
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
      
      // Draw inline sparkline risk history
      const sparkCanvas = document.getElementById(`spark-${s.id}`);
      setTimeout(() => {
        window.drawSparkline(sparkCanvas, s.riskScoresHistory, s.riskTier.color);
      }, 0);
    });
  };

  // Re-run filter on inputs
  riskFilter.onchange = applyFilters;
  deptFilter.onchange = applyFilters;
  gradeFilter.onchange = applyFilters;

  document.getElementById("btn-reset-filters").onclick = () => {
    riskFilter.value = "all";
    deptFilter.value = "all";
    gradeFilter.value = "all";
    document.getElementById("global-search").value = "";
    state.filters = { search: "", risk: "all", department: "all", grade: "all" };
    applyFilters();
  };

  applyFilters();
}

// C. INTERVENTIONS VIEW
// ==========================================
function renderInterventionsView() {
  const container = document.getElementById("interventions-container");
  container.innerHTML = "";
  
  // Gather active interventions
  const activeInts = [];
  state.students.forEach(s => {
    s.activeInterventions.forEach(int => {
      activeInts.push({ ...int, studentName: s.name, studentId: s.id, riskColor: s.riskTier.color });
    });
  });

  if (activeInts.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: span 3; text-align: center; padding: 4rem; color: var(--text-secondary);">
        <i class="fa-solid fa-hand-holding-hand" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
        <h3>No Care Interventions Active</h3>
        <p style="margin-top: 0.5rem; font-size: 0.85rem;">Dropout predictors are running. Spot low, moderate, or high risk students and assign structured early interventions.</p>
        <button class="btn btn-primary" onclick="openInterventionModal()" style="margin-top: 1.5rem;">Launch New Plan</button>
      </div>`;
    return;
  }

  activeInts.forEach(int => {
    const card = document.createElement("div");
    card.className = "glass-card int-card";
    card.style.borderLeft = `4px solid ${int.riskColor}`;
    
    card.innerHTML = `
      <div class="int-header">
        <div>
          <span class="badge badge-low" style="font-size: 0.65rem; margin-bottom: 0.5rem;">${int.status}</span>
          <h3 class="int-type">${int.type}</h3>
          <p class="int-student-name"><i class="fa-solid fa-graduation-cap"></i> <strong>${int.studentName}</strong> (<code>${int.studentId}</code>)</p>
        </div>
        <button class="modal-close" style="width:24px; height:24px;" onclick="cancelIntervention('${int.studentId}', '${int.id}')" title="Discharge / Cancel Plan">
          <i class="fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
        </button>
      </div>

      <div class="int-meta">
        <span><i class="fa-solid fa-user-tie"></i> ${int.counselor}</span>
        <span><i class="fa-solid fa-calendar-days"></i> ${int.startDate}</span>
      </div>

      <div class="int-progress-container">
        <div class="int-progress-label">
          <span>Intervention Progress</span>
          <strong>${int.progress}%</strong>
        </div>
        <div class="int-progress-bar">
          <div class="int-progress-fill" style="width: ${int.progress}%;"></div>
        </div>
      </div>

      <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1.25rem; font-style: italic;">
        "${int.notes}"
      </p>

      <div class="int-actions">
        <button class="btn btn-secondary btn-sm" style="flex-grow:1;" onclick="boostIntervention('${int.studentId}', '${int.id}')">
          <i class="fa-solid fa-bolt"></i> Boost progress
        </button>
        <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);" onclick="completeIntervention('${int.studentId}', '${int.id}')">
          <i class="fa-solid fa-circle-check"></i> Complete
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Bind Launcher button
  document.getElementById("btn-assign-intervention-manual").onclick = () => {
    openInterventionModal();
  };
}

// D. ANALYTICS VIEW
// ==========================================
function renderAnalyticsView() {
  // 1. Matrix Heatmap data calculation
  // Rows: Departments, Cols: Academic, Behavioral, Socioeconomic pillars
  const columns = ["Academics Support", "Behavioral Support", "Socioeconomic Care"];
  
  const matrixValues = departments.map(dept => {
    const deptStudents = state.students.filter(s => s.department === dept);
    if (deptStudents.length === 0) return [0, 0, 0];
    
    let acadRiskSum = 0;
    let behavRiskSum = 0;
    let socioRiskSum = 0;
    
    deptStudents.forEach(s => {
      // Academic factors: GPA + Assignment submission
      const gpaRisk = Math.min(100, Math.max(0, (4.0 - s.academics.gpa) * 25 + (s.academics.gpaTrend === "declining" ? 30 : -20)));
      const assignmentRisk = Math.max(0, Math.min(100, (100 - s.academics.assignmentSubmission) * 2));
      acadRiskSum += (gpaRisk + assignmentRisk) / 2;
      
      // Behavioral: Attendance + Disciplinary incidents
      const attendanceRisk = Math.max(0, Math.min(100, (100 - s.behavioral.attendance) * 2));
      const behavioralRisk = Math.min(100, s.behavioral.disciplinaryIncidents * 33.3);
      behavRiskSum += (attendanceRisk + behavioralRisk) / 2;
      
      // Socioeconomic: Financial Hardship + Family Support
      let financialRisk = 0;
      if (s.socioeconomic.financialAid) {
        financialRisk = Math.min(100, s.socioeconomic.partTimeHours * 4 + 20);
      }
      const familyRisk = (5 - s.socioeconomic.familySupport) * 25;
      socioRiskSum += (financialRisk + familyRisk) / 2;
    });
    
    return [
      Math.round(acadRiskSum / deptStudents.length),
      Math.round(behavRiskSum / deptStudents.length),
      Math.round(socioRiskSum / deptStudents.length)
    ];
  });

  const heatmapCanvas = document.getElementById("chart-analytics-heatmap");
  window.drawHeatmap(heatmapCanvas, columns, departments, matrixValues);

  // 2. Scatter Plot: GPA vs Risk Score
  const scatterPoints = state.students.map(s => ({
    x: s.academics.gpa,
    y: s.riskScore,
    name: s.name,
    tierColor: s.riskTier.color
  }));
  
  const scatterCanvas = document.getElementById("chart-analytics-scatter");
  window.drawScatterPlot(scatterCanvas, scatterPoints);

  // 3. Success Rate Bar Chart
  // Academic Tutoring (82%), Mentorship (74%), Financial Counseling (91%), Wellness Counseling (68%), Parent Outreach (58%)
  const barLabels = ["Tutoring", "Mentorship", "Financial", "Wellness", "Family Care"];
  const barData = [82, 74, 91, 68, 58];
  const barCanvas = document.getElementById("chart-analytics-success-rate");
  window.drawBarChart(barCanvas, barLabels, barData, "#3b82f6");
}

// E. SETTINGS VIEW
// ==========================================
function renderSettingsView() {
  // Set Weight Sliders
  Object.keys(state.weights).forEach(key => {
    const slide = document.getElementById(`slide-weight-${key}`);
    const lbl = document.getElementById(`lbl-weight-${key}`);
    
    if (slide && lbl) {
      slide.value = state.weights[key];
      lbl.textContent = `${state.weights[key]}%`;
      
      // Dynamic slider value display
      slide.oninput = (e) => {
        lbl.textContent = `${e.target.value}%`;
      };
    }
  });

  // Set Threshold Sliders
  Object.keys(state.thresholds).forEach(key => {
    const slide = document.getElementById(`slide-thresh-${key}`);
    const lbl = document.getElementById(`lbl-thresh-${key}`);
    
    if (slide && lbl) {
      slide.value = state.thresholds[key];
      lbl.textContent = `${state.thresholds[key]}%`;
      
      slide.oninput = (e) => {
        lbl.textContent = `${e.target.value}%`;
      };
    }
  });

  // Apply Weight Settings Button
  document.getElementById("btn-save-weights").onclick = () => {
    Object.keys(state.weights).forEach(key => {
      const slide = document.getElementById(`slide-weight-${key}`);
      if (slide) {
        state.weights[key] = parseInt(slide.value);
      }
    });
    recalculateAllRiskScores();
    showToast("Model weight configuration applied and compiled.", "success");
  };

  // Reset Weights Button
  document.getElementById("btn-reset-weights").onclick = () => {
    state.weights = { ...window.DEFAULT_WEIGHTS };
    recalculateAllRiskScores();
    renderSettingsView();
    showToast("Weights restored to factory defaults.", "info");
  };

  // Save Threshold Boundaries Button
  document.getElementById("btn-save-thresholds").onclick = () => {
    const moderateVal = parseInt(document.getElementById("slide-thresh-moderate").value);
    const highVal = parseInt(document.getElementById("slide-thresh-high").value);
    const criticalVal = parseInt(document.getElementById("slide-thresh-critical").value);
    
    if (moderateVal >= highVal || highVal >= criticalVal) {
      showToast("Error: Threshold boundaries must be progressive (Mod < High < Crit)", "info");
      return;
    }
    
    state.thresholds = {
      moderate: moderateVal,
      high: highVal,
      critical: criticalVal
    };
    
    recalculateAllRiskScores();
    showToast("Global risk classification thresholds modified.", "success");
  };

  // Simulator: Midterm Attendance Drop
  document.getElementById("btn-sim-anomalies").onclick = () => {
    // Take 4 random students and slash attendance by 20%
    let modifiedCount = 0;
    state.students.forEach((s, idx) => {
      if (idx % 12 === 0 && s.behavioral.attendance > 75) {
        s.behavioral.attendance = parseFloat((s.behavioral.attendance - 20).toFixed(1));
        s.academics.assignmentSubmission = parseFloat((s.academics.assignmentSubmission - 10).toFixed(1));
        modifiedCount++;
      }
    });
    
    recalculateAllRiskScores();
    showToast(`Simulation Complete: Attendance anomalies loaded for ${modifiedCount} profiles.`, "info");
    
    // Auto redirect to dashboard to see anomalies
    setTimeout(() => {
      window.location.hash = "#dashboard";
    }, 1000);
  };

  // Simulator: Boost progress
  document.getElementById("btn-sim-intervention-boost").onclick = () => {
    let boostedCount = 0;
    state.students.forEach(s => {
      s.activeInterventions.forEach(int => {
        if (int.progress < 100) {
          int.progress = Math.min(100, int.progress + 20);
          if (int.progress === 100) {
            int.status = "Complete (Sim)";
          }
          boostedCount++;
        }
      });
    });
    
    showToast(`Simulation Complete: Accelerated progress across ${boostedCount} active plans.`, "success");
    
    setTimeout(() => {
      window.location.hash = "#interventions";
    }, 1000);
  };
}

// 5. INTERVENTION BOARD MANIPULATION
// ==========================================
function boostIntervention(studentId, intId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  
  const int = student.activeInterventions.find(i => i.id === intId);
  if (!int) return;
  
  int.progress = Math.min(100, int.progress + 15);
  if (int.progress === 100) {
    int.status = "Completed";
  }
  
  showToast(`Elevated progress on ${student.name}'s plan!`, "success");
  renderInterventionsView();
}

function completeIntervention(studentId, intId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  
  // Remove or set complete
  student.activeInterventions = student.activeInterventions.filter(i => i.id !== intId);
  
  // Positively impact GPA and attendance dynamically representing the intervention value!
  student.behavioral.attendance = Math.min(99, student.behavioral.attendance + 4.5);
  student.academics.gpa = parseFloat(Math.min(4.0, student.academics.gpa + 0.15).toFixed(2));
  student.academics.gpaTrend = "improving";
  
  recalculateAllRiskScores();
  
  showToast(`Intervention resolved successfully. Recalculated ${student.name}'s risk score.`, "success");
  renderInterventionsView();
}

function cancelIntervention(studentId, intId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  
  student.activeInterventions = student.activeInterventions.filter(i => i.id !== intId);
  showToast("Early intervention plan discharged.", "info");
  renderInterventionsView();
}

// 6. MODAL DRAWERS AND TRIGGERS
// ==========================================
function openStudentModal(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  
  state.selectedStudent = student;
  
  // Set modal texts
  const avatar = document.getElementById("modal-avatar");
  const nameParts = student.name.split(" ");
  avatar.textContent = `${nameParts[0]?.[0] || ""}${nameParts[1]?.[0] || ""}`;
  
  document.getElementById("modal-student-name").textContent = student.name;
  document.getElementById("modal-student-id").innerHTML = `<i class="fa-solid fa-id-card"></i> ${student.id}`;
  document.getElementById("modal-student-dept").innerHTML = `<i class="fa-solid fa-building"></i> ${student.department}`;
  document.getElementById("modal-student-grade").innerHTML = `<i class="fa-solid fa-calendar"></i> Year ${student.grade}`;
  
  // Vitals
  document.getElementById("modal-vital-gpa").textContent = student.academics.gpa;
  document.getElementById("modal-vital-attendance").textContent = `${student.behavioral.attendance}%`;
  document.getElementById("modal-vital-lms").textContent = `${student.engagement.lmsLogins}/wk`;
  
  // Set Risk Value text and Tier Badge
  const valueEl = document.getElementById("modal-gauge-value");
  const tierEl = document.getElementById("modal-gauge-tier");
  
  valueEl.textContent = `${student.riskScore}%`;
  tierEl.textContent = student.riskTier.name;
  tierEl.className = `gauge-lbl ${student.riskTier.class || 'risk-low'}`;
  tierEl.style.color = student.riskTier.color;
  
  // Animated circular SVG progress ring
  const ring = document.getElementById("modal-gauge-ring");
  const percent = student.riskScore;
  const perimeter = 2 * Math.PI * 45; // r=45 -> 282.74
  const offset = perimeter - (perimeter * percent) / 100;
  
  ring.style.stroke = student.riskTier.color;
  
  // Delay a split second to trigger transition
  setTimeout(() => {
    ring.style.strokeDasharray = perimeter;
    ring.style.strokeDashoffset = offset;
  }, 100);
  
  // RENDER SHAP ATTRIBUTION DRIVERS
  const explainList = document.getElementById("modal-explainability-list");
  explainList.innerHTML = "";
  
  const attributions = window.getFeatureAttribution(student, state.weights);
  
  attributions.forEach(attr => {
    const item = document.createElement("div");
    item.className = "feature-score-item";
    
    // Is it positive (adds risk) or negative (protective factor)?
    const isPositive = attr.contribution >= 0;
    const contribStr = isPositive ? `+${attr.contribution}%` : `${attr.contribution}%`;
    const progressFillClass = isPositive ? "var(--risk-critical)" : "var(--risk-low)";
    
    // Normalize absolute width for progress block representation (contribution usually between -15% and +25%)
    const absContrib = Math.abs(attr.contribution);
    const barWidth = Math.min(100, Math.max(5, absContrib * 3.5)); // scale factor
    
    item.innerHTML = `
      <div class="feature-score-info">
        <span class="feature-score-name">${attr.name} (Val: ${attr.valStr})</span>
        <span class="feature-score-contrib ${isPositive ? 'positive' : 'negative'}">${contribStr} Impact</span>
      </div>
      <div class="feature-progress-bar">
        <div class="feature-progress-fill" style="width: ${barWidth}%; background-color: ${progressFillClass}"></div>
      </div>
    `;
    
    explainList.appendChild(item);
  });

  // RENDER RECOMMENDATIONS
  const recList = document.getElementById("modal-recommendations-list");
  recList.innerHTML = "";
  
  const recommendations = window.getInterventionRecommendations(student, state.weights);
  
  recommendations.forEach(rec => {
    const item = document.createElement("div");
    item.className = "rec-item";
    
    // Custom icon mapper
    let iconClass = "fa-solid fa-graduation-cap";
    if (rec.category === "Behavioral") iconClass = "fa-solid fa-clipboard-check";
    if (rec.category === "Socioeconomic") iconClass = "fa-solid fa-hand-holding-dollar";
    if (rec.category === "Engagement") iconClass = "fa-solid fa-handshake";
    
    item.innerHTML = `
      <div class="rec-icon"><i class="${iconClass}"></i></div>
      <div class="rec-body">
        <div class="rec-title-wrap">
          <h4 class="rec-title">${rec.title}</h4>
          <span class="rec-impact-badge impact-${rec.impact}">${rec.impact} impact</span>
        </div>
        <p class="rec-desc">${rec.description}</p>
        <button class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.6rem; font-size: 0.7rem;" onclick="assignRecIntervention('${rec.actionCode}', '${rec.title}', '${rec.category}')">
          <i class="fa-solid fa-plus"></i> Adopt Plan
        </button>
      </div>
    `;
    recList.appendChild(item);
  });

  // Active interventions list inside student modal
  const modalActiveList = document.getElementById("modal-active-interventions-list");
  modalActiveList.innerHTML = "";
  
  if (student.activeInterventions.length === 0) {
    modalActiveList.innerHTML = `<p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No current active plans.</p>`;
  } else {
    student.activeInterventions.forEach(int => {
      const el = document.createElement("div");
      el.style.cssText = "background: rgba(255,255,255,0.02); padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--glass-border); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;";
      el.innerHTML = `
        <div>
          <h5 style="font-size: 0.8rem; font-weight: 600;">${int.type}</h5>
          <span style="font-size: 0.65rem; color: var(--text-secondary);">${int.counselor} • ${int.progress}% Done</span>
        </div>
        <span class="badge badge-low" style="font-size: 0.65rem;">Active</span>
      `;
      modalActiveList.appendChild(el);
    });
  }

  // Open modal overlay
  document.getElementById("student-detail-modal").classList.add("active");
  
  // Set details drawer button
  document.getElementById("modal-btn-assign-intervention").onclick = () => {
    closeStudentModal();
    openInterventionModalWithStudent(student.id);
  };
}

function closeStudentModal() {
  document.getElementById("student-detail-modal").classList.remove("active");
  state.selectedStudent = null;
}

// 7. INTERVENTION ASSIGNMENT WINDOW
// ==========================================
function openInterventionModal() {
  // Populate dropdown list with students at risk (High, Critical, Moderate)
  const studentDrop = document.getElementById("form-int-student");
  studentDrop.innerHTML = "";
  
  const options = state.students
    .sort((a, b) => b.riskScore - a.riskScore);
    
  options.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (Risk: ${s.riskScore}% - ${s.riskTier.name})`;
    studentDrop.appendChild(opt);
  });
  
  document.getElementById("intervention-assignment-modal").classList.add("active");
}

function openInterventionModalWithStudent(studentId) {
  openInterventionModal();
  document.getElementById("form-int-student").value = studentId;
}

// Intercept Adopt buttons from recommendations inside modal
function assignRecIntervention(actionCode, title, category) {
  if (!state.selectedStudent) return;
  const s = state.selectedStudent;
  closeStudentModal();
  
  openInterventionModal();
  
  // Set fields
  document.getElementById("form-int-student").value = s.id;
  
  // Pre-fill type based on recommendation category
  const typeSelect = document.getElementById("form-int-type");
  if (category === "Academic") typeSelect.value = "Academic Tutoring";
  if (category === "Behavioral") typeSelect.value = "Wellness Counseling";
  if (category === "Socioeconomic") {
    typeSelect.value = title.includes("Emergency") ? "Financial Counseling" : "Parent Outreach";
  }
  if (category === "Engagement") typeSelect.value = "Mentorship Program";
  
  document.getElementById("form-int-notes").value = `Assigned AI Recommended care plan: "${title}". Targets optimized.`;
}

function closeInterventionModal() {
  document.getElementById("intervention-assignment-modal").classList.remove("active");
}

// Create new active intervention
function initInterventionAssignment() {
  const studentId = document.getElementById("form-int-student").value;
  const type = document.getElementById("form-int-type").value;
  const counselor = document.getElementById("form-int-counselor").value;
  const notes = document.getElementById("form-int-notes").value || "General intervention milestones established.";
  
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  
  // Check if student already has this exact intervention type
  const duplicate = student.activeInterventions.find(i => i.type === type);
  if (duplicate) {
    showToast(`${student.name} already has an active ${type} plan.`, "info");
    closeInterventionModal();
    return;
  }

  const newInt = {
    id: `INT-${Math.floor(300 + Math.random() * 700)}`,
    type,
    counselor,
    startDate: new Date().toISOString().split('T')[0],
    status: "New",
    progress: 10,
    notes
  };

  student.activeInterventions.push(newInt);
  closeInterventionModal();
  
  showToast(`Launched ${type} for ${student.name} successfully.`, "success");
  
  // Re-run UI
  recalculateAllRiskScores();
  
  if (state.activeView === "interventions") {
    renderInterventionsView();
  } else if (state.activeView === "dashboard") {
    renderDashboardView();
  } else if (state.activeView === "students") {
    renderStudentsView();
  }
}

// 8. HELPERS & COUNTER ANIMATION
// ==========================================
function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  let current = 0;
  const duration = 800; // ms
  const stepTime = Math.max(10, Math.floor(duration / Math.max(1, targetValue)));
  
  // Reset
  el.textContent = "0";
  
  if (targetValue === 0) {
    el.textContent = "0";
    return;
  }
  
  const timer = setInterval(() => {
    current += Math.ceil(targetValue / 20); // increment steps
    if (current >= targetValue) {
      el.textContent = targetValue;
      clearInterval(timer);
    } else {
      el.textContent = current;
    }
  }, stepTime);
}

// 9. INITIALIZER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initializeData();
  initRouter();
  
  // Bind intervention submission
  document.getElementById("btn-submit-intervention").onclick = initInterventionAssignment;
});

// Bind globally for inline onclick functions
window.openStudentModal = openStudentModal;
window.closeStudentModal = closeStudentModal;
window.openInterventionModal = openInterventionModal;
window.openInterventionModalWithStudent = openInterventionModalWithStudent;
window.closeInterventionModal = closeInterventionModal;
window.assignRecIntervention = assignRecIntervention;
window.boostIntervention = boostIntervention;
window.completeIntervention = completeIntervention;
window.cancelIntervention = cancelIntervention;

// charts.js - Crisp Canvas Charting Library with Retina Scaling support

/**
 * Standard Setup to handle High-DPI/Retina displays
 */
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  // Get CSS sizing
  const rect = canvas.getBoundingClientRect();
  
  // Set internal resolution
  canvas.width = (rect.width || canvas.clientWidth || 300) * dpr;
  canvas.height = (rect.height || canvas.clientHeight || 200) * dpr;
  
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  
  return {
    ctx,
    width: rect.width || canvas.clientWidth || 300,
    height: rect.height || canvas.clientHeight || 200
  };
}

/**
 * Draws a gorgeous animated Donut/Ring Chart with hover/legend capabilities
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<{label: string, value: number, color: string}>} segments 
 */
function drawDonutChart(canvas, segments) {
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  
  ctx.clearRect(0, 0, width, height);
  
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(centerX, centerY) * 0.8;
  const innerRadius = outerRadius * 0.65;
  
  let startAngle = -Math.PI / 2;
  
  segments.forEach(seg => {
    if (seg.value === 0) return;
    const sliceAngle = (seg.value / total) * (Math.PI * 2);
    const endAngle = startAngle + sliceAngle;
    
    // Draw outer segment
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    
    // Set segment color with a subtle glowing radial gradient
    ctx.fillStyle = seg.color;
    ctx.fill();
    
    // Add subtle divider line between segments
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
    
    startAngle = endAngle;
  });
  
  // Draw center text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(total.toString(), centerX, centerY - 8);
  
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 11px Inter, sans-serif";
  ctx.fillText("STUDENTS", centerX, centerY + 12);
}

/**
 * Draws an interactive-looking Area/Line Chart with gradient fill below the curve
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<string>} labels 
 * @param {Array<number>} dataPoints 
 * @param {string} accentColor 
 */
function drawAreaChart(canvas, labels, dataPoints, accentColor = "#6366f1") {
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  
  const maxVal = 100; // Risk range is 0 to 100
  const minVal = 0;
  
  // Draw Grid Lines (Horizontal only)
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 4; i++) {
    const yVal = minVal + (maxVal - minVal) * (i / 4);
    const y = paddingTop + graphHeight - (i / 4) * graphHeight;
    
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    
    // Draw Y axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(yVal)}%`, paddingLeft - 8, y);
  }
  
  if (dataPoints.length === 0) return;
  
  // Calculate X coordinates
  const stepX = graphWidth / (dataPoints.length - 1);
  const points = dataPoints.map((val, idx) => {
    const x = paddingLeft + idx * stepX;
    const y = paddingTop + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    return { x, y, val };
  });
  
  // Draw area gradient path first
  ctx.beginPath();
  ctx.moveTo(points[0].x, paddingTop + graphHeight);
  
  // Draw bezier curves or simple line paths
  points.forEach((pt, idx) => {
    if (idx === 0) {
      ctx.lineTo(pt.x, pt.y);
    } else {
      // Draw bezier curves for smoothness
      const prevPt = points[idx - 1];
      const cpX1 = prevPt.x + (pt.x - prevPt.x) / 2;
      const cpY1 = prevPt.y;
      const cpX2 = prevPt.x + (pt.x - prevPt.x) / 2;
      const cpY2 = pt.y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, pt.x, pt.y);
    }
  });
  ctx.lineTo(points[points.length - 1].x, paddingTop + graphHeight);
  ctx.closePath();
  
  // Create gradient
  const areaGradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + graphHeight);
  areaGradient.addColorStop(0, accentColor + "28"); // opacity ~16%
  areaGradient.addColorStop(1, accentColor + "00"); // fully transparent
  ctx.fillStyle = areaGradient;
  ctx.fill();
  
  // Draw top glowing stroke line
  ctx.beginPath();
  points.forEach((pt, idx) => {
    if (idx === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      const prevPt = points[idx - 1];
      const cpX1 = prevPt.x + (pt.x - prevPt.x) / 2;
      const cpY1 = prevPt.y;
      const cpX2 = prevPt.x + (pt.x - prevPt.x) / 2;
      const cpY2 = pt.y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, pt.x, pt.y);
    }
  });
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  // Draw points & hover markers
  points.forEach((pt, idx) => {
    // Draw outer glow circle
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    
    // Draw X-axis label
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(labels[idx] || "", pt.x, paddingTop + graphHeight + 8);
  });
}

/**
 * Draws a stylized Bar Chart with rounded tops
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<string>} labels 
 * @param {Array<number>} dataPoints 
 * @param {string} barColor 
 */
function drawBarChart(canvas, labels, dataPoints, barColor = "#3b82f6") {
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  
  const paddingLeft = 35;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;
  
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  
  const maxVal = Math.max(...dataPoints, 10);
  const minVal = 0;
  
  // Draw Grid lines
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const yVal = minVal + (maxVal - minVal) * (i / 3);
    const y = paddingTop + graphHeight - (i / 3) * graphHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    
    // Y labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(yVal)}%`, paddingLeft - 8, y);
  }
  
  if (dataPoints.length === 0) return;
  
  const barCount = dataPoints.length;
  const totalBarSpacing = graphWidth / barCount;
  const barWidth = totalBarSpacing * 0.55; // 55% width, rest gap
  
  dataPoints.forEach((val, idx) => {
    const x = paddingLeft + (idx * totalBarSpacing) + (totalBarSpacing - barWidth) / 2;
    const barHeight = (val / maxVal) * graphHeight;
    const y = paddingTop + graphHeight - barHeight;
    
    // Draw Bar with rounded top
    ctx.fillStyle = barColor;
    
    // Custom drawing with rounded top corners
    const radius = Math.min(5, barHeight);
    ctx.beginPath();
    ctx.moveTo(x, y + barHeight);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, y + barHeight);
    ctx.closePath();
    
    // Draw styled gradient fill
    const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
    grad.addColorStop(0, barColor);
    grad.addColorStop(1, barColor + "40");
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Value Label on top of bar
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${Math.round(val)}%`, x + barWidth / 2, y - 3);
    
    // X Axis Label
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(labels[idx] || "", x + barWidth / 2, paddingTop + graphHeight + 6);
  });
}

/**
 * Draws an inline micro-sparkline for tables
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<number>} dataPoints 
 * @param {string} color 
 */
function drawSparkline(canvas, dataPoints, color = "#10b981") {
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  
  if (dataPoints.length < 2) return;
  
  const minVal = 0;
  const maxVal = 100;
  
  const stepX = width / (dataPoints.length - 1);
  const points = dataPoints.map((val, idx) => {
    const x = idx * stepX;
    const y = height - 2 - ((val - minVal) / (maxVal - minVal)) * (height - 4);
    return { x, y };
  });
  
  // Area fill below sparkline
  ctx.beginPath();
  ctx.moveTo(0, height);
  points.forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.lineTo(width, height);
  ctx.closePath();
  
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, color + "20");
  grad.addColorStop(1, color + "00");
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Sparkline stroke
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Final dot indicator
  const lastPt = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(lastPt.x - 1, lastPt.y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a Heatmap Grid representing risk levels across categories/departments
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<string>} xLabels 
 * @param {Array<string>} yLabels 
 * @param {Array<Array<number>>} gridValues Matrix [y][x]
 */
function drawHeatmap(canvas, xLabels, yLabels, gridValues) {
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  
  const paddingLeft = 110; // Extra room for long department names
  const paddingTop = 15;
  const paddingBottom = 30;
  const paddingRight = 10;
  
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  
  const rows = yLabels.length;
  const cols = xLabels.length;
  
  const cellWidth = graphWidth / cols;
  const cellHeight = graphHeight / rows;
  
  // Draw grid cells
  for (let r = 0; r < rows; r++) {
    // Draw Y label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(yLabels[r], paddingLeft - 10, paddingTop + (r * cellHeight) + (cellHeight / 2));
    
    for (let c = 0; c < cols; c++) {
      const val = gridValues[r]?.[c] || 0;
      const x = paddingLeft + (c * cellWidth);
      const y = paddingTop + (r * cellHeight);
      
      // Determine color intensity based on value (0-100 risk)
      let colorStr = "rgba(16, 185, 129, 0.1)"; // Low
      let textFill = "#10b981";
      
      if (val >= 75) {
        colorStr = `rgba(239, 68, 68, ${0.15 + (val - 75) * 0.03})`;
        textFill = "#ef4444";
      } else if (val >= 50) {
        colorStr = `rgba(249, 115, 22, ${0.15 + (val - 50) * 0.03})`;
        textFill = "#f97316";
      } else if (val >= 25) {
        colorStr = `rgba(234, 179, 8, ${0.15 + (val - 25) * 0.03})`;
        textFill = "#eab308";
      }
      
      // Draw frosted block
      ctx.fillStyle = colorStr;
      ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
      
      // Draw border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
      
      // Draw risk value text inside
      ctx.fillStyle = textFill;
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${val}%`, x + cellWidth / 2, y + cellHeight / 2);
    }
  }
  
  // Draw X axis labels at bottom
  xLabels.forEach((lbl, c) => {
    const x = paddingLeft + (c * cellWidth) + (cellWidth / 2);
    ctx.fillStyle = "#64748b";
    ctx.font = "500 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(lbl, x, paddingTop + graphHeight + 6);
  });
}

/**
 * Draws a gorgeous Scatter Plot correlation (Risk Score vs GPA)
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<{x: number, y: number, name: string, tierColor: string}>} points 
 */
function drawScatterPlot(canvas, points) {
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;
  
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  
  // X: GPA from 1.5 to 4.0
  const minGPA = 1.5;
  const maxGPA = 4.0;
  
  // Y: Risk from 0 to 100
  const minRisk = 0;
  const maxRisk = 100;
  
  // Draw Horizontal and Vertical grid lines
  ctx.strokeStyle = "rgba(148, 163, 184, 0.05)";
  ctx.lineWidth = 1;
  
  // Horizontal grid (Risk)
  for (let i = 0; i <= 4; i++) {
    const riskVal = minRisk + (maxRisk - minRisk) * (i / 4);
    const y = paddingTop + graphHeight - (i / 4) * graphHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    
    // Y label
    ctx.fillStyle = "#64748b";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(riskVal.toString(), paddingLeft - 8, y);
  }
  
  // Vertical grid (GPA)
  for (let i = 0; i <= 5; i++) {
    const gpaVal = minGPA + (maxGPA - minGPA) * (i / 5);
    const x = paddingLeft + (i / 5) * graphWidth;
    ctx.beginPath();
    ctx.moveTo(x, paddingTop);
    ctx.lineTo(x, paddingTop + graphHeight);
    ctx.stroke();
    
    // X label
    ctx.fillStyle = "#64748b";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(gpaVal.toFixed(1), x, paddingTop + graphHeight + 6);
  }
  
  // Axis titles
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 9px Outfit, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("RISK %", paddingLeft + 5, paddingTop + 5);
  
  ctx.textAlign = "right";
  ctx.fillText("GPA →", width - paddingRight, paddingTop + graphHeight - 12);
  
  // Plot dots
  points.forEach(pt => {
    // Map coords
    if (pt.x < minGPA || pt.x > maxGPA) return;
    const x = paddingLeft + ((pt.x - minGPA) / (maxGPA - minGPA)) * graphWidth;
    const y = paddingTop + graphHeight - ((pt.y - minRisk) / (maxRisk - minRisk)) * graphHeight;
    
    // Draw scatter point
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = pt.tierColor;
    ctx.globalAlpha = 0.75;
    ctx.fill();
    
    // Draw glowing border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 1.0;
    ctx.stroke();
  });
}

// Bind to window context
window.drawDonutChart = drawDonutChart;
window.drawAreaChart = drawAreaChart;
window.drawBarChart = drawBarChart;
window.drawSparkline = drawSparkline;
window.drawHeatmap = drawHeatmap;
window.drawScatterPlot = drawScatterPlot;

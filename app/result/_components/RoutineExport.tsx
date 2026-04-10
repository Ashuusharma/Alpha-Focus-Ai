"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, X, CheckCircle, Loader2 } from "lucide-react";

interface RoutineStep {
  step: number;
  product: string;
  action: string;
  duration: string;
  tip?: string;
}

interface WeekRoutine {
  week: number;
  title: string;
  focus: string;
  morning: RoutineStep[];
  evening: RoutineStep[];
  expectedProgress: string;
}

interface RoutineExportProps {
  isOpen: boolean;
  onClose: () => void;
  routine: WeekRoutine[];
  issues: { name: string; severity: string }[];
}

export default function RoutineExport({ isOpen, onClose, routine, issues }: RoutineExportProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const generatePDF = async () => {
    setExporting(true);

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your 4-Week Grooming Routine - Oneman AI</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0B0F19 0%, #1E293B 100%);
      color: #fff;
      padding: 40px;
      min-height: 100vh;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(255,255,255,0.1);
    }
    
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #06b6d4;
      margin-bottom: 8px;
    }
    
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #9CA3AF;
      font-size: 14px;
    }
    
    .issues-section {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .issues-title {
      font-size: 14px;
      text-transform: uppercase;
      color: #9CA3AF;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    
    .issues-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .issue-tag {
      background: rgba(6,182,212,0.2);
      color: #06b6d4;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .week-card {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      margin-bottom: 24px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    
    .week-header {
      background: rgba(255,255,255,0.05);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .week-number {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }
    
    .week-info h3 {
      font-size: 18px;
      margin-bottom: 4px;
    }
    
    .week-info p {
      color: #9CA3AF;
      font-size: 12px;
    }
    
    .routine-section {
      padding: 20px;
    }
    
    .routine-time {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #FBBF24;
    }
    
    .routine-time.evening {
      color: #818CF8;
    }
    
    .step {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
    }
    
    .step-number {
      width: 24px;
      height: 24px;
      background: rgba(6,182,212,0.2);
      color: #06b6d4;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .step-content {
      flex: 1;
    }
    
    .step-product {
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .step-action {
      color: #9CA3AF;
      font-size: 12px;
    }
    
    .step-tip {
      color: #06b6d4;
      font-size: 11px;
      margin-top: 4px;
    }
    
    .progress-note {
      background: rgba(16,185,129,0.1);
      border-left: 3px solid #10B981;
      padding: 12px;
      margin: 16px 20px 20px;
      border-radius: 0 8px 8px 0;
    }
    
    .progress-note p {
      color: #10B981;
      font-size: 12px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #6B7280;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: #0B0F19;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ONEMAN AI</div>
    <h1>Your Personalized 4-Week Routine</h1>
    <p class="subtitle">Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
  </div>
  
  <div class="issues-section">
    <p class="issues-title">Targeting These Issues</p>
    <div class="issues-list">
      ${issues.map(issue => `<span class="issue-tag">${issue.name}</span>`).join("")}
    </div>
  </div>
  
  ${routine.map(week => `
    <div class="week-card">
      <div class="week-header">
        <div class="week-number">W${week.week}</div>
        <div class="week-info">
          <h3>${week.title}</h3>
          <p>${week.focus}</p>
        </div>
      </div>
      
      <div class="routine-section">
        <p class="routine-time">MORNING</p>
        ${week.morning.map(step => `
          <div class="step">
            <div class="step-number">${step.step}</div>
            <div class="step-content">
              <p class="step-product">${step.product}</p>
              <p class="step-action">${step.action} - ${step.duration}</p>
              ${step.tip ? `<p class="step-tip"> ${step.tip}</p>` : ""}
            </div>
          </div>
        `).join("")}
        
        <p class="routine-time evening" style="margin-top: 20px;"> EVENING</p>
        ${week.evening.map(step => `
          <div class="step">
            <div class="step-number">${step.step}</div>
            <div class="step-content">
              <p class="step-product">${step.product}</p>
              <p class="step-action">${step.action} - ${step.duration}</p>
              ${step.tip ? `<p class="step-tip"> ${step.tip}</p>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="progress-note">
        <p> Expected Progress: ${week.expectedProgress}</p>
      </div>
    </div>
  `).join("")}
  
  <div class="footer">
    <p>Generated by Oneman AI  -  Your Personal Grooming Assistant</p>
    <p style="margin-top: 8px;">oneman.ai</p>
  </div>
</body>
</html>
    `;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oneman-routine-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Export Routine</h3>
                  <p className="text-xs text-gray-500">Download your 4-week plan</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Download your personalized routine as an HTML file that you can print or save for offline access.
              </p>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-sm text-white font-medium mb-2">Includes:</p>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    4-week morning & evening routines
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Product recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Pro tips for each step
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Expected progress milestones
                  </li>
                </ul>
              </div>

              <button
                onClick={generatePDF}
                disabled={exporting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition ${
                  exported
                    ? "bg-green-500 text-white"
                    : "bg-primary text-black hover:bg-cyan-400"
                } disabled:opacity-50`}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : exported ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Routine
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


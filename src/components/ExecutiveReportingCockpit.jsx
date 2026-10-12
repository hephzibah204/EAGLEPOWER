import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Award,
  CreditCard,
  Users,
  AlertTriangle,
  AlertCircle,
  Printer,
  Download,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  BookOpen,
  PhoneCall,
  Sparkles,
  Activity,
  Layers,
  RefreshCw
} from 'lucide-react';

import { getApiBase } from '../config/api';

const REPORT_GENERATED_DATE = new Date().toLocaleDateString('en-GB');

export default function ExecutiveReportingCockpit({ authToken }) {
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [selectedTerm, setSelectedTerm] = useState('Second Term');
  const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'academics', 'finance', 'operations'
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded Reporting Data
  const [summaryData, setSummaryData] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [operationsData, setOperationsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportDate = REPORT_GENERATED_DATE;

  // Fetch reports from backend
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      const [sumRes, acadRes, finRes, opsRes] = await Promise.all([
        fetch(`${apiBase}/reports/executive-summary?session=${encodeURIComponent(selectedSession)}&term=${encodeURIComponent(selectedTerm)}`, { headers }),
        fetch(`${apiBase}/reports/academic-analytics?session=${encodeURIComponent(selectedSession)}&term=${encodeURIComponent(selectedTerm)}`, { headers }),
        fetch(`${apiBase}/reports/financial-analytics`, { headers }),
        fetch(`${apiBase}/reports/operations-safety`, { headers })
      ]);

      if (sumRes.ok) {
        const d = await sumRes.json();
        setSummaryData(d.data);
      }
      if (acadRes.ok) {
        const d = await acadRes.json();
        setAcademicData(d.data);
      }
      if (finRes.ok) {
        const d = await finRes.json();
        setFinancialData(d.data);
      }
      if (opsRes.ok) {
        const d = await opsRes.json();
        setOperationsData(d.data);
      }
    } catch (err) {
      console.error('Failed to load executive reports:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken, selectedSession, selectedTerm]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Export Defaulters to CSV
  const handleExportDefaultersCsv = () => {
    if (!financialData?.top_debtors || financialData.top_debtors.length === 0) {
      alert('No debtor records available to export.');
      return;
    }

    const headers = ['Admission No', 'Student Name', 'Class', 'Guardian', 'Phone', 'Amount Due (NGN)', 'Amount Paid (NGN)', 'Balance Due (NGN)', 'Status'];
    const rows = financialData.top_debtors.map(d => [
      `"${d.admission_no}"`,
      `"${d.student_name}"`,
      `"${d.class_name}"`,
      `"${d.guardian_name || 'N/A'}"`,
      `"${d.guardian_phone || 'N/A'}"`,
      d.amount_due,
      d.amount_paid,
      d.balance_due,
      `"${d.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EaglePower_Debtors_Report_${selectedSession.replace('/', '-')}_${selectedTerm.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print Mode for Board Memorandum
  const handlePrintBoardBrief = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const enrollment = summaryData?.enrollment || {};
  const financial = summaryData?.financial || {};
  const academic = summaryData?.academic || {};
  const operations = summaryData?.operations || {};
  const alerts = summaryData?.alerts || [];

  // Filtered classes for academic tab
  const filteredClasses = (academicData?.classes || []).filter(c => {
    if (divisionFilter !== 'All' && c.division !== divisionFilter) return false;
    if (searchQuery && !c.class_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filtered subjects
  const filteredSubjects = (academicData?.subjects || []).filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Cockpit Header Bar */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Executive Cockpit
            </span>
            <span className="text-slate-400 text-xs">School Head & Proprietor Decision Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Eagle Power Comprehensive Reporting Suite
          </h2>
          <p className="text-xs text-slate-400">
            Real-time analytics across Academics, Bursary, Admissions, Campus Operations & Governance
          </p>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Session Selector */}
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
          >
            <option value="2024/2025">2024/2025 Session</option>
            <option value="2025/2026">2025/2026 Session</option>
          </select>

          {/* Term Selector */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
          >
            <option value="First Term">1st Term</option>
            <option value="Second Term">2nd Term (Active)</option>
            <option value="Third Term">3rd Term</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchReports}
            title="Reload live database telemetry"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Export Defaulters CSV */}
          <button
            onClick={handleExportDefaultersCsv}
            title="Download Defaulters CSV for Bursary"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Defaulters</span> CSV
          </button>

          {/* Board-Ready Print Button */}
          <button
            onClick={handlePrintBoardBrief}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Board Briefing</span>
          </button>
        </div>
      </div>

      {/* Early Warning Anomaly Radar Alert Box */}
      {alerts.length > 0 && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Head of School Early-Warning Radar ({alerts.length} Active Notice{alerts.length > 1 ? 's' : ''})
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Automated Decision Intelligence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  alt.level === 'critical'
                    ? 'bg-red-950/40 border-red-800/80 text-red-200'
                    : alt.level === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {alt.level === 'critical' ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : alt.level === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Activity className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[11px] uppercase tracking-wide opacity-80">
                      [{alt.category}]
                    </span>
                    <strong className="font-bold text-xs text-white">{alt.title}</strong>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{alt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Institutional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Student Enrollment & Demographics */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Population</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">
              {enrollment.total || 96} <span className="text-xs font-normal text-slate-400">Pupils</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span>👦 {enrollment.male || 52} Boys</span>
              <span>&bull;</span>
              <span>👧 {enrollment.female || 44} Girls</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
            <span>Staff Ratio: <strong className="text-slate-200">{enrollment.teacher_student_ratio || '1:14'}</strong></span>
            <span><strong className="text-slate-200">{enrollment.class_count || 16}</strong> Classes</span>
          </div>
        </div>

        {/* KPI 2: Academic Health Index */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Academic Health Index</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-emerald-400">
              {academic.school_average || 68.2}% <span className="text-xs font-normal text-slate-400">GPA</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-bold">{academic.pass_rate || 85}% Pass Rate</span>
              <span>&bull;</span>
              <span className="text-amber-400 font-bold">{academic.distinction_rate || 35}% Dist.</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
            <span>Grades Evaluated: <strong className="text-slate-200">{academic.total_marks_recorded || 200}</strong></span>
            <span className="text-red-400">Failures: {academic.failure_rate || 15}%</span>
          </div>
        </div>

        {/* KPI 3: Bursary & Recovery Efficiency */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Bursary Recovery</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-amber-400">
              {financial.collection_rate || 63}% <span className="text-xs font-normal text-slate-400">Collected</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Collected: <strong className="text-slate-200">₦{(financial.total_collected || 850000).toLocaleString()}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
            <span>Outstanding Debt:</span>
            <span className="text-red-400 font-bold">₦{(financial.outstanding_debt || 500000).toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 4: Operations & Front Desk Safety */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Operations & Safety</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">
              {operations.visitors_in_campus || 0} <span className="text-xs font-normal text-slate-400">In Campus</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span>Complaints Open: <strong className={operations.pending_complaints > 0 ? 'text-amber-400' : 'text-emerald-400'}>{operations.pending_complaints || 0}</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
            <span>Admissions in Queue:</span>
            <span className="text-blue-400 font-bold">{operations.pending_admissions || 0} Pending</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSection === 'overview'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white bg-slate-950/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Strategic Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveSection('academics')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSection === 'academics'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white bg-slate-950/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Academic & Examination Radar</span>
        </button>

        <button
          onClick={() => setActiveSection('finance')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSection === 'finance'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white bg-slate-950/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Bursary & Defaulter Ledger</span>
        </button>

        <button
          onClick={() => setActiveSection('operations')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSection === 'operations'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white bg-slate-950/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Campus Safety & Grievance SLA</span>
        </button>
      </div>

      {/* TAB 1: STRATEGIC OVERVIEW & DRIFT */}
      {activeSection === 'overview' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Division Contributions & Performance Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Division Financial & Enrollment Breakdown */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Division Revenue vs Debt Share
                </h4>
                <span className="text-[10px] text-slate-400">Bursary Breakdown</span>
              </div>

              <div className="space-y-3">
                {(financialData?.divisions || []).map((div) => (
                  <div key={div.division} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-white font-extrabold">{div.division}</strong>
                      <span className="text-slate-400 text-[11px]">{div.students} Students</span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-400 h-full"
                        style={{ width: `${div.collection_rate}%` }}
                        title={`Collected: ${div.collection_rate}%`}
                      />
                      <div
                        className="bg-red-400 h-full"
                        style={{ width: `${100 - div.collection_rate}%` }}
                        title={`Debt: ${100 - div.collection_rate}%`}
                      />
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-emerald-400">Collected: ₦{div.collected.toLocaleString()} ({div.collection_rate}%)</span>
                      <span className="text-red-400">Debt: ₦{div.debt.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Scholars vs Remedial Need */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Top Scholars Honor Roll
                </h4>
                <span className="text-[10px] text-slate-400">Distinction Cohort</span>
              </div>

              <div className="space-y-2">
                {(academicData?.top_scholars || []).slice(0, 5).map((sch, idx) => (
                  <div key={sch.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 font-black text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <strong className="text-white font-bold block">{sch.student_name}</strong>
                        <span className="text-[10px] text-slate-400">{sch.class_name} &bull; {sch.admission_no}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400">{sch.gpa_average}%</span>
                      <span className="text-[10px] text-slate-400 block">{sch.subjects_taken} Subjects</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Decision Guidance for School Head */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-400/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Head of School Decision Directives (Automated Recommendations)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <strong className="text-amber-300 block mb-1">1. Bursary Debt Recovery</strong>
                Immediate SMS broadcast recommended for accounts with &gt; ₦50,000 balance prior to end-of-term examinations.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <strong className="text-emerald-300 block mb-1">2. Academic Remedial Clinic</strong>
                Organize 2-week intensive clinics for students with &lt; 50% GPA in core Mathematics and English Language.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <strong className="text-blue-300 block mb-1">3. Front Desk Vigilance</strong>
                Enforce mandatory badge return at gate upon visitor checkout to ensure zero open visitor passes at close of day.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ACADEMIC & EXAMINATION RADAR */}
      {activeSection === 'academics' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-300">Division Filter:</span>
              <div className="flex items-center gap-1">
                {['All', 'Nursery', 'Primary', 'Junior College', 'Senior College'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDivisionFilter(d)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      divisionFilter === d ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search class or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Class Academic Rankings Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Class Academic Rankings ({filteredClasses.length} Classes)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Ranked by Cohort Average Score</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Class Name</th>
                    <th className="py-2.5 px-3">Division</th>
                    <th className="py-2.5 px-3">Pupils</th>
                    <th className="py-2.5 px-3">Avg CA (/30)</th>
                    <th className="py-2.5 px-3">Avg Exam (/70)</th>
                    <th className="py-2.5 px-3">Total Avg (/100)</th>
                    <th className="py-2.5 px-3">Pass Rate</th>
                    <th className="py-2.5 px-3">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredClasses.map((cls, idx) => (
                    <tr key={cls.class_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-400 font-bold">#{idx + 1}</td>
                      <td className="py-2 px-3 font-extrabold text-white">{cls.class_name}</td>
                      <td className="py-2 px-3 text-slate-400">{cls.division}</td>
                      <td className="py-2 px-3 font-bold text-slate-200">{cls.enrolled_students}</td>
                      <td className="py-2 px-3 font-mono text-slate-300">{cls.average_ca}</td>
                      <td className="py-2 px-3 font-mono text-slate-300">{cls.average_exam}</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-400">{cls.average_score}%</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cls.pass_rate >= 80 ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' : 'bg-amber-950 border border-amber-800 text-amber-300'
                        }`}>
                          {cls.pass_rate}%
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          cls.health_status === 'Distinction'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : cls.health_status === 'Good'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : cls.health_status === 'Fair'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}>
                          {cls.health_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject Performance & High Risk Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Subject Performance & Failure Risk Benchmark
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Curriculum Diagnostic</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Submissions</th>
                    <th className="py-2.5 px-3">Average Score</th>
                    <th className="py-2.5 px-3">Score Range</th>
                    <th className="py-2.5 px-3">Distinctions (&gt;70%)</th>
                    <th className="py-2.5 px-3">Failures (&lt;50%)</th>
                    <th className="py-2.5 px-3">Curriculum Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2 px-3 font-extrabold text-white">{sub.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{sub.code}</td>
                      <td className="py-2 px-3 text-slate-300">{sub.submissions}</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-400">{sub.average_score}%</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{sub.min_score} - {sub.max_score}</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{sub.distinctions}</td>
                      <td className="py-2 px-3 text-red-400 font-bold">{sub.failures}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.risk_level === 'High Risk'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : sub.risk_level === 'Moderate'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {sub.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Students Requiring Urgent Academic Intervention */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Students Requiring Mandatory Academic Intervention (Below 50% GPA or Multiple Subject Failures)
              </h4>
              <span className="text-[10px] text-slate-400">Target for Remedial Parent Conferences</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(academicData?.intervention_needed || []).map((st) => (
                <div key={st.id} className="p-3 rounded-xl bg-slate-900 border border-red-900/50 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <strong className="text-white font-extrabold">{st.student_name}</strong>
                    <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {st.gpa_average}% GPA
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] flex justify-between">
                    <span>{st.class_name} &bull; {st.admission_no}</span>
                    <span className="text-red-400 font-bold">{st.failed_subjects} failed subject(s)</span>
                  </div>
                  {st.guardian_phone && (
                    <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Guardian Contact:</span>
                      <a href={`tel:${st.guardian_phone}`} className="text-amber-400 hover:underline flex items-center gap-1 font-mono">
                        <PhoneCall className="w-3 h-3" />
                        <span>{st.guardian_phone}</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: BURSARY & DEFAULTER LEDGER */}
      {activeSection === 'finance' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Top Inflow Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Termly Invoiced</span>
              <div className="text-2xl font-black text-white mt-1">
                ₦{(financial.total_invoiced || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Expected tuition commitment</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Total Recovered Cash</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                ₦{(financial.total_collected || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">{financial.collection_rate || 0}% recovery rate</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold text-red-400 uppercase">Outstanding Receivables</span>
              <div className="text-2xl font-black text-red-400 mt-1">
                ₦{(financial.outstanding_debt || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-red-400 mt-1 block">Subject to Bursary clearance</span>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Payment Channels & Reconciliation Channels
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {(financialData?.payment_methods || []).map((pm) => (
                <div key={pm.payment_method} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">{pm.payment_method}</span>
                  <div className="text-lg font-black text-white mt-0.5">₦{pm.total_amount.toLocaleString()}</div>
                  <span className="text-[10px] text-slate-400 font-mono">{pm.transaction_count} transaction(s)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Defaulter Ledger Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Top Defaulters & Outstanding Balances Ledger
                </h4>
                <p className="text-[11px] text-slate-400">Prioritized list for Bursary follow-up & fee drive</p>
              </div>

              <button
                onClick={handleExportDefaultersCsv}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export CSV List</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Guardian</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Amount Due</th>
                    <th className="py-2.5 px-3">Amount Paid</th>
                    <th className="py-2.5 px-3">Balance Due</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(financialData?.top_debtors || []).map((deb) => (
                    <tr key={deb.invoice_no} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2 px-3">
                        <strong className="text-white block">{deb.student_name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{deb.admission_no}</span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-200">{deb.class_name}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{deb.invoice_no}</td>
                      <td className="py-2 px-3 text-slate-300">{deb.guardian_name || 'N/A'}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-amber-400">
                        {deb.guardian_phone ? (
                          <a href={`tel:${deb.guardian_phone}`} className="hover:underline flex items-center gap-1">
                            <PhoneCall className="w-3 h-3" />
                            <span>{deb.guardian_phone}</span>
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="py-2 px-3 font-mono">₦{deb.amount_due.toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono text-emerald-400">₦{deb.amount_paid.toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono font-bold text-red-400">₦{deb.balance_due.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          deb.status === 'Partial' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {deb.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: CAMPUS SAFETY, GRIEVANCES & SLA */}
      {activeSection === 'operations' && (
        <div className="space-y-4 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Campus Front Desk & Visitors Status */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  Campus Visitor Pass Telemetry
                </h4>
                <span className="text-[10px] text-slate-400">Security Desk Log</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Total Visitors</span>
                  <strong className="text-white text-lg font-black">{operationsData?.visitors?.total || 0}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800 text-purple-200">
                  <span className="text-[10px] block">In Campus Now</span>
                  <strong className="text-purple-300 text-lg font-black">{operationsData?.visitors?.in_campus || 0}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Checked Out</span>
                  <strong className="text-emerald-400 text-lg font-black">{operationsData?.visitors?.checked_out || 0}</strong>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-900 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Visitor Purpose Breakdown:</span>
                {(operationsData?.visitors?.purposes || []).map((p) => (
                  <div key={p.purpose} className="flex justify-between text-[11px] text-slate-300 py-0.5">
                    <span>{p.purpose}</span>
                    <strong className="font-mono text-white">{p.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent Grievance & Complaint SLA Tracker */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Parent Grievance & SLA Tracker
                </h4>
                <span className="text-[10px] text-slate-400">Reputation Management</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Total Logged</span>
                  <strong className="text-white text-lg font-black">{operationsData?.complaints?.total || 0}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200">
                  <span className="text-[10px] block">Pending / Investigating</span>
                  <strong className="text-amber-400 text-lg font-black">
                    {(operationsData?.complaints?.pending || 0) + (operationsData?.complaints?.investigating || 0)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Resolved</span>
                  <strong className="text-emerald-400 text-lg font-black">{operationsData?.complaints?.resolved || 0}</strong>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-900 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Recent Grievances:</span>
                {(operationsData?.complaints?.recent || []).slice(0, 3).map((comp) => (
                  <div key={comp.complaint_no} className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-white font-bold">{comp.complainant_name}</strong>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        comp.status === 'Resolved' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{comp.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* System Governance & Audit Trail Log */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Administrative Activity Audit Log (Governance & Fraud Prevention)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Immutable Log Trail</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {(operationsData?.audit_trail || []).map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-400">
                        {log.action}
                      </span>
                      <strong className="text-white font-bold">{log.entity}</strong>
                      <span className="text-slate-400 text-[11px]">by {log.user_id || 'System'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* PRINT-ONLY BOARD OF GOVERNORS EXECUTIVE MEMORANDUM */}
      <div className={`hidden print:block fixed inset-0 bg-white text-black p-8 font-serif z-[999999] overflow-visible`}>
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase tracking-widest">EAGLE POWER SCHOOLS & COLLEGES</h1>
          <p className="text-xs italic">Citadel of Academic & Moral Excellence &bull; 2 & 9 Amikwo Road, Awka, Anambra State</p>
          <h2 className="text-base font-bold uppercase mt-2 underline">EXECUTIVE HEAD OF SCHOOL BOARD BRIEFING</h2>
          <p className="text-xs">Academic Session: {selectedSession} | Evaluation: {selectedTerm} | Date: {reportDate}</p>
        </div>

        {/* Top-Line Executive Summary */}
        <div className="grid grid-cols-4 gap-4 border border-black p-3 mb-6 text-xs text-center">
          <div>
            <strong>TOTAL ENROLLMENT</strong>
            <div className="text-lg font-bold">{enrollment.total || 96} Pupils</div>
            <div>{enrollment.male || 52} Boys | {enrollment.female || 44} Girls</div>
          </div>
          <div>
            <strong>ACADEMIC GPA</strong>
            <div className="text-lg font-bold">{academic.school_average || 68.2}%</div>
            <div>Pass Rate: {academic.pass_rate || 85}%</div>
          </div>
          <div>
            <strong>TUITION RECOVERY</strong>
            <div className="text-lg font-bold">{financial.collection_rate || 63}%</div>
            <div>₦{(financial.total_collected || 850000).toLocaleString()} Collected</div>
          </div>
          <div>
            <strong>OUTSTANDING DEBT</strong>
            <div className="text-lg font-bold text-red-700">₦{(financial.outstanding_debt || 500000).toLocaleString()}</div>
            <div>Pending Clearance</div>
          </div>
        </div>

        {/* Academic Ranking Overview */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase border-b border-black mb-2">Class Academic Performance Summary</h3>
          <table className="w-full text-xs text-left border-collapse border border-black">
            <thead>
              <tr className="border-b border-black bg-gray-100">
                <th className="p-1 border border-black">Class</th>
                <th className="p-1 border border-black">Division</th>
                <th className="p-1 border border-black">Pupils</th>
                <th className="p-1 border border-black">Avg Score</th>
                <th className="p-1 border border-black">Pass Rate</th>
                <th className="p-1 border border-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {(academicData?.classes || []).map((c) => (
                <tr key={c.class_id} className="border-b border-black">
                  <td className="p-1 border border-black font-bold">{c.class_name}</td>
                  <td className="p-1 border border-black">{c.division}</td>
                  <td className="p-1 border border-black">{c.enrolled_students}</td>
                  <td className="p-1 border border-black">{c.average_score}%</td>
                  <td className="p-1 border border-black">{c.pass_rate}%</td>
                  <td className="p-1 border border-black font-bold">{c.health_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Executive Sign-off */}
        <div className="pt-8 border-t border-black flex justify-between text-xs mt-12">
          <div>
            <p>Prepared By: <strong>Executive Reporting Intelligence Engine</strong></p>
            <p>Eagle Power EduCore Management System</p>
          </div>
          <div className="text-right">
            <p>_______________________________________</p>
            <p><strong>Head of School / Director of Academics</strong></p>
            <p>Eagle Power Schools, Awka</p>
          </div>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Share2, 
  ChevronLeft, 
  Loader2,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { EliteModernTemplate } from './EliteModernTemplate';
import { CherithClassicTemplate } from './CherithClassicTemplate';
import { AlQalamClassicTemplate } from './AlQalamClassicTemplate';
import { ClassicProfessionalTemplate } from './ClassicProfessionalTemplate';
import { PrimarySchoolTemplate } from './PrimarySchoolTemplate';
import { NurseryColorfulTemplate } from './NurseryColorfulTemplate';
import ShareReportModal from './ShareReportModal';
import { getApiBase } from '../../config/api';

export default function BroadsheetView({ token: propToken, _token, userRole = 'admin', _userRole }) {
  const authToken = propToken || _token || (typeof window !== 'undefined' ? (localStorage.getItem('eagle_token') || localStorage.getItem('token') || '') : '');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [selectedTerm, setSelectedTerm] = useState('Second Term');
  const [selectedTemplate, setSelectedTemplate] = useState('ELITE');

  // Broadsheet data
  const [broadsheet, setBroadsheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [performanceFilter, setPerformanceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);

  // Single & Bulk Print Modes
  const [singleStudent, setSingleStudent] = useState(null);
  const [bulkPrintMode, setBulkPrintMode] = useState(false);
  const [bulkReports, setBulkReports] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingStudent, setSharingStudent] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');

  // Load available classes
  useEffect(() => {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    fetch(`${getApiBase()}/academics/classes`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setClasses(data.data);
          setSelectedClassId(data.data[0].id.toString());
        }
      })
      .catch(_err => console.error('Failed to load classes:', _err));
  }, [authToken]);

  // Fetch broadsheet when class, session or term changes
  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    setError('');
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    fetch(`${getApiBase()}/exams/class-broadsheet?class_id=${selectedClassId}&session=${encodeURIComponent(selectedSession)}&term=${encodeURIComponent(selectedTerm)}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBroadsheet(data);
        } else {
          setError(data.message || 'Failed to load broadsheet data.');
        }
      })
      .catch(() => {
        setError('Network error loading broadsheet.');
      })
      .finally(() => setLoading(false));
  }, [selectedClassId, selectedSession, selectedTerm, authToken]);

  // Auto-switch template if class is Nursery or Primary
  useEffect(() => {
    if (!broadsheet?.class_info) return;
    const name = (broadsheet.class_info.name || '').toLowerCase();
    if (name.includes('nursery') || name.includes('reception') || name.includes('creche')) {
      setSelectedTemplate('NURSERY');
    } else if (name.includes('primary') || name.includes('basic')) {
      setSelectedTemplate('PRIMARY');
    } else {
      setSelectedTemplate('ELITE');
    }
  }, [broadsheet?.class_info]);

  // Filtered & Sorted student rows
  const filteredStudents = useMemo(() => {
    if (!broadsheet?.students) return [];
    let list = [...broadsheet.students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q));
    }

    if (genderFilter !== 'ALL') {
      list = list.filter(s => s.gender === genderFilter);
    }

    if (performanceFilter === 'EXCELLENT') {
      list = list.filter(s => s.average >= 75);
    } else if (performanceFilter === 'AT_RISK') {
      list = list.filter(s => s.average > 0 && s.average < 50);
    }

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (broadsheet.subjects.includes(sortBy)) {
        valA = a.subject_totals[sortBy] || 0;
        valB = b.subject_totals[sortBy] || 0;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      }
    });

    return list;
  }, [broadsheet, searchQuery, genderFilter, performanceFilter, sortBy, sortAsc]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!broadsheet || filteredStudents.length === 0) return;

    const headers = ["Rank", "Student Name", "Admission No", "Gender", ...broadsheet.subjects, "Total Score", "Average (%)", "WAEC Grade"];
    const rows = filteredStudents.map(s => [
      s.rank,
      `"${s.name.replace(/"/g, '""')}"`,
      s.admission_no,
      s.gender,
      ...broadsheet.subjects.map(sub => s.subject_totals[sub] !== undefined ? s.subject_totals[sub] : ""),
      s.total_score,
      s.average,
      s.grade
    ]);

    const subAverages = [
      "Subject Averages", "", "", "",
      ...broadsheet.subjects.map(sub => broadsheet.statistics?.subject_averages[sub]?.average || 0),
      "", "", ""
    ];

    const csvContent = [headers.join(","), ...rows.map(r => r.join(",")), subAverages.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Broadsheet_${broadsheet.class_info.name}_${selectedTerm.replace(/\s+/g, '_')}_${selectedSession.replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View Single Student Report Card
  const handleViewStudentReport = async (admissionNo) => {
    setLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${getApiBase()}/exams/report-card/${encodeURIComponent(admissionNo)}?session=${encodeURIComponent(selectedSession)}&term=${encodeURIComponent(selectedTerm)}`, { headers });
      const data = await res.json();
      if (data.success) {
        setSingleStudent(data.standard_report);
      } else {
        alert(data.message || 'Report card not found.');
      }
    } catch {
      alert('Error fetching student report card.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Bulk Print Mode
  const handleBulkPrint = async () => {
    if (!selectedClassId) return;
    setBulkLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${getApiBase()}/exams/class-reports/${selectedClassId}?session=${encodeURIComponent(selectedSession)}&term=${encodeURIComponent(selectedTerm)}`, { headers });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setBulkReports(data.data);
        setBulkPrintMode(true);
      } else {
        alert(data.message || 'No reports found for this class.');
      }
    } catch {
      alert('Error loading bulk class reports.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Batch Generate AI Remarks for Class
  const handleBatchGenerateAiRemarks = async (overwrite = false) => {
    if (!selectedClassId) return;
    if (overwrite && !window.confirm('Are you sure you want to overwrite existing teacher and principal remarks for all students in this class?')) {
      return;
    }
    setAiGenerating(true);
    setAiSuccessMessage('');
    try {
      const res = await fetch(`${getApiBase()}/exams/batch-generate-ai-comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          class_id: selectedClassId,
          session: selectedSession,
          term: selectedTerm,
          overwrite
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiSuccessMessage(`✨ Success! Generated remarks for ${data.generated_count} students (${data.skipped_count} skipped/already had remarks).`);
        setTimeout(() => setAiSuccessMessage(''), 7000);
      } else {
        alert(data.message || 'Failed to auto-generate remarks.');
      }
    } catch (err) {
      console.error('Batch AI comments error:', err);
      alert('Network error while generating AI comments.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Template renderer helper
  const renderTemplateComponent = (data) => {
    switch (selectedTemplate) {
      case 'CHERITH':
        return <CherithClassicTemplate data={data} />;
      case 'ALQALAM':
        return <AlQalamClassicTemplate data={data} />;
      case 'PRIMARY':
        return <PrimarySchoolTemplate data={data} />;
      case 'NURSERY':
        return <NurseryColorfulTemplate data={data} />;
      case 'CLASSIC':
        return <ClassicProfessionalTemplate data={data} />;
      default:
        return <EliteModernTemplate data={data} />;
    }
  };

  // -------------------------------------------------------------
  // RENDER: SINGLE STUDENT PRINT / PREVIEW PAGE
  // -------------------------------------------------------------
  if (singleStudent) {
    return (
      <div className="min-h-screen bg-slate-100 p-0 m-0">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .single-print-page { padding: 0 !important; margin: 0 !important; background: white !important; }
          }
        `}</style>

        {/* Top Control Bar */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between shadow-sm no-print z-50">
          <button 
            onClick={() => setSingleStudent(null)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Broadsheet Matrix
          </button>

          <div className="flex items-center gap-4">
            {/* Template Switcher */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <span className="text-slate-400">Design Layout:</span>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent font-black text-indigo-700 cursor-pointer outline-none"
              >
                <option value="ELITE">Elite Modern (Glassmorphic)</option>
                <option value="CHERITH">Legacy Standard (Cherith)</option>
                <option value="ALQALAM">Heritage Classic (Al Qalam)</option>
                <option value="PRIMARY">Primary School Theme</option>
                <option value="NURSERY">Nursery Colorful</option>
                <option value="CLASSIC">Classic Professional</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setSharingStudent(singleStudent.student.name);
                setShareModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>

            <button 
              onClick={() => window.print()}
              className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-300" /> Save as PDF / Print
            </button>
          </div>
        </div>

        {/* Render Card Container */}
        <div className="p-8 flex justify-center bg-slate-100 print:bg-white single-print-page">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none p-2">
            {renderTemplateComponent(singleStudent)}
          </div>
        </div>

        <ShareReportModal 
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          studentName={sharingStudent}
          reportLink={window.location.origin + `/portal?adm=${encodeURIComponent(singleStudent.student.admissionNo)}`}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: BULK CLASS PRINT PAGE
  // -------------------------------------------------------------
  if (bulkPrintMode && bulkReports.length > 0) {
    return (
      <div className="min-h-screen bg-slate-100 p-0 m-0">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .bulk-print-page { padding: 0 !important; margin: 0 !important; background: white !important; }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
          }
        `}</style>

        {/* Top Control Bar */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between shadow-sm no-print z-50">
          <button 
            onClick={() => setBulkPrintMode(false)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Broadsheet
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <span className="text-slate-400">Design Layout:</span>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent font-black text-indigo-700 cursor-pointer outline-none"
              >
                <option value="ELITE">Elite Modern (Glassmorphic)</option>
                <option value="CHERITH">Legacy Standard (Cherith)</option>
                <option value="ALQALAM">Heritage Classic (Al Qalam)</option>
                <option value="PRIMARY">Primary School Theme</option>
                <option value="NURSERY">Nursery Colorful</option>
                <option value="CLASSIC">Classic Professional</option>
              </select>
            </div>

            <span className="text-xs font-black text-slate-700">Total Cards: {bulkReports.length}</span>

            <button 
              onClick={() => window.print()}
              className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-300" /> Print Whole Class ({bulkReports.length} Cards)
            </button>
          </div>
        </div>

        {/* Render Cards with Page Breaks */}
        <div className="p-8 space-y-8 flex flex-col items-center bulk-print-page">
          {bulkReports.map((data, idx) => (
            <div key={idx} className="page-break bg-white shadow-xl print:shadow-none rounded-2xl overflow-hidden p-2">
              {renderTemplateComponent(data)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN BROADSHEET MATRIX VIEW
  // -------------------------------------------------------------
  const stats = broadsheet?.statistics;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-900 font-black text-xl">
              <FileSpreadsheet className="w-6 h-6 text-amber-500" />
              <span>Master Broadsheet & Report Sheet Generator</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Continuous Assessment (CA 30) + Examination (70) Master Matrix with WAEC Ranking & PDF Export
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Class Level</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.division})</option>
                ))}
              </select>
            </div>

            {/* Session Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>

            {/* Term Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            {/* Template Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Template Style</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-indigo-50 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-xl text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="ELITE">Elite Modern (Glass)</option>
                <option value="CHERITH">Cherith Legacy Standard</option>
                <option value="ALQALAM">Al Qalam Heritage</option>
                <option value="PRIMARY">Primary School Theme</option>
                <option value="NURSERY">Nursery Colorful</option>
                <option value="CLASSIC">Classic Professional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={!broadsheet || filteredStudents.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV Broadsheet
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-slate-600" /> Print Table
            </button>

            <button
              onClick={() => handleBatchGenerateAiRemarks(false)}
              disabled={aiGenerating || !broadsheet || filteredStudents.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
              title="Auto-generate pedagogical teacher remarks, principal endorsements, and promotion recommendations based on exam performance, positions, and attendance."
            >
              {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>{aiGenerating ? 'AI Generating Remarks...' : '✨ Auto-Generate AI Remarks'}</span>
            </button>
          </div>

          <button
            onClick={handleBulkPrint}
            disabled={bulkLoading || !broadsheet || filteredStudents.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-[#0D2342] to-indigo-900 hover:from-black hover:to-indigo-950 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-md"
          >
            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4 text-amber-300" />}
            <span>Bulk Print All Class Reports ({filteredStudents.length} Students)</span>
          </button>
        </div>

        {aiSuccessMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
            <span>{aiSuccessMessage}</span>
            <button 
              onClick={() => setAiSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-900 font-black text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Class Enrolled</span>
            <div className="text-xl font-black text-slate-800 mt-1">{stats.total_enrolled} Pupils</div>
            <span className="text-[10px] text-indigo-600 font-bold">{stats.graded_count} Graded</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Class Average</span>
            <div className="text-xl font-black text-amber-600 mt-1">{stats.class_average}%</div>
            <span className="text-[10px] text-slate-400">WAEC Benchmark</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Top Performer</span>
            <div className="text-base font-black text-emerald-700 truncate mt-1">{stats.top_student_name}</div>
            <span className="text-[10px] text-emerald-600 font-bold">{stats.highest_average}% (1st)</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Distinction (&gt;= 75%)</span>
            <div className="text-xl font-black text-indigo-700 mt-1">{stats.distinction_count}</div>
            <span className="text-[10px] text-emerald-600 font-bold">Grade A1 Pupils</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block">At Risk (&lt; 50%)</span>
            <div className={`text-xl font-black mt-1 ${stats.at_risk_count > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {stats.at_risk_count}
            </div>
            <span className="text-[10px] text-slate-400">Needs Remedial</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student by name or admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="ALL">All Genders</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>Filter:</span>
            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="ALL">All Pupils</option>
              <option value="EXCELLENT">Distinction (&ge; 75%)</option>
              <option value="AT_RISK">At Risk (&lt; 50%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Broadsheet Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-bold">Compiling Master Broadsheet...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 font-bold text-xs">{error}</div>
        ) : !broadsheet || filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-bold">
            No students found in this class for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D2342] text-white text-[10px] font-black uppercase tracking-wider select-none">
                  <th onClick={() => handleSort('rank')} className="px-3 py-3 text-center w-12 cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="inline-flex items-center gap-1">Rank <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></span>
                  </th>
                  <th onClick={() => handleSort('name')} className="px-4 py-3 min-w-[180px] cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="inline-flex items-center gap-1">Student Name <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></span>
                  </th>
                  <th onClick={() => handleSort('admission_no')} className="px-3 py-3 w-28 cursor-pointer hover:bg-slate-800 transition-colors">Adm No</th>
                  <th className="px-2 py-3 text-center w-10">Sex</th>
                  {broadsheet.subjects.map(sub => (
                    <th key={sub} onClick={() => handleSort(sub)} className="px-2 py-3 text-center min-w-[70px] truncate max-w-[90px] cursor-pointer hover:bg-slate-800 transition-colors" title={sub}>
                      {sub.length > 8 ? sub.substring(0, 7) + '..' : sub}
                    </th>
                  ))}
                  <th onClick={() => handleSort('total')} className="px-3 py-3 text-center bg-indigo-950 min-w-[65px] cursor-pointer hover:bg-indigo-900 transition-colors">Total</th>
                  <th onClick={() => handleSort('average')} className="px-3 py-3 text-center bg-indigo-900 min-w-[65px] cursor-pointer hover:bg-indigo-800 transition-colors">Avg (%)</th>
                  <th className="px-2 py-3 text-center min-w-[50px]">Grade</th>
                  <th className="px-4 py-3 text-center min-w-[130px] no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.student_id} className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-3 py-2.5 text-center font-black">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        s.rank === 1 ? 'bg-amber-100 text-amber-800' :
                        s.rank === 2 ? 'bg-slate-200 text-slate-700' :
                        s.rank === 3 ? 'bg-amber-50 text-amber-900' : 'text-slate-500'
                      }`}>
                        {s.position}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 truncate max-w-[200px]">{s.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{s.admission_no}</td>
                    <td className="px-2 py-2.5 text-center font-bold text-slate-600">{s.gender}</td>
                    {broadsheet.subjects.map(sub => {
                      const score = s.subject_totals[sub];
                      return (
                        <td key={sub} className="px-2 py-2.5 text-center font-bold">
                          {score !== undefined ? (
                            <span className={score >= 75 ? 'text-emerald-600 font-black' : score < 50 ? 'text-red-500' : 'text-slate-700'}>
                              {score}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center font-black text-indigo-900 bg-indigo-50/30">{s.total_score}</td>
                    <td className="px-3 py-2.5 text-center font-black text-amber-600 bg-amber-50/20">{s.average}%</td>
                    <td className="px-2 py-2.5 text-center font-black">
                      <span className={`text-xs ${s.grade === 'A1' ? 'text-emerald-600' : s.grade === 'F9' ? 'text-red-500' : 'text-blue-700'}`}>
                        {s.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center no-print">
                      <button
                        onClick={() => handleViewStudentReport(s.admission_no)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors"
                      >
                        Report Card
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Subject Averages Footer Row */}
                <tr className="bg-slate-100 font-black text-[11px] text-slate-800 border-t-2 border-slate-300">
                  <td colSpan={4} className="px-4 py-3 uppercase text-right">Class Subject Averages:</td>
                  {broadsheet.subjects.map(sub => (
                    <td key={sub} className="px-2 py-3 text-center text-indigo-900 font-black">
                      {stats?.subject_averages[sub]?.average || '-'}
                    </td>
                  ))}
                  <td colSpan={4} className="px-4 py-3 text-center text-amber-700 font-black">
                    Class Avg: {stats?.class_average}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Distribution Breakdown Bar */}
      {stats?.grade_distribution && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 mb-3">
            WAEC Grade Distribution Breakdown ({broadsheet?.class_info?.name})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 text-center text-xs">
            {Object.entries(stats.grade_distribution).map(([grd, count]) => (
              <div key={grd} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className={`font-black text-sm block ${grd === 'A1' ? 'text-emerald-600' : grd === 'F9' ? 'text-red-500' : 'text-indigo-700'}`}>
                  {grd}
                </span>
                <span className="text-[11px] font-extrabold text-slate-800 block mt-0.5">{count} Pupils</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

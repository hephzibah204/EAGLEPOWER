import React, { useState } from 'react';
import { EliteModernTemplate } from './EliteModernTemplate';
import { CherithClassicTemplate } from './CherithClassicTemplate';
import { AlQalamClassicTemplate } from './AlQalamClassicTemplate';
import { ClassicProfessionalTemplate } from './ClassicProfessionalTemplate';
import { PrimarySchoolTemplate } from './PrimarySchoolTemplate';
import { NurseryColorfulTemplate } from './NurseryColorfulTemplate';
import { Layout, CheckCircle, Sparkles, Check, RefreshCw } from 'lucide-react';
import { getApiBase } from '../../config/api';

const sampleData = {
  school: {
    name: "Eagle Power Schools",
    motto: "Love, Truth & Service",
    principal: "Dr. (Mrs) N. Okoye",
    address: "2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State",
    session: "2024/2025",
    term: "Second Term",
    contact: "+234 803 542 8910",
    email: "info@eaglepowerschools.sch.ng",
    logoUrl: "/assets/official-logo.jpg"
  },
  student: {
    name: "Chukwuemeka Nwuzor",
    admissionNo: "ESE2009012",
    className: "JSS 1 Gold",
    gender: "Male",
    position: "1st",
    classSize: 32
  },
  scores: {
    "Mathematics": { ca1: 14, ca2: 14, exam: 62, total: 90, grade: 'A1', remark: 'Distinction / Excellent' },
    "English Language": { ca1: 13, ca2: 13, exam: 58, total: 84, grade: 'A1', remark: 'Distinction / Excellent' },
    "Basic Science & Technology": { ca1: 12, ca2: 13, exam: 55, total: 80, grade: 'A1', remark: 'Distinction / Excellent' },
    "Civic Education": { ca1: 14, ca2: 12, exam: 50, total: 76, grade: 'A1', remark: 'Distinction / Excellent' },
    "Social Studies": { ca1: 12, ca2: 13, exam: 48, total: 73, grade: 'B2', remark: 'Very Good' },
    "Christian Religious Studies": { ca1: 14, ca2: 13, exam: 58, total: 85, grade: 'A1', remark: 'Distinction / Excellent' },
    "Igbo Language & Culture": { ca1: 13, ca2: 12, exam: 63, total: 88, grade: 'A1', remark: 'Distinction / Excellent' },
    "Agricultural Science": { ca1: 12, ca2: 12, exam: 51, total: 75, grade: 'A1', remark: 'Distinction / Excellent' }
  },
  extras: {
    attendance: { opened: 120, present: 118, absent: 2 },
    traits: {
      punctuality: 5,
      neatness: 5,
      politeness: 5,
      honesty: 5,
      relationship: 5,
      attentiveness: 5,
      selfControl: 5
    },
    psychomotor: {
      handwriting: 5,
      fluency: 5,
      sports: 4,
      drawing: 4,
      tools: 4,
      club: 5
    },
    comments: {
      teacher: "An exceptionally bright and diligent student. His performance in Mathematics and Basic Science is particularly sterling.",
      principal: "Keep up the excellent academic pace. You are a role model and credit to Eagle Power Schools."
    },
    promotion: "PROMOTED TO NEXT CLASS",
    nextTermBegins: "Monday, 28th April, 2025"
  },
  grades: [
    { grade: 'A1', min: 75, max: 100, remark: 'Distinction' },
    { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
    { grade: 'B3', min: 65, max: 69, remark: 'Good' },
    { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
    { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
    { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
    { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
    { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
    { grade: 'F9', min: 0, max: 39, remark: 'Fail' }
  ]
};

const templates = [
  { id: 'ELITE', name: 'Elite Modern', desc: 'Glassmorphic card design with modern typography & clean metrics' },
  { id: 'CHERITH', name: 'Legacy Standard (Cherith)', desc: 'Full traditional Nigerian broadsheet with Cognitive, Affective & Psychomotor domains' },
  { id: 'ALQALAM', name: 'Heritage Classic (Al Qalam)', desc: 'Dual-domain character, moral conduct and WAEC academic mastery layout' },
  { id: 'PRIMARY', name: 'Primary School Theme', desc: 'Vibrant sky-blue themed report card designed for Primary 1 – 6 pupils' },
  { id: 'NURSERY', name: 'Nursery Colorful', desc: 'Playful early childhood developmental milestones for Creche & Nursery' },
  { id: 'CLASSIC', name: 'Classic Professional', desc: 'Double-bordered formal serif monochrome print template' }
];

export const TemplateGallery = ({ selectedTemplate = 'ELITE', onSelectTemplate, previewData, authToken, apiBase }) => {
  const [activeTab, setActiveTab] = useState(selectedTemplate);
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState(null);
  const data = previewData || sampleData;
  const API_BASE = apiBase || getApiBase();

  const handleSelect = (id) => {
    setActiveTab(id);
    if (onSelectTemplate) onSelectTemplate(id);
  };

  const handleActivateSchoolWide = async () => {
    setIsActivating(true);
    setActivationStatus(null);
    try {
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('eagle_token') : null);
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/reports/template`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          template: activeTab,
          session: '2024/2025',
          term: 'Second Term'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const tplName = templates.find(t => t.id === activeTab)?.name || activeTab;
        setActivationStatus({ type: 'success', message: `Template "${tplName}" successfully activated school-wide for 2024/2025 Second Term!` });
      } else {
        setActivationStatus({ type: 'error', message: result.message || 'Failed to activate template.' });
      }
    } catch (err) {
      setActivationStatus({ type: 'error', message: 'Network error activating template: ' + err.message });
    } finally {
      setIsActivating(false);
    }
  };

  const renderActiveTemplate = () => {
    switch (activeTab) {
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

  return (
    <div className="space-y-6">
      {/* Selector Tabs */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-700" />
            <div>
              <h3 className="font-black text-slate-800 text-sm">Choose Report Sheet Template Layout</h3>
              <p className="text-[11px] text-slate-500">6 authentic Nigerian layouts with custom WAEC grading and domains</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleActivateSchoolWide}
              disabled={isActivating}
              className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {isActivating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Activate School-Wide</span>
            </button>
          </div>
        </div>

        {activationStatus && (
          <div className={`mb-3 p-3 rounded-2xl text-xs flex items-center gap-2 ${
            activationStatus.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {activationStatus.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <span className="font-bold shrink-0">!</span>
            )}
            <span>{activationStatus.message}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {templates.map((tpl) => {
            const isSelected = activeTab === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => handleSelect(tpl.id)}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  isSelected
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-400/50'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black truncate">{tpl.name}</span>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />}
                </div>
                <p className={`text-[10px] leading-tight line-clamp-2 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {tpl.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Container */}
      <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 overflow-x-auto flex justify-center">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none">
          {renderActiveTemplate()}
        </div>
      </div>
    </div>
  );
};

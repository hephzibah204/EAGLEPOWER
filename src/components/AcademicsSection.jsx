import React, { useState } from 'react';
import { 
  GraduationCap, 
  Baby, 
  BookOpen, 
  BookMarked, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

export default function AcademicsSection({ onOpenAdmission }) {
  const [activeTab, setActiveTab] = useState('primary');

  const tabIcons = {
    'early-years': Baby,
    'primary': BookOpen,
    'secondary': GraduationCap
  };

  const selectedDivision = schoolInfo.divisions.find(d => d.id === activeTab) || schoolInfo.divisions[1];

  return (
    <section id="academics" className="py-20 lg:py-28 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
            <span>Academic Wings</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Curriculum Designed for Comprehensive Mastery
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            From the sensory discovery of preschool to competitive WAEC & NECO college distinctions, our academic continuum empowers every milestone of your child's growth.
          </p>
        </div>

        {/* Division Selection Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {schoolInfo.divisions.map((div) => {
            const Icon = tabIcons[div.id] || BookOpen;
            const isActive = activeTab === div.id;
            return (
              <button
                key={div.id}
                onClick={() => setActiveTab(div.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-amber-400 shadow-lg shadow-slate-900/20 scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{div.name}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {div.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Division Feature Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left: Division Detail & Curriculum */}
          <div className="lg:col-span-7 p-8 sm:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/10 text-amber-700 border border-amber-300/40 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedDivision.ages}
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Full-Day Mon-Fri</span>
              </span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {selectedDivision.name}
              </h3>
              <p className="text-slate-600 text-base mt-2 leading-relaxed">
                {selectedDivision.description}
              </p>
            </div>

            {/* Core Curriculum Highlights */}
            <div className="pt-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-600" />
                <span>Curriculum Highlights & Core Subjects</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedDivision.curriculum.map((subj, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm font-semibold text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{subj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unique Pedagogy Note */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs sm:text-sm text-slate-700">
              <span className="font-bold text-amber-900">Pedagogical Distinction: </span>
              {selectedDivision.highlights}
            </div>

            {/* Division Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onOpenAdmission(selectedDivision.id)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-slate-950 text-amber-400 hover:bg-slate-900 shadow-md transition-all"
              >
                <span>Enroll in {selectedDivision.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <a
                href="#tuition"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>View Termly Fees</span>
              </a>
            </div>

          </div>

          {/* Right: Academic Enrichment & Co-Curricular Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 text-white p-8 sm:p-12 flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Eagle Enrichment Edge</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Beyond the Regular Syllabus
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We believe that education must ignite both mind and spirit. Every scholar at Eagle Power is exposed to vital co-curricular competencies:
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Nigeria Spelling Bee Drills</h5>
                    <p className="text-xs text-slate-400">Rigorous phonetic mastery, etymology, and public speaking.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    B
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">ICT & Coding Academy</h5>
                    <p className="text-xs text-slate-400">Block coding for primary pupils, Python & Web Basics for college students.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    C
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">WAEC & JAMB Diagnostic Clinics</h5>
                    <p className="text-xs text-slate-400">Continuous mock assessments, CBT practice, and revision masterclasses.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
              <span className="font-bold text-amber-400">Session 2026/2027: </span>
              Registration for placement examinations is currently ongoing every Saturday at the Amikwo campus.
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

import React from 'react';
import { 
  ArrowRight, 
  GraduationCap, 
  Award,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function Hero({ onOpenAdmission }) {
  return (
    <section id="home" className="relative bg-[#092347] bg-navy text-slate-100 pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main 12-Column Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Prestigious Statement, Credibility & Dual Gateways */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Accreditation Line */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-400/30 text-amber-300 rounded text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Government Approved: Awka South, Anambra State</span>
            </div>

            {/* Headline in Roman Serif (Libre Caslon Display) */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.08]">
              Where Dedicated Scholars Learn to Soar.
            </h1>

            {/* Concise Mission Sentence */}
            <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed font-sans">
              Welcome to Eagle Power Schools, Awka, nurturing dedicated scholars in character and modern inquiry.
            </p>

            {/* Dual Core Actions: Admission & Portal */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenAdmission}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 bg-gold hover:bg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all whitespace-nowrap shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                <span className="whitespace-nowrap">Apply for Admission</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="/portal/overview"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 active:bg-white/20 rounded border border-white/25 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span className="whitespace-nowrap">Access Web Portal</span>
              </a>
            </div>

            {/* Verified Achievements & Distinctions Banner */}
            <div className="pt-4 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>2026 National Spelling Bee 2nd Runner-up</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>State Spelling Champions, 14 Feb 2026</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Children’s Day March-Past 1st Place</span>
              </div>
            </div>

          </div>

          {/* Right Column: Authentic Photography & School Spotlight */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Real Photography Card */}
            <div className="bg-[#0e2a54] bg-navy-surface border border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-2xl">
              
              {/* Header with Crest */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/official-logo.jpg"
                    alt="Official Eagle Power Logo"
                    className="w-11 h-11 rounded border border-amber-400/60 bg-white p-0.5"
                  />
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight font-sans">
                      Eagle Power Schools
                    </h2>
                    <p className="text-xs text-amber-400">Love, Truth &amp; Service, Awka</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 rounded">
                  2026/2027 Term 1
                </span>
              </div>

              {/* Real Champion Photography */}
              <figure className="mt-4 border border-slate-700 overflow-hidden rounded bg-slate-950">
                <img 
                  src="/assets/school-updates/state-spelling-bee-2026.jpeg" 
                  alt="Eagle Power scholars with championship trophy at 2026 Anambra State competition" 
                  width="800" 
                  height="600" 
                  className="w-full aspect-[4/3] object-cover" 
                  fetchPriority="high"
                />
                <figcaption className="p-3 bg-[#051429] bg-navy-dark border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span>Anambra State Champions and National Finalists</span>
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                </figcaption>
              </figure>

              {/* Programs Hierarchy */}
              <div className="mt-4 pt-3 border-t border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 text-slate-200">
                  <span className="font-medium">Early Years &amp; Nursery</span>
                  <span className="text-amber-300 text-[11px]">Creche, Nursery 1 to 3</span>
                </div>
                <div className="flex items-center justify-between py-1 text-slate-200 border-t border-slate-800">
                  <span className="font-medium">School of Excellence (Primary)</span>
                  <span className="text-amber-300 text-[11px]">Basic 1 to 6</span>
                </div>
                <div className="flex items-center justify-between py-1 text-slate-200 border-t border-slate-800">
                  <span className="font-medium">College of Excellence (Secondary)</span>
                  <span className="text-amber-300 text-[11px]">JSS 1 to 3 and SSS 1 to 3</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Real Numbers Bar (Floor Rule 8: Strictly genuine real numbers) */}
        <div className="mt-12 pt-8 border-t border-slate-700/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div>
            <div className="font-mono text-3xl font-normal text-amber-400">99</div>
            <div className="text-sm font-semibold text-white mt-1">Enrolled Scholars</div>
            <div className="text-xs text-slate-300">Active pupil population</div>
          </div>
          <div>
            <div className="font-mono text-3xl font-normal text-amber-400">30</div>
            <div className="text-sm font-semibold text-white mt-1">Academic Faculty</div>
            <div className="text-xs text-slate-300">Educators and Directorate</div>
          </div>
          <div>
            <div className="font-mono text-3xl font-normal text-amber-400">18</div>
            <div className="text-sm font-semibold text-white mt-1">Class Divisions</div>
            <div className="text-xs text-slate-300">Creche through SSS 3</div>
          </div>
          <div>
            <div className="font-mono text-3xl font-normal text-amber-400">100%</div>
            <div className="text-sm font-semibold text-white mt-1">Accredited Delivery</div>
            <div className="text-xs text-slate-300">WAEC, NECO and BECE</div>
          </div>
        </div>

      </div>
    </section>
  );
}

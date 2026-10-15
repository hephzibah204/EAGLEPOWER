import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Compass,
  Star
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

export default function Hero({ onOpenAdmission }) {
  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background Decorative Glow & Grid */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline and CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-blue-500/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Government Approved &bull; Awka South, Anambra State</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Nurturing <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">Eagles</span> Destined to Soar in Knowledge & Moral Excellence.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Welcome to <span className="text-white font-semibold">Eagle Power Schools</span> — home to <em>Eagle Power School of Excellence</em> and <em>Eagle Power College of Excellence</em> in Awka. We blend academic rigor, moral character, and 21st-century STEM education to unlock every child's full potential.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenAdmission}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 transition-all transform hover:-translate-y-0.5"
              >
                <span>Enroll for 2026/2027 Session</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => scrollTo('#academics')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl backdrop-blur-sm transition-all"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Explore Academic Wings</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>100% WAEC/NECO Distinction Record</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Anambra State Spelling Bee Champions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Modern STEM & Computer Labs</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Showcase & Spotlight Card */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Main Showcase Card */}
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-blue-950/90 border border-slate-700/80 p-6 sm:p-7 shadow-2xl backdrop-blur-md overflow-hidden">
              
              {/* Crest Badge Floating */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/official-logo.jpg"
                    alt="Official Eagle Power Logo"
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-400 bg-white p-0.5 shadow-md"
                  />
                  <div>
                    <h2 className="text-white font-extrabold text-base sm:text-lg leading-tight">Eagle Power Schools</h2>
                    <p className="text-xs text-amber-400 font-semibold">Love, Truth &amp; Service &bull; Awka</p>
                  </div>
                </div>
                <div className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  State Champions
                </div>
              </div>

              {/* Champion Spotlight & Real Photo Ribbon */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-blue-500/15 border border-amber-400/30 flex items-center gap-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-amber-400/50">
                  <img
                    src="/assets/spelling-champion.png"
                    alt="Nigeria Spelling Bee Champion from Eagle Power College"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                    Nigeria Spelling Bee Distinction
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    Best Senior Speller (Anambra State)
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Produced by Eagle Power College of Excellence, qualifying for National Finals!
                  </p>
                </div>
              </div>

              {/* Programs preview */}
              <div className="space-y-2.5 pb-5 border-b border-slate-700/60">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-400/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Eagle Power Early Years &amp; Nursery</h4>
                    <p className="text-[11px] text-slate-300">Montessori sensory play, phonics mastery, and warm nurturing care.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-400/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Eagle Power School of Excellence (Primary)</h4>
                    <p className="text-[11px] text-slate-300">Foundational mathematics, English diction, STEM basics &amp; coding.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-400/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Eagle Power College of Excellence (Secondary)</h4>
                    <p className="text-[11px] text-slate-300">JSS &amp; SSS specialized Science, Commercial &amp; Arts tracks.</p>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-2">
                <button
                  onClick={onOpenAdmission}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-amber-400/30 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Download Prospectus & Apply Today</span>
                </button>
              </div>

            </div>

            {/* Rating or Quick Testimonial Ribbon */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-white">100% Parent Satisfaction</span>
              <span className="text-slate-300">Amikwo, Awka</span>
            </div>

          </div>

        </div>

        {/* Floating Stat Counters Bar */}
        <div className="mt-14 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {schoolInfo.stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-amber-500/30 rounded-2xl p-5 text-left transition-all hover:bg-slate-900/80 group"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {stat.label}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

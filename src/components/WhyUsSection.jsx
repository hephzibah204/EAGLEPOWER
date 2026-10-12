import React from 'react';
import { 
  Trophy, 
  FlaskConical, 
  Building2, 
  HeartHandshake, 
  Bus, 
  Activity,
  Check,
  Sparkles
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

const iconMap = {
  Trophy: Trophy,
  FlaskConical: FlaskConical,
  Building2: Building2,
  HeartHandshake: HeartHandshake,
  Bus: Bus,
  Activity: Activity
};

export default function WhyUsSection() {
  return (
    <section id="why-us" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Why Eagle Power Schools</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Six Compelling Reasons Families in Awka Trust Us
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            We provide an environment where your child is not just another face in a crowded classroom, but a celebrated champion groomed to dominate any intellectual arena.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schoolInfo.features.map((feature, idx) => {
            const Icon = iconMap[feature.icon] || Trophy;
            return (
              <div 
                key={idx}
                className="group relative rounded-3xl p-8 bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 mb-6 shadow-sm">
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Pillar #{idx + 1}</span>
                  <span className="text-amber-600 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Verified Standard
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparative Banner: Traditional School vs Eagle Power */}
        <div className="mt-16 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-block bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                The Eagle Power Difference
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                How We Outpace Traditional Learning
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Experience an educational community engineered around individualized progress tracking and real-world mastery.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <span className="text-amber-400 font-bold block">15:1 Student-Teacher Ratio</span>
                <p className="text-slate-300">Ensures no student is left behind; daily individual feedback and tailored remedial coaching.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <span className="text-amber-400 font-bold block">Digital Parent Portal</span>
                <p className="text-slate-300">Instant smartphone access to weekly test results, attendance records, and termly reports.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <span className="text-amber-400 font-bold block">Uninterrupted Power & Solar</span>
                <p className="text-slate-300">Smart classrooms with dedicated solar energy guarantee continuous ICT lab sessions and cool spaces.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <span className="text-amber-400 font-bold block">Moral Formation & Discipline</span>
                <p className="text-slate-300">Zero tolerance for unruly behavior; active mentoring in etiquette, empathy, and integrity.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

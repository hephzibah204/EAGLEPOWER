import React from 'react';
import { Quote, Star, MessageSquare } from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
            <span>Community Voices</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Loved by Parents, Revered by Scholars
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Hear from families across Awka and Anambra State who have witnessed their children blossom under our tutelage.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {schoolInfo.testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-3xl p-8 bg-slate-50 border border-slate-200/80 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-amber-300/40 group-hover:text-amber-500/40 transition-colors" />
                </div>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200/60">
                <h4 className="font-bold text-slate-900 text-base">
                  {t.author}
                </h4>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  {t.role}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.location}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

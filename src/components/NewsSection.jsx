import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  ArrowUpRight, 
  X
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

export default function NewsSection() {
  const [activeArticle, setActiveArticle] = useState(null);

  return (
    <section id="news" className="py-20 lg:py-28 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl space-y-3 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-amber-700" />
              <span>Announcements & Trophies</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Latest News & Institutional Highlights
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Stay informed about academic milestones, upcoming entrance examination dates, and student triumphs across Anambra State.
            </p>
          </div>

          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>2026/2027 Academic Year</span>
            </div>
          </div>
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {schoolInfo.news.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveArticle(item)}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between cursor-pointer group text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.date}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug line-clamp-3">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-amber-600 transition-colors">
                <span>Read Full Story</span>
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Modal for full story */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative text-left">
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                  {activeArticle.category}
                </span>
                <span className="text-xs text-slate-400">{activeArticle.date}</span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-4 leading-snug">
                {activeArticle.title}
              </h3>

              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>{activeArticle.summary}</p>
                <p>
                  Eagle Power Schools continues to elevate benchmarks for academic rigor and moral uprightness in Awka South LGA. For further media or parental inquiries regarding this update, kindly connect with the administrative secretariat.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Eagle Power Media Desk</span>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

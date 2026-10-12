import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Phone, MessageCircle } from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section className="py-20 lg:py-28 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Everything you need to know about enrollment, school bus coverage, exams, and student welfare at Eagle Power Schools.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {schoolInfo.faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all text-left"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <span className="font-bold text-base sm:text-lg text-slate-900">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions card */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-amber-500/10 border border-amber-300/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Still have questions for our admissions team?</h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Our counselors are available Monday to Friday from 8:00 AM to 4:00 PM.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${schoolInfo.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call Us</span>
            </a>
            <a
              href="https://wa.me/2348035428910?text=Hello%20Eagle%20Power%20Schools,%20I%20would%20like%20to%20inquire%20about%20admissions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

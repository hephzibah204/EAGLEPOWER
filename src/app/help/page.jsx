'use client';

import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SystemHelpGuide from '../../components/SystemHelpGuide';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* Top Header / Nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <img
                src="/assets/official-logo.jpg"
                alt="Eagle Power Schools"
                className="w-9 h-9 rounded-full border-2 border-amber-400 object-cover shadow"
              />
              <div>
                <span className="font-black text-white text-sm tracking-wide group-hover:text-amber-400 transition-colors block">
                  Eagle Power Schools
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  EduCore Operations & Help Center
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <a
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold border border-slate-800 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </a>
            <a
              href="/portal/overview"
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow transition-all flex items-center gap-1.5"
            >
              <span>Launch Portal</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow py-8 px-4 sm:px-6">
        <SystemHelpGuide isStandalone={true} />
      </main>

      {/* Simplified Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-400">
            Eagle Power Schools &bull; 2 & 9 Amikwo Road, Awka, Anambra State, Nigeria
          </p>
          <p className="text-[11px]">
            Official EduCore ERP Documentation &bull; Nursery, Primary & College Excellence &bull; ICT Support: +234 907 558 0671
          </p>
        </div>
      </footer>
    </div>
  );
}

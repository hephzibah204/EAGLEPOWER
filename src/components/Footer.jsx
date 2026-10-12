import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';
import Logo from './Logo';
import { schoolInfo } from '../data/schoolData';

import { getApiBase } from '../config/api';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ onOpenAdmission, onOpenPortal }) {
  const [emailSub, setEmailSub] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!emailSub || submitting) return;
    setSubmitting(true);
    setSubError(null);

    try {
      const res = await fetch(`${getApiBase()}/frontdesk/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          phone: 'N/A (Web Subscription)',
          email: emailSub.trim(),
          class_interested: 'General / Newsletter',
          source: 'Website Newsletter Subscription',
          notes: `Parent subscribed to school updates: ${emailSub.trim()}`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Subscription failed. Please try again.');
      }

      setSubscribed(true);
      setEmailSub('');
      setTimeout(() => {
        setSubscribed(false);
      }, 5000);
    } catch (err) {
      setSubError(err.message || 'Network error subscribing.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-left">
      
      {/* Top Banner / Callout */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to Give Your Child the Eagle Advantage?
            </h3>
            <p className="text-slate-900 font-medium text-sm">
              Admissions for the 2026/2027 Academic Session are actively ongoing. Entrance screening held every Saturday.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenAdmission}
              className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-sm shadow-xl transition-all"
            >
              Apply Online Now
            </button>
            <a
              href={`tel:${schoolInfo.phone}`}
              className="px-5 py-3 rounded-xl bg-white/30 hover:bg-white/40 text-slate-950 font-bold text-sm transition-all"
            >
              Call Admissions Office
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Logo size="lg" light={true} />
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Eagle Power Schools (Eagle Power School of Excellence & Eagle Power College of Excellence) is a premier nursery, primary, and secondary institution in Awka, dedicated to raising global scholars with intellectual agility and high moral values.
            </p>

            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Approved by Anambra State Ministry of Education</span>
            </div>
          </div>

          {/* Academic Wings (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
              Academic Divisions
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#academics" onClick={() => scrollTo('#academics')} className="hover:text-amber-400 transition-colors block">
                  Early Years & Nursery (Ages 1.5 - 5)
                </a>
              </li>
              <li>
                <a href="#academics" onClick={() => scrollTo('#academics')} className="hover:text-amber-400 transition-colors block">
                  Eagle Power School of Excellence (Primary 1 - 6)
                </a>
              </li>
              <li>
                <a href="#academics" onClick={() => scrollTo('#academics')} className="hover:text-amber-400 transition-colors block">
                  Eagle Power College of Excellence (JSS 1 - 3)
                </a>
              </li>
              <li>
                <a href="#academics" onClick={() => scrollTo('#academics')} className="hover:text-amber-400 transition-colors block">
                  Senior College (SSS 1 - 3: Science/Arts/Commerce)
                </a>
              </li>
              <li>
                <a href="#academics" onClick={() => scrollTo('#academics')} className="hover:text-amber-400 transition-colors block">
                  Nigeria Spelling Bee Training Club
                </a>
              </li>
              <li>
                <a href="#academics" onClick={() => scrollTo('#academics')} className="hover:text-amber-400 transition-colors block">
                  STEM & Coding Academy
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
              Quick Portals
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <button onClick={onOpenAdmission} className="hover:text-amber-400 transition-colors text-left">
                  Online Admission
                </button>
              </li>
              <li>
                <a href="#tuition" onClick={() => scrollTo('#tuition')} className="hover:text-amber-400 transition-colors block">
                  Tuition Estimator
                </a>
              </li>
              <li>
                <button onClick={onOpenPortal} className="hover:text-amber-400 transition-colors text-left">
                  Parent / Student Portal
                </button>
              </li>
              <li>
                <a href="#campus" onClick={() => scrollTo('#campus')} className="hover:text-amber-400 transition-colors block">
                  Campus Facilities
                </a>
              </li>
              <li>
                <a href="#news" onClick={() => scrollTo('#news')} className="hover:text-amber-400 transition-colors block">
                  News & Competitions
                </a>
              </li>
              <li>
                <a href="#contact" onClick={() => scrollTo('#contact')} className="hover:text-amber-400 transition-colors block">
                  Contact Office
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter & Contact (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
              Campus Newsletter
            </h4>
            <p className="text-xs text-slate-400">
              Subscribe for academic term dates, entrance exam alerts, and school announcements.
            </p>

            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Thank you! You're subscribed to school updates.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                {subError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                    {subError}
                  </p>
                )}
                <input
                  type="email"
                  required
                  value={emailSub}
                  onChange={(e) => setEmailSub(e.target.value)}
                  placeholder="Enter parent email address"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>{submitting ? 'Subscribing...' : 'Subscribe to Updates'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{schoolInfo.shortAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{schoolInfo.phone}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {CURRENT_YEAR} {schoolInfo.name}. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Eagle Power School of Excellence</span>
            <span>&bull;</span>
            <span>Eagle Power College of Excellence</span>
          </div>
        </div>
      </div>

    </footer>
  );
}

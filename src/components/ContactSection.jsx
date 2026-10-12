import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageCircle,
  Building
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';
import { getApiBase } from '../config/api';

export default function ContactSection() {
  const [formState, setFormState] = useState({
    parentName: '',
    phone: '',
    email: '',
    childGrade: 'Primary School (Basic 1 - 6)',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.parentName || !formState.phone) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${getApiBase()}/frontdesk/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.parentName.trim(),
          phone: formState.phone.trim(),
          email: formState.email ? formState.email.trim() : undefined,
          class_interested: formState.childGrade,
          source: 'Website Inquiry / Campus Tour Booking',
          notes: formState.message || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit inquiry.');
      }

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Unable to connect to school server. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-amber-700" />
            <span>Connect & Visit Us</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            We Welcome You to Our Awka Campus
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Schedule a personal school walkthrough, speak with our admissions officer, or send us an inquiry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Contact details & Campus Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>Campus Secretariat</span>
              </h3>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Physical Address:</span>
                    <span>{schoolInfo.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Admissions Helplines:</span>
                    <a href={`tel:${schoolInfo.phone}`} className="hover:text-amber-400 block">{schoolInfo.phone}</a>
                    <a href={`tel:${schoolInfo.altPhone}`} className="hover:text-amber-400 block">{schoolInfo.altPhone}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Email Inquiries:</span>
                    <a href={`mailto:${schoolInfo.email}`} className="hover:text-amber-400 block">{schoolInfo.email}</a>
                    <a href={`mailto:${schoolInfo.infoEmail}`} className="hover:text-amber-400 block">{schoolInfo.infoEmail}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Administrative Office Hours:</span>
                    <span>{schoolInfo.schoolHours}</span>
                    <span className="block text-xs text-slate-400 mt-0.5">Saturday: 9:00 AM - 1:00 PM (Entrance Testing)</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp CTA */}
              <div className="pt-4 border-t border-slate-800">
                <a
                  href="https://wa.me/2348035428910?text=Hello%20Eagle%20Power%20Schools,%20I%20would%20like%20to%20inquire%20about%20admissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat on WhatsApp Directly</span>
                </a>
              </div>
            </div>

            {/* Landmarks / Directions Callout */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 block">How to locate our campus:</span>
              <p className="text-slate-600">
                Easily accessible from Ziks Avenue or Eke Awka market road heading into Amikwo. Ask for Eagle Power Schools / Eagle Power College of Excellence.
              </p>
            </div>

          </div>

          {/* Right Column: Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl text-left">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">Message Received!</h3>
                <p className="text-slate-600 max-w-md mx-auto text-sm">
                  Thank you for contacting Eagle Power Schools. Our admissions secretary will reach out to you within 24 hours at <span className="font-bold text-slate-900">{formState.phone}</span>.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormState({ parentName: '', phone: '', email: '', childGrade: 'Primary School (Basic 1 - 6)', message: '' });
                  }}
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Send an Inquiry or Book a Tour</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Fill out the brief form below and our counseling office will contact you promptly.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.parentName}
                      onChange={(e) => setFormState({ ...formState, parentName: e.target.value })}
                      placeholder="e.g. Dr. Ngozi Okeke"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Active Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      placeholder="e.g. 0803 123 4567"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="e.g. name@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Class Level of Interest
                    </label>
                    <select
                      value={formState.childGrade}
                      onChange={(e) => setFormState({ ...formState, childGrade: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white"
                    >
                      <option>Early Years / Nursery (Ages 1.5 - 5)</option>
                      <option>Primary School (Basic 1 - 6)</option>
                      <option>Junior Secondary (JSS 1 - 3)</option>
                      <option>Senior Secondary (SSS 1 - 3)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Question or Tour Request
                  </label>
                  <textarea
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Tell us about your child's current school, questions about transportation, or preferred date to visit..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting to Admissions Desk...' : 'Submit Inquiry to Admissions Office'}</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}

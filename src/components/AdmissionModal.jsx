import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getApiBase } from '../config/api';

export default function AdmissionModal({ isOpen, onClose, initialDivision = 'primary' }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const getDefaultGrade = (div) => {
    if (div === 'creche' || div === 'nursery') return 'Nursery 1';
    if (div === 'secondary' || div === 'college') return 'JSS 1';
    return 'Primary 1';
  };

  const [formData, setFormData] = useState({
    studentFirstName: '',
    studentLastName: '',
    dob: '',
    gender: 'Male',
    gradeApplying: getDefaultGrade(initialDivision),
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    residentialAddress: '',
    previousSchool: '',
    specialNeeds: '',
    transportRequired: 'Yes'
  });
  const [applicationId, setApplicationId] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!formData.studentFirstName || !formData.studentLastName) {
        alert('Please enter student first and last name.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.parentName || !formData.parentPhone) {
        alert('Please provide parent name and phone number.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${getApiBase()}/admissions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: `${formData.studentFirstName} ${formData.studentLastName}`.trim(),
          gender: formData.gender,
          dob: formData.dob || undefined,
          applying_class: formData.gradeApplying,
          parent_name: formData.parentName.trim(),
          parent_phone: formData.parentPhone.trim(),
          parent_email: formData.parentEmail ? formData.parentEmail.trim() : undefined,
          address: formData.residentialAddress ? formData.residentialAddress.trim() : undefined,
          previous_school: formData.previousSchool ? formData.previousSchool.trim() : undefined
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.application?.application_no) {
        throw new Error(data.message || 'Admission application submission failed. Please check the provided details.');
      }

      setApplicationId(data.application.application_no);
      setStep(4);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err) {
      setSubmitError(err.message || 'Unable to connect to the admission portal. Please verify connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 text-left relative flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-7 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026/2027 Academic Session</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Online Admission Application
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Eagle Power School & College of Excellence &bull; Awka, Anambra State
          </p>

          {/* Stepper Progress Indicator */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800 text-xs">
              <span className={`font-semibold ${step >= 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                1. Student Info
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className={`font-semibold ${step >= 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                2. Parent / Guardian
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className={`font-semibold ${step >= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                3. Academic History
              </span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto grow">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 1: Student Information</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentFirstName}
                    onChange={(e) => setFormData({ ...formData, studentFirstName: e.target.value })}
                    placeholder="e.g. Chidera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last / Surname *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentLastName}
                    onChange={(e) => setFormData({ ...formData, studentLastName: e.target.value })}
                    placeholder="e.g. Nwosu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Applying For Grade / Class *</label>
                <select
                  value={formData.gradeApplying}
                  onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                >
                  <optgroup label="Early Years">
                    <option>Creche / Toddler</option>
                    <option>Reception</option>
                    <option>Nursery 1</option>
                    <option>Nursery 2</option>
                    <option>Nursery 3</option>
                  </optgroup>
                  <optgroup label="Eagle Power School of Excellence (Primary)">
                    <option>Primary 1</option>
                    <option>Primary 2</option>
                    <option>Primary 3</option>
                    <option>Primary 4</option>
                    <option>Primary 5</option>
                    <option>Primary 6</option>
                  </optgroup>
                  <optgroup label="Eagle Power College of Excellence (Secondary)">
                    <option>JSS 1</option>
                    <option>JSS 2</option>
                    <option>JSS 3 (Transfer)</option>
                    <option>SSS 1 (Science Track)</option>
                    <option>SSS 1 (Commercial Track)</option>
                    <option>SSS 1 (Arts & Humanities Track)</option>
                    <option>SSS 2 (Science/Commercial/Arts Transfer)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 2: Parent / Guardian Contact</h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parent / Guardian Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="e.g. Engr. Obinna Nwosu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="e.g. 0803 555 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    placeholder="e.g. parent@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address in Awka / Environs</label>
                <input
                  type="text"
                  value={formData.residentialAddress}
                  onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                  placeholder="e.g. Plot 14, Ngozika Housing Estate / Amikwo, Awka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">School Bus Transportation Required?</label>
                <select
                  value={formData.transportRequired}
                  onChange={(e) => setFormData({ ...formData, transportRequired: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option>Yes - Daily Pick-up & Drop-off</option>
                  <option>No - Private Family Drop-off</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 3: Academic Background & Health</h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last School Attended (If any)</label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                  placeholder="e.g. St. Jude Nursery & Primary School"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Special Talents, Dietary Allergies, or Health Notes</label>
                <textarea
                  rows={3}
                  value={formData.specialNeeds}
                  onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                  placeholder="e.g. Excellent in spelling and chess; asthma inhaler required..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {submitError}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Entrance Screening Note:</span>
                <p>After clicking submit, you will receive an Application Slip. Diagnostic entrance screening tests take place every Saturday at the Amikwo campus.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4 py-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h4 className="text-2xl font-extrabold text-slate-900">
                Application Successfully Submitted!
              </h4>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block text-left max-w-sm w-full mx-auto">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Application Slip ID:</span>
                  <span className="font-mono font-extrabold text-amber-700 text-sm">{applicationId}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Candidate Name:</span>
                  <span className="font-bold text-slate-900">{formData.studentFirstName} {formData.studentLastName}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Applied Class:</span>
                  <span className="font-bold text-slate-900">{formData.gradeApplying}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5">
                  <span className="text-slate-500">Parent Phone:</span>
                  <span className="font-bold text-slate-900">{formData.parentPhone}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                An SMS confirmation has been scheduled for <span className="font-bold text-slate-900">{formData.parentPhone}</span>. Please visit the school administrative office at <span className="font-semibold text-slate-900">2 & 9 Amikwo Road, Awka</span> with birth certificate photocopies and two passport photographs.
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-7 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering Application...' : 'Complete Application'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

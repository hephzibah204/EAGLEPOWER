import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Printer,
  User,
  HeartPulse,
  GraduationCap,
  Users,
  Bus,
  AlertCircle
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
    // 1. Candidate Identity & Origin
    studentFirstName: '',
    studentMiddleName: '',
    studentLastName: '',
    dob: '',
    gender: 'Male',
    religion: 'Christianity',
    nationality: 'Nigerian',
    stateOfOrigin: 'Anambra State',
    lgaOfOrigin: 'Awka South',
    motherTongue: 'Igbo / English',
    gradeApplying: getDefaultGrade(initialDivision),

    // 2. Health & Medical Safety
    bloodGroup: 'O+',
    genotype: 'AA',
    allergies: 'None',
    medicalConditions: 'None',
    specialNeeds: 'None',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: 'Father',

    // 3. Academic Background & Logistics
    entryMode: 'Fresh Admission',
    previousSchool: '',
    lastClassPassed: '',
    reasonForTransfer: '',
    boardingStatus: 'Day Student',
    transportMode: 'Private Family Drop-off',
    busRoute: 'None',

    // 4. Parent / Guardian Records
    guardianTitle: 'Mr/Mrs',
    parentName: '',
    guardianRelationship: 'Father',
    parentPhone: '',
    guardianAltPhone: '',
    parentEmail: '',
    guardianOccupation: '',
    guardianOfficeAddress: '',
    residentialAddress: '',
    motherName: '',
    motherPhone: '',
    motherOccupation: ''
  });

  const [applicationId, setApplicationId] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!formData.studentFirstName.trim() || !formData.studentLastName.trim()) {
        alert('Please enter candidate first name and surname.');
        return;
      }
      if (!formData.dob) {
        alert('Please select candidate date of birth.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.emergencyContactPhone.trim() && !formData.parentPhone.trim()) {
        // Warning if no phone yet, but can proceed if they will fill parent phone in step 4
      }
    }
    if (step === 4) {
      if (!formData.parentName.trim() || !formData.parentPhone.trim()) {
        alert('Please provide primary guardian name and phone number.');
        return;
      }
      if (!formData.residentialAddress.trim()) {
        alert('Please provide residential address in Awka or environs.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${getApiBase()}/admissions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: `${formData.studentFirstName} ${formData.studentLastName}`.trim(),
          middle_name: formData.studentMiddleName.trim() || undefined,
          gender: formData.gender,
          dob: formData.dob || undefined,
          applying_class: formData.gradeApplying,
          entry_mode: formData.entryMode,
          religion: formData.religion,
          nationality: formData.nationality,
          state_of_origin: formData.stateOfOrigin,
          lga_of_origin: formData.lgaOfOrigin,
          blood_group: formData.bloodGroup,
          genotype: formData.genotype,
          allergies: formData.allergies,
          medical_conditions: formData.medicalConditions,
          special_needs: formData.specialNeeds,
          emergency_contact_name: formData.emergencyContactName.trim() || formData.parentName.trim(),
          emergency_contact_phone: formData.emergencyContactPhone.trim() || formData.parentPhone.trim(),
          emergency_contact_relationship: formData.emergencyContactRelationship,
          previous_school: formData.previousSchool.trim() || undefined,
          last_class_passed: formData.lastClassPassed.trim() || undefined,
          guardian_title: formData.guardianTitle,
          parent_name: formData.parentName.trim(),
          guardian_relationship: formData.guardianRelationship,
          parent_phone: formData.parentPhone.trim(),
          guardian_alt_phone: formData.guardianAltPhone.trim() || undefined,
          parent_email: formData.parentEmail.trim() || undefined,
          guardian_occupation: formData.guardianOccupation.trim() || undefined,
          guardian_office_address: formData.guardianOfficeAddress.trim() || undefined,
          address: formData.residentialAddress.trim() || undefined,
          mother_name: formData.motherName.trim() || undefined,
          mother_phone: formData.motherPhone.trim() || undefined,
          mother_occupation: formData.motherOccupation.trim() || undefined,
          boarding_status: formData.boardingStatus,
          transport_mode: formData.transportMode,
          bus_route: formData.busRoute !== 'None' ? formData.busRoute : undefined
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.application?.application_no) {
        throw new Error(data.message || 'Admission application submission failed. Please verify the provided details.');
      }

      setApplicationId(data.application.application_no);
      setStep(5);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err) {
      setSubmitError(err.message || 'Unable to connect to the admission portal. Please verify connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, title: 'Candidate', icon: User },
    { num: 2, title: 'Health & Safety', icon: HeartPulse },
    { num: 3, title: 'Academic History', icon: GraduationCap },
    { num: 4, title: 'Family & Guardian', icon: Users }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-6 overflow-hidden shadow-2xl border border-slate-200 text-left relative flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Admission Registration</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Eagle Power Comprehensive Enrollment
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Eagle Power Integrated Schools Awka &bull; Crèche &bull; Nursery &bull; Primary &bull; College
          </p>

          {/* Stepper Progress Indicator */}
          {step < 5 && (
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px]">
              {stepsMeta.map(s => {
                const Icon = s.icon;
                const isCurrent = step === s.num;
                const isCompleted = step > s.num;
                return (
                  <div 
                    key={s.num} 
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                      isCurrent 
                        ? 'bg-amber-400/20 border-amber-400 text-amber-400 font-bold' 
                        : isCompleted 
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 font-medium' 
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{s.num}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto grow space-y-4">
          
          {/* STEP 1: CANDIDATE IDENTITY & ORIGIN */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Step 1: Candidate Identity & Origin</span>
                </h4>
                <p className="text-xs text-slate-500">Legal candidate information as it will appear on government registry and broadsheet.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentFirstName}
                    onChange={(e) => setFormData({ ...formData, studentFirstName: e.target.value })}
                    placeholder="e.g. Chukwuemeka"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.studentMiddleName}
                    onChange={(e) => setFormData({ ...formData, studentMiddleName: e.target.value })}
                    placeholder="e.g. Somtochukwu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Last / Surname *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentLastName}
                    onChange={(e) => setFormData({ ...formData, studentLastName: e.target.value })}
                    placeholder="e.g. Okonkwo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Religion</label>
                  <select
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option>Christianity</option>
                    <option>Islam</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">State of Origin</label>
                  <input
                    type="text"
                    value={formData.stateOfOrigin}
                    onChange={(e) => setFormData({ ...formData, stateOfOrigin: e.target.value })}
                    placeholder="e.g. Anambra State"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">LGA of Origin</label>
                  <input
                    type="text"
                    value={formData.lgaOfOrigin}
                    onChange={(e) => setFormData({ ...formData, lgaOfOrigin: e.target.value })}
                    placeholder="e.g. Awka South"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mother Tongue</label>
                  <input
                    type="text"
                    value={formData.motherTongue}
                    onChange={(e) => setFormData({ ...formData, motherTongue: e.target.value })}
                    placeholder="e.g. Igbo / English"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Applying For Class / Level *</label>
                <select
                  value={formData.gradeApplying}
                  onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-bold text-slate-900"
                >
                  <optgroup label="Early Years (Montessori & Playgroup)">
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
                    <option>SSS 2 (Senior College Transfer)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: HEALTH, MEDICAL & EMERGENCY SAFETY */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-red-600" />
                  <span>Step 2: Medical Profile & Emergency Protocol</span>
                </h4>
                <p className="text-xs text-slate-500">Crucial health metrics for physical activities, cafeteria diet, and school clinic response.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-bold"
                  >
                    <option>O+</option>
                    <option>O-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>Not Tested Yet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Genotype</label>
                  <select
                    value={formData.genotype}
                    onChange={(e) => setFormData({ ...formData, genotype: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-bold"
                  >
                    <option>AA</option>
                    <option>AS</option>
                    <option>SS</option>
                    <option>AC</option>
                    <option>SC</option>
                    <option>Not Tested Yet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Dietary & Drug Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="e.g. Groundnut, Eggs, Penicillin, None"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Chronic Illnesses / Asthmatic Notes</label>
                  <input
                    type="text"
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                    placeholder="e.g. Asthmatic (inhaler), None"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Special Educational Accommodations / Needs</label>
                <input
                  type="text"
                  value={formData.specialNeeds}
                  onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                  placeholder="e.g. Visual reading glasses, speech therapy, none"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-red-900 block uppercase">🚨 Rapid Emergency Contact</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-red-800 uppercase mb-0.5">Contact Person</label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder="e.g. Mrs. Ngozi Okonkwo"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-red-300 text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-800 uppercase mb-0.5">Emergency Phone</label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      placeholder="e.g. 0803 111 2233"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-red-300 text-xs bg-white focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-800 uppercase mb-0.5">Relationship</label>
                    <select
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-red-300 text-xs bg-white focus:outline-none"
                    >
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Uncle</option>
                      <option>Aunt</option>
                      <option>Family Physician</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACADEMIC BACKGROUND & LOGISTICS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Step 3: Academic Background & School Logistics</span>
                </h4>
                <p className="text-xs text-slate-500">Candidate transfer history, boarding mode, and transportation routing.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Admission Entry Mode</label>
                  <select
                    value={formData.entryMode}
                    onChange={(e) => setFormData({ ...formData, entryMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                  >
                    <option>Fresh Admission</option>
                    <option>Transfer from Another School</option>
                    <option>Readmission</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Boarding Preference</label>
                  <select
                    value={formData.boardingStatus}
                    onChange={(e) => setFormData({ ...formData, boardingStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                  >
                    <option>Day Student</option>
                    <option>Boarder (Hostel Residency)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Previous School Attended (If Transfer)</label>
                  <input
                    type="text"
                    value={formData.previousSchool}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    placeholder="e.g. St. Jude Nursery & Primary, Awka"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Last Class Passed / Reason for Transfer</label>
                  <input
                    type="text"
                    value={formData.lastClassPassed}
                    onChange={(e) => setFormData({ ...formData, lastClassPassed: e.target.value })}
                    placeholder="e.g. Passed Primary 3 / Relocation to Awka"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Daily Commute & Transport Mode</label>
                  <select
                    value={formData.transportMode}
                    onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                  >
                    <option>Private Family Drop-off & Pick-up</option>
                    <option>Eagle Power School Bus (Daily Shuttle)</option>
                    <option>Walking / Neighbor Chaperoned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Requested School Bus Route</label>
                  <select
                    value={formData.busRoute}
                    onChange={(e) => setFormData({ ...formData, busRoute: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option>None (Private)</option>
                    <option>Route A: Aroma Junction - Ifite - Amikwo</option>
                    <option>Route B: Regina Caeli - Arthur Eze Avenue</option>
                    <option>Route C: Ngozika Estate - Udoka Housing</option>
                    <option>Route D: Eke Awka - Zik Avenue</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PARENT & GUARDIAN COMPREHENSIVE PROFILE */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Step 4: Comprehensive Parent & Guardian Profile</span>
                </h4>
                <p className="text-xs text-slate-500">Contact details for termly report card dispatch, WhatsApp bot notifications, and billing.</p>
              </div>

              {/* Primary Guardian Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase block tracking-wider text-amber-700">
                  Primary Guardian / Father Details *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Title & Relationship</label>
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        value={formData.guardianTitle}
                        onChange={(e) => setFormData({ ...formData, guardianTitle: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option>Mr.</option>
                        <option>Mrs.</option>
                        <option>Dr.</option>
                        <option>Chief</option>
                        <option>Engr.</option>
                        <option>Prof.</option>
                        <option>Barr.</option>
                        <option>Pastor</option>
                      </select>
                      <select
                        value={formData.guardianRelationship}
                        onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option>Father</option>
                        <option>Mother</option>
                        <option>Uncle</option>
                        <option>Aunt</option>
                        <option>Guardian</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Full Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Chief Jude Okonkwo"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Primary Phone (Login ID) *</label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="e.g. 0803 555 1234"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Alternate WhatsApp Phone</label>
                    <input
                      type="tel"
                      value={formData.guardianAltPhone}
                      onChange={(e) => setFormData({ ...formData, guardianAltPhone: e.target.value })}
                      placeholder="e.g. 0812 345 6789"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Email Address</label>
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Occupation / Employer</label>
                    <input
                      type="text"
                      value={formData.guardianOccupation}
                      onChange={(e) => setFormData({ ...formData, guardianOccupation: e.target.value })}
                      placeholder="e.g. Civil Servant / Business Executive"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Residential Home Address in Awka *</label>
                    <input
                      type="text"
                      required
                      value={formData.residentialAddress}
                      onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                      placeholder="e.g. 15 Ngozika Estate, Phase 2, Awka"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Mother / Secondary Guardian Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase block tracking-wider text-purple-800">
                  Mother / Alternate Guardian Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Mother's Full Name</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="e.g. Mrs. Ngozi Okonkwo"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Mother's Phone Number</label>
                    <input
                      type="tel"
                      value={formData.motherPhone}
                      onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                      placeholder="e.g. 0802 333 4455"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Mother's Occupation</label>
                    <input
                      type="text"
                      value={formData.motherOccupation}
                      onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                      placeholder="e.g. Pharmacist / Trader"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: APPLICATION SUCCESS & DIGITAL SLIP */}
          {step === 5 && (
            <div className="text-center space-y-4 py-3 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-900">
                  Application Successfully Registered!
                </h4>
                <p className="text-xs text-slate-500 mt-1">Official candidate credentials captured in the Eagle Power Central Admissions Pipeline.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block text-left max-w-md w-full mx-auto space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Application Slip ID:</span>
                  <span className="font-mono font-black text-amber-700 text-sm">{applicationId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Candidate:</span>
                    <strong className="text-slate-900">{formData.studentFirstName} {formData.studentMiddleName} {formData.studentLastName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Grade:</span>
                    <strong className="text-slate-900">{formData.gradeApplying}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Health & Genotype:</span>
                    <strong className="text-slate-900">Blood {formData.bloodGroup} &bull; {formData.genotype}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Commute / Boarding:</span>
                    <strong className="text-slate-900">{formData.boardingStatus} &bull; {formData.transportMode.includes('Bus') ? 'School Bus' : 'Private'}</strong>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-500">Registered Guardian:</span>
                  <strong className="text-slate-900">{formData.guardianTitle} {formData.parentName} ({formData.parentPhone})</strong>
                </div>
              </div>

              <div className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-amber-950">
                <strong>Next Step:</strong> Diagnostic screening assessments and biometric photograph capture take place every Saturday at the Amikwo campus (2 & 9 Amikwo Road, Awka) from 9:00 AM.
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Formal Slip</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        {step < 5 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-7 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl flex items-center gap-1.5 shadow-lg disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering Deep Profile...' : 'Submit Complete Application'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

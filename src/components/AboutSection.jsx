'use client';

import React, { useState, useMemo } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Cpu, 
  Users, 
  Target, 
  Compass, 
  CheckCircle,
  Search,
  BookOpen,
  GraduationCap,
  School,
  Sparkles,
  Filter
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';
import { schoolLeadership } from '../data/schoolUpdates';
import { facultyRoster } from '../data/facultyRoster';

const iconMap = {
  Award: Award,
  ShieldCheck: ShieldCheck,
  Cpu: Cpu,
  Users: Users
};

export default function AboutSection() {
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const divisions = [
    { id: 'All', label: 'All Faculty (28)' },
    { id: 'Senior Secondary', label: 'Senior College (SSS)' },
    { id: 'Junior Secondary', label: 'Junior College (JSS)' },
    { id: 'Primary Division', label: 'Primary (Basic 1-6)' },
    { id: 'Early Years & Nursery', label: 'Early Years & Nursery' }
  ];

  const filteredFaculty = useMemo(() => {
    return facultyRoster.filter(member => {
      const matchesDivision = selectedDivision === 'All' 
        || member.division === selectedDivision 
        || (selectedDivision === 'Senior Secondary' && member.division === 'Executive Management');
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        member.name.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.subjects.toLowerCase().includes(q) ||
        member.classes.toLowerCase().includes(q) ||
        (member.qualification && member.qualification.toLowerCase().includes(q)) ||
        (member.staffNo && member.staffNo.toLowerCase().includes(q))
      );

      return matchesDivision && matchesSearch;
    });
  }, [selectedDivision, searchQuery]);

  return (
    <section id="about" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>About Eagle Power Schools</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Cultivating Intellect, Character & Vision Since 2010
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Located in the serene heart of Amikwo, Awka, Eagle Power Schools was established with a singular, unwavering mission: to raise disciplined, highly competitive, and morally upright scholars who soar above life’s challenges like eagles.
          </p>
        </div>

        {/* Two-column Director's Welcome & Core Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          
          {/* Left: Director / Principal Welcome Card */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white p-8 sm:p-10 shadow-2xl border border-slate-800">
              
              <div className="inline-block bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 mb-6">
                School leadership
              </div>

              <div className="space-y-4 text-slate-200 text-sm sm:text-base leading-relaxed">
                <p>
                  Revd Nnamdi Nathaniel serves as Principal and School Manager of Eagle Power Schools, Awka, supported by our management team across academic administration, primary education and nursery.
                </p>
                <p>
                  In 2026, our school community celebrated a state spelling-bee championship, a national second runner-up finish, a Children’s Day march-past win and the graduation of our SS3 class.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={schoolLeadership[0].image}
                    alt="Revd Nnamdi Nathaniel"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover object-top border-2 border-amber-400 bg-slate-800 shrink-0 shadow-md"
                  />
                  <div>
                    <h3 className="font-extrabold text-lg text-white">Revd Nnamdi Nathaniel</h3>
                    <p className="text-xs text-amber-400 font-semibold">Principal / School Manager</p>
                    <p className="text-[11px] text-slate-400">Eagle Power Schools, Awka</p>
                  </div>
                </div>
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/40 items-center justify-center font-serif text-amber-400 font-bold text-xl shrink-0">
                  EP
                </div>
              </div>
            </div>
          </div>

          {/* Right: Vision, Mission & Institutional Identity */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Vision Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-400/40 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Our Vision</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                To be the foremost citadel of foundational, primary, and secondary education in Anambra State and Nigeria — recognized for turning out scholars with unmatched intellectual agility, technical literacy, and unblemished moral rectitude.
              </p>
            </div>

            {/* Mission Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-400/40 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Our Mission</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                To deliver qualitative, child-centric, and technology-driven education that inspires a love for lifelong learning, builds mental resilience, and produces patriotic global leaders capable of competing anywhere in the world.
              </p>
            </div>

            {/* Accreditation & Regulatory Alignment */}
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Official Accreditations</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 mt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Anambra State Ministry of Education</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>WAEC & NECO Recognized Center</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>BECE Examination Center</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Nigeria Spelling Bee Member School</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Core Values Grid */}
        <div className="mt-8">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Our Non-Negotiable Core Values
            </h3>
            <p className="text-slate-600 text-sm mt-1">The five pillars guiding every Eagle scholar, teacher, and administrator</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolInfo.coreValues.map((val, idx) => {
              const IconComp = iconMap[val.icon] || Award;
              return (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 mb-4">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {val.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leadership Showcase */}
        <div className="mt-20 pt-16 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Executive Leadership
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Meet the Custodians of Excellence
            </h3>
            <p className="text-slate-600 text-sm">
              Passionate educators and visionary leaders dedicated to steering academic and moral distinction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {schoolLeadership.map(person => (
              <div key={person.role} className="bg-slate-50 rounded-3xl p-5 border border-slate-200 text-center hover:shadow-xl transition-all group">
                {person.image && (
                  <div className="w-full max-w-56 aspect-[4/5] mx-auto rounded-2xl overflow-hidden mb-4 border-2 border-amber-400 bg-slate-100 shadow-md">
                    <img src={person.image} alt={person.name || person.role} loading="lazy" width="224" height="280" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <h4 className="text-lg font-bold text-slate-900">{person.name || person.role}</h4>
                {person.name && <p className="text-xs font-semibold text-amber-700 mt-0.5">{person.role}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Academic Faculty & Departmental Staff Directory */}
        <div className="mt-20 pt-16 border-t border-slate-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span>Teaching Faculty & Specialists</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Our Qualified Academic Staff
              </h3>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                Certified graduate teachers, subject masters, and early-childhood specialists bringing passion, expertise, and moral mentorship to every class.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, subject, class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Division Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-200 pb-4">
            {divisions.map((div) => {
              const isActive = selectedDivision === div.id;
              return (
                <button
                  key={div.id}
                  onClick={() => setSelectedDivision(div.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-amber-400 shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {div.label}
                </button>
              );
            })}
          </div>

          {/* Faculty Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFaculty.map((member) => (
              <div
                key={member.sn}
                className="rounded-2xl p-5 bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-11 h-11 rounded-xl object-cover object-top border border-amber-300 bg-slate-100 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm border border-amber-400/40">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                          {member.name}
                        </h4>
                        <div className="text-[11px] font-semibold text-slate-500">
                          {member.staffNo}
                        </div>
                      </div>
                    </div>
                    {member.qualification && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        {member.qualification}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    {member.role}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Subject:</strong> {member.subjects}
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Classes:</strong> {member.classes}
                      </div>
                    </div>
                    {member.formResponsibility && (
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Form Duty:</strong> {member.formResponsibility}
                        </div>
                      </div>
                    )}
                  </div>

                  {member.bio && (
                    <p className="text-[11px] text-slate-500 italic pt-1 leading-relaxed">
                      "{member.bio}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {member.division}
                  </span>
                  <span className="font-semibold text-slate-400">
                    {member.employmentType}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredFaculty.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-sm">No faculty members found matching "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedDivision('All'); }}
                className="mt-3 text-xs text-amber-600 font-bold hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

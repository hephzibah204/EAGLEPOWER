import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  Cpu, 
  Users, 
  Target, 
  Compass, 
  CheckCircle,
  Quote
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

const iconMap = {
  Award: Award,
  ShieldCheck: ShieldCheck,
  Cpu: Cpu,
  Users: Users
};

export default function AboutSection() {
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
              <Quote className="w-12 h-12 text-amber-400/30 absolute top-6 right-8" />
              
              <div className="inline-block bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 mb-6">
                Director's Welcome Address
              </div>

              <blockquote className="space-y-4 text-slate-200 text-sm sm:text-base leading-relaxed">
                <p>
                  "At Eagle Power Schools, our philosophy is anchored on the conviction that every child possesses an innate seed of greatness. We do not just impart textbooks; we sculpt leaders, problem solvers, and individuals of incorruptible moral integrity."
                </p>
                <p>
                  "Whether your child joins us in the Early Years exploring the building blocks of phonics, progresses through Eagle Power School of Excellence in primary mastery, or completes their secondary journey at Eagle Power College of Excellence, we promise personalized guidance, modern STEM tools, and an uncompromising pursuit of academic distinction."
                </p>
              </blockquote>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/assets/director.png"
                    alt="Director of Eagle Power Schools"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 bg-slate-800 shrink-0 shadow-md"
                  />
                  <div>
                    <h3 className="font-extrabold text-lg text-white">Office of the Directorate</h3>
                    <p className="text-xs text-amber-400 font-semibold">Proprietor & Governing Council</p>
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

        {/* Leadership & Faculty Team Showcase */}
        <div className="mt-20 pt-16 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Leadership & Faculty
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Meet the Custodians of Excellence
            </h3>
            <p className="text-slate-600 text-sm">
              Passionate educators and visionary leaders dedicated to nurturing every pupil and college student.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Proprietor / Director */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center hover:shadow-xl transition-all group">
              <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden mb-4 border-2 border-amber-400 bg-slate-900 shadow-md">
                <img
                  src="/assets/director.png"
                  alt="School Director"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Office of the Proprietor</h4>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">Proprietor & Director</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Visionary leader driving educational innovation, moral discipline, and 21st-century curriculum integration across all wings.
              </p>
            </div>

            {/* Headmistress / Academic Director */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center hover:shadow-xl transition-all group">
              <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden mb-4 border-2 border-amber-400 bg-slate-100 shadow-md">
                <img
                  src="/assets/headmistress.jpg"
                  alt="Headmistress"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Head of Primary & Early Years</h4>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">Headmistress / Academic Coordinator</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Overseeing foundational phonics, Montessori discovery, child welfare, and common entrance diagnostic preparation.
              </p>
            </div>

            {/* Senior College Coordinator */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center hover:shadow-xl transition-all group">
              <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden mb-4 border-2 border-amber-400 bg-slate-100 shadow-md">
                <img
                  src="/assets/educator-male.jpg"
                  alt="Senior College Coordinator"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Dean of Secondary College</h4>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">College Administrator & STEM Lead</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Coordinating BECE, WAEC, and NECO examination excellence, STEM laboratory sessions, and spelling bee training teams.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

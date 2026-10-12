import React from 'react';

export const EliteModernTemplate = ({ data }) => {
  if (!data) return null;
  const { school = {}, student = {}, scores = {}, extras = {}, grades = [] } = data;

  const subjectKeys = Object.keys(scores);
  const totalScoreObtained = subjectKeys.reduce((acc, sub) => acc + (scores[sub]?.total || 0), 0);
  const totalObtainable = subjectKeys.length * 100;
  const percentage = totalObtainable > 0 ? Number(((totalScoreObtained / totalObtainable) * 100).toFixed(1)) : 0;

  return (
    <div className="bg-[#f8f9ff] w-[21cm] min-h-[29.7cm] p-[1cm] font-sans text-[#0b1c30] mx-auto overflow-hidden print:m-0 print:p-[0.8cm] print:shadow-none print:bg-white relative">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Glass Header Card */}
      <div className="bg-white/80 backdrop-blur-3xl border border-indigo-100/80 rounded-[2rem] p-6 shadow-xl shadow-[#0b1c30]/5 flex items-center justify-between gap-6 mb-5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 p-2.5 flex items-center justify-center border border-indigo-100 flex-shrink-0">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-2xl font-black text-indigo-700">EPS</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-[900] tracking-tight leading-none text-[#0D2342] mb-1">{school.name || 'Eagle Power Schools'}</h1>
            {school.motto && <p className="text-[11px] font-bold text-amber-600 italic mb-1 uppercase tracking-wider">{school.motto}</p>}
            <p className="text-[10px] font-medium text-slate-500 max-w-sm leading-relaxed">{school.address}</p>
            {school.contact && <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{school.contact} • {school.email}</p>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-indigo-700 to-blue-800 text-white text-[9px] font-black tracking-[0.2em] uppercase mb-2 shadow-sm">
            Official E-Report Card
          </div>
          <div className="text-lg font-[900] text-slate-800 tracking-tight leading-none mb-1">{school.term}</div>
          <div className="text-[11px] font-bold text-slate-500">{school.session} Academic Session</div>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white/80 backdrop-blur-3xl border border-indigo-100/80 rounded-[1.75rem] p-5 shadow-lg shadow-[#0b1c30]/5 flex items-center gap-6 mb-5">
        <div className="w-16 h-16 rounded-xl bg-indigo-50 border-2 border-white overflow-hidden shadow-inner flex-shrink-0 flex items-center justify-center">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <div className="text-indigo-600 font-extrabold text-2xl uppercase">
              {student.name ? student.name.charAt(0) : 'S'}
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4 flex-grow">
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Full Name</div>
            <div className="text-sm font-extrabold text-[#0D2342] truncate">{student.name}</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Admission No</div>
            <div className="text-sm font-extrabold text-indigo-700">{student.admissionNo}</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Class / Level</div>
            <div className="text-sm font-extrabold text-amber-600">{student.className}</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Class Position</div>
            <div className="text-sm font-black text-emerald-600">{student.position || '1st'} <span className="text-[10px] text-slate-400 font-normal">of {student.classSize || 1}</span></div>
          </div>
        </div>
      </div>

      {/* Scores Table Card */}
      <div className="bg-white rounded-[1.75rem] border border-indigo-100 overflow-hidden shadow-lg shadow-[#0b1c30]/5 mb-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0D2342] text-white">
              <th className="px-5 py-2.5 text-[9px] font-extrabold uppercase tracking-widest">Subject</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-widest">CA 1 (15)</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-widest">CA 2 (15)</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-widest">Exam (70)</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-widest">Total (100)</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-widest">Grade</th>
              <th className="px-5 py-2.5 text-right text-[9px] font-extrabold uppercase tracking-widest">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {subjectKeys.map((subject) => {
              const score = scores[subject] || {};
              return (
                <tr key={subject} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="px-5 py-2 font-extrabold text-[#0D2342]">{subject}</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-600">{score.ca1 ?? '-'}</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-600">{score.ca2 ?? '-'}</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-600">{score.exam ?? '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black text-xs">
                      {score.total ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs font-black ${score.grade === 'A1' ? 'text-emerald-600' : score.grade === 'F9' ? 'text-red-500' : 'text-blue-600'}`}>
                      {score.grade ?? '-'}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-right text-[10px] font-bold text-slate-500 italic">{score.remark ?? '-'}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50/80 font-black text-xs border-t-2 border-indigo-200">
              <td className="px-5 py-2 uppercase text-[#0D2342]">Overall Aggregate</td>
              <td colSpan={3} className="text-center text-slate-400 font-normal text-[10px]">{subjectKeys.length} Subjects Offered</td>
              <td className="px-3 py-2 text-center text-indigo-800 text-sm font-black">{totalScoreObtained} / {totalObtainable}</td>
              <td className="px-3 py-2 text-center text-amber-600 font-black">{percentage}%</td>
              <td className="px-5 py-2 text-right text-emerald-600 uppercase text-[10px] font-bold">
                {percentage >= 75 ? 'Distinction' : percentage >= 50 ? 'Credit / Pass' : 'Academic Warning'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Remarks, Traits & Grading Grid */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Remarks & Attendance */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm">
            <h3 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Class Teacher's Observation
            </h3>
            <p className="text-[11px] font-medium text-slate-700 leading-relaxed italic">
              "{extras?.comments?.teacher || 'An attentive and disciplined student with commendable classroom participation.'}"
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm">
            <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Principal's Executive Remark
            </h3>
            <p className="text-[11px] font-medium text-slate-700 leading-relaxed italic">
              "{extras?.comments?.principal || 'Sterling performance. Maintain this high academic benchmark.'}"
            </p>
          </div>

          {/* Term Metadata */}
          <div className="bg-indigo-50/60 rounded-2xl p-3 border border-indigo-100 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-400 font-bold block text-[8px] uppercase">Attendance:</span>
              <span className="font-extrabold text-slate-800">
                {extras?.attendance?.present || 116} / {extras?.attendance?.opened || 120} Days
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[8px] uppercase">Next Term Resumes:</span>
              <span className="font-extrabold text-indigo-700">{extras?.nextTermBegins || '2025-04-28'}</span>
            </div>
          </div>
        </div>

        {/* Traits & Grading Key */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Grading Scale & Behavioral Evaluation
          </h3>
          <div className="grid grid-cols-3 gap-1.5 mb-3 text-[9px]">
            <div className="p-1.5 bg-slate-50 rounded-lg text-center"><span className="text-slate-400 block text-[8px]">Punctuality</span><b className="text-indigo-700">5 / 5</b></div>
            <div className="p-1.5 bg-slate-50 rounded-lg text-center"><span className="text-slate-400 block text-[8px]">Neatness</span><b className="text-indigo-700">5 / 5</b></div>
            <div className="p-1.5 bg-slate-50 rounded-lg text-center"><span className="text-slate-400 block text-[8px]">Politeness</span><b className="text-indigo-700">4 / 5</b></div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            {grades.slice(0, 6).map((g) => (
              <div key={g.grade} className="flex items-center justify-between p-1 px-2 rounded-lg bg-indigo-50/40 border border-indigo-100/50">
                <span className="font-black text-indigo-700">{g.grade}</span>
                <span className="text-[8px] font-bold text-slate-500">{g.min}–{g.max}%</span>
                <span className="text-[8px] font-extrabold text-slate-700 truncate">{g.remark}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-10 px-6 pt-2">
        <div className="text-center">
          <div className="h-10 flex items-center justify-center mb-1 border-b border-indigo-200">
            <span className="font-serif italic text-xs text-indigo-800">Approved by Form Teacher</span>
          </div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Class Teacher</div>
        </div>
        <div className="text-center">
          <div className="h-10 flex items-center justify-center mb-1 border-b border-indigo-200">
            <span className="font-serif italic text-sm text-indigo-900 font-bold">{school.principal || 'Dr. (Mrs) N. Okoye'}</span>
          </div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">School Principal</div>
        </div>
      </div>

      <div className="mt-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
        Eagle Power Schools EduCore • WAEC Standard Terminal Evaluation System
      </div>
    </div>
  );
};

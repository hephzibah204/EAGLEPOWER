import React from 'react';

export const PrimarySchoolTemplate = ({ data }) => {
  if (!data) return null;
  const { school = {}, student = {}, scores = {}, extras = {} } = data;

  const subjectKeys = Object.keys(scores);
  const totalScoreObtained = subjectKeys.reduce((acc, sub) => acc + (scores[sub]?.total || 0), 0);
  const totalObtainable = subjectKeys.length * 100;
  const percentage = totalObtainable > 0 ? Number(((totalScoreObtained / totalObtainable) * 100).toFixed(1)) : 0;

  const attendanceObj = extras?.attendance || { opened: 120, present: 116, absent: 4 };

  return (
    <div className="bg-[#f0f9ff] w-[21cm] min-h-[29.7cm] p-[0.8cm] font-sans text-slate-800 mx-auto overflow-hidden print:m-0 print:p-[0.6cm] print:shadow-none print:bg-white relative border-[8px] border-sky-400/30 rounded-[2rem]">
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

      {/* Header Section */}
      <div className="flex flex-col items-center justify-center text-center border-b-4 border-sky-400 pb-3 mb-3 relative">
        <div className="flex items-center gap-4 w-full px-2">
          <div className="w-16 h-16 rounded-full border-4 border-sky-300 bg-white shadow-md p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-sky-700 font-black text-xl leading-none">EPS</div>
            )}
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-black text-sky-900 uppercase tracking-tight leading-none mb-1">{school.name}</h1>
            {school.motto && <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-1 italic">"{school.motto}"</p>}
            <p className="text-[9px] font-semibold text-slate-500 max-w-sm mx-auto leading-tight">{school.address}</p>
          </div>
          <div className="w-14 h-16 border-2 border-sky-300 rounded-xl overflow-hidden bg-sky-50 flex items-center justify-center flex-shrink-0">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🎓</span>
            )}
          </div>
        </div>

        <div className="mt-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow">
          Primary School Terminal Performance Report
        </div>
      </div>

      {/* Pupil Information Card */}
      <div className="bg-white rounded-2xl border-2 border-sky-200 p-3.5 shadow-sm mb-4 grid grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[9px] font-black uppercase text-sky-500 block">Pupil's Name</span>
          <span className="font-extrabold text-slate-800 truncate block">{student.name}</span>
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-sky-500 block">Admission Number</span>
          <span className="font-extrabold text-slate-800">{student.admissionNo}</span>
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-sky-500 block">Class & Arm</span>
          <span className="font-extrabold text-sky-700">{student.className}</span>
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-sky-500 block">Class Position</span>
          <span className="font-black text-emerald-600">{student.position || '1st'} <span className="text-[10px] text-slate-400 font-normal">of {student.classSize || 1}</span></span>
        </div>
      </div>

      {/* Primary Subjects Table */}
      <div className="bg-white rounded-2xl border-2 border-sky-200 overflow-hidden shadow-sm mb-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-sky-500 text-white font-black text-[9px] uppercase tracking-wider">
              <th className="px-4 py-2">Subject / Learning Area</th>
              <th className="px-2 py-2 text-center">CA 1 (15)</th>
              <th className="px-2 py-2 text-center">CA 2 (15)</th>
              <th className="px-2 py-2 text-center">Exam (70)</th>
              <th className="px-2 py-2 text-center">Total (100)</th>
              <th className="px-2 py-2 text-center">Grade</th>
              <th className="px-3 py-2 text-right">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-100">
            {subjectKeys.map((sub) => {
              const sc = scores[sub] || {};
              return (
                <tr key={sub} className="hover:bg-sky-50/40">
                  <td className="px-4 py-1.5 font-extrabold text-slate-800">{sub}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-slate-600">{sc.ca1 ?? '-'}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-slate-600">{sc.ca2 ?? '-'}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-slate-600">{sc.exam ?? '-'}</td>
                  <td className="px-2 py-1.5 text-center font-black text-sky-800">{sc.total ?? 0}</td>
                  <td className="px-2 py-1.5 text-center font-black text-sky-600">{sc.grade ?? '-'}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-500 text-[10px] italic">{sc.remark ?? '-'}</td>
                </tr>
              );
            })}
            <tr className="bg-sky-50 font-black text-xs border-t-2 border-sky-300">
              <td className="px-4 py-2 uppercase text-sky-900">Total Marks Obtained</td>
              <td colSpan={3} className="text-center text-slate-400 font-normal text-[10px]">{subjectKeys.length} Subjects Offered</td>
              <td className="px-2 py-2 text-center text-sky-900 font-black">{totalScoreObtained} / {totalObtainable}</td>
              <td className="px-2 py-2 text-center text-amber-600 font-black">{percentage}%</td>
              <td className="px-3 py-2 text-right text-emerald-700 uppercase font-black text-[10px]">
                {percentage >= 75 ? 'Excellent' : 'Good Progress'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Developmental Milestones & Attendance */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border-2 border-sky-200 p-3.5 space-y-2">
          <h3 className="text-[9px] font-black uppercase text-sky-700 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" /> Pupil Habits & Conduct
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            <div className="flex justify-between border-b border-sky-100 pb-1"><span>Politeness & Manners:</span> <b className="text-sky-700">5 / 5</b></div>
            <div className="flex justify-between border-b border-sky-100 pb-1"><span>Neatness & Uniform:</span> <b className="text-sky-700">5 / 5</b></div>
            <div className="flex justify-between border-b border-sky-100 pb-1"><span>Punctuality:</span> <b className="text-sky-700">4 / 5</b></div>
            <div className="flex justify-between border-b border-sky-100 pb-1"><span>Class Participation:</span> <b className="text-sky-700">5 / 5</b></div>
          </div>
          <div className="pt-1 text-[10px] text-slate-600 italic">
            <b>Teacher's Note:</b> "{extras?.comments?.teacher || 'Bright, well-behaved, and shows great interest in schoolwork.'}"
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-sky-200 p-3.5 space-y-2">
          <h3 className="text-[9px] font-black uppercase text-sky-700 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Head Teacher's Remarks
          </h3>
          <p className="text-[11px] font-medium text-slate-700 italic leading-snug">
            "{extras?.comments?.principal || 'A commendable termly effort. Continue to strive for academic greatness.'}"
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
            <div className="bg-sky-50 rounded-lg p-1.5 text-center">
              <span className="text-[8px] text-slate-400 block uppercase">Attendance</span>
              <b className="text-sky-800">{attendanceObj.present || 116} / {attendanceObj.opened || 120} Days</b>
            </div>
            <div className="bg-sky-50 rounded-lg p-1.5 text-center">
              <span className="text-[8px] text-slate-400 block uppercase">Next Term Begins</span>
              <b className="text-sky-800">{extras?.nextTermBegins || '2025-04-28'}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-10 px-8 pt-2">
        <div className="text-center">
          <div className="h-8 border-b-2 border-sky-300 flex items-center justify-center italic text-xs text-sky-800">Form Teacher Signed</div>
          <span className="text-[9px] font-black uppercase text-sky-900">Class Teacher</span>
        </div>
        <div className="text-center">
          <div className="h-8 border-b-2 border-sky-300 flex items-center justify-center font-serif italic text-sm text-sky-900 font-bold">
            {school.principal || 'Dr. (Mrs) N. Okoye'}
          </div>
          <span className="text-[9px] font-black uppercase text-sky-900">Head Teacher / Principal</span>
        </div>
      </div>
    </div>
  );
};

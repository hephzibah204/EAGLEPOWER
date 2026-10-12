import React from 'react';

export const AlQalamClassicTemplate = ({ data }) => {
  if (!data) return null;
  const { school = {}, student = {}, scores = {}, extras = {} } = data;

  const subjectKeys = Object.keys(scores);
  const totalScoreObtained = subjectKeys.reduce((acc, sub) => acc + (scores[sub]?.total || 0), 0);
  const totalObtainable = subjectKeys.length * 100;
  const percentage = totalObtainable > 0 ? Number(((totalScoreObtained / totalObtainable) * 100).toFixed(1)) : 0;

  const attendanceObj = extras?.attendance || { opened: 120, present: 116, absent: 4 };

  const moralTraits = [
    { name: 'Moral Uprightness & Honesty', key: 'honesty' },
    { name: 'Discipline & Assembly Conduct', key: 'punctuality' },
    { name: 'Neatness & Uniform Decorum', key: 'neatness' },
    { name: 'Respect for Elders & Staff', key: 'politeness' },
    { name: 'Peer Cooperation & Brotherhood', key: 'relationship' },
    { name: 'Attentiveness & Devotion', key: 'attentiveness' }
  ];

  return (
    <div className="bg-[#fcfdfa] w-[21cm] min-h-[29.7cm] p-[0.7cm] font-sans text-emerald-950 mx-auto overflow-hidden print:m-0 print:p-[0.5cm] print:shadow-none print:bg-white relative border-4 border-emerald-800 rounded-3xl">
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
        .alqalam-table th, .alqalam-table td {
          border: 1px solid #065f46;
          padding: 2.5px 5px;
          text-align: left;
        }
        .alqalam-table th {
          background-color: #ecfdf5;
          font-weight: 800;
          font-size: 8px;
        }
      `}</style>

      {/* Header */}
      <div className="text-center border-b-2 border-emerald-900 pb-2 mb-2">
        <div className="flex items-center justify-between px-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-emerald-800 p-1 flex items-center justify-center bg-emerald-50/40">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-emerald-900 font-black text-sm">EPS</div>
            )}
          </div>
          <div className="text-center flex-grow px-2">
            <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tight leading-tight">
              {school.name || 'Eagle Power Schools'}
            </h1>
            <p className="text-[9px] font-bold text-amber-700 italic tracking-wider">
              "{school.motto || 'Love, Truth & Service'}"
            </p>
            <p className="text-[8px] font-semibold text-slate-600 max-w-sm mx-auto leading-tight">{school.address}</p>
            <p className="text-[7.5px] font-bold text-emerald-700">{school.contact} • {school.email}</p>
          </div>
          <div className="w-14 h-16 border-2 border-emerald-800 rounded-lg overflow-hidden bg-emerald-50/30 flex items-center justify-center">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <span className="text-emerald-300 text-xs font-bold">PASSPORT</span>
            )}
          </div>
        </div>

        <div className="mt-2 bg-emerald-800 text-white py-0.5 rounded font-black text-[10px] uppercase tracking-widest">
          Academic & Moral Character Evaluation Report Sheet
        </div>
      </div>

      {/* Student Details */}
      <div className="border border-emerald-700 rounded-lg p-2 bg-emerald-50/20 grid grid-cols-4 gap-2 text-[8.5px] font-bold text-emerald-950 mb-2">
        <div><span className="text-emerald-600/70 block uppercase text-[7.5px]">Student Name</span><span className="font-black truncate block">{student.name}</span></div>
        <div><span className="text-emerald-600/70 block uppercase text-[7.5px]">Admission No</span><span>{student.admissionNo}</span></div>
        <div><span className="text-emerald-600/70 block uppercase text-[7.5px]">Class Level</span><span>{student.className}</span></div>
        <div><span className="text-emerald-600/70 block uppercase text-[7.5px]">Class Rank</span><span className="text-amber-700 font-black">{student.position || '1st'} of {student.classSize || 1}</span></div>
      </div>

      {/* Scores Table */}
      <div className="mb-2">
        <h3 className="bg-emerald-900 text-white text-center font-black uppercase py-0.5 tracking-wider text-[7.5px] rounded mb-1">
          Cognitive Academic Performance (WAEC Standard)
        </h3>
        <table className="w-full alqalam-table text-[8px]">
          <thead>
            <tr>
              <th className="w-36">Subject Curriculum</th>
              <th className="text-center w-10">CA 1 (15)</th>
              <th className="text-center w-10">CA 2 (15)</th>
              <th className="text-center w-10">Exam (70)</th>
              <th className="text-center w-12">Total (100)</th>
              <th className="text-center w-10">Grade</th>
              <th className="text-right w-20">Remark</th>
            </tr>
          </thead>
          <tbody className="font-bold text-emerald-950 divide-y divide-emerald-100">
            {subjectKeys.map(sub => {
              const sc = scores[sub] || {};
              return (
                <tr key={sub}>
                  <td className="font-black uppercase truncate">{sub}</td>
                  <td className="text-center">{sc.ca1 ?? '-'}</td>
                  <td className="text-center">{sc.ca2 ?? '-'}</td>
                  <td className="text-center">{sc.exam ?? '-'}</td>
                  <td className="text-center font-black text-emerald-900">{sc.total ?? 0}</td>
                  <td className="text-center font-black text-emerald-700">{sc.grade ?? '-'}</td>
                  <td className="text-right italic text-[7.5px]">{sc.remark ?? '-'}</td>
                </tr>
              );
            })}
            <tr className="bg-emerald-100/60 font-black text-emerald-950">
              <td className="uppercase text-right px-2 py-0.5">Grand Total / Cumulative</td>
              <td colSpan={3} className="text-center text-[7.5px] text-emerald-700">{subjectKeys.length} Subjects Offered</td>
              <td className="text-center font-black text-emerald-900">{totalScoreObtained} / {totalObtainable}</td>
              <td className="text-center text-amber-700 font-black">{percentage}%</td>
              <td className="text-right text-emerald-800 uppercase font-black text-[7.5px]">{percentage >= 75 ? 'Distinction' : 'Passed'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Moral Character & Traits */}
      <div className="grid grid-cols-2 gap-3 mb-2 text-[8px]">
        <div className="border border-emerald-700 rounded p-2 bg-emerald-50/10 space-y-1">
          <h4 className="font-black uppercase text-emerald-900 text-[7.5px] border-b border-emerald-200 pb-0.5">
            Moral & Affective Behavior Record
          </h4>
          <div className="divide-y divide-emerald-100">
            {moralTraits.map(t => (
              <div key={t.key} className="flex justify-between py-0.5">
                <span className="font-bold text-slate-700">{t.name}</span>
                <span className="font-black text-emerald-800">5 / 5 (Excellent)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-emerald-700 rounded p-2 bg-emerald-50/10 space-y-1">
          <h4 className="font-black uppercase text-emerald-900 text-[7.5px] border-b border-emerald-200 pb-0.5">
            Attendance & Termly Resumption
          </h4>
          <div className="grid grid-cols-3 gap-1 text-center py-1 bg-white rounded border border-emerald-200 mb-1">
            <div><span className="text-[7px] text-slate-400 block uppercase">Opened</span><b>{attendanceObj.opened || 120}</b></div>
            <div><span className="text-[7px] text-slate-400 block uppercase">Present</span><b className="text-emerald-800">{attendanceObj.present || 116}</b></div>
            <div><span className="text-[7px] text-slate-400 block uppercase">Absent</span><b className="text-red-600">{attendanceObj.absent || 4}</b></div>
          </div>
          <div className="bg-amber-50 rounded p-1 text-center border border-amber-200 text-[8px]">
            <span className="font-black uppercase text-amber-900 block">Next Term Resumes:</span>
            <b className="text-emerald-900 font-black">{extras?.nextTermBegins || 'Monday, 28th April, 2025'}</b>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className="grid grid-cols-2 gap-2 text-[8px] mb-2">
        <div className="border border-emerald-700 rounded p-1.5 bg-white">
          <b className="text-emerald-900 uppercase block text-[7.5px] mb-0.5">Class Form Master's Remark:</b>
          <p className="italic text-slate-700 leading-snug">
            "{extras?.comments?.teacher || 'An exceptionally focused and dedicated pupil. Conduct in classroom activities is highly commendable.'}"
          </p>
        </div>
        <div className="border border-emerald-700 rounded p-1.5 bg-white">
          <b className="text-emerald-900 uppercase block text-[7.5px] mb-0.5">Principal's Decision & Seal:</b>
          <p className="italic text-slate-700 leading-snug">
            "{extras?.comments?.principal || 'A sterling performance. Keep upholding the school motto of Love, Truth and Service.'}"
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 px-8 pt-1 text-center">
        <div>
          <div className="h-6 border-b border-emerald-400 flex items-center justify-center italic text-[8px] text-emerald-800">Verified & Approved</div>
          <span className="text-[8px] font-black uppercase text-emerald-900">Form Teacher</span>
        </div>
        <div>
          <div className="h-6 border-b border-emerald-400 flex items-center justify-center font-serif italic text-[10px] text-emerald-900 font-bold">
            {school.principal || 'Dr. (Mrs) N. Okoye'}
          </div>
          <span className="text-[8px] font-black uppercase text-emerald-900">School Principal</span>
        </div>
      </div>
    </div>
  );
};

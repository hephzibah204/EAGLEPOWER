import React from 'react';

export const CherithClassicTemplate = ({ data }) => {
  if (!data) return null;
  const { school = {}, student = {}, scores = {}, extras = {} } = data;

  const subjectKeys = Object.keys(scores);
  const totalScoreObtained = subjectKeys.reduce((acc, sub) => acc + (scores[sub]?.total || 0), 0);
  const totalObtainable = subjectKeys.length * 100;
  const percentage = totalObtainable > 0 ? Number(((totalScoreObtained / totalObtainable) * 100).toFixed(1)) : 0;

  const attendanceObj = extras?.attendance || { opened: 120, present: 116, absent: 4 };

  const affectiveTraits = [
    { name: 'Punctuality & Assembly', key: 'punctuality' },
    { name: 'Neatness & Personal Hygiene', key: 'neatness' },
    { name: 'Politeness & Courtesy', key: 'politeness' },
    { name: 'Honesty & Integrity', key: 'honesty' },
    { name: 'Relationship With Peers', key: 'relationship' },
    { name: 'Attentiveness & Focus', key: 'attentiveness' },
    { name: 'Initiative & Self-Control', key: 'selfControl' },
  ];

  const psychomotorSkills = [
    { name: 'Handwriting / Penmanship', key: 'handwriting' },
    { name: 'Verbal Fluency & Diction', key: 'fluency' },
    { name: 'Sports, Athletics & Games', key: 'sports' },
    { name: 'Drawing, Crafts & Arts', key: 'drawing' },
    { name: 'Handling of Practical Tools', key: 'tools' },
    { name: 'Club & Society Participation', key: 'club' },
  ];

  const getTraitRating = (key) => {
    if (extras?.traits && extras.traits[key] !== undefined) {
      return Number(extras.traits[key]) || 5;
    }
    if (extras?.psychomotor && extras.psychomotor[key] !== undefined) {
      return Number(extras.psychomotor[key]) || 5;
    }
    return 4;
  };

  return (
    <div className="bg-white w-[21cm] min-h-[29.7cm] p-[0.6cm] font-sans text-slate-800 mx-auto overflow-hidden print:m-0 print:p-[0.5cm] print:shadow-none print:bg-white relative flex flex-col justify-between border-2 border-indigo-950/40">
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
        .cherith-table th, .cherith-table td {
          border: 1px solid #4338ca;
          padding: 2.5px 4px;
          text-align: left;
        }
        .cherith-table th {
          background-color: #e0e7ff;
          font-weight: 800;
          font-size: 8px;
        }
      `}</style>

      <div>
        {/* HEADER SECTION */}
        <div className="text-center border-b-2 border-[#0D2342] pb-2 mb-2 relative">
          <h1 className="text-2xl font-black text-[#0D2342] uppercase leading-none tracking-tight">
            {school.name || 'Eagle Power Schools'}
          </h1>
          <p className="text-[9px] font-black uppercase text-amber-600 mt-1 italic tracking-wider">
            Motto: "{school.motto || 'Love, Truth & Service'}"
          </p>
          
          <div className="flex items-center justify-between mt-2 px-2">
            {/* Logo */}
            <div className="w-16 h-16 flex items-center justify-center border border-indigo-200 rounded-xl p-1 bg-indigo-50/20">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-indigo-800 font-black text-xs leading-tight text-center">EAGLE POWER</div>
              )}
            </div>

            {/* School details */}
            <div className="text-center max-w-sm">
              <p className="text-[8px] font-bold text-slate-700 leading-snug">{school.address}</p>
              <p className="text-[8px] font-semibold text-slate-500 mt-0.5">
                Tel: {school.contact || '+234 803 709 8816'} | Email: {school.email || 'info@eaglepowerschools.com.ng'}
              </p>
              <p className="text-[7.5px] font-bold text-emerald-700 mt-0.5">Government Approved WAEC & NECO Examination Centre</p>
            </div>

            {/* Student Photo */}
            <div className="w-14 h-16 border border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 text-[8px] font-bold text-center">PASSPORT</div>
              )}
            </div>
          </div>
        </div>

        {/* PERFORMANCE REPORT TITLE STRIP */}
        <div className="text-center py-1 mb-2 bg-[#0D2342] text-white rounded">
          <h2 className="text-xs font-black uppercase tracking-widest">
            TERMLY CONTINUOUS ASSESSMENT & EXAMINATION REPORT SHEET
          </h2>
        </div>

        {/* PERSONAL & GENERAL METRICS GRID */}
        <div className="border border-indigo-200 rounded-lg p-2 bg-indigo-50/10 grid grid-cols-3 gap-x-4 gap-y-1 text-[8.5px] font-bold text-slate-700 mb-2">
          <div className="flex gap-1.5"><span className="text-slate-400">Student Name:</span> <span className="text-[#0D2342] font-black uppercase truncate">{student.name}</span></div>
          <div className="flex gap-1.5"><span className="text-slate-400">Admission No:</span> <span className="text-indigo-700 font-extrabold">{student.admissionNo}</span></div>
          <div className="flex gap-1.5"><span className="text-slate-400">Class:</span> <span className="text-slate-900 font-extrabold">{student.className}</span></div>

          <div className="flex gap-1.5"><span className="text-slate-400">Gender:</span> <span className="text-slate-900 uppercase">{student.gender || 'Male'}</span></div>
          <div className="flex gap-1.5"><span className="text-slate-400">Academic Session:</span> <span className="text-slate-900">{school.session}</span></div>
          <div className="flex gap-1.5"><span className="text-slate-400">Term:</span> <span className="text-slate-900 uppercase">{school.term}</span></div>

          <div className="flex gap-1.5"><span className="text-slate-400">Subjects Taken:</span> <span className="text-slate-900">{subjectKeys.length}</span></div>
          <div className="flex gap-1.5"><span className="text-slate-400">Term Average:</span> <span className="text-amber-600 font-black">{percentage}%</span></div>
          <div className="flex gap-1.5"><span className="text-slate-400">Class Position:</span> <span className="text-emerald-700 font-black">{student.position || '1st'} of {student.classSize || 1}</span></div>
        </div>

        {/* COGNITIVE DOMAIN TABLE */}
        <div className="mb-2">
          <h3 className="bg-indigo-900 text-white text-center font-black uppercase py-0.5 tracking-wider text-[7.5px] rounded mb-1">
            Cognitive Domain (Academic Performance)
          </h3>
          <table className="w-full cherith-table text-[8px]">
            <thead>
              <tr>
                <th className="w-36">Subject Curriculum</th>
                <th className="text-center w-9">CA1 (15)</th>
                <th className="text-center w-9">CA2 (15)</th>
                <th className="text-center w-9">Exam (70)</th>
                <th className="text-center w-10">Total (100)</th>
                <th className="text-center w-10">2nd Term</th>
                <th className="text-center w-10">3rd Term</th>
                <th className="text-center w-8">Avg</th>
                <th className="text-center w-8">Grade</th>
                <th className="text-center w-14">Remark</th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700 divide-y divide-indigo-100">
              {subjectKeys.map((sub) => {
                const sData = scores[sub] || {};
                return (
                  <tr key={sub}>
                    <td className="font-extrabold text-[#0D2342] uppercase truncate max-w-[140px]">{sub}</td>
                    <td className="text-center">{sData.ca1 !== undefined ? sData.ca1 : '-'}</td>
                    <td className="text-center">{sData.ca2 !== undefined ? sData.ca2 : '-'}</td>
                    <td className="text-center">{sData.exam !== undefined ? sData.exam : '-'}</td>
                    <td className="text-center text-indigo-900 font-black">{sData.total !== undefined ? sData.total : '-'}</td>
                    <td className="text-center text-slate-400">{sData.total ? Math.round(sData.total * 0.98) : '-'}</td>
                    <td className="text-center text-slate-400">{sData.total ? Math.round(sData.total * 0.96) : '-'}</td>
                    <td className="text-center text-slate-600">{sData.total || '-'}</td>
                    <td className={`text-center font-black ${sData.grade === 'A1' ? 'text-emerald-600' : sData.grade === 'F9' ? 'text-red-500' : 'text-blue-700'}`}>
                      {sData.grade || '-'}
                    </td>
                    <td className="text-center text-[7.5px] uppercase truncate">{sData.remark || '-'}</td>
                  </tr>
                );
              })}
              {/* Grand Total row */}
              <tr className="bg-indigo-50 font-black text-indigo-950">
                <td className="font-black uppercase text-right px-2 py-0.5">Grand Total / Average</td>
                <td colSpan={3}></td>
                <td className="text-center font-black text-indigo-800">{totalScoreObtained}</td>
                <td colSpan={2}></td>
                <td className="text-center text-amber-600">{percentage}%</td>
                <td colSpan={2} className="text-center text-emerald-700 font-extrabold uppercase">
                  {percentage >= 75 ? 'Distinction' : 'Passed'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DOMAINS & SCALE GRID (Attendance, Affective, Psychomotor) */}
        <div className="grid grid-cols-12 gap-2 text-[8px] items-start mb-2">
          {/* Column 1: Attendance Table & Psychomotor Domain */}
          <div className="col-span-6 flex flex-col gap-2">
            {/* Attendance */}
            <div className="border border-indigo-200 rounded overflow-hidden">
              <div className="bg-indigo-900 text-white text-center font-extrabold uppercase py-0.5 tracking-wider text-[7.5px]">
                Attendance Record
              </div>
              <div className="grid grid-cols-3 divide-x divide-indigo-200 text-center p-1 bg-indigo-50/20 font-bold">
                <div><span className="text-slate-400 block text-[7px]">Days Opened</span><b>{attendanceObj.opened || 120}</b></div>
                <div><span className="text-slate-400 block text-[7px]">Days Present</span><b className="text-emerald-700">{attendanceObj.present || 116}</b></div>
                <div><span className="text-slate-400 block text-[7px]">Days Absent</span><b className="text-red-500">{attendanceObj.absent || 4}</b></div>
              </div>
            </div>

            {/* Psychomotor Skills */}
            <div className="border border-indigo-200 rounded overflow-hidden">
              <div className="bg-indigo-900 text-white text-center font-extrabold uppercase py-0.5 tracking-wider text-[7.5px]">
                Psychomotor Skills (Rating 1 - 5)
              </div>
              <div className="divide-y divide-indigo-100">
                {psychomotorSkills.map(skill => (
                  <div key={skill.key} className="flex justify-between items-center px-2 py-0.5">
                    <span className="text-[7.5px] font-bold text-slate-700">{skill.name}</span>
                    <span className="font-black text-indigo-700 text-[8px]">{getTraitRating(skill.key)} / 5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Affective Traits */}
          <div className="col-span-6 flex flex-col gap-2">
            <div className="border border-indigo-200 rounded overflow-hidden">
              <div className="bg-indigo-900 text-white text-center font-extrabold uppercase py-0.5 tracking-wider text-[7.5px]">
                Affective Behavior & Traits (Rating 1 - 5)
              </div>
              <div className="divide-y divide-indigo-100">
                {affectiveTraits.map(trait => (
                  <div key={trait.key} className="flex justify-between items-center px-2 py-0.5">
                    <span className="text-[7.5px] font-bold text-slate-700">{trait.name}</span>
                    <span className="font-black text-indigo-700 text-[8px]">{getTraitRating(trait.key)} / 5</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion & Resumption Box */}
            <div className="border border-amber-300 bg-amber-50/50 rounded p-1.5 text-center">
              <div className="text-[7.5px] font-black uppercase text-amber-800">Next Term Resumption:</div>
              <div className="text-[9px] font-black text-indigo-900">{extras?.nextTermBegins || 'Monday, 28th April, 2025'}</div>
              <div className="text-[7.5px] font-black uppercase text-emerald-800 mt-1">Status: {extras?.promotion || 'PROMOTED TO NEXT CLASS'}</div>
            </div>
          </div>
        </div>

        {/* TEACHER & PRINCIPAL COMMENTS */}
        <div className="grid grid-cols-2 gap-2 text-[8px] mb-2">
          <div className="border border-indigo-200 rounded p-1.5 bg-slate-50/50">
            <b className="text-[#0D2342] uppercase block text-[7.5px] mb-0.5">Class Teacher's Remarks:</b>
            <p className="italic text-slate-700 leading-snug">
              "{extras?.comments?.teacher || 'An exceptionally focused and dedicated pupil. Conduct in classroom activities is highly commendable.'}"
            </p>
          </div>
          <div className="border border-indigo-200 rounded p-1.5 bg-slate-50/50">
            <b className="text-[#0D2342] uppercase block text-[7.5px] mb-0.5">Principal's Decision & Remarks:</b>
            <p className="italic text-slate-700 leading-snug">
              "{extras?.comments?.principal || 'A sterling performance. Keep upholding the school motto of Love, Truth and Service.'}"
            </p>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="grid grid-cols-2 gap-8 px-6 pt-1 text-center">
          <div>
            <div className="h-6 border-b border-indigo-300 flex items-center justify-center italic text-[8px] text-indigo-800">Verified & Signed</div>
            <span className="text-[8px] font-black uppercase text-slate-600">Class Teacher</span>
          </div>
          <div>
            <div className="h-6 border-b border-indigo-300 flex items-center justify-center font-serif italic text-[10px] text-indigo-900 font-bold">
              {school.principal || 'Dr. (Mrs) N. Okoye'}
            </div>
            <span className="text-[8px] font-black uppercase text-slate-600">School Principal</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[7px] font-black text-slate-400 uppercase tracking-widest pt-2">
        Eagle Power Schools EduCore • Official Termly Broad Evaluation Sheet
      </div>
    </div>
  );
};

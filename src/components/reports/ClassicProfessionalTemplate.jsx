import React from 'react';

export const ClassicProfessionalTemplate = ({ data }) => {
  if (!data) return null;
  const { school = {}, student = {}, scores = {}, extras = {} } = data;
  const subjectKeys = Object.keys(scores);
  const totalScoreObtained = subjectKeys.reduce((acc, sub) => acc + (scores[sub]?.total || 0), 0);
  const totalObtainable = subjectKeys.length * 100;
  const percentage = totalObtainable > 0 ? Number(((totalScoreObtained / totalObtainable) * 100).toFixed(1)) : 0;

  return (
    <div className="bg-white w-[21cm] min-h-[29.7cm] p-[0.8cm] font-serif text-black border-[10px] border-double border-slate-900 mx-auto overflow-hidden print:m-0 print:border-[8px] print:shadow-none relative">
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

      <div className="border border-black p-5 h-full flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div className="w-16 h-16 border border-black p-1 flex items-center justify-center">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-xs font-bold text-center">CREST</div>
              )}
            </div>
            <div className="text-center flex-grow px-3">
              <h1 className="text-xl font-bold uppercase tracking-wide leading-tight">{school.name}</h1>
              {school.motto && <p className="text-[10px] italic">"{school.motto}"</p>}
              <p className="text-[9px] uppercase font-bold tracking-wider leading-relaxed">{school.address}</p>
              <p className="text-[8px] text-gray-600">{school.contact} • {school.email}</p>
            </div>
            <div className="w-16 h-16 border border-black flex flex-col items-center justify-center text-center p-1 bg-gray-50">
              <div className="text-[8px] font-bold uppercase text-gray-500">Student<br/>Photo</div>
            </div>
          </div>

          <div className="text-center mb-3">
            <h2 className="text-sm font-bold underline uppercase tracking-widest">Continuous Assessment & Terminal Report Card</h2>
            <p className="text-xs font-bold mt-0.5">{school.term}, {school.session} Academic Session</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-4 text-xs border border-black p-2.5 bg-gray-50/50">
            <div className="flex gap-2 items-end"><span className="font-bold">Pupil's Name:</span> <span className="border-b border-dotted border-black flex-grow truncate">{student.name}</span></div>
            <div className="flex gap-2 items-end"><span className="font-bold">Admission No:</span> <span className="border-b border-dotted border-black flex-grow">{student.admissionNo}</span></div>
            <div className="flex gap-2 items-end"><span className="font-bold">Class / Arm:</span> <span className="border-b border-dotted border-black flex-grow">{student.className}</span></div>
            <div className="flex gap-2 items-end"><span className="font-bold">Class Position:</span> <span className="border-b border-dotted border-black flex-grow font-bold">{student.position || '1st'} of {student.classSize || 1}</span></div>
          </div>

          {/* Scores Table */}
          <table className="w-full border-collapse border border-black text-[11px] mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1 text-left uppercase font-bold">Subjects</th>
                <th className="border border-black px-1 py-1 text-center w-12 font-bold">CA 1</th>
                <th className="border border-black px-1 py-1 text-center w-12 font-bold">CA 2</th>
                <th className="border border-black px-1 py-1 text-center w-12 font-bold">Exam</th>
                <th className="border border-black px-1 py-1 text-center w-12 font-bold">Total</th>
                <th className="border border-black px-1 py-1 text-center w-12 font-bold">Grade</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {subjectKeys.map((sub) => {
                const sc = scores[sub] || {};
                return (
                  <tr key={sub}>
                    <td className="border border-black px-2 py-1 font-bold uppercase">{sub}</td>
                    <td className="border border-black px-1 py-1 text-center">{sc.ca1 ?? '-'}</td>
                    <td className="border border-black px-1 py-1 text-center">{sc.ca2 ?? '-'}</td>
                    <td className="border border-black px-1 py-1 text-center">{sc.exam ?? '-'}</td>
                    <td className="border border-black px-1 py-1 text-center font-bold">{sc.total ?? 0}</td>
                    <td className="border border-black px-1 py-1 text-center font-bold">{sc.grade ?? '-'}</td>
                    <td className="border border-black px-2 py-1 text-left italic text-[10px]">{sc.remark ?? '-'}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold border-t-2 border-black">
                <td className="border border-black px-2 py-1 uppercase text-right">Overall Total / Avg</td>
                <td colSpan={3} className="border border-black"></td>
                <td className="border border-black px-1 py-1 text-center font-black">{totalScoreObtained}</td>
                <td className="border border-black px-1 py-1 text-center">{percentage}%</td>
                <td className="border border-black px-2 py-1 uppercase">{percentage >= 75 ? 'Distinction' : 'Passed'}</td>
              </tr>
            </tbody>
          </table>

          {/* Comments & Evaluation */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
            <div className="border border-black p-2">
              <b className="block text-[10px] uppercase underline mb-1">Form Teacher's Report:</b>
              <p className="italic text-[10px] leading-snug">
                "{extras?.comments?.teacher || 'An attentive and disciplined student with commendable classroom participation.'}"
              </p>
            </div>
            <div className="border border-black p-2">
              <b className="block text-[10px] uppercase underline mb-1">Principal's Decision & Remarks:</b>
              <p className="italic text-[10px] leading-snug">
                "{extras?.comments?.principal || 'Sterling performance. Maintain this high academic benchmark.'}"
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Signatures */}
        <div>
          <div className="grid grid-cols-2 gap-12 px-6 pt-3 text-center text-xs">
            <div>
              <div className="h-6 border-b border-black mb-1"></div>
              <span className="font-bold uppercase tracking-wider text-[10px]">Class Teacher's Signature</span>
            </div>
            <div>
              <div className="h-6 border-b border-black mb-1 font-serif italic text-xs">{school.principal || 'Dr. (Mrs) N. Okoye'}</div>
              <span className="font-bold uppercase tracking-wider text-[10px]">Principal's Signature & Stamp</span>
            </div>
          </div>
          <div className="text-center text-[8px] text-gray-500 uppercase tracking-widest mt-3">
            Eagle Power Schools • Official Terminal Academic Record
          </div>
        </div>
      </div>
    </div>
  );
};

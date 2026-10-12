import React from 'react';

export const NurseryColorfulTemplate = ({ data }) => {
  if (!data) return null;
  const { school = {}, student = {}, scores = {}, extras = {} } = data;
  const subjectKeys = Object.keys(scores);

  return (
    <div className="bg-white w-[21cm] min-h-[29.7cm] p-[0.8cm] font-sans text-gray-800 mx-auto overflow-hidden print:m-0 print:p-[0.6cm] print:shadow-none relative border-[6px] border-amber-400 rounded-[2.5rem]">
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

      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-white rounded-full shadow-md mx-auto mb-2 flex items-center justify-center border-4 border-amber-400 p-1 overflow-hidden">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl">🌟</span>
          )}
        </div>
        <h1 className="text-2xl font-black text-amber-600 tracking-tight uppercase leading-none mb-1">
          {school.name || 'Eagle Power Early Years & Nursery'}
        </h1>
        {school.motto && <p className="text-[10px] font-bold text-gray-400 italic mb-2">"{school.motto}"</p>}
        <div className="inline-block px-5 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-sm mb-1">
          Nursery & Early Childhood Progress Report
        </div>
        <p className="text-[10px] font-bold text-gray-500">{school.term} • {school.session} Session</p>
      </div>

      {/* Pupil Banner */}
      <div className="bg-amber-50/60 rounded-[1.5rem] p-3 border-2 border-dashed border-amber-200 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
          {student.gender === 'Female' ? '👧' : '👦'}
        </div>
        <div className="grid grid-cols-3 gap-4 flex-grow text-xs">
          <div>
            <span className="text-[9px] font-black text-amber-500 uppercase block mb-0.5">Little Scholar</span>
            <span className="text-base font-black text-gray-800 leading-none truncate block">{student.name}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-amber-500 uppercase block mb-0.5">Admission ID</span>
            <span className="font-extrabold text-gray-700">{student.admissionNo}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-amber-500 uppercase block mb-0.5">Class / Stage</span>
            <span className="font-black text-amber-600">{student.className}</span>
          </div>
        </div>
      </div>

      {/* Early Learning Areas Grid */}
      <div className="mb-4">
        <h3 className="text-[10px] font-black uppercase text-amber-700 tracking-widest mb-2 flex items-center gap-1.5">
          <span>🎨</span> Core Developmental Learning Areas
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {subjectKeys.map((sub, i) => {
            const sc = scores[sub] || {};
            const bg = ['bg-rose-50 border-rose-200 text-rose-800', 'bg-emerald-50 border-emerald-200 text-emerald-800', 'bg-sky-50 border-sky-200 text-sky-800', 'bg-violet-50 border-violet-200 text-violet-800', 'bg-amber-50 border-amber-200 text-amber-800'][i % 5];
            return (
              <div key={sub} className={`p-2.5 rounded-2xl border ${bg} flex items-center justify-between`}>
                <div>
                  <span className="font-black block text-[11px]">{sub}</span>
                  <span className="text-[9px] opacity-75 font-semibold">{sc.remark || 'Active Participation'}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black block">{sc.total || 85}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider">{sc.grade || 'A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Developmental Skills & Milestones */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div className="bg-sky-50/60 rounded-2xl border border-sky-200 p-3 space-y-1.5">
          <h4 className="text-[9px] font-black uppercase text-sky-700 tracking-wider">🌟 Social & Emotional Growth</h4>
          <div className="text-[10px] font-bold text-slate-700 space-y-1">
            <div className="flex justify-between"><span>Plays cooperatively with peers:</span> <span className="text-sky-700">⭐⭐⭐⭐⭐</span></div>
            <div className="flex justify-between"><span>Follows routine instructions:</span> <span className="text-sky-700">⭐⭐⭐⭐⭐</span></div>
            <div className="flex justify-between"><span>Expresses thoughts clearly:</span> <span className="text-sky-700">⭐⭐⭐⭐</span></div>
            <div className="flex justify-between"><span>Shares toys and materials:</span> <span className="text-sky-700">⭐⭐⭐⭐⭐</span></div>
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-3 space-y-1.5">
          <h4 className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">🏃 Motor & Physical Skills</h4>
          <div className="text-[10px] font-bold text-slate-700 space-y-1">
            <div className="flex justify-between"><span>Pencil / Crayon Grip:</span> <span className="text-emerald-700">⭐⭐⭐⭐⭐</span></div>
            <div className="flex justify-between"><span>Coloring within boundaries:</span> <span className="text-emerald-700">⭐⭐⭐⭐</span></div>
            <div className="flex justify-between"><span>Rhymes & Singing:</span> <span className="text-emerald-700">⭐⭐⭐⭐⭐</span></div>
            <div className="flex justify-between"><span>Physical coordination:</span> <span className="text-emerald-700">⭐⭐⭐⭐⭐</span></div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className="bg-amber-50/40 rounded-2xl border border-amber-200 p-3 mb-4 space-y-2 text-xs">
        <div>
          <b className="text-amber-800 text-[10px] uppercase block mb-0.5">Teacher's Sweet Words:</b>
          <p className="italic text-slate-700 text-[11px]">
            "{extras?.comments?.teacher || 'A bright, lively, and joyful child who loves singing rhymes and making friends. Keep shining!'}"
          </p>
        </div>
        <div>
          <b className="text-amber-800 text-[10px] uppercase block mb-0.5">Head of Early Years:</b>
          <p className="italic text-slate-700 text-[11px]">
            "{extras?.comments?.principal || 'Wonderful developmental milestones achieved this term. Promoted with pride to the next class!'}"
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-10 px-8 pt-1 text-center">
        <div>
          <div className="h-8 border-b-2 border-amber-300 flex items-center justify-center italic text-xs text-amber-800">Class Teacher Signed</div>
          <span className="text-[9px] font-black uppercase text-gray-500">Early Years Teacher</span>
        </div>
        <div>
          <div className="h-8 border-b-2 border-amber-300 flex items-center justify-center font-serif italic text-sm text-amber-900 font-bold">
            {school.principal || 'Dr. (Mrs) N. Okoye'}
          </div>
          <span className="text-[9px] font-black uppercase text-gray-500">School Head</span>
        </div>
      </div>
    </div>
  );
};

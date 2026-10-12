import React, { useState } from 'react';

export default function Logo({ size = "md", light = false }) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const textClasses = {
    sm: { title: "text-sm font-bold", subtitle: "text-[10px]" },
    md: { title: "text-base font-extrabold tracking-tight", subtitle: "text-[11px] font-semibold" },
    lg: { title: "text-xl font-extrabold tracking-tight", subtitle: "text-xs font-semibold" },
    xl: { title: "text-2xl font-extrabold tracking-tight", subtitle: "text-sm font-semibold" }
  };

  return (
    <div className="flex items-center gap-3 group select-none">
      <div className={`relative flex items-center justify-center rounded-2xl bg-white p-0.5 shadow-md ring-2 ring-amber-400/50 transition-transform duration-300 group-hover:scale-105 shrink-0 overflow-hidden ${sizeClasses[size]}`}>
        {!imgError ? (
          <img
            src="/assets/official-logo.jpg"
            alt="Eagle Power School of Excellence Crest"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="#6B2D18" stroke="#F59E0B" strokeWidth="4" />
            <circle cx="50" cy="50" r="38" fill="#FCE7D6" />
            <path d="M50 26 C45 32 30 36 24 32 C30 40 40 42 46 42 C47 45 44 50 38 52 C45 53 50 48 50 46 C50 48 55 53 62 52 C56 50 53 45 54 42 C60 42 70 40 76 32 C70 36 55 32 50 24 Z" fill="#1E293B" />
            <polygon points="50,18 40,24 50,30 60,24" fill="#0F172A" />
            <path d="M36 54 C42 50 48 52 50 56 C52 52 58 50 64 54 V66 C58 62 52 63 50 68 C48 63 42 62 36 66 V54 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
          </svg>
        )}
      </div>

      <div className="flex flex-col text-left">
        <span className={`${textClasses[size].title} leading-tight ${light ? 'text-white' : 'text-slate-900'} flex items-center gap-1`}>
          EAGLE POWER <span className="text-amber-500 font-black">SCHOOLS</span>
        </span>
        <span className={`${textClasses[size].subtitle} leading-none mt-0.5 tracking-wider uppercase ${light ? 'text-amber-300' : 'text-amber-700'}`}>
          Awka &bull; Love, Truth & Service
        </span>
      </div>
    </div>
  );
}

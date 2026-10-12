import React, { useState } from 'react';
import { X, Mail, MessageCircle, Link, Check, Smartphone } from 'lucide-react';

export default function ShareReportModal({ isOpen, onClose, studentName, reportLink }) {
  const [copied, setCopied] = useState(false);
  const finalLink = reportLink || window.location.href;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = `Eagle Power Schools — Official Terminal Academic Report Sheet for ${studentName || 'Student'}.\nView and download verified report card here:\n${finalLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = `Eagle Power Schools: Terminal Academic Report for ${studentName || 'Student'}`;
    const body = `Dear Parent/Guardian,\n\nPlease find the official terminal examination report card for ${studentName || 'your child'} online at the following secure portal link:\n\n${finalLink}\n\nSchool Motto: Love, Truth & Service\nEagle Power Schools Administration`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSMS = () => {
    const text = `Eagle Power Schools report card for ${studentName} is ready: ${finalLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-[#0D2342] to-indigo-900 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Share Report Card</h2>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Transmit {studentName}'s result to parents/guardians</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Grid */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl transition-all border border-green-200"
            >
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-md">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">WhatsApp</span>
            </button>
            
            <button 
              onClick={handleEmail}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-all border border-blue-200"
            >
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Email</span>
            </button>

            <button 
              onClick={handleSMS}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl transition-all border border-amber-200"
            >
              <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">SMS</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">or copy report link</span></div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={finalLink}
              className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            />
            <button 
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Link className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

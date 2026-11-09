import React, { useState, useRef, useEffect } from 'react';
import {
  CreditCard,
  Printer,
  Upload,
  PenTool,
  Check,
  X,
  User,
  ShieldCheck,
  Sparkles,
  Camera,
  Trash2,
  QrCode,
  Phone,
  Droplet,
  Calendar,
  AlertCircle,
  RotateCw,
  Award
} from 'lucide-react';
import { getApiBase, apiFetch } from '../../config/api';

/**
 * StaffIDCardModal
 * Provides staff with a printable official identity card badge,
 * profile picture uploader, and digital signature drawing/upload pad.
 */
export default function StaffIDCardModal({
  isOpen,
  onClose,
  targetStaff,
  currentUser,
  onProfileUpdated
}) {
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'upload_photo' | 'signature'
  const [cardSide, setCardSide] = useState('front'); // 'front' | 'back' | 'both'
  const [photoPreview, setPhotoPreview] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Canvas ref for signature drawing
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Determine active staff record
  const staffMember = targetStaff || currentUser?.staff || currentUser || {};
  const isSelf = !targetStaff || (currentUser && (targetStaff.staff_no === currentUser.reference_id || targetStaff.id === currentUser.id));

  // Initialize data on mount or target change
  useEffect(() => {
    if (!isOpen) return;
    const initialPhoto = staffMember.photo_url || currentUser?.avatar_url || '';
    const initialSig = staffMember.signature_url || currentUser?.signature_url || '';
    setPhotoPreview(initialPhoto);
    setSignaturePreview(initialSig);
    setBloodGroup(staffMember.blood_group || 'O+');
    setEmergencyContact(staffMember.emergency_contact || staffMember.phone || '+234 907 558 0671');
    setContactPhone(staffMember.phone || '');
    setSaveSuccess('');
    setSaveError('');
    setActiveTab('card');
  }, [isOpen, targetStaff, currentUser]);

  // Setup Canvas context when switching to signature tab
  useEffect(() => {
    if (activeTab === 'signature' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0284c7'; // Crisp royal blue pen ink
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const staffNo = staffMember.staff_no || staffMember.reference_id || (staffMember.role === 'superadmin' ? 'EPS-DIR-01' : 'EPS-STF-01');
  const staffName = staffMember.name || staffMember.full_name || 'Staff Member';
  const staffRole = staffMember.role || (currentUser?.role === 'superadmin' ? 'Proprietor & Director' : 'Academic Faculty');
  const assignedClass = staffMember.assigned_class || 'General Faculty';
  const staffQual = staffMember.qualification || 'B.Ed / NCE (Verified)';
  const currentYear = new Date().getFullYear();
  const issueDate = `09/${currentYear}`;
  const expiryDate = `08/${currentYear + 3}`;

  // Drawing Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const applyDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignaturePreview(dataUrl);
    setSaveSuccess('Digital signature applied! Click "Save Credentials" to save permanently.');
  };

  // Image Upload Handlers
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Image file is too large. Please select a photo under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image client-side to 500x500 square for crisp, fast rendering
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPhotoPreview(optimizedDataUrl);
        setSaveSuccess('Photo loaded! Click "Save Credentials" to persist.');
        setSaveError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignaturePreview(event.target.result);
      setSaveSuccess('Signature image loaded! Click "Save Credentials" to persist.');
      setSaveError('');
    };
    reader.readAsDataURL(file);
  };

  // Persist Profile Picture and Signature via API
  const handleSaveCredentials = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload = {
        photo_url: photoPreview,
        signature_url: signaturePreview,
        blood_group: bloodGroup,
        emergency_contact: emergencyContact,
        phone: contactPhone
      };

      const res = await apiFetch(`${getApiBase()}/staff/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update credentials.');
      }

      setSaveSuccess('Staff credentials and ID Card assets saved successfully!');
      if (onProfileUpdated) {
        onProfileUpdated(data.staff || data.user || payload);
      }
    } catch (err) {
      setSaveError(err.message || 'Unable to update credentials. Please check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Print Action
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:max-w-none print:w-full">
        
        {/* Top Header Controls (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Official Staff Identity Card & Credentials</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/30">
                  {staffNo}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Institutional badge, portrait photograph & authorized signature management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCard}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all hover:scale-102"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ID Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector (Hidden during print) */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2 print:hidden">
          <button
            onClick={() => setActiveTab('card')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'card'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Official ID Badge (CR80)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload_photo')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'upload_photo'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'signature'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Digital Signature Studio</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[78vh] print:p-0 print:max-h-none print:overflow-visible">
          
          {/* Alerts */}
          {saveSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 print:hidden">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{saveSuccess}</span>
            </div>
          )}
          {saveError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2 print:hidden">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{saveError}</span>
            </div>
          )}

          {/* TAB 1: ID BADGE VIEW & PRINT */}
          {activeTab === 'card' && (
            <div className="space-y-6">
              {/* Orientation / View Switcher (Screen only) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800 text-xs print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Display Badge:</span>
                  <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
                    <button
                      onClick={() => setCardSide('both')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardSide === 'both' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Dual Side (Print View)
                    </button>
                    <button
                      onClick={() => setCardSide('front')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardSide === 'front' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Front Face
                    </button>
                    <button
                      onClick={() => setCardSide('back')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardSide === 'back' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Back Face
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">
                    Standard CR80 Vertical Card (3.375" x 2.125" / 85.6mm x 54mm)
                  </span>
                  <button
                    onClick={handlePrintCard}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 shadow"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Ready</span>
                  </button>
                </div>
              </div>

              {/* PRINTABLE BADGE CONTAINER */}
              <div id="staff-id-printable-area" className="flex flex-wrap items-center justify-center gap-8 py-4 print:py-0 print:gap-4 print:block">
                
                {/* 1. FRONT OF ID CARD */}
                {(cardSide === 'front' || cardSide === 'both') && (
                  <div className="staff-id-badge relative w-[320px] h-[500px] rounded-2xl bg-gradient-to-b from-[#091529] via-[#0d1e38] to-[#071120] text-white p-4 flex flex-col justify-between shadow-2xl border-2 border-amber-400/60 overflow-hidden print:inline-block print:m-2 print:border-amber-500 print:shadow-none">
                    
                    {/* Security Guilloche Watermark / Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-amber-400/5 blur-2xl pointer-events-none" />
                    
                    {/* Lanyard Punch Hole Indicator */}
                    <div className="w-12 h-2 rounded-full bg-slate-800/80 border border-slate-700 mx-auto -mt-1 shrink-0 print:border-slate-400" />

                    {/* Top Header Banner */}
                    <div className="text-center space-y-1 relative z-10 pt-1">
                      <div className="flex items-center justify-center gap-2">
                        <img
                          src="/assets/real-logo-enhanced.png"
                          alt="Eagle Power Schools"
                          className="w-10 h-10 object-contain drop-shadow"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="text-left">
                          <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                            EAGLE POWER SCHOOLS
                          </h4>
                          <p className="text-[8.5px] font-bold text-amber-400 tracking-wider uppercase">
                            Love, Truth & Service
                          </p>
                        </div>
                      </div>

                      <div className="py-0.5 px-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-[9.5px] tracking-widest uppercase shadow-sm">
                        STAFF IDENTITY CARD
                      </div>
                    </div>

                    {/* Middle: Portrait Photo & Identity */}
                    <div className="flex flex-col items-center text-center space-y-2 relative z-10">
                      
                      {/* Photo Frame */}
                      <div className="relative group">
                        <div className="w-28 h-32 rounded-xl bg-slate-800 border-2 border-amber-400/80 shadow-lg overflow-hidden flex items-center justify-center relative">
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt={staffName}
                              className="w-full h-full object-cover object-center"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                              <User className="w-12 h-12 text-slate-500 mb-1" />
                              <span className="text-[9px] font-bold">Photo Pending</span>
                            </div>
                          )}
                        </div>

                        {/* Gold Security Seal Badge */}
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-slate-950 font-black flex items-center justify-center shadow-md border border-white/60">
                          <ShieldCheck className="w-4 h-4 text-slate-950" />
                        </div>
                      </div>

                      {/* Staff Name & Title */}
                      <div className="space-y-0.5 w-full px-2">
                        <h3 className="text-base font-black text-white uppercase tracking-tight line-clamp-1">
                          {staffName}
                        </h3>
                        <p className="text-xs font-bold text-amber-400 line-clamp-1">
                          {staffRole}
                        </p>
                        <p className="text-[9.5px] text-slate-300 line-clamp-1 font-medium">
                          {assignedClass}
                        </p>
                      </div>

                      {/* Staff ID Pill */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-amber-400/40 text-amber-300 font-mono text-xs font-black">
                        <span>ID:</span>
                        <span className="tracking-wider">{staffNo}</span>
                      </div>
                    </div>

                    {/* Bottom Metadata & Authorized Signature */}
                    <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-300 space-y-2 relative z-10">
                      <div className="flex justify-between items-center px-1">
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Issued</span>
                          <span className="font-bold text-white font-mono">{issueDate}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block text-[8px] uppercase">Blood Group</span>
                          <span className="font-black text-amber-400">{bloodGroup}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[8px] uppercase">Expires</span>
                          <span className="font-bold text-white font-mono">{expiryDate}</span>
                        </div>
                      </div>

                      {/* Registrar Authorized Stamp */}
                      <div className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                        <div className="text-[8px] text-slate-400 leading-tight">
                          <span className="font-bold text-white block">Adaeze Uzoefuna</span>
                          <span>Vice Principal (Academics)</span>
                        </div>
                        <div className="text-right text-[8px] text-amber-400 font-bold font-mono">
                          VALIDATED
                        </div>
                      </div>
                    </div>

                    {/* Security Microprint footer */}
                    <div className="text-center text-[7.5px] text-slate-500 font-mono tracking-tighter uppercase border-t border-slate-900 pt-1">
                      EPS • ANAMBRA STATE MINISTRY OF EDUCATION APPROVED
                    </div>
                  </div>
                )}

                {/* 2. BACK OF ID CARD */}
                {(cardSide === 'back' || cardSide === 'both') && (
                  <div className="staff-id-badge relative w-[320px] h-[500px] rounded-2xl bg-gradient-to-b from-[#091529] via-[#0d1e38] to-[#071120] text-white p-4 flex flex-col justify-between shadow-2xl border-2 border-slate-700 overflow-hidden print:inline-block print:m-2 print:border-slate-500 print:shadow-none">
                    
                    {/* Top Terms */}
                    <div className="space-y-2 relative z-10">
                      <div className="text-center pb-2 border-b border-slate-800">
                        <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                          TERMS & CONDITIONS
                        </h4>
                        <p className="text-[7.5px] text-slate-400 leading-tight mt-0.5">
                          Official Institutional Identity Card of Eagle Power Schools
                        </p>
                      </div>

                      <div className="text-[8px] text-slate-300 space-y-1.5 leading-relaxed bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                        <p>
                          1. This card is the property of <strong>Eagle Power Schools</strong> and must be produced upon official request.
                        </p>
                        <p>
                          2. Loss of this credential must be reported immediately to the School Administration.
                        </p>
                        <p>
                          3. If found, please return to:
                          <span className="block font-bold text-white mt-0.5">
                            2 & 9 Amikwo Road, Awka, Anambra State
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Emergency Contacts & Staff Signature */}
                    <div className="space-y-3 relative z-10">
                      {/* Emergency Contacts */}
                      <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                        <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                          <span className="text-slate-400 block text-[7.5px] uppercase">Emergency Phone</span>
                          <span className="font-bold text-white font-mono">{emergencyContact || contactPhone || '+234 907 558 0671'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                          <span className="text-slate-400 block text-[7.5px] uppercase">School Line</span>
                          <span className="font-bold text-amber-400 font-mono">09075580671</span>
                        </div>
                      </div>

                      {/* Cardholder Signature Box */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8.5px]">
                          <span className="text-slate-400 font-bold uppercase">Cardholder Signature:</span>
                          <span className="text-[7.5px] text-slate-500 font-mono">AUTHORIZED</span>
                        </div>
                        <div className="w-full h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 overflow-hidden relative">
                          {signaturePreview ? (
                            <img
                              src={signaturePreview}
                              alt="Staff Signature"
                              className="max-h-full max-w-full object-contain filter invert-0 drop-shadow"
                            />
                          ) : (
                            <span className="text-[8px] text-slate-500 italic">Signature not yet recorded</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: QR Code & Security Barcode */}
                    <div className="space-y-2 relative z-10 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        {/* QR Code Container */}
                        <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                          {/* Generated QR visual */}
                          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-white text-[7px] font-mono font-bold p-0.5 text-center leading-none">
                            <QrCode className="w-9 h-9 text-white" />
                          </div>
                        </div>

                        {/* Barcode graphic */}
                        <div className="grow space-y-1">
                          <div className="h-7 w-full flex items-center justify-between px-1 bg-white/95 rounded">
                            {/* Simulated barcode bars */}
                            {[2,4,1,3,2,5,1,2,4,2,3,1,5,2,1,3,4,2,1,3,2,4,1,2,3,4].map((w, i) => (
                              <div
                                key={i}
                                className="bg-slate-950 h-5"
                                style={{ width: `${w}px` }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-400">
                            <span>EPS-SEC-VAL</span>
                            <span className="font-bold text-white">{staffNo}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-[7.5px] text-slate-400 font-mono">
                        www.eaglepowerschools.com.ng • info@eaglepowerschools.com.ng
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD PHOTO */}
          {activeTab === 'upload_photo' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Official Staff Photograph</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Upload a clear, forward-facing passport photograph with a plain background. This photograph will be embossed on your printable official Staff ID Card and portal profile.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                  {/* Photo Preview Frame */}
                  <div className="w-32 h-36 rounded-2xl bg-slate-900 border-2 border-amber-400/60 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <User className="w-12 h-12 mb-1" />
                        <span className="text-[10px]">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-3 w-full">
                    <label className="block w-full cursor-pointer">
                      <span className="sr-only">Choose profile photo</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handlePhotoUpload}
                        className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-500 cursor-pointer"
                      />
                    </label>

                    <p className="text-[11px] text-slate-400">
                      Recommended: High resolution passport photograph (JPG, PNG, max 5MB).
                    </p>

                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => setPhotoPreview('')}
                        className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional ID Card Profile Details */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-400" />
                  <span>Medical & Emergency Contact for ID Card</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Emergency Phone Number</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Preview on Card
                </button>
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Credentials'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SIGNATURE STUDIO */}
          {activeTab === 'signature' && (
            <div className="space-y-6 max-w-xl mx-auto">
              {/* Option A: Draw Signature */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <PenTool className="w-4 h-4 text-amber-400" />
                    <span>Draw Digital Signature</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Mouse or Touch</span>
                </div>

                <p className="text-slate-400 leading-relaxed">
                  Sign directly inside the signature box below. Your digital signature will appear on your staff ID badge and academic broadsheets.
                </p>

                {/* Signature Canvas Pad */}
                <div className="space-y-2">
                  <div className="w-full h-40 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 hover:border-amber-400/50 transition-colors flex items-center justify-center relative touch-none">
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-full cursor-crosshair rounded-2xl"
                    />
                    {!hasDrawn && (
                      <div className="absolute pointer-events-none text-slate-500 flex items-center gap-1.5 text-xs">
                        <PenTool className="w-4 h-4" />
                        <span>Sign your name here</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Clear Pad</span>
                    </button>

                    <button
                      type="button"
                      onClick={applyDrawnSignature}
                      disabled={!hasDrawn}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Signature</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Option B: Upload Signature Scan */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Or Upload Signature Scan (PNG/JPG)</span>
                </div>
                <p className="text-slate-400">
                  If you have a clean digital scan of your physical signature on white paper, you can upload it here.
                </p>

                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleSignatureUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              {/* Current Active Signature Preview */}
              {signaturePreview && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-slate-300">Active Signature Preview:</span>
                  <div className="h-16 w-full rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center">
                    <img
                      src={signaturePreview}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain filter invert-0"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Preview on Card
                </button>
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Credentials'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer (Screen only) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Institution Credential • Eagle Power Schools ID Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold"
          >
            Close
          </button>
        </div>

      </div>

      {/* PRINT-ONLY STYLES INJECTION */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #staff-id-printable-area, #staff-id-printable-area * {
                visibility: visible;
              }
              #staff-id-printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                display: flex !important;
                flex-direction: row !important;
                justify-content: center !important;
                gap: 20px !important;
                background: white !important;
              }
              .staff-id-badge {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-shadow: none !important;
                page-break-inside: avoid !important;
              }
            }
          `
        }}
      />
    </div>
  );
}

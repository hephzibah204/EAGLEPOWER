import React, { useState } from 'react';
import { 
  Calculator, 
  Check, 
  ArrowRight, 
  Receipt, 
  FileCheck
} from 'lucide-react';
import { schoolInfo } from '../data/schoolData';

export default function FeeEstimator({ onOpenAdmission }) {
  const { divisions, studentTypes, optionalServices } = schoolInfo.feeEstimatorData;

  const [selectedDivision, setSelectedDivision] = useState(divisions[1].id);
  const [selectedStudentType, setSelectedStudentType] = useState(studentTypes[0].id);
  const [selectedServices, setSelectedServices] = useState(['lunch', 'uniforms']);
  const [copiedEstimate, setCopiedEstimate] = useState(false);

  // Find objects
  const currentDiv = divisions.find(d => d.id === selectedDivision) || divisions[0];
  const currentType = studentTypes.find(t => t.id === selectedStudentType) || studentTypes[0];

  // Calculation
  const baseTuition = currentDiv.tuitionBase;
  const regFee = currentType.regFee;
  const devLevy = currentType.developmentLevy;

  const servicesTotal = selectedServices.reduce((sum, serviceId) => {
    const s = optionalServices.find(item => item.id === serviceId);
    return sum + (s ? s.cost : 0);
  }, 0);

  const grandTotal = baseTuition + regFee + devLevy + servicesTotal;

  const toggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const formatNaira = (amount) => {
    return '₦' + amount.toLocaleString('en-NG');
  };

  const handleCopySummary = () => {
    const summary = `Eagle Power Schools - Fee Estimate:
Division: ${currentDiv.name} (${formatNaira(baseTuition)})
Student Type: ${currentType.name}
Registration & Levy: ${formatNaira(regFee + devLevy)}
Optional Services Total: ${formatNaira(servicesTotal)}
ESTIMATED TOTAL: ${formatNaira(grandTotal)} / Term
Contact: ${schoolInfo.phone} | ${schoolInfo.email}`;

    navigator.clipboard.writeText(summary);
    setCopiedEstimate(true);
    setTimeout(() => setCopiedEstimate(false), 3000);
  };

  return (
    <section id="tuition" className="py-20 lg:py-28 bg-slate-100/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5 text-amber-700" />
            <span>Transparent Investment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Interactive Tuition & Fee Estimator
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            We maintain crystal-clear transparency with zero hidden charges. Configure your child's grade level and desired auxiliary services to calculate your estimated termly commitment.
          </p>
        </div>

        {/* Estimator Interactive Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg space-y-8">
            
            {/* Step 1: Choose Division */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">
                1. Select Academic Wing
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {divisions.map((div) => {
                  const isChecked = selectedDivision === div.id;
                  return (
                    <button
                      key={div.id}
                      type="button"
                      onClick={() => setSelectedDivision(div.id)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        isChecked 
                          ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-400' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{div.name}</span>
                        {isChecked && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{div.desc}</p>
                      <div className="mt-2 text-xs font-extrabold text-amber-700">
                        {formatNaira(div.tuitionBase)} <span className="text-[10px] font-normal text-slate-400">/ term</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Student Type */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">
                2. Enrollment Status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentTypes.map((type) => {
                  const isChecked = selectedStudentType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedStudentType(type.id)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        isChecked 
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-sm">
                        <span>{type.name}</span>
                        {isChecked && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className={`mt-1.5 text-xs ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                        {type.regFee > 0 
                          ? `Includes Registration (${formatNaira(type.regFee)}) + Development Levy` 
                          : 'No new registration fees applied'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Optional Auxiliary Services */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">
                3. Optional Auxiliary Services & Programs
              </label>
              <div className="space-y-2.5">
                {optionalServices.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-50/40 border-amber-400/80' 
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected 
                            ? 'bg-amber-500 border-amber-500 text-white' 
                            : 'bg-white border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{service.name}</div>
                          <div className="text-xs text-slate-500">{service.desc}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        +{formatNaira(service.cost)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Breakdown & Grand Total Card (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 sticky top-28">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Estimated Fee Breakdown</h3>
              </div>
              <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full">
                Per Term
              </span>
            </div>

            {/* Selected itemized list */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Tuition: {currentDiv.name}</span>
                <span className="font-semibold text-white">{formatNaira(baseTuition)}</span>
              </div>

              {regFee > 0 && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>One-off Registration & Prospectus</span>
                  <span className="font-semibold text-white">{formatNaira(regFee)}</span>
                </div>
              )}

              {devLevy > 0 && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Campus Maintenance & Dev Levy</span>
                  <span className="font-semibold text-white">{formatNaira(devLevy)}</span>
                </div>
              )}

              {selectedServices.map(id => {
                const s = optionalServices.find(item => item.id === id);
                if (!s) return null;
                return (
                  <div key={id} className="flex justify-between items-center text-slate-300">
                    <span>{s.name}</span>
                    <span className="font-semibold text-white">{formatNaira(s.cost)}</span>
                  </div>
                );
              })}
            </div>

            {/* Grand Total Highlight */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Total Estimated Termly Investment
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                {formatNaira(grandTotal)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                *Flexible installment plans are supported. Examination registration fees (WAEC/NECO/BECE) apply strictly in candidate classes.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <button
                onClick={() => onOpenAdmission(selectedDivision)}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Apply with this Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopySummary}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span>{copiedEstimate ? '✓ Estimate Copied to Clipboard!' : 'Copy / Share Fee Breakdown'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

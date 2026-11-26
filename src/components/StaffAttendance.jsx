import React, { useCallback, useEffect, useState } from 'react';
import { Clock, CalendarCheck2, LogIn, LogOut, RefreshCw, Users } from 'lucide-react';
import { getApiBase, apiFetch as fetch } from '../config/api';

// Staff Attendance (added 2026-11-26)
// - Every staff member sees "My Attendance": clock in / clock out for today
//   and their recent records, served by /api/staff-attendance/*.
// - Admin / SuperAdmin (the VP signs in as admin) additionally see the daily
//   Staff Attendance register for all staff, served by
//   /api/executive/staff-attendance, with one-tap status marking.
const STATUSES = ['Present', 'Absent', 'Late', 'On Leave'];

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });
}

function statusPill(status) {
  const styles = {
    Present: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    Absent: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
    Late: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    'On Leave': 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    'Not marked': 'bg-slate-700/40 text-slate-400 border-slate-600/40',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold ${styles[status] || styles['Not marked']}`}>
      {status}
    </span>
  );
}

export default function StaffAttendance({ authToken, activeRole }) {
  const API_BASE = getApiBase();
  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  }), [authToken]);

  const isExecutive = activeRole === 'admin' || activeRole === 'superadmin';

  // --- My Attendance state ---
  const [mine, setMine] = useState(null);
  const [mineError, setMineError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const loadMine = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/staff-attendance/mine`, { headers: headers() });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) { setMine(data); setMineError(''); }
      else setMineError(data?.message || 'Could not load your attendance.');
    } catch { setMineError('Could not load your attendance.'); }
  }, [API_BASE, headers]);

  useEffect(() => { loadMine(); }, [loadMine]);

  const clock = async (kind) => {
    setBusy(true); setNotice('');
    try {
      const res = await fetch(`${API_BASE}/staff-attendance/${kind}`, { method: 'POST', headers: headers(), body: JSON.stringify({}) });
      const data = await res.json().catch(() => null);
      setNotice(data?.message || (res.ok ? 'Done.' : 'Something went wrong.'));
      if (res.ok) await loadMine();
    } catch { setNotice('Network error. Please try again.'); }
    setBusy(false);
  };

  // --- Executive register state ---
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
  const [regDate, setRegDate] = useState(todayStr);
  const [register, setRegister] = useState(null);
  const [regError, setRegError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  const loadRegister = useCallback(async () => {
    if (!isExecutive) return;
    try {
      const res = await fetch(`${API_BASE}/executive/staff-attendance?date=${regDate}`, { headers: headers() });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) { setRegister(data); setRegError(''); }
      else setRegError(data?.message || 'Could not load the staff register.');
    } catch { setRegError('Could not load the staff register.'); }
  }, [API_BASE, headers, isExecutive, regDate]);

  useEffect(() => { loadRegister(); }, [loadRegister]);

  const mark = async (staffId, status) => {
    setMarkingId(staffId);
    try {
      await fetch(`${API_BASE}/executive/staff-attendance/mark`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ staff_id: staffId, date: regDate, status }),
      });
      await loadRegister();
    } catch { /* register reload shows the current truth */ }
    setMarkingId(null);
  };

  const today = mine?.today || null;

  return (
    <div className="space-y-5 animate-in fade-in">
      <div>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-amber-400" /> Staff Attendance
        </h3>
        <p className="text-xs text-slate-400">Mark your own attendance each school day. Leadership can view and correct the full register below.</p>
      </div>

      {/* MY ATTENDANCE CARD */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> My Attendance — Today
            </p>
            {mine?.staff && <p className="text-xs text-slate-400 mt-0.5">{mine.staff.name} · {mine.staff.staff_no}</p>}
          </div>
          {today ? statusPill(today.status) : statusPill('Not marked')}
        </div>

        {mineError && <p className="mt-3 text-xs font-bold text-rose-300">{mineError}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-300">
          <span>Clock in: <strong className="text-white">{fmtTime(today?.clock_in)}</strong></span>
          <span>Clock out: <strong className="text-white">{fmtTime(today?.clock_out)}</strong></span>
          {today?.marked_by?.startsWith('admin:') && <span className="text-slate-400">(marked by leadership)</span>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => clock('clock-in')}
            disabled={busy || !!today?.clock_in}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 text-xs font-black shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-300"
          >
            <LogIn className="w-3.5 h-3.5" /> Clock In
          </button>
          <button
            onClick={() => clock('clock-out')}
            disabled={busy || !today?.clock_in || !!today?.clock_out}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-xs font-black border border-slate-600 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-600"
          >
            <LogOut className="w-3.5 h-3.5" /> Clock Out
          </button>
          <button
            onClick={loadMine}
            disabled={busy}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 text-xs font-bold border border-slate-700 transition hover:text-white disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        {notice && <p className="mt-3 text-xs font-bold text-amber-300">{notice}</p>}

        {mine?.records?.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-xs min-w-[420px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700/60">
                  <th className="py-2 pr-3 font-bold">Date</th>
                  <th className="py-2 pr-3 font-bold">Status</th>
                  <th className="py-2 pr-3 font-bold">Clock In</th>
                  <th className="py-2 font-bold">Clock Out</th>
                </tr>
              </thead>
              <tbody>
                {mine.records.map((r) => (
                  <tr key={r.attendance_date} className="border-b border-slate-800 text-slate-200">
                    <td className="py-2 pr-3 font-bold">{r.attendance_date}</td>
                    <td className="py-2 pr-3">{statusPill(r.status)}</td>
                    <td className="py-2 pr-3">{fmtTime(r.clock_in)}</td>
                    <td className="py-2">{fmtTime(r.clock_out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EXECUTIVE REGISTER */}
      {isExecutive && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> Staff Register — All Staff
            </p>
            <input
              type="date"
              value={regDate}
              onChange={(e) => setRegDate(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white"
            />
          </div>

          {regError && <p className="mt-3 text-xs font-bold text-rose-300">{regError}</p>}

          {register?.summary && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
              <span className="px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">{register.summary.present} Present</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">{register.summary.late} Late</span>
              <span className="px-2.5 py-1 rounded-full bg-rose-400/15 text-rose-300 border border-rose-400/30">{register.summary.absent} Absent</span>
              <span className="px-2.5 py-1 rounded-full bg-sky-400/15 text-sky-300 border border-sky-400/30">{register.summary.on_leave} On Leave</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-700/40 text-slate-300 border border-slate-600/40">{register.summary.not_marked} Not marked</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-200 border border-slate-700">{register.summary.total} Staff total</span>
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700/60">
                  <th className="py-2 pr-3 font-bold">Staff</th>
                  <th className="py-2 pr-3 font-bold">Status</th>
                  <th className="py-2 pr-3 font-bold">In</th>
                  <th className="py-2 pr-3 font-bold">Out</th>
                  <th className="py-2 font-bold">Mark</th>
                </tr>
              </thead>
              <tbody>
                {(register?.staff || []).map((s) => (
                  <tr key={s.staff_id} className="border-b border-slate-800 text-slate-200">
                    <td className="py-2 pr-3">
                      <span className="font-bold text-white">{s.name}</span>
                      <span className="block text-[11px] text-slate-400">{s.role}{s.assigned_class ? ` · ${s.assigned_class}` : ''}</span>
                    </td>
                    <td className="py-2 pr-3">{statusPill(s.status)}</td>
                    <td className="py-2 pr-3">{fmtTime(s.clock_in)}</td>
                    <td className="py-2 pr-3">{fmtTime(s.clock_out)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            onClick={() => mark(s.staff_id, st)}
                            disabled={markingId === s.staff_id || s.status === st}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition disabled:opacity-40 ${s.status === st ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'}`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {register && register.staff.length === 0 && (
              <p className="py-4 text-xs text-slate-400">No staff records found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

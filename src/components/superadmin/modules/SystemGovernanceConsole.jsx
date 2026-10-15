import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Database,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Activity,
  History,
  Save,
  Server,
  FileCheck,
  Building,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import { getApiBase } from '../../../config/api';

export default function SystemGovernanceConsole({ authToken }) {
  const API_BASE = getApiBase();

  const [status, setStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [settings, setSettings] = useState({
    school_name: 'Eagle Power Schools Awka',
    school_motto: 'Love, Truth & Service',
    current_session: '2024/2025',
    current_term: 'Second Term',
    next_resumption_date: '2025-05-05',
    principal_name: 'Adaeze Uzoefuna',
    contact_phone: '+234 803 359 1058',
    contact_email: 'info@eaglepowerschools.com.ng',
    address: '2 & 9 Amikwo Road, Awka, Anambra State'
  });
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [termLockLoading, setTermLockLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchSystemData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, backupRes, settingsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/system/status`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE}/system/backups`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE}/system/settings`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE}/audit?limit=15`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      const statusData = await statusRes.json();
      const backupData = await backupRes.json();
      const settingsData = await settingsRes.json();
      const auditData = await auditRes.json();

      if (statusData.success) setStatus(statusData);
      if (backupData.success) setBackups(backupData.data || []);
      if (settingsData.success && settingsData.data) setSettings(settingsData.data);
      if (auditData.success) setAuditLogs(auditData.data || []);
    } catch {
      showFeedback('error', 'Failed to retrieve system governance telemetry.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE, authToken]);

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // Trigger Backup
  const handleTriggerBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/system/backup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', `Database snapshot created: ${data.backup?.filename} (${data.backup?.size_kb} KB)`);
        fetchSystemData();
      } else {
        showFeedback('error', data.message || 'Backup failed.');
      }
    } catch {
      showFeedback('error', 'Network error during snapshot creation.');
    } finally {
      setBackupLoading(false);
    }
  };

  // Toggle Term Lock
  const handleToggleTermLock = async () => {
    const currentLock = Boolean(status?.session?.term_locked);
    const newLockState = !currentLock;
    setTermLockLoading(true);
    try {
      const res = await fetch(`${API_BASE}/system/term-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ locked: newLockState })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', data.message);
        fetchSystemData();
      } else {
        showFeedback('error', data.message || 'Term lock toggle failed.');
      }
    } catch {
      showFeedback('error', 'Network error modifying term lock.');
    } finally {
      setTermLockLoading(false);
    }
  };

  // Save Institutional Parameters
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/system/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Institutional settings updated successfully.');
        fetchSystemData();
      } else {
        showFeedback('error', data.message || 'Failed to update institutional settings.');
      }
    } catch {
      showFeedback('error', 'Network error updating settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Executive Governance & Resiliency
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">System Governance & Disaster Recovery</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Atomic SQLite WAL snapshots, term-grade entry locking, institutional branding, and live security telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSystemData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Governance Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <div className="text-xs font-semibold">{feedback.message}</div>
        </div>
      )}

      {/* SECTION 1: SYSTEM HEALTH TELEMETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DB Engine & Size */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Database Storage</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">
            {status?.database?.size_kb ? `${status.database.size_kb} KB` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {status?.database?.engine || 'SQLite 3 (WAL mode)'}
          </div>
        </div>

        {/* Active Enrolled Pupils */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Enrolled Students</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">
            {status?.counts?.active_students ?? '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active registered pupils</div>
        </div>

        {/* Academic Faculty & Officers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Active Faculty</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white">
            {status?.counts?.active_staff ?? '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Teaching & administrative staff</div>
        </div>

        {/* Term Lock State */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Grade Entry Lock</span>
            {status?.session?.term_locked ? (
              <Lock className="w-4 h-4 text-rose-400" />
            ) : (
              <Unlock className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className={`text-xl font-black ${
            status?.session?.term_locked ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {status?.session?.term_locked ? 'LOCKED' : 'UNLOCKED'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {status?.session?.term_locked
              ? 'Assessment alterations frozen'
              : 'Teachers can record & submit scores'}
          </div>
        </div>
      </div>

      {/* SECTION 2: IMMEDIATE GOVERNANCE CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ONE-CLICK WAL BACKUP SNAPSHOT */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                <HardDrive className="w-4 h-4" />
                Zero-Downtime Backup
              </div>
              <h3 className="text-lg font-black text-white mt-1">Atomic Database Snapshot</h3>
              <p className="text-xs text-slate-400 mt-1">
                Executes SQLite WAL checkpoint to flush all in-memory journals to disk and copies an isolated, point-in-time snapshot to the backups archive directory.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Manual Checkpoint & Snapshot</div>
              <div className="text-[10px] text-slate-400">Creates timestamped .db copy in server/backups</div>
            </div>
            <button
              onClick={handleTriggerBackup}
              disabled={backupLoading}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Database className={`w-4 h-4 ${backupLoading ? 'animate-spin' : ''}`} />
              {backupLoading ? 'Checkpointing...' : 'Take Snapshot Now'}
            </button>
          </div>

          {/* Backup Archives Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Recent Backup Archives ({backups.length})</span>
              <span className="text-[10px] text-slate-500">Persistent disk storage</span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800/60 bg-slate-950/70">
              {backups.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No snapshots recorded yet. Click above to create one.
                </div>
              ) : (
                backups.map((b, idx) => (
                  <div key={idx} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-mono font-bold text-white text-[11px] truncate max-w-[220px]">
                          {b.filename}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(b.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-xs shrink-0">
                      {b.size_kb} KB
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TERM LOCK & ASSESSMENT GOVERNANCE */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                <Lock className="w-4 h-4" />
                Assessment Integrity Guard
              </div>
              <h3 className="text-lg font-black text-white mt-1">Term Grade-Entry Lockdown</h3>
              <p className="text-xs text-slate-400 mt-1">
                Prevents unauthorized grade inflation or tampering once official term broadsheets and report cards are published.
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            status?.session?.term_locked
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-black ${
                  status?.session?.term_locked ? 'text-rose-300' : 'text-emerald-300'
                }`}>
                  Current Status: {status?.session?.term_locked ? '🔒 STRICTLY LOCKED' : '🔓 OPEN FOR SUBMISSIONS'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {status?.session?.term_locked
                    ? 'Faculty members are blocked from submitting or editing marks.'
                    : 'Faculty members are actively submitting CA and exam marks.'}
                </div>
              </div>

              <button
                onClick={handleToggleTermLock}
                disabled={termLockLoading}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow ${
                  status?.session?.term_locked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                {status?.session?.term_locked ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unlock Assessment Entry
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Lock All Term Grades
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Institutional Protocol Note
            </div>
            <div>
              When locked, only SuperAdmin authority can override marks. Teachers will be prompted to request administrative unlocks for post-broadsheet corrections.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: INSTITUTIONAL PARAMETERS & BRANDING CONFIGURATOR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
          <Building className="w-4 h-4" />
          Identity & Academic Calendar
        </div>
        <h3 className="text-lg font-black text-white">Institutional Parameters Configuration</h3>
        <p className="text-xs text-slate-400 mb-5">
          Controls official school session, active term, resumption dates, and administrative contacts stamped on report cards and receipts.
        </p>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">School Name</label>
              <input
                type="text"
                required
                value={settings.school_name || ''}
                onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">School Motto</label>
              <input
                type="text"
                value={settings.school_motto || ''}
                onChange={(e) => setSettings({ ...settings, school_motto: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Principal / Director Name</label>
              <input
                type="text"
                value={settings.principal_name || ''}
                onChange={(e) => setSettings({ ...settings, principal_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Active Academic Session</label>
              <input
                type="text"
                required
                placeholder="e.g. 2024/2025"
                value={settings.current_session || ''}
                onChange={(e) => setSettings({ ...settings, current_session: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Current Academic Term</label>
              <select
                value={settings.current_term || 'Second Term'}
                onChange={(e) => setSettings({ ...settings, current_term: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Next Resumption Date</label>
              <input
                type="date"
                value={settings.next_resumption_date || ''}
                onChange={(e) => setSettings({ ...settings, next_resumption_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Administrative Email</label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Campus Physical Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={settingsLoading}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              {settingsLoading ? 'Updating System...' : 'Save Institutional Parameters'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: REAL-TIME AUDIT TRAIL LOG */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
              <History className="w-4 h-4" />
              Security Trail
            </div>
            <h3 className="text-lg font-black text-white mt-1">Live Audit Trail Explorer</h3>
          </div>
          <span className="text-xs text-slate-400">Latest 15 administrative actions</span>
        </div>

        <div className="rounded-xl border border-slate-800 divide-y divide-slate-800/60 bg-slate-950/70 overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No audit records logged yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 px-4 flex flex-col md:flex-row md:items-center justify-between gap-1 text-xs hover:bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {log.action}
                  </span>
                  <span className="text-white font-medium">{log.details}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
                  <span>IP: {log.ip_address || '127.0.0.1'}</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

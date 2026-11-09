import React, { useState, useEffect } from 'react';
import {
  Send,
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  MessageSquare,
  Users,
  Calendar,
  Layers,
  FileText,
  Sliders,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

export default function StaffCommunicationConsole({ apiBase = '', currentUser }) {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'rules' | 'history' | 'templates'
  const [overview, setOverview] = useState(null);
  const [rules, setRules] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    target_group: 'ALL_STAFF',
    channels: 'IN_APP,WHATSAPP',
    priority: 'NORMAL',
    action_url: 'overview'
  });

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${apiBase}/api/staff-communication/overview`, { credentials: 'include', headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setOverview(data);
        setRules(data.rules || []);
        setCampaigns(data.recentCampaigns || []);
      }
    } catch (_) {}
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${apiBase}/api/staff-communication/templates`, { credentials: 'include', headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchOverview();
    fetchTemplates();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in both a broadcast title and message body.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/staff-communication/broadcast`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(broadcastForm)
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Broadcast delivered successfully to ${data.result.totalRecipients} staff members via [${broadcastForm.channels}]!`
        });
        setBroadcastForm({
          title: '',
          message: '',
          target_group: 'ALL_STAFF',
          channels: 'IN_APP,WHATSAPP',
          priority: 'NORMAL',
          action_url: 'overview'
        });
        fetchOverview();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to dispatch broadcast.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error dispatching message.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleKey, currentEnabled) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/staff-communication/rules/${ruleKey}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_enabled: currentEnabled ? 0 : 1 })
      });
      const data = await res.json();
      if (data.success) {
        setRules(prev => prev.map(r => r.rule_key === ruleKey ? { ...r, is_enabled: currentEnabled ? 0 : 1 } : r));
      }
    } catch (_) {}
  };

  const handleTriggerRule = async (ruleKey, ruleName) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/staff-communication/rules/${ruleKey}/trigger`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Automated campaign "${ruleName}" triggered! Dispatched to ${data.result.totalRecipients} staff members.`
        });
        fetchOverview();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to trigger rule.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = (tpl) => {
    setBroadcastForm({
      title: tpl.subject,
      message: tpl.body,
      target_group: tpl.targetGroup,
      channels: 'IN_APP,WHATSAPP',
      priority: tpl.priority,
      action_url: tpl.actionUrl || 'overview'
    });
    setActiveTab('broadcast');
    setStatusMessage({
      type: 'info',
      text: `Loaded template: "${tpl.title}". Review or customize message below before dispatching.`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automated Faculty Communications & Alert Center</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Staff Messaging & Automated Reminders</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Coordinate all 30 faculty members and educators with automated daily roll-call reminders, Friday lesson plan deadlines, exam score submission alerts, and instant WhatsApp broadcasts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-sm"
              title="Refresh Telemetry"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Scheduler Active (WAT)</span>
            </div>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Active Faculty</span>
            <strong className="text-lg font-black text-white mt-0.5 block">
              {overview?.totalStaff || 30} Personnel
            </strong>
            <span className="text-[10px] text-amber-400/90 font-medium">
              {overview?.totalTeachers || 28} Educators
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Class Form Masters</span>
            <strong className="text-lg font-black text-white mt-0.5 block">
              {overview?.totalFormMasters || 16} Form Teachers
            </strong>
            <span className="text-[10px] text-emerald-400 font-medium">Daily morning roll call</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Active Automation Rules</span>
            <strong className="text-lg font-black text-white mt-0.5 block">
              {rules.filter(r => r.is_enabled).length} of {rules.length} Rules
            </strong>
            <span className="text-[10px] text-indigo-400 font-medium">Scheduled daily/weekly</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Broadcast History</span>
            <strong className="text-lg font-black text-white mt-0.5 block">
              {overview?.totalCampaigns || 0} Campaigns
            </strong>
            <span className="text-[10px] text-slate-400 font-medium">
              {overview?.totalNotificationsSent || 0} alerts delivered
            </span>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'info'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>⚡ Instant Staff Broadcast</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>⏰ Automated Schedule Rules ({rules.filter(r => r.is_enabled).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📚 Institutional Template Library ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>📋 Delivery Audit Logs ({campaigns.length})</span>
        </button>
      </div>

      {/* TAB 1: INSTANT STAFF BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composer Form */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-950/70 border border-slate-800/90 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Compose Staff Announcement</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Transmit urgent alerts, notices, or operational directives across teacher portal and WhatsApp.
                </p>
              </div>

              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                Multi-Channel Gateway
              </span>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              {/* Target Audience Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Target Recipient Cohort
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ALL_STAFF', label: 'All Faculty & Staff (30)', icon: '👥' },
                    { id: 'TEACHERS', label: 'Classroom Teachers (28)', icon: '👨‍🏫' },
                    { id: 'FORM_MASTERS', label: 'Class Form Masters (16)', icon: '📋' },
                    { id: 'MANAGEMENT', label: 'Leadership Directorate', icon: '🏛️' },
                    { id: 'NON_TEACHING', label: 'Non-Teaching Staff', icon: '🛠️' }
                  ].map(target => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setBroadcastForm({ ...broadcastForm, target_group: target.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        broadcastForm.target_group === target.id
                          ? 'bg-amber-400/15 border-amber-400/50 text-amber-300 font-bold shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <span>{target.icon}</span>
                      <span className="truncate">{target.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Channels */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Delivery Channels
                  </label>
                  <select
                    value={broadcastForm.channels}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, channels: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
                  >
                    <option value="IN_APP,WHATSAPP">Dual Delivery: Portal In-App + WhatsApp Bot</option>
                    <option value="IN_APP">Portal In-App Notification Only</option>
                    <option value="WHATSAPP">WhatsApp Direct Message Only</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Message Priority
                  </label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
                  >
                    <option value="NORMAL">Normal Priority (Standard Bulletin)</option>
                    <option value="HIGH">High Priority (Action Required)</option>
                    <option value="URGENT">🚨 URGENT Directive (Immediate Action)</option>
                  </select>
                </div>
              </div>

              {/* Title / Subject */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Broadcast Title / Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Assembly Duty & Gate Clearance Roster"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Message Body & Instructions
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {broadcastForm.message.length} chars
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Compose your detailed guidance, deadlines, or operational directives for faculty..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              {/* Action Link Button Target */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  1-Click Action Shortcut in Teacher Portal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'attendance', label: 'Attendance Roll Call' },
                    { id: 'lesson_notes', label: 'Lesson Notes & Plans' },
                    { id: 'gradebook', label: 'Master Gradebook' },
                    { id: 'payroll', label: 'Payroll & Payslips' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBroadcastForm({ ...broadcastForm, action_url: tab.id })}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer truncate ${
                        broadcastForm.action_url === tab.id
                          ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? 'Transmitting to Faculty...' : '🚀 Dispatch Staff Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Mobile & In-App Preview */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Live Preview</span>
              </h4>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-slate-200 font-mono space-y-2 leading-relaxed">
                <div className="text-emerald-400 font-bold">🦅 EAGLE POWER SCHOOLS & COLLEGES</div>
                <div className="text-amber-300 font-bold">
                  {broadcastForm.priority === 'URGENT' ? '🚨 URGENT NOTICE' : '📌 STAFF BULLETIN'}
                </div>
                <div>To: Educator Name</div>
                <div className="font-bold text-white">Subject: {broadcastForm.title || '(Subject Title)'}</div>
                <div className="border-t border-emerald-500/20 pt-1 text-slate-300 whitespace-pre-wrap">
                  {broadcastForm.message || '(Your message body will be formatted with official school headers and one-click portal links)'}
                </div>
                <div className="border-t border-emerald-500/20 pt-1 text-emerald-300 text-[10px]">
                  🔗 Teacher Portal Workspace:<br/>
                  https://eaglepower.pages.dev/portal?tab={broadcastForm.action_url}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Portal In-App Drawer Preview</span>
              </h4>

              <div className="p-3.5 rounded-2xl bg-slate-900 border-l-4 border-amber-400 border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-amber-400">{broadcastForm.priority}</span>
                  <span>Just now</span>
                </div>
                <h5 className="font-bold text-white text-xs">
                  {broadcastForm.title || 'Broadcast Title'}
                </h5>
                <p className="text-[11px] text-slate-300 line-clamp-2">
                  {broadcastForm.message || 'Staff notification message description.'}
                </p>
                <div className="text-[10px] text-amber-300 font-bold pt-1 flex items-center gap-1">
                  <span>Open {broadcastForm.action_url}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED SCHEDULE RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Recurring Automated Staff Notifications</span>
              </h3>
              <p className="text-xs text-slate-400">
                These rules run autonomously on our background cron scheduler in Lagos/WAT time.
              </p>
            </div>

            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              ⚡ All rules feature instant on-demand testing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 relative overflow-hidden ${
                  rule.is_enabled
                    ? 'bg-slate-950/80 border-slate-800/90 shadow-lg'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                {/* Header & Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        rule.is_enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rule.is_enabled ? 'Active Scheduled' : 'Paused'}
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{rule.schedule_time} WAT ({rule.schedule_days})</span>
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white truncate">{rule.name}</h4>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggleRule(rule.rule_key, rule.is_enabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.is_enabled ? 'bg-amber-400' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                        rule.is_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {rule.description}
                </p>

                {/* Template Message Box */}
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 text-xs space-y-1">
                  <div className="font-bold text-amber-300 text-[11px]">{rule.template_title}</div>
                  <div className="text-slate-300 text-[11px] line-clamp-3 italic">
                    "{rule.template_body}"
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-[10px] text-slate-500">
                    Target: <strong className="text-slate-400">{rule.target_audience}</strong> • Channels: <strong className="text-slate-400">{rule.channels}</strong>
                  </div>

                  <button
                    onClick={() => handleTriggerRule(rule.rule_key, rule.name)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-amber-400" />
                    <span>Run Campaign Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INSTITUTIONAL TEMPLATE LIBRARY */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Pre-Crafted Educational Staff Notices</span>
              </h3>
              <p className="text-xs text-slate-400">
                Official Nigerian school communication templates for exams, lesson schemes, assembly duties, and emergencies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                      {tpl.category}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      tpl.priority === 'URGENT' ? 'bg-red-500/20 text-red-300' : (tpl.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300')
                    }`}>
                      {tpl.priority}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white">{tpl.title}</h4>
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed italic">
                    "{tpl.body}"
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Cohort: <strong className="text-slate-400">{tpl.targetGroup}</strong>
                  </span>
                  <button
                    onClick={() => handleLoadTemplate(tpl)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 hover:bg-amber-300 transition-all cursor-pointer shadow"
                  >
                    <span>Load into Composer</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST HISTORY & AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Staff Broadcast & Dispatch History</span>
              </h3>
              <p className="text-xs text-slate-400">
                Verifiable audit trail of all automated alerts and leadership broadcasts to teachers.
              </p>
            </div>
            <button
              onClick={fetchOverview}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-xs">No staff broadcast campaigns dispatched yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase">
                    <th className="pb-3">Title / Subject</th>
                    <th className="pb-3">Audience Cohort</th>
                    <th className="pb-3">Channels</th>
                    <th className="pb-3 text-center">Recipients</th>
                    <th className="pb-3">Dispatched By</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date (WAT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 pr-3 font-bold text-white max-w-xs truncate">
                        {camp.title}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-medium">
                          {camp.target_group}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-300">
                        {camp.channels}
                      </td>
                      <td className="py-3.5 pr-3 text-center font-bold text-white">
                        {camp.recipient_count}
                      </td>
                      <td className="py-3.5 pr-3 text-slate-400">
                        {camp.dispatched_by}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          {camp.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(camp.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

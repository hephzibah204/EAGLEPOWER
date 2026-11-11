import { getApiBase, apiFetch as fetch } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertCircle,
  ExternalLink,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Landmark,
  ShieldAlert,
  Sparkles,
  X
} from 'lucide-react';

export default function StaffNotificationBell({
  currentUser,
  onNavigateTab,
  apiBase = getApiBase()
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsUnavailable = useRef(false);
  const [loadError, setLoadError] = useState('');

  const fetchNotifications = async () => {
    if (notificationsUnavailable.current) return;
    try {
      const token = null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${apiBase.replace(/\/$/, '').replace(/\/api$/, '')}/api/staff-communication/notifications?limit=25`, { credentials: 'include', headers });
      if (!res.ok) {
        if (res.status === 404) notificationsUnavailable.current = true;
        setLoadError('Staff notifications are unavailable. The deployed backend needs the staff communication service.');
        return;
      }
      setLoadError('');
      const data = await res.json();
      if (data.success) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s background poll
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const response = await fetch(`${apiBase.replace(/\/$/, '').replace(/\/api$/, '')}/api/staff-communication/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      if (!response.ok) return;
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      const token = null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const response = await fetch(`${apiBase.replace(/\/$/, '').replace(/\/api$/, '')}/api/staff-communication/notifications/read-all`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      if (!response.ok) return;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (_) {} finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.action_url && onNavigateTab) {
      onNavigateTab(notif.action_url);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-4 border-red-500 bg-red-500/10 text-red-300';
      case 'HIGH':
        return 'border-l-4 border-amber-500 bg-amber-500/10 text-amber-300';
      default:
        return 'border-l-4 border-emerald-500 bg-slate-900/90 text-slate-300';
    }
  };

  const getTypeIcon = (type, priority) => {
    if (priority === 'URGENT') return <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />;
    switch (type) {
      case 'DUTY_REMINDER':
        return <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'LESSON_NOTE':
        return <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'GRADEBOOK_DEADLINE':
        return <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'PAYSLIP':
        return <Landmark className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all shadow-sm focus:outline-none cursor-pointer group"
        title="Faculty Alerts & Notifications"
      >
        <Bell className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-down Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-white">Faculty Notices & Alerts</h4>
                <p className="text-[10px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-400/10 transition-all cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 text-xs">
            {loadError ? <p role="status" className="p-4 text-sm text-amber-300">{loadError}</p> : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-700 opacity-50" />
                <p className="text-xs font-medium">No announcements or duty alerts yet.</p>
                <p className="text-[10px] text-slate-600">Daily duty reminders and school notices will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleActionClick(notif)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-900/70 ${
                    !notif.is_read ? 'bg-slate-900/40' : 'opacity-75'
                  } ${getPriorityStyle(notif.priority)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getTypeIcon(notif.type, notif.priority)}
                      <h5 className="font-bold text-white text-xs truncate">
                        {notif.title}
                      </h5>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">
                      From: <strong className="text-slate-300">{notif.sender_name || 'Admin'}</strong>
                    </span>

                    {notif.action_url && (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300">
                        <span>Open {notif.action_url.replace('_', ' ')}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-950 text-center border-t border-slate-800 text-[10px] text-slate-500">
            Eagle Power Schools Automated Notification Network
          </div>
        </div>
      )}
    </div>
  );
}

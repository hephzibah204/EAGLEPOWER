import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Edit2,
  ArrowRightLeft,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  Phone,
  Mail,
  HeartPulse,
  Bus,
  MapPin
} from 'lucide-react';
import { getApiBase } from '../../../config/api';

export default function StudentMasterConsole({ authToken, classes = [] }) {
  const API_BASE = getApiBase();

  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Selected for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // Modals state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editModalTab, setEditModalTab] = useState('biodata');
  const [transferringStudent, setTransferringStudent] = useState(null);
  const [bulkPromoteOpen, setBulkPromoteOpen] = useState(false);
  const [targetClassId, setTargetClassId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'Male',
    dob: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    address: '',
    is_active: 1
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pageSize);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedClassId) params.append('class_id', selectedClassId);

      const res = await fetch(`${API_BASE}/students?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        let list = data.data || [];
        if (selectedStatus === 'active') {
          list = list.filter(s => s.is_active === 1);
        } else if (selectedStatus === 'inactive') {
          list = list.filter(s => s.is_active === 0);
        }
        setStudents(list);
        setTotalCount(data.total || list.length);
      }
    } catch {
      showFeedback('error', 'Failed to retrieve students registry.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE, authToken, page, searchQuery, selectedClassId, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Open Edit Modal
  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditModalTab('biodata');
    setEditForm({
      first_name: student.first_name || '',
      middle_name: student.middle_name || '',
      last_name: student.last_name || '',
      gender: student.gender || 'Male',
      dob: student.dob || '',
      religion: student.religion || 'Christianity',
      nationality: student.nationality || 'Nigerian',
      state_of_origin: student.state_of_origin || 'Anambra State',
      lga_of_origin: student.lga_of_origin || 'Awka South',
      mother_tongue: student.mother_tongue || 'Igbo / English',
      // Health & Medical Safety
      blood_group: student.blood_group || 'O+',
      genotype: student.genotype || 'AA',
      allergies: student.allergies || 'None',
      medical_conditions: student.medical_conditions || 'None',
      special_needs: student.special_needs || 'None',
      emergency_contact_name: student.emergency_contact_name || '',
      emergency_contact_phone: student.emergency_contact_phone || '',
      emergency_contact_relationship: student.emergency_contact_relationship || 'Father',
      // Academic Placement
      entry_mode: student.entry_mode || 'Fresh Admission',
      previous_school: student.previous_school || '',
      last_class_passed: student.last_class_passed || '',
      reason_for_transfer: student.reason_for_transfer || '',
      // Family & Guardians
      guardian_title: student.guardian_title || 'Mr',
      guardian_name: student.guardian_name || '',
      guardian_relationship: student.guardian_relationship || 'Father',
      guardian_phone: student.guardian_phone || '',
      guardian_alt_phone: student.guardian_alt_phone || '',
      guardian_email: student.guardian_email || '',
      guardian_occupation: student.guardian_occupation || '',
      guardian_office_address: student.guardian_office_address || '',
      address: student.address || '',
      mother_name: student.mother_name || '',
      mother_phone: student.mother_phone || '',
      mother_occupation: student.mother_occupation || '',
      // Logistics
      boarding_status: student.boarding_status || 'Day',
      transport_mode: student.transport_mode || 'Parent Dropoff',
      bus_route: student.bus_route || 'None',
      is_active: student.is_active !== undefined ? student.is_active : 1
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', `Updated records for ${editForm.first_name} ${editForm.last_name}.`);
        setEditingStudent(null);
        fetchStudents();
      } else {
        showFeedback('error', data.message || 'Failed to update student profile.');
      }
    } catch {
      showFeedback('error', 'Network error updating student details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Class Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferringStudent || !targetClassId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students/${transferringStudent.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          target_class_id: parseInt(targetClassId),
          reason: transferReason
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', data.message || 'Class transfer processed successfully.');
        setTransferringStudent(null);
        setTargetClassId('');
        setTransferReason('');
        fetchStudents();
      } else {
        showFeedback('error', data.message || 'Transfer failed.');
      }
    } catch {
      showFeedback('error', 'Network error during student transfer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Bulk Promotion
  const handleBulkPromote = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.size === 0 || !targetClassId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students/bulk-promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          student_ids: Array.from(selectedStudentIds),
          target_class_id: parseInt(targetClassId)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', `Promoted ${data.promoted_count} student(s) successfully!`);
        setBulkPromoteOpen(false);
        setSelectedStudentIds(new Set());
        setTargetClassId('');
        fetchStudents();
      } else {
        showFeedback('error', data.message || 'Bulk promotion failed.');
      }
    } catch {
      showFeedback('error', 'Network error during bulk promotion.');
    } finally {
      setActionLoading(false);
    }
  };

  // Selection toggles
  const toggleSelectAll = () => {
    if (selectedStudentIds.size === students.length && students.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    }
  };

  const toggleSelectStudent = (id) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            SuperAdmin Registry
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">Student Master Command Console</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional directory with full CRUD biodata authority, class transfers, and bulk promotions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedStudentIds.size > 0 && (
            <button
              onClick={() => setBulkPromoteOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Bulk Promote ({selectedStudentIds.size})
            </button>
          )}

          <button
            onClick={fetchStudents}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Registry"
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

      {/* Filter and Search Controls */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, admission no, or guardian phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); setPage(1); }}
            aria-label="Filter students by class"
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400/80"
          >
            <option value="">All Classes ({classes.length})</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.division})</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          aria-label="Filter students by status"
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400/80"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Suspended / Inactive</option>
        </select>
      </div>

      {/* Students Registry Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-black text-[11px] tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Select / Deselect All on page"
                  >
                    {students.length > 0 && selectedStudentIds.size === students.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Admission No</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Class Enrolled</th>
                <th className="p-3">Guardian Contact</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    Retrieving enrolled pupils database...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No students matching your filter criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isSelected = selectedStudentIds.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isSelected ? 'bg-amber-400/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectStudent(student.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">
                          {student.first_name} {student.last_name}
                        </div>
                        {student.dob && (
                          <div className="text-[10px] text-slate-500">DOB: {student.dob}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {student.admission_no}
                      </td>
                      <td className="p-3 text-slate-300">
                        {student.gender || '—'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-semibold text-[11px] border border-slate-700/60">
                          {student.class_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200 font-medium">
                          {student.guardian_name || 'Not on file'}
                        </div>
                        {student.guardian_phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-slate-500" />
                            {student.guardian_phone}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {student.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <UserX className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Student Biodata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setTransferringStudent(student);
                              setTargetClassId('');
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                            title="Transfer Student Class"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{students.length}</span> of{' '}
            <span className="font-bold text-white">{totalCount}</span> pupils
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-amber-400">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={students.length < pageSize}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT STUDENT BIODATA */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingStudent(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
              <Edit2 className="w-4 h-4" />
              SuperAdmin Master Editor
            </div>
            <h3 className="text-xl font-black text-white">
              Edit Student Dossier: {editingStudent.admission_no}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Institutional records directly update database persistence and synchronize connected parent portal accounts.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Category Navigation */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none text-[11px]">
                {[
                  { id: 'biodata', label: '👤 Biodata & Origin' },
                  { id: 'health', label: '🩺 Medical & Safety' },
                  { id: 'academics', label: '🏫 Academics' },
                  { id: 'guardians', label: '👨‍👩‍👧 Family Registry' },
                  { id: 'logistics', label: '🚌 Logistics & Status' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEditModalTab(t.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                      editModalTab === t.id
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: BIODATA & ORIGIN */}
              {editModalTab === 'biodata' && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={editForm.middle_name}
                        onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Last Name / Surname *</label>
                      <input
                        type="text"
                        required
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Gender</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">State of Origin</label>
                      <input
                        type="text"
                        value={editForm.state_of_origin}
                        onChange={(e) => setEditForm({ ...editForm, state_of_origin: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">LGA of Origin</label>
                      <input
                        type="text"
                        value={editForm.lga_of_origin}
                        onChange={(e) => setEditForm({ ...editForm, lga_of_origin: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Religion</label>
                      <select
                        value={editForm.religion}
                        onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option>Christianity</option>
                        <option>Islam</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HEALTH & SAFETY */}
              {editModalTab === 'health' && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Blood Group</label>
                      <select
                        value={editForm.blood_group}
                        onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option>O+</option>
                        <option>O-</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Genotype</label>
                      <select
                        value={editForm.genotype}
                        onChange={(e) => setEditForm({ ...editForm, genotype: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option>AA</option>
                        <option>AS</option>
                        <option>SS</option>
                        <option>AC</option>
                        <option>SC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Known Allergies</label>
                      <input
                        type="text"
                        value={editForm.allergies}
                        onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Medical Conditions</label>
                      <input
                        type="text"
                        value={editForm.medical_conditions}
                        onChange={(e) => setEditForm({ ...editForm, medical_conditions: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2.5">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Emergency Contact</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Contact Person</label>
                        <input
                          type="text"
                          value={editForm.emergency_contact_name}
                          onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Relationship</label>
                        <input
                          type="text"
                          value={editForm.emergency_contact_relationship}
                          onChange={(e) => setEditForm({ ...editForm, emergency_contact_relationship: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Emergency Phone</label>
                        <input
                          type="tel"
                          value={editForm.emergency_contact_phone}
                          onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACADEMICS */}
              {editModalTab === 'academics' && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Entry Mode</label>
                      <select
                        value={editForm.entry_mode}
                        onChange={(e) => setEditForm({ ...editForm, entry_mode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option>Fresh Admission</option>
                        <option>Transfer from another school</option>
                        <option>Direct Entry</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Last Class Passed</label>
                      <input
                        type="text"
                        value={editForm.last_class_passed}
                        onChange={(e) => setEditForm({ ...editForm, last_class_passed: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Previous School Attended</label>
                    <input
                      type="text"
                      value={editForm.previous_school}
                      onChange={(e) => setEditForm({ ...editForm, previous_school: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: FAMILY REGISTRY */}
              {editModalTab === 'guardians' && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="border-b border-slate-800 pb-2.5">
                    <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Primary Guardian Credentials & Contacts</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Title</label>
                        <select
                          value={editForm.guardian_title}
                          onChange={(e) => setEditForm({ ...editForm, guardian_title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        >
                          <option>Mr</option>
                          <option>Mrs</option>
                          <option>Chief</option>
                          <option>Dr</option>
                          <option>Engr</option>
                          <option>Barrister</option>
                          <option>Pastor</option>
                          <option>Alhaji</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block font-bold text-slate-300 mb-1">Guardian Name</label>
                        <input
                          type="text"
                          value={editForm.guardian_name}
                          onChange={(e) => setEditForm({ ...editForm, guardian_name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Guardian Phone (Login Phone)</label>
                        <input
                          type="text"
                          value={editForm.guardian_phone}
                          onChange={(e) => setEditForm({ ...editForm, guardian_phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Alternate Phone</label>
                        <input
                          type="text"
                          value={editForm.guardian_alt_phone}
                          onChange={(e) => setEditForm({ ...editForm, guardian_alt_phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Guardian Email</label>
                        <input
                          type="email"
                          value={editForm.guardian_email}
                          onChange={(e) => setEditForm({ ...editForm, guardian_email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Occupation</label>
                        <input
                          type="text"
                          value={editForm.guardian_occupation}
                          onChange={(e) => setEditForm({ ...editForm, guardian_occupation: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Mother's Information & Residential Address</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Mother's Name</label>
                        <input
                          type="text"
                          value={editForm.mother_name}
                          onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Mother's Phone</label>
                        <input
                          type="text"
                          value={editForm.mother_phone}
                          onChange={(e) => setEditForm({ ...editForm, mother_phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <label className="block font-bold text-slate-300 mb-1">Residential Address</label>
                      <textarea
                        rows={2}
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LOGISTICS & STATUS */}
              {editModalTab === 'logistics' && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Boarding Status</label>
                      <select
                        value={editForm.boarding_status}
                        onChange={(e) => setEditForm({ ...editForm, boarding_status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Day">Day Student</option>
                        <option value="Full Boarding">Full Boarding Hostel</option>
                        <option value="Weekly Boarding">Weekly Boarding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Transport Mode</label>
                      <select
                        value={editForm.transport_mode}
                        onChange={(e) => setEditForm({ ...editForm, transport_mode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Parent Dropoff">Private Family Drop-off</option>
                        <option value="School Bus">Eagle Power School Bus Shuttle</option>
                        <option value="Walk">Walking / Bicycle</option>
                        <option value="Public">Public Transit / Commercial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">School Bus Route</label>
                    <select
                      value={editForm.bus_route}
                      onChange={(e) => setEditForm({ ...editForm, bus_route: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="None">None (Private / Boarding)</option>
                      <option value="Route A - Awka South / Regina Caeli / Ziks Ave">Route A — Awka South / Regina Caeli / Zik Avenue</option>
                      <option value="Route B - Amansea / UNIZIK Junction / Ifite">Route B — Amansea / UNIZIK Junction / Ifite</option>
                      <option value="Route C - Ngozika Housing / Udoka Estate">Route C — Ngozika Housing / Udoka Estate</option>
                      <option value="Route D - Amawbia / Governor's Lodge / Enugwu-Ukwu">Route D — Amawbia / Governor's Lodge / Enugwu-Ukwu</option>
                    </select>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 mt-3">
                    <div>
                      <div className="font-bold text-white">Enrollment Clearance Status</div>
                      <div className="text-[10px] text-slate-400">Suspended pupils cannot access the portal or sit for examinations.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, is_active: editForm.is_active ? 0 : 1 })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        editForm.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {editForm.is_active ? 'Active Enrolled' : 'Suspended'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  {actionLoading ? 'Saving...' : 'Save Dossier Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK CLASS TRANSFER */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setTransferringStudent(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
              <ArrowRightLeft className="w-4 h-4" />
              Academic Stream Transfer
            </div>
            <h3 className="text-lg font-black text-white">
              Transfer Student: {transferringStudent.first_name} {transferringStudent.last_name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current Class:{' '}
              <span className="font-bold text-white">{transferringStudent.class_name || 'Unassigned'}</span>
            </p>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Class *</label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select Target Destination Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.division})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Transfer Rationale (Optional)</label>
                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Promoted mid-term, streamed to Science division, parental request..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !targetClassId}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {actionLoading ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BULK PROMOTION */}
      {bulkPromoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setBulkPromoteOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
              <GraduationCap className="w-4 h-4" />
              Batch Session Elevation
            </div>
            <h3 className="text-lg font-black text-white">
              Bulk Promote {selectedStudentIds.size} Selected Pupils
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Batch promotes all selected students into the selected target class in a single atomic database transaction.
            </p>

            <form onSubmit={handleBulkPromote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Class *</label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select Destination Promotion Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.division})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-300">
                ⚠️ All {selectedStudentIds.size} selected students will have their class IDs updated immediately, preserving historical examination scores and marks.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkPromoteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !targetClassId}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
                >
                  <GraduationCap className="w-4 h-4" />
                  {actionLoading ? 'Promoting...' : `Promote (${selectedStudentIds.size}) Students`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

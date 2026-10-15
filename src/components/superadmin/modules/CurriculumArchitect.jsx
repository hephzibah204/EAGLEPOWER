import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  Filter,
  GraduationCap,
  Layers,
  Sparkles
} from 'lucide-react';
import { getApiBase } from '../../../config/api';

export default function CurriculumArchitect({ authToken, staffList = [] }) {
  const API_BASE = getApiBase();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('classes'); // 'classes' | 'subjects'

  // Subject filters
  const [subjectDivision, setSubjectDivision] = useState('All');
  const [subjectCategory, setSubjectCategory] = useState('All');

  // Modals state
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({
    name: '',
    division: 'Primary',
    termly_tuition: 40000,
    class_teacher_id: ''
  });

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    division: 'All',
    category: 'Core'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/academics/classes`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE}/academics/subjects`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      const classData = await classRes.json();
      const subData = await subRes.json();

      if (classData.success) setClasses(classData.data || []);
      if (subData.success) setSubjects(subData.data || []);
    } catch {
      showFeedback('error', 'Failed to retrieve curriculum structures.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE, authToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Add/Edit Class
  const handleOpenClassModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      setClassForm({
        name: cls.name,
        division: cls.division || 'Primary',
        termly_tuition: cls.termly_tuition || 40000,
        class_teacher_id: cls.class_teacher_id || ''
      });
    } else {
      setEditingClass(null);
      setClassForm({
        name: '',
        division: 'Primary',
        termly_tuition: 40000,
        class_teacher_id: ''
      });
    }
    setClassModalOpen(true);
  };

  // Submit Class (Create or Update)
  const handleSaveClass = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editingClass
        ? `${API_BASE}/academics/classes/${editingClass.id}`
        : `${API_BASE}/academics/classes`;
      const method = editingClass ? 'PUT' : 'POST';

      const payload = {
        name: classForm.name.trim(),
        division: classForm.division,
        termly_tuition: parseFloat(classForm.termly_tuition) || 40000,
        class_teacher_id: classForm.class_teacher_id ? parseInt(classForm.class_teacher_id) : null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', data.message || `Class '${payload.name}' saved successfully.`);
        setClassModalOpen(false);
        fetchData();
      } else {
        showFeedback('error', data.message || 'Operation failed.');
      }
    } catch {
      showFeedback('error', 'Network error modifying class.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Add/Edit Subject
  const handleOpenSubjectModal = (sub = null) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectForm({
        name: sub.name,
        code: sub.code,
        division: sub.division || 'All',
        category: sub.category || 'Core'
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        name: '',
        code: '',
        division: 'All',
        category: 'Core'
      });
    }
    setSubjectModalOpen(true);
  };

  // Submit Subject (Create or Update)
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editingSubject
        ? `${API_BASE}/academics/subjects/${editingSubject.id}`
        : `${API_BASE}/academics/subjects`;
      const method = editingSubject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(subjectForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', data.message || `Subject '${subjectForm.name}' saved.`);
        setSubjectModalOpen(false);
        fetchData();
      } else {
        showFeedback('error', data.message || 'Subject operation failed.');
      }
    } catch {
      showFeedback('error', 'Network error managing subject.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subject) => {
    if (!confirm(`Are you sure you want to permanently delete subject '${subject.name}' (${subject.code})?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/academics/subjects/${subject.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', data.message || 'Subject deleted.');
        fetchData();
      } else {
        showFeedback('error', data.message || 'Cannot delete subject.');
      }
    } catch {
      showFeedback('error', 'Network error deleting subject.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered subjects
  const filteredSubjects = subjects.filter(s => {
    const matchDiv = subjectDivision === 'All' || s.division === subjectDivision || s.division === 'All';
    const matchCat = subjectCategory === 'All' || s.category === subjectCategory;
    return matchDiv && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
            <Layers className="w-5 h-5 text-amber-400" />
            Curriculum Architect
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">Academics & Subject Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure institutional classrooms, termly tuition schedules, curriculum subjects, and assigned faculty.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'classes' ? (
            <button
              onClick={() => handleOpenClassModal(null)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          ) : (
            <button
              onClick={() => handleOpenSubjectModal(null)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Curriculum"
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

      {/* Sub Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeSubTab === 'classes'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Classes & Tuition ({classes.length})
        </button>
        <button
          onClick={() => setActiveSubTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeSubTab === 'subjects'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Curriculum Subjects ({subjects.length})
        </button>
      </div>

      {/* VIEW 1: CLASSES DIRECTORY */}
      {activeSubTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {cls.division}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1.5">{cls.name}</h3>
                </div>
                <button
                  onClick={() => handleOpenClassModal(cls)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Edit Class"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Enrolled Pupils:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-400" />
                    {cls.student_count || 0} Pupils
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Termly Base Tuition:</span>
                  <span className="font-bold text-emerald-400">
                    ₦{(cls.termly_tuition || 40000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Class Teacher:</span>
                  <span className="font-medium text-slate-200 truncate max-w-[150px]">
                    {cls.teacher_name || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: SUBJECTS DIRECTORY */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Subject Filters */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-bold">Filter By:</span>

            <select
              value={subjectDivision}
              onChange={(e) => setSubjectDivision(e.target.value)}
              aria-label="Filter subjects by division"
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Divisions</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Junior College">Junior College</option>
              <option value="Senior College">Senior College</option>
            </select>

            <select
              value={subjectCategory}
              onChange={(e) => setSubjectCategory(e.target.value)}
              aria-label="Filter subjects by category"
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Categories</option>
              <option value="Core">Core</option>
              <option value="Elective">Elective</option>
              <option value="Vocational">Vocational</option>
            </select>

            <span className="ml-auto text-slate-400">
              Showing <span className="font-bold text-white">{filteredSubjects.length}</span> subjects
            </span>
          </div>

          {/* Subjects Table */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-black text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Division</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        {sub.name}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {sub.code}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[10px]">
                          {sub.division}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.category === 'Core'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : sub.category === 'Vocational'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {sub.category || 'Core'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenSubjectModal(sub)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT CLASS */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setClassModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
              <GraduationCap className="w-4 h-4" />
              Classroom Architect
            </div>
            <h3 className="text-xl font-black text-white">
              {editingClass ? `Edit Class: ${editingClass.name}` : 'Create New Classroom'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Define division level, termly tuition, and assign official form tutor.
            </p>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary 5 Gold, JSS 1 Alpha..."
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Division *</label>
                <select
                  value={classForm.division}
                  onChange={(e) => setClassForm({ ...classForm, division: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Nursery">Nursery</option>
                  <option value="Primary">Primary</option>
                  <option value="Junior College">Junior College</option>
                  <option value="Senior College">Senior College</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Termly Base Tuition (₦) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={500}
                  value={classForm.termly_tuition}
                  onChange={(e) => setClassForm({ ...classForm, termly_tuition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Class Teacher (Optional)</label>
                <select
                  value={classForm.class_teacher_id}
                  onChange={(e) => setClassForm({ ...classForm, class_teacher_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Unassigned (No Class Teacher)</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.staff_no}) - {st.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
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
                  {actionLoading ? 'Saving...' : 'Save Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT SUBJECT */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setSubjectModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
              <BookOpen className="w-4 h-4" />
              Curriculum Matrix
            </div>
            <h3 className="text-xl font-black text-white">
              {editingSubject ? `Edit Subject: ${editingSubject.name}` : 'Register New Subject'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Subject codes are indexed for grading reports and master broadsheets.
            </p>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subject Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Further Mathematics, Visual Arts..."
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subject Code * (Unique)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. MTH, ENG, CHM, PHY..."
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono uppercase text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Division</label>
                  <select
                    value={subjectForm.division}
                    onChange={(e) => setSubjectForm({ ...subjectForm, division: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="All">All Divisions</option>
                    <option value="Nursery">Nursery</option>
                    <option value="Primary">Primary</option>
                    <option value="Junior College">Junior College</option>
                    <option value="Senior College">Senior College</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={subjectForm.category}
                    onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Vocational">Vocational</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
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
                  {actionLoading ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

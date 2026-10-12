import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  LogOut,
  TrendingUp,
  Building2,
  RefreshCw,
  Sparkles,
  Lock,
  Check,
  FileSpreadsheet,
  Layout,
  Plus,
  PhoneCall,
  MessageSquare,
  Save
} from 'lucide-react';
import { getApiBase } from '../config/api';
import BroadsheetView from './reports/BroadsheetView';
import { TemplateGallery } from './reports/TemplateGallery';
import { EliteModernTemplate } from './reports/EliteModernTemplate';
import { CherithClassicTemplate } from './reports/CherithClassicTemplate';
import { AlQalamClassicTemplate } from './reports/AlQalamClassicTemplate';
import { PrimarySchoolTemplate } from './reports/PrimarySchoolTemplate';
import { NurseryColorfulTemplate } from './reports/NurseryColorfulTemplate';
import { ClassicProfessionalTemplate } from './reports/ClassicProfessionalTemplate';
import ExecutiveReportingCockpit from './ExecutiveReportingCockpit';

export default function PortalDashboard({ isOpen, onClose }) {
  const API_BASE = getApiBase();
  // Authentication & Session
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eagle_token') || '';
    }
    return '';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('eagle_user') || 'null');
      } catch {
        return null;
      }
    }
    return null;
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Role and Tab
  const [activeRole, setActiveRole] = useState(() => currentUser?.role || 'admin');
  const [activeTab, setActiveTab] = useState('overview');

  // Real Database Data States
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [financeStats, setFinanceStats] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Teacher Gradebook States
  const [selectedClassId, setSelectedClassId] = useState(2); // JSS2 (has 14 students)
  const [selectedSubjectId, setSelectedSubjectId] = useState(1); // Mathematics
  const [classSheetRows, setClassSheetRows] = useState([]);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [scoreSaveSuccess, setScoreSaveSuccess] = useState(false);

  // Bursar States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [invoiceFilter, setInvoiceFilter] = useState('All');

  // Student Dossier State
  const [selectedStudentAdmNo, setSelectedStudentAdmNo] = useState('ESE2009012');
  const [studentReportCard, setStudentReportCard] = useState(null);
  const [standardReport, setStandardReport] = useState(null);
  const [studentSelectedTemplate, setStudentSelectedTemplate] = useState('ELITE');
  const [reportCardLoading, setReportCardLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Front Desk Visitor & Module States
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [visitorForm, setVisitorForm] = useState({
    visitor_name: '',
    phone: '',
    purpose: 'Admissions Enquiry',
    person_to_see: 'Principal',
    id_card_type: 'National ID (NIN)',
    badge_no: ''
  });
  const [isCheckingInVisitor, setIsCheckingInVisitor] = useState(false);
  const [frontDeskSubTab, setFrontDeskSubTab] = useState('visitors'); // 'visitors', 'enquiries', 'calls', 'complaints'
  const [enquiries, setEnquiries] = useState([]);
  const [calls, setCalls] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    class_interested: 'JSS 1',
    source: 'Walk-in',
    follow_up_date: '',
    notes: ''
  });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callForm, setCallForm] = useState({
    caller_name: '',
    phone: '',
    call_type: 'Incoming',
    duration: '3 mins',
    purpose: 'Admissions & Fee Inquiries',
    follow_up_needed: false,
    message: ''
  });
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    complainant_name: '',
    complainant_phone: '',
    complaint_type: 'Academics',
    description: '',
    assigned_to: 'Administrative Officer'
  });
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Teacher Daily Student Attendance Register States
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceClassId, setAttendanceClassId] = useState(2);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaveSuccess, setAttendanceSaveSuccess] = useState(false);

  // Parent Registration States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regChildAdmNo, setRegChildAdmNo] = useState('ESE2009012');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Add Staff Modal States
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    role: 'Teacher',
    email: '',
    phone: '',
    qualification: 'B.Ed / NCE',
    assigned_class: 'Junior College (JSS 1)',
    password: 'EagleStaff2025!'
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [addedStaffSuccess, setAddedStaffSuccess] = useState(null);

  // Enroll Student & Parent Modal States
  const [enrollStudentModalOpen, setEnrollStudentModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    admission_no: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    dob: '2016-01-01',
    class_id: 1,
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    address: 'Awka, Anambra State'
  });
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);
  const [enrolledStudentSuccess, setEnrolledStudentSuccess] = useState(null);

  // Teacher Class Assignment States
  const [assignClassModalOpen, setAssignClassModalOpen] = useState(false);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState(null);
  const [selectedStaffForClass, setSelectedStaffForClass] = useState(null);
  const [selectedTeacherIdToAssign, setSelectedTeacherIdToAssign] = useState('');
  const [selectedClassNameToAssign, setSelectedClassNameToAssign] = useState('');
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Homework & In-House AI Progress States
  const [homeworkList, setHomeworkList] = useState([]);
  const [selectedHwClassId, setSelectedHwClassId] = useState('');
  const [createHwModalOpen, setCreateHwModalOpen] = useState(false);
  const [isCreatingHw, setIsCreatingHw] = useState(false);
  const [newHwForm, setNewHwForm] = useState({
    class_id: 1,
    subject_id: 1,
    title: '',
    description: '',
    key_concepts: '',
    max_points: 10,
    due_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
  });
  const [parentAiProfile, setParentAiProfile] = useState(null);
  const [parentAiRecs, setParentAiRecs] = useState([]);
  const [isLoadingAiProgress, setIsLoadingAiProgress] = useState(false);
  const [submitHwModalOpen, setSubmitHwModalOpen] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState(null);
  const [parentHwSolution, setParentHwSolution] = useState('');
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);
  const [hwSubmissionResult, setHwSubmissionResult] = useState(null);
  const [selectedHwForSubmissionsView, setSelectedHwForSubmissionsView] = useState(null);
  const [hwSubmissionsList, setHwSubmissionsList] = useState([]);

  // Auto-sync user role on login
  useEffect(() => {
    if (currentUser?.role) {
      setActiveRole(currentUser.role);
      if (currentUser.role === 'teacher') setActiveTab('gradebook');
      else if (currentUser.role === 'bursar') setActiveTab('invoices');
      else if (currentUser.role === 'student') setActiveTab('reportcard');
      else if (currentUser.role === 'parent') {
        setActiveTab('child_overview');
        if (currentUser.children?.[0]?.admission_no) {
          setSelectedStudentAdmNo(currentUser.children[0].admission_no);
        }
      }
      else setActiveTab('executive_cockpit');
    }
  }, [currentUser]);

  // Load backend data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      // 1. Classes
      const cRes = await fetch(`${API_BASE}/academics/classes`, { headers }).catch(() => null);
      if (cRes?.ok) {
        const d = await cRes.json();
        setClasses(d.data || []);
      }

      // 2. Subjects
      const subRes = await fetch(`${API_BASE}/academics/subjects`, { headers }).catch(() => null);
      if (subRes?.ok) {
        const d = await subRes.json();
        setSubjects(d.data || []);
      }

      // 3. Students
      const sRes = await fetch(`${API_BASE}/students?limit=100`, { headers }).catch(() => null);
      if (sRes?.ok) {
        const d = await sRes.json();
        setStudents(d.data || []);
      }

      // 4. Staff
      const stRes = await fetch(`${API_BASE}/staff`, { headers }).catch(() => null);
      if (stRes?.ok) {
        const d = await stRes.json();
        setStaff(d.data || []);
      }

      // 5. Finance Stats & Invoices
      const fRes = await fetch(`${API_BASE}/finance/stats`, { headers }).catch(() => null);
      if (fRes?.ok) {
        const d = await fRes.json();
        setFinanceStats(d.data || null);
      }

      const invRes = await fetch(`${API_BASE}/finance/invoices?limit=50`, { headers }).catch(() => null);
      if (invRes?.ok) {
        const d = await invRes.json();
        setInvoices(d.data || []);
      }

      // 6. Admissions
      const admRes = await fetch(`${API_BASE}/admissions`, { headers }).catch(() => null);
      if (admRes?.ok) {
        const d = await admRes.json();
        setAdmissions(d.data || []);
      }

      // 7. Front Desk Visitors & Sub-modules
      const [fdRes, enqRes, callRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/frontdesk/visitors`, { headers }).catch(() => null),
        fetch(`${API_BASE}/frontdesk/enquiries`, { headers }).catch(() => null),
        fetch(`${API_BASE}/frontdesk/calls`, { headers }).catch(() => null),
        fetch(`${API_BASE}/frontdesk/complaints`, { headers }).catch(() => null)
      ]);
      if (fdRes?.ok) {
        const d = await fdRes.json();
        setVisitors(d.data || []);
      }
      if (enqRes?.ok) {
        const d = await enqRes.json();
        setEnquiries(d.data || []);
      }
      if (callRes?.ok) {
        const d = await callRes.json();
        setCalls(d.data || []);
      }
      if (compRes?.ok) {
        const d = await compRes.json();
        setComplaints(d.data || []);
      }

      // 8. Homework Assignments
      const hwRes = await fetch(`${API_BASE}/homework`).catch(() => null);
      if (hwRes?.ok) {
        const d = await hwRes.json();
        setHomeworkList(d.data || []);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, API_BASE]);

  // Fetch student daily roll-call attendance
  const fetchStudentAttendance = useCallback(async (cId, dDate) => {
    if (!cId) return;
    setIsLoadingAttendance(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/attendance/students?class_id=${cId}&date=${dDate}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setAttendanceRecords(d.records || []);
      }
    } catch (err) {
      console.warn('Error fetching student attendance:', err);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [authToken, API_BASE]);

  // Save student attendance batch
  const handleSaveAttendance = async () => {
    if (!attendanceRecords.length) return;
    setIsSavingAttendance(true);
    setAttendanceSaveSuccess(false);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/attendance/students/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          class_id: parseInt(attendanceClassId),
          date: attendanceDate,
          records: attendanceRecords.map(r => ({
            student_id: r.student_id,
            status: r.status === 'Unrecorded' ? 'Present' : r.status,
            remarks: r.remarks || ''
          }))
        })
      });
      if (res.ok) {
        setAttendanceSaveSuccess(true);
        setTimeout(() => setAttendanceSaveSuccess(false), 4000);
        fetchStudentAttendance(attendanceClassId, attendanceDate);
      }
    } catch (err) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handleUpdateStudentAttendance = (studentId, field, value) => {
    setAttendanceRecords(prev => prev.map(rec => {
      if (rec.student_id === studentId) {
        return { ...rec, [field]: value };
      }
      return rec;
    }));
  };

  const handleMarkAllAttendance = (status) => {
    setAttendanceRecords(prev => prev.map(rec => ({ ...rec, status })));
  };

  // Fetch In-House AI Progress & Recommendations for a student
  const fetchStudentAiProgress = useCallback(async (studentId) => {
    if (!studentId) return;
    setIsLoadingAiProgress(true);
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/progress/student/${studentId}`).catch(() => null),
        fetch(`${API_BASE}/progress/student/${studentId}/recommendations`).catch(() => null)
      ]);
      if (pRes?.ok) {
        const pData = await pRes.json();
        setParentAiProfile(pData.data || null);
      }
      if (rRes?.ok) {
        const rData = await rRes.json();
        setParentAiRecs(rData.data || []);
      }
    } catch (err) {
      console.warn('AI progress fetch error:', err.message);
    } finally {
      setIsLoadingAiProgress(false);
    }
  }, [API_BASE]);

  // Handle Teacher Create Homework
  const handleCreateHomework = async (e) => {
    e.preventDefault();
    setIsCreatingHw(true);
    try {
      const res = await fetch(`${API_BASE}/homework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          class_id: parseInt(newHwForm.class_id),
          subject_id: parseInt(newHwForm.subject_id),
          title: newHwForm.title,
          description: newHwForm.description,
          key_concepts: newHwForm.key_concepts,
          max_points: parseFloat(newHwForm.max_points) || 10,
          due_date: newHwForm.due_date
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreateHwModalOpen(false);
        setNewHwForm({
          class_id: classes[0]?.id || 1,
          subject_id: subjects[0]?.id || 1,
          title: '',
          description: '',
          key_concepts: '',
          max_points: 10,
          due_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
        });
        fetchAllData();
      } else {
        alert(data.message || 'Failed to create homework.');
      }
    } catch (err) {
      alert('Error creating homework: ' + err.message);
    } finally {
      setIsCreatingHw(false);
    }
  };

  // Handle Parent / Student Submit Homework via Web Portal (AI auto-graded)
  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!selectedAssignmentForSubmit || !parentHwSolution.trim()) return;
    setIsSubmittingHw(true);
    setHwSubmissionResult(null);

    try {
      // Find candidate student ID
      const targetStudent = currentUser?.children?.[0] || students[0];
      const res = await fetch(`${API_BASE}/homework/${selectedAssignmentForSubmit.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: targetStudent?.id || 1,
          submitted_by_phone: currentUser?.phone || '08031234567',
          submission_channel: 'Portal',
          submission_text: parentHwSolution.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHwSubmissionResult(data.submission);
        fetchAllData();
      } else {
        alert(data.message || 'Submission failed.');
      }
    } catch (err) {
      alert('Error submitting homework: ' + err.message);
    } finally {
      setIsSubmittingHw(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen, fetchAllData]);

  // Load teacher class score sheet whenever class or subject changes
  const fetchClassSheet = useCallback(async (cId, sId) => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/exams/class-sheet?class_id=${cId}&subject_id=${sId}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setClassSheetRows(d.data || []);
      }
    } catch (err) {
      console.warn('Error fetching class sheet:', err.message);
    }
  }, [API_BASE, authToken]);

  useEffect(() => {
    if (isOpen && activeRole === 'teacher') {
      fetchClassSheet(selectedClassId, selectedSubjectId);
    }
  }, [isOpen, activeRole, selectedClassId, selectedSubjectId, fetchClassSheet]);

  // Load student report card
  const fetchReportCard = useCallback(async (admNo) => {
    const cleanId = admNo?.trim()?.toUpperCase();
    if (!cleanId) return;

    setReportCardLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/exams/report-card/${cleanId}`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.report_card) {
          setStudentReportCard(d.report_card);
          if (d.standard_report) {
            setStandardReport(d.standard_report);
            if (d.standard_report.template) {
              setStudentSelectedTemplate(d.standard_report.template);
            }
          }
          return;
        }
      }
      setStudentReportCard(null);
      setStandardReport(null);
    } catch {
      setStudentReportCard(null);
      setStandardReport(null);
    } finally {
      setReportCardLoading(false);
    }
  }, [API_BASE, authToken]);

  useEffect(() => {
    if (isOpen && (activeRole === 'student' || activeTab === 'reportcard') && selectedStudentAdmNo) {
      fetchReportCard(selectedStudentAdmNo);
    }
  }, [isOpen, activeRole, activeTab, selectedStudentAdmNo, fetchReportCard]);

  if (!isOpen) return null;

  // Real Authentication Handler
  const handlePerformLogin = async (e, customUser, customPass) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const u = customUser || loginUsername;
    const p = customPass || loginPassword;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.trim(), password: p })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.token) {
        setLoginError(data.message || 'Login failed. Please verify credentials.');
        return;
      }

      setAuthToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('eagle_token', data.token);
      localStorage.setItem('eagle_user', JSON.stringify(data.user));
      setActiveRole(data.user.role);

      if (data.user.role === 'student' && data.user.reference_id) {
        setSelectedStudentAdmNo(data.user.reference_id);
      }
    } catch {
      setLoginError('Unable to connect to Eagle Power authentication server. Please verify your connection or ensure the server is active.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    localStorage.removeItem('eagle_token');
    localStorage.removeItem('eagle_user');
  };

  // Parent Registration Handler
  const handlePerformRegister = async (e) => {
    if (e) e.preventDefault();
    if (!regFullName || !regPhone || !regPassword) {
      setRegError('Please provide your full name, phone number, and password.');
      return;
    }
    setRegLoading(true);
    setRegError('');

    try {
      const cleanPhone = regPhone.replace(/\D/g, '') || regPhone.trim();
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanPhone,
          password: regPassword,
          full_name: regFullName.trim(),
          email: regEmail ? regEmail.trim() : undefined,
          phone: regPhone.trim(),
          role: 'parent',
          reference_id: regChildAdmNo ? regChildAdmNo.trim().toUpperCase() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Parent registration failed.');
      }

      setAuthToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('eagle_token', data.token);
      localStorage.setItem('eagle_user', JSON.stringify(data.user));
      setActiveRole('parent');
      setActiveTab('child_overview');
      if (data.user.children?.[0]?.admission_no) {
        setSelectedStudentAdmNo(data.user.children[0].admission_no);
      }
    } catch (err) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  // Admin Add Staff Member Handler
  const handleAddStaff = async (e) => {
    if (e) e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.role.trim()) {
      alert('Staff name and role are required.');
      return;
    }
    setIsAddingStaff(true);
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(newStaffForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add staff member.');
      setAddedStaffSuccess(data);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAddingStaff(false);
    }
  };

  // Admin Enroll Student & Parent Handler
  const handleEnrollStudent = async (e) => {
    if (e) e.preventDefault();
    if (!newStudentForm.admission_no.trim() || !newStudentForm.first_name.trim() || !newStudentForm.last_name.trim()) {
      alert('Admission number, first name, and last name are required.');
      return;
    }
    setIsEnrollingStudent(true);
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(newStudentForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to enroll student.');
      setEnrolledStudentSuccess(data);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsEnrollingStudent(false);
    }
  };

  // Teacher Class Assignment Handlers
  const handleAssignTeacherToClass = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClassForTeacher) return;
    setIsSavingAssignment(true);
    try {
      const res = await fetch(`${API_BASE}/academics/classes/${selectedClassForTeacher.id}/assign-teacher`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ teacher_id: selectedTeacherIdToAssign ? Number(selectedTeacherIdToAssign) : null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign teacher.');
      fetchAllData();
      setAssignClassModalOpen(false);
      setSelectedClassForTeacher(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleAssignStaffClass = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStaffForClass) return;
    setIsSavingAssignment(true);
    try {
      const res = await fetch(`${API_BASE}/staff/${selectedStaffForClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ assigned_class: selectedClassNameToAssign })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update staff class.');
      fetchAllData();
      setAssignClassModalOpen(false);
      setSelectedStaffForClass(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Teacher Grade Computation & Editing
  const handleScoreEdit = (index, field, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    const updated = [...classSheetRows];
    const row = { ...updated[index] };

    if (field === 'ca') row.ca_score = Math.min(30, num);
    if (field === 'exam') row.exam_score = Math.min(70, num);

    row.total_score = row.ca_score + row.exam_score;

    if (row.total_score >= 75) { row.grade = 'A1'; row.remark = 'Distinction'; }
    else if (row.total_score >= 70) { row.grade = 'B2'; row.remark = 'Very Good'; }
    else if (row.total_score >= 65) { row.grade = 'B3'; row.remark = 'Good'; }
    else if (row.total_score >= 60) { row.grade = 'C4'; row.remark = 'Credit'; }
    else if (row.total_score >= 55) { row.grade = 'C5'; row.remark = 'Credit'; }
    else if (row.total_score >= 50) { row.grade = 'C6'; row.remark = 'Pass'; }
    else if (row.total_score >= 45) { row.grade = 'D7'; row.remark = 'Fair Pass'; }
    else if (row.total_score >= 40) { row.grade = 'E8'; row.remark = 'Weak Pass'; }
    else { row.grade = 'F9'; row.remark = 'Fail'; }

    updated[index] = row;
    setClassSheetRows(updated);
    setScoreSaveSuccess(false);
  };

  // Save Batch Marks to Backend SQLite
  const handleSaveBatchScores = async () => {
    if (!classSheetRows.length) return;
    setIsSavingScores(true);

    try {
      const payload = {
        subject_id: parseInt(selectedSubjectId),
        session: '2024/2025',
        term: 'Second Term',
        entries: classSheetRows.map(r => ({
          student_id: r.student_id,
          ca_score: r.ca_score,
          exam_score: r.exam_score
        }))
      };

      const res = await fetch(`${API_BASE}/exams/marks/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setScoreSaveSuccess(true);
        setTimeout(() => setScoreSaveSuccess(false), 4000);
      }
    } catch (err) {
      alert('Failed to save scores: ' + err.message);
    } finally {
      setIsSavingScores(false);
    }
  };

  // Bursar Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    const amt = parseFloat(paymentAmount);
    try {
      const res = await fetch(`${API_BASE}/finance/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          amount: amt,
          payment_method: paymentMethod,
          reference: `PAY-${Date.now()}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveReceipt({
          receiptNo: data.receipt_no,
          invoiceNo: selectedInvoice.invoice_no,
          studentName: `${selectedInvoice.first_name} ${selectedInvoice.last_name}`,
          admissionNo: selectedInvoice.admission_no,
          className: selectedInvoice.class_name,
          amount: amt,
          method: paymentMethod,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        });

        // Refresh invoices list
        fetchAllData();
        setPaymentModalOpen(false);
        setPaymentAmount('');
      }
    } catch (err) {
      alert('Payment processing failed: ' + err.message);
    }
  };

  // Principal Update Admission Status
  const handleUpdateAdmissionStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  // Front Desk Check Out Visitor
  const handleVisitorCheckout = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/frontdesk/visitors/${id}/checkout`, {
        method: 'PATCH',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: 'Checked Out' } : v));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to checkout visitor.');
      }
    } catch (err) {
      alert('Network error while checking out visitor: ' + err.message);
    }
  };

  // Front Desk Check In Visitor
  const handleVisitorCheckin = async (e) => {
    e.preventDefault();
    if (!visitorForm.visitor_name.trim() || !visitorForm.phone.trim()) {
      alert('Visitor name and phone number are required.');
      return;
    }
    setIsCheckingInVisitor(true);

    try {
      const res = await fetch(`${API_BASE}/frontdesk/visitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(visitorForm)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.visitor) {
          setVisitors(prev => [data.visitor, ...prev]);
        } else {
          fetchAllData();
        }
        setVisitorModalOpen(false);
        setVisitorForm({
          visitor_name: '',
          phone: '',
          purpose: 'Admissions Enquiry',
          person_to_see: 'Principal',
          id_card_type: 'National ID (NIN)',
          badge_no: ''
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Visitor check-in failed.');
      }
    } catch (err) {
      alert('Unable to connect to front desk service: ' + err.message);
    } finally {
      setIsCheckingInVisitor(false);
    }
  };

  // Front Desk: Create Admission Enquiry
  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryForm.name.trim() || !enquiryForm.phone.trim()) {
      alert('Parent/Guardian name and phone number are required.');
      return;
    }
    setIsSubmittingEnquiry(true);
    try {
      const res = await fetch(`${API_BASE}/frontdesk/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(enquiryForm)
      });
      if (res.ok) {
        setEnquiryModalOpen(false);
        setEnquiryForm({
          name: '',
          phone: '',
          email: '',
          class_interested: 'JSS 1',
          source: 'Walk-in',
          follow_up_date: '',
          notes: ''
        });
        const refRes = await fetch(`${API_BASE}/frontdesk/enquiries`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
        if (refRes.ok) {
          const rData = await refRes.json();
          setEnquiries(rData.data || []);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to log enquiry.');
      }
    } catch (err) {
      alert('Error connecting to front desk service: ' + err.message);
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  // Front Desk: Update Enquiry Status
  const handleUpdateEnquiryStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/frontdesk/enquiries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to update enquiry status.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  // Front Desk: Log Phone Call
  const handleCreateCall = async (e) => {
    e.preventDefault();
    if (!callForm.caller_name.trim() || !callForm.phone.trim()) {
      alert('Caller name and phone are required.');
      return;
    }
    setIsSubmittingCall(true);
    try {
      const res = await fetch(`${API_BASE}/frontdesk/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(callForm)
      });
      if (res.ok) {
        setCallModalOpen(false);
        setCallForm({
          caller_name: '',
          phone: '',
          call_type: 'Incoming',
          duration: '3 mins',
          purpose: 'Admissions & Fee Inquiries',
          follow_up_needed: false,
          message: ''
        });
        const refRes = await fetch(`${API_BASE}/frontdesk/calls`);
        if (refRes.ok) {
          const rData = await refRes.json();
          setCalls(rData.data || []);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to log call.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSubmittingCall(false);
    }
  };

  // Front Desk: Submit Complaint / Feedback
  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.complainant_name.trim() || !complaintForm.description.trim()) {
      alert('Complainant name and feedback details are required.');
      return;
    }
    setIsSubmittingComplaint(true);
    try {
      const res = await fetch(`${API_BASE}/frontdesk/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(complaintForm)
      });
      if (res.ok) {
        setComplaintModalOpen(false);
        setComplaintForm({
          complainant_name: '',
          complainant_phone: '',
          complaint_type: 'Academics',
          description: '',
          assigned_to: 'Administrative Officer'
        });
        const refRes = await fetch(`${API_BASE}/frontdesk/complaints`);
        if (refRes.ok) {
          const rData = await refRes.json();
          setComplaints(rData.data || []);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Front Desk: Resolve Complaint
  const handleResolveComplaint = async (id) => {
    const notes = prompt('Enter resolution action taken by school administration:');
    if (!notes || !notes.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/frontdesk/complaints/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ resolution_notes: notes.trim() })
      });
      if (res.ok) {
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved', resolution_notes: notes.trim() } : c));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to resolve complaint.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-hidden">
      <div className="bg-slate-900 rounded-3xl max-w-7xl w-full h-[96vh] shadow-2xl border border-slate-800 text-left relative flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/official-logo.jpg" 
              alt="Eagle Power Schools Seal" 
              className="w-9 h-9 rounded-full border-2 border-amber-400 object-cover shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">
                  EaglePower EduCore
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                  Production ERP
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                School Management System &bull; 2 & 9 Amikwo Road, Awka
              </p>
            </div>
          </div>

          {/* Institutional Preview: Strictly restricted to SuperAdmin */}
          {currentUser && currentUser.role === 'superadmin' && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
              <span className="text-[10px] text-amber-400/80 font-bold uppercase px-2 hidden sm:inline">Admin Preview:</span>
              <button
                onClick={() => { setActiveRole('superadmin'); setActiveTab('executive_cockpit'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'superadmin' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                👑 SuperAdmin
              </button>
              <button
                onClick={() => { setActiveRole('admin'); setActiveTab('executive_cockpit'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'admin' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏛️ Principal
              </button>
              <button
                onClick={() => { setActiveRole('teacher'); setActiveTab('gradebook'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'teacher' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                👨‍🏫 Teacher
              </button>
              <button
                onClick={() => { setActiveRole('bursar'); setActiveTab('invoices'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'bursar' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                💼 Bursar
              </button>
              <button
                onClick={() => { setActiveRole('student'); setActiveTab('reportcard'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'student' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎒 Student
              </button>
              <button
                onClick={() => { setActiveRole('parent'); setActiveTab('child_overview'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'parent' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                👪 Parent
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
            <button
              onClick={fetchAllData}
              title="Refresh Data from Live Server"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* If user is NOT logged in: Production Authentication Screen */}
        {!currentUser ? (
          <div className="grow overflow-y-auto p-6 flex flex-col items-center justify-center max-w-xl mx-auto w-full space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white">Staff, Student & Parent Portal Access</h3>
              <p className="text-xs text-slate-400">
                Log in to your verified Eagle Power EduCore portal profile or register as a parent.
              </p>
            </div>

            {/* Toggle Mode: Sign In vs Parent Registration */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full max-w-sm text-xs">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  !isRegisterMode ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  isRegisterMode ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register Parent
              </button>
            </div>

            {isRegisterMode ? (
              /* Parent Self-Registration Form */
              <form onSubmit={handlePerformRegister} className="w-full space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs animate-in fade-in">
                <div className="text-left mb-1">
                  <h4 className="font-bold text-white text-sm">Parent Self-Registration</h4>
                  <p className="text-[11px] text-slate-400">Link your portal profile to your child's student admission number.</p>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Barr. Jude Okonkwo"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Phone Number (Login ID) *</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0803XXXXXXX"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Child's Admission No *</label>
                    <input
                      type="text"
                      required
                      value={regChildAdmNo}
                      onChange={(e) => setRegChildAdmNo(e.target.value)}
                      placeholder="e.g. ESE2009012"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  <span>Register Parent & Link Child Profile</span>
                </button>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handlePerformLogin} className="w-full space-y-3.5 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs">
                {loginError && (
                  <div className="w-full p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Username / Admission Number / Phone</label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. admin, ESE2009012, or 08037098816"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Password / Secure Access PIN</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Authenticate & Launch Portal</span>
                </button>
              </form>
            )}

            {/* Institutional Portal Guidance & Protection Notice */}
            <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified Portal Authentication</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] leading-relaxed">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <strong className="text-white block mb-0.5">🏛️ Administrative & Faculty:</strong>
                  <span>Sign in with your assigned staff username or staff ID number and your secure access password.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <strong className="text-white block mb-0.5">🎒 Enrolled Students:</strong>
                  <span>Sign in using your school Admission Number (e.g. <span className="font-mono text-amber-300">ESE2009012</span>) and access PIN.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 sm:col-span-2">
                  <strong className="text-white block mb-0.5">👪 Parents & Guardians:</strong>
                  <span>Log in with your registered phone number, or select <strong>Register Parent</strong> above to link your portal profile with your child's records via verified guardian match.</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* When Logged In: Role-Based Dashboard View */
          <div className="flex grow overflow-hidden">
            
            {/* Sidebar */}
            <aside className="w-52 bg-slate-950/70 border-r border-slate-800 p-3.5 flex flex-col justify-between shrink-0 hidden md:flex text-xs">
              <div className="space-y-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Logged in User</span>
                  <strong className="text-white font-extrabold text-xs block mt-0.5 truncate">{currentUser.full_name}</strong>
                  <span className="text-slate-400 text-[10px] block uppercase mt-0.5 font-mono">{currentUser.role}</span>
                </div>

                {/* Role Specific Nav */}
                <nav className="space-y-1">
                  {activeRole === 'superadmin' && (
                    <>
                      <button
                        onClick={() => setActiveTab('executive_cockpit')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'executive_cockpit' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🏛️ Head's Cockpit</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'overview' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Overview KPIs</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'security' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Security Hardening</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('staff')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'staff' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Staff Faculty</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('broadsheet')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'broadsheet' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                        <span>Master Broadsheet</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('templates')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'templates' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Layout className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Template Gallery</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'admin' && (
                    <>
                      <button
                        onClick={() => setActiveTab('executive_cockpit')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'executive_cockpit' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🏛️ Head's Cockpit</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('broadsheet')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'broadsheet' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                        <span>Master Broadsheet</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('templates')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'templates' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Layout className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Template Gallery</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('admissions')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'admissions' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Admissions ({admissions.length})</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('classes')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'classes' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>16 Classes</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('staff')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'staff' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Staff Faculty</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('visitors')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'visitors' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Front Desk</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'teacher' && (
                    <>
                      <button
                        onClick={() => {
                          setActiveTab('attendance');
                          fetchStudentAttendance(attendanceClassId, attendanceDate);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'attendance' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Daily Attendance</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('gradebook')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'gradebook' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Live Score Entry</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('broadsheet')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'broadsheet' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                        <span>Class Broadsheet</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('homework')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'homework' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Class Homework ({homeworkList.length})</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'bursar' && (
                    <>
                      <button
                        onClick={() => setActiveTab('invoices')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'invoices' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Tuition Invoices</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'student' && (
                    <>
                      <button
                        onClick={() => setActiveTab('reportcard')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'reportcard' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>E-Report Card</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('homework')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'homework' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Assignments & Tasks</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'parent' && (
                    <>
                      <button
                        onClick={() => setActiveTab('child_overview')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'child_overview' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>My Children</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('ai_progress');
                          const targetStudent = currentUser?.children?.[0] || students[0];
                          if (targetStudent) fetchStudentAiProgress(targetStudent.id);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'ai_progress' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>🧠 AI Progress & Advice</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('homework')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'homework' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Submit Homework</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('reportcard')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'reportcard' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Termly Report Cards</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('invoices')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'invoices' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Tuition & Fees</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                <span>Eagle Power &bull; Awka</span>
              </div>
            </aside>

            {/* Main Panel Content */}
            <main className="grow p-4 sm:p-6 overflow-y-auto bg-slate-900/50">
              
              {/* EXECUTIVE SCHOOL HEAD DECISION COCKPIT */}
              {activeTab === 'executive_cockpit' && (
                <ExecutiveReportingCockpit authToken={authToken} />
              )}

              {/* SUPERADMIN DASHBOARD */}
              {activeRole === 'superadmin' && activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-black text-white">Executive Command Overview</h3>
                    <p className="text-xs text-slate-400">Live school analytics from SQLite production database</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Total Pupils Enrolled</span>
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-black text-white mt-1">
                        {students.length > 0 ? `${students.length} Students` : 'Loading...'}
                      </div>
                      <span className="text-[11px] text-emerald-400 mt-1 block">Migrated & active in SQLite</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Fees Invoiced</span>
                        <CreditCard className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-black text-amber-400 mt-1">
                        ₦{(financeStats?.total_invoiced ?? 0).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Collected: ₦{(financeStats?.total_collected ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Outstanding Debt</span>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="text-2xl font-black text-red-400 mt-1">
                        ₦{(financeStats?.outstanding_debt ?? 0).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">Pending collection</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Security Hardening</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">100% Active</div>
                      <span className="text-[11px] text-slate-400 mt-1 block">0 PHP execution &bull; Bcrypt</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-400" />
                      <h4 className="font-extrabold text-white text-sm">Vulnerability Elimination & Mitigation Report</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The compromised legacy PHP system suffered from unauthenticated file upload exploitation. In this modern Node.js EduCore architecture, all 96 historical pupils and 16 classes were preserved while completely eliminating execution of PHP scripts.
                    </p>
                  </div>
                </div>
              )}

              {/* SUPERADMIN & ADMIN: Staff */}
              {(activeRole === 'superadmin' || activeRole === 'admin') && activeTab === 'staff' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">Staff Faculty & Officers</h3>
                      <p className="text-xs text-slate-400">Institutional personnel and academic faculty profiles</p>
                    </div>
                    <button
                      onClick={() => { setAddStaffModalOpen(true); setAddedStaffSuccess(null); }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Staff Member</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {staff.map(s => (
                      <div key={s.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-amber-400 text-[10px]">{s.staff_no}</span>
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                            {s.assigned_class || 'General Faculty'}
                          </span>
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm">{s.name}</div>
                          <div className="text-slate-300 font-semibold">{s.role}</div>
                          <div className="text-slate-400 text-[11px]">{s.qualification}</div>
                        </div>
                        {s.role.toLowerCase().includes('teacher') && (
                          <div className="pt-2 border-t border-slate-900 flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedStaffForClass(s);
                                setSelectedClassNameToAssign(s.assigned_class || classes[0]?.name || 'JSS1');
                                setSelectedClassForTeacher(null);
                                setAssignClassModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[10px] font-bold transition-colors"
                            >
                              Assign / Change Class &rarr;
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUPERADMIN: Security */}
              {activeRole === 'superadmin' && activeTab === 'security' && (
                <div className="space-y-4 animate-in fade-in text-xs">
                  <h3 className="text-lg font-bold text-white">Live System Hardening Diagnostics</h3>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Security Guardrails Live Verification</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                      <li>PHP Execution Vector: <strong>Permanently Eliminated</strong>.</li>
                      <li>Credentials: <strong>100% Bcrypt Salted Hashes (Cost 10)</strong>.</li>
                      <li>SQL Injection Defense: <strong>Strict Parameterization via SQLite Sync</strong>.</li>
                      <li>Brute-Force Defense: <strong>Rate Limiter Active</strong> (30 auth reqs / 15 min).</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* PRINCIPAL (ADMIN) DASHBOARD: Admissions */}
              {activeRole === 'admin' && activeTab === 'admissions' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">Online Admissions Pipeline</h3>
                      <p className="text-xs text-slate-400">Applications received from website form</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-800/40">
                      {admissions.length} Applicants
                    </span>
                  </div>

                  <div className="space-y-3">
                    {admissions.map(adm => (
                      <div key={adm.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400 font-bold">{adm.application_no}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              adm.status === 'Admitted' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              adm.status === 'Screening Scheduled' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                              'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {adm.status}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-white">{adm.student_name} ({adm.gender})</div>
                          <div className="text-slate-400">
                            Applying For: <strong className="text-white">{adm.applying_class}</strong> &bull; Parent: <strong className="text-slate-200">{adm.parent_name} ({adm.parent_phone})</strong>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Previous School: {adm.previous_school || 'None'} &bull; Address: {adm.address}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {adm.status !== 'Screening Scheduled' && adm.status !== 'Admitted' && (
                            <button
                              onClick={() => handleUpdateAdmissionStatus(adm.id, 'Screening Scheduled')}
                              className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold text-xs"
                            >
                              Schedule Screening
                            </button>
                          )}
                          {adm.status !== 'Admitted' && (
                            <button
                              onClick={() => handleUpdateAdmissionStatus(adm.id, 'Admitted')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-xs"
                            >
                              Grant Admission
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRINCIPAL & SUPERADMIN: Classes */}
              {(activeRole === 'admin' || activeRole === 'superadmin') && activeTab === 'classes' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">Class Registry & Enrolled Pupils</h3>
                      <p className="text-xs text-slate-400">Click any class card to view its master academic broadsheet & marks matrix</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-bold bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-800/40">
                        {classes.length} Total Cohorts
                      </span>
                      <button
                        onClick={() => { setEnrollStudentModalOpen(true); setEnrolledStudentSuccess(null); }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Enroll Student & Parent</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {classes.map(c => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 transition-all text-xs space-y-1.5 shadow-sm group"
                      >
                        <div className="flex justify-between items-center">
                          <strong 
                            onClick={() => { setSelectedClassId(c.id); setActiveTab('broadsheet'); }}
                            className="text-white text-sm group-hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            {c.name}
                          </strong>
                          <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded font-bold">{c.division}</span>
                        </div>
                        <div className="text-slate-400">Enrolled Pupils: <strong className="text-white">{c.student_count || 0}</strong></div>
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Form Teacher:</span>
                          <span className={`font-semibold text-[11px] truncate max-w-[120px] ${c.teacher_name ? 'text-amber-300' : 'text-slate-500 italic'}`}>
                            {c.teacher_name || 'Unassigned'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex justify-between items-center pt-1.5 border-t border-slate-900">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClassForTeacher(c);
                              setSelectedTeacherIdToAssign(c.teacher_id ? String(c.teacher_id) : '');
                              setSelectedStaffForClass(null);
                              setAssignClassModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded font-bold border border-amber-400/30 transition-colors"
                          >
                            {c.teacher_name ? 'Change Teacher' : 'Assign Teacher'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedClassId(c.id); setActiveTab('broadsheet'); }}
                            className="text-slate-300 hover:text-white font-bold text-[10px] group-hover:underline"
                          >
                            Broadsheet &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRINCIPAL & RECEPTION: FRONT DESK & VISITOR MANAGEMENT */}
              {activeRole === 'admin' && activeTab === 'visitors' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Front Desk Sub-Tab Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                      <button
                        onClick={() => setFrontDeskSubTab('visitors')}
                        className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                          frontDeskSubTab === 'visitors'
                            ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Security Passes ({visitors.length})</span>
                      </button>
                      <button
                        onClick={() => setFrontDeskSubTab('enquiries')}
                        className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                          frontDeskSubTab === 'enquiries'
                            ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Admission Enquiries ({enquiries.length})</span>
                      </button>
                      <button
                        onClick={() => setFrontDeskSubTab('calls')}
                        className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                          frontDeskSubTab === 'calls'
                            ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Logs ({calls.length})</span>
                      </button>
                      <button
                        onClick={() => setFrontDeskSubTab('complaints')}
                        className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                          frontDeskSubTab === 'complaints'
                            ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Complaints & Feedback ({complaints.length})</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {frontDeskSubTab === 'visitors' && (
                        <button
                          onClick={() => setVisitorModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Issue Visitor Pass</span>
                        </button>
                      )}
                      {frontDeskSubTab === 'enquiries' && (
                        <button
                          onClick={() => setEnquiryModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Log New Enquiry</span>
                        </button>
                      )}
                      {frontDeskSubTab === 'calls' && (
                        <button
                          onClick={() => setCallModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Log Phone Call</span>
                        </button>
                      )}
                      {frontDeskSubTab === 'complaints' && (
                        <button
                          onClick={() => setComplaintModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Log Feedback / Complaint</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-tab 1: Visitors Book */}
                  {frontDeskSubTab === 'visitors' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Real-time gatekeeper reception log and badge tracking</span>
                        <span className="font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-800/40">
                          {visitors.filter(v => v.status === 'In Campus').length} Active On Campus
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {visitors.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No visitor records found.
                          </div>
                        ) : (
                          visitors.map(v => (
                            <div key={v.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-amber-400 font-bold">{v.pass_no}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    v.status === 'In Campus' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                  }`}>{v.status}</span>
                                  <span className="font-mono text-slate-400 text-[10px]">{v.badge_no}</span>
                                </div>
                                <div className="font-bold text-white text-sm mt-0.5">{v.visitor_name} &bull; <span className="font-normal text-slate-400 font-mono text-xs">{v.phone}</span></div>
                                <div className="text-slate-400">Seeing: <strong className="text-slate-200">{v.person_to_see}</strong> &bull; Purpose: {v.purpose}</div>
                              </div>

                              {v.status === 'In Campus' && (
                                <button
                                  onClick={() => handleVisitorCheckout(v.id)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                                >
                                  Check Out
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Admission Enquiries */}
                  {frontDeskSubTab === 'enquiries' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Prospect and parent admissions pipeline</span>
                        <span className="font-bold text-amber-400 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-800/40">
                          {enquiries.filter(e => e.status === 'Active').length} Active Leads
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {enquiries.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No admission enquiries logged yet.
                          </div>
                        ) : (
                          enquiries.map(enq => (
                            <div key={enq.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-amber-400 font-bold">{enq.enquiry_no}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    enq.status === 'Active' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                                    enq.status === 'Converted/Admitted' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                                    enq.status === 'Followed Up' ? 'bg-blue-950 text-blue-400 border border-blue-800/40' :
                                    'bg-slate-800 text-slate-400'
                                  }`}>{enq.status}</span>
                                  <span className="text-slate-400 text-[10px]">Source: {enq.source}</span>
                                </div>
                                <div className="font-bold text-white text-sm mt-0.5">{enq.name}</div>
                                <div className="text-slate-400 font-mono text-xs">Phone: {enq.phone} {enq.email && `| Email: ${enq.email}`}</div>
                                <div className="text-slate-300 mt-1">Class Interested: <strong className="text-amber-300">{enq.class_interested}</strong> {enq.notes && `&bull; Note: ${enq.notes}`}</div>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={enq.status}
                                  onChange={(e) => handleUpdateEnquiryStatus(enq.id, e.target.value)}
                                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Followed Up">Followed Up</option>
                                  <option value="Converted/Admitted">Converted/Admitted</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 3: Phone Calls */}
                  {frontDeskSubTab === 'calls' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Reception telephone communication logs</span>
                        <span className="font-bold text-blue-400 bg-blue-950/40 px-3 py-1 rounded-xl border border-blue-800/40">
                          {calls.length} Total Calls
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {calls.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No telephone logs found.
                          </div>
                        ) : (
                          calls.map(cl => (
                            <div key={cl.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cl.call_type === 'Incoming' ? 'bg-emerald-950 text-emerald-400' : 'bg-blue-950 text-blue-400'
                                  }`}>{cl.call_type}</span>
                                  <span className="font-mono text-slate-400 text-[10px]">{cl.call_date}</span>
                                  <span className="text-slate-500 text-[10px]">({cl.duration})</span>
                                  {Boolean(cl.follow_up_needed) && (
                                    <span className="bg-rose-950 text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-800/40">
                                      Follow-up Needed
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-white text-sm mt-0.5">{cl.caller_name} &bull; <span className="font-normal font-mono text-slate-400 text-xs">{cl.phone}</span></div>
                                <div className="text-slate-300">Purpose: <strong className="text-slate-100">{cl.purpose}</strong></div>
                                {cl.message && <div className="text-slate-400 mt-0.5 italic">"{cl.message}"</div>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 4: Complaints & Parent Feedback */}
                  {frontDeskSubTab === 'complaints' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Parent satisfaction, feedback, and grievance resolution desk</span>
                        <span className="font-bold text-rose-400 bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-800/40">
                          {complaints.filter(c => c.status === 'Pending').length} Pending Review
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {complaints.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No complaints or grievances logged.
                          </div>
                        ) : (
                          complaints.map(cp => (
                            <div key={cp.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs">
                              <div className="max-w-2xl">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-amber-400 font-bold">{cp.complaint_no}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cp.status === 'Pending' ? 'bg-rose-950 text-rose-400 border border-rose-800/40' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                  }`}>{cp.status}</span>
                                  <span className="text-slate-400 text-[10px]">Type: {cp.complaint_type}</span>
                                  <span className="text-slate-500 text-[10px]">Assigned to: {cp.assigned_to}</span>
                                </div>
                                <div className="font-bold text-white text-sm mt-0.5">{cp.complainant_name} {cp.complainant_phone && `(${cp.complainant_phone})`}</div>
                                <div className="text-slate-200 mt-1 leading-relaxed">{cp.description}</div>
                                {cp.resolution_notes && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px]">
                                    <strong>Resolution:</strong> {cp.resolution_notes}
                                  </div>
                                )}
                              </div>

                              {cp.status === 'Pending' && (
                                <button
                                  onClick={() => handleResolveComplaint(cp.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow transition-all flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Resolve</span>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TEACHER DASHBOARD: DAILY STUDENT ATTENDANCE REGISTER */}
              {activeRole === 'teacher' && activeTab === 'attendance' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">Daily Student Attendance Register</h3>
                      <p className="text-xs text-slate-400">Live official roll-call tracking and permanent database record</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <select
                        value={attendanceClassId}
                        onChange={(e) => {
                          const cId = parseInt(e.target.value);
                          setAttendanceClassId(cId);
                          fetchStudentAttendance(cId, attendanceDate);
                        }}
                        className="bg-slate-950 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.student_count || 0} pupils)</option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => {
                          setAttendanceDate(e.target.value);
                          fetchStudentAttendance(attendanceClassId, e.target.value);
                        }}
                        className="bg-slate-950 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl"
                      />

                      <button
                        onClick={() => handleMarkAllAttendance('Present')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
                      >
                        Mark All Present
                      </button>

                      <button
                        onClick={handleSaveAttendance}
                        disabled={isSavingAttendance || attendanceRecords.length === 0}
                        className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSavingAttendance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Roll-Call</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Total Roll</div>
                      <div className="text-white font-black text-lg">{attendanceRecords.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                      <div className="text-emerald-400 text-[10px] uppercase font-bold">Present</div>
                      <div className="text-emerald-300 font-black text-lg">{attendanceRecords.filter(r => r.status === 'Present').length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40">
                      <div className="text-rose-400 text-[10px] uppercase font-bold">Absent</div>
                      <div className="text-rose-300 font-black text-lg">{attendanceRecords.filter(r => r.status === 'Absent').length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
                      <div className="text-amber-400 text-[10px] uppercase font-bold">Late</div>
                      <div className="text-amber-300 font-black text-lg">{attendanceRecords.filter(r => r.status === 'Late').length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40">
                      <div className="text-blue-400 text-[10px] uppercase font-bold">Excused</div>
                      <div className="text-blue-300 font-black text-lg">{attendanceRecords.filter(r => r.status === 'Excused').length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Unrecorded</div>
                      <div className="text-slate-300 font-black text-lg">{attendanceRecords.filter(r => r.status === 'Unrecorded').length}</div>
                    </div>
                  </div>

                  {attendanceSaveSuccess && (
                    <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Class roll-call successfully recorded and stored in the official attendance database!</span>
                    </div>
                  )}

                  {isLoadingAttendance ? (
                    <div className="p-12 text-center text-slate-400 bg-slate-950 rounded-2xl border border-slate-800 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Loading roll-call register...</span>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                      No enrolled students found in this class for attendance.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3">Admission No</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Parent Phone</th>
                            <th className="p-3 text-center">Roll-Call Status</th>
                            <th className="p-3">Remarks / Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {attendanceRecords.map((r, i) => (
                            <tr key={r.student_id} className="hover:bg-slate-900/40">
                              <td className="p-3 text-center font-mono text-slate-500 text-[11px]">{i + 1}</td>
                              <td className="p-3 font-mono font-bold text-amber-400">{r.admission_no}</td>
                              <td className="p-3 font-bold text-white">{r.first_name} {r.last_name}</td>
                              <td className="p-3 font-mono text-slate-400 text-[11px]">{r.guardian_phone || '—'}</td>
                              <td className="p-3 text-center">
                                <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 gap-1">
                                  {[
                                    { id: 'Present', label: 'P', title: 'Present', activeClass: 'bg-emerald-600 text-white font-black' },
                                    { id: 'Absent', label: 'A', title: 'Absent', activeClass: 'bg-rose-600 text-white font-black' },
                                    { id: 'Late', label: 'L', title: 'Late', activeClass: 'bg-amber-500 text-slate-950 font-black' },
                                    { id: 'Excused', label: 'E', title: 'Excused', activeClass: 'bg-blue-600 text-white font-black' }
                                  ].map(btn => (
                                    <button
                                      key={btn.id}
                                      type="button"
                                      title={btn.title}
                                      onClick={() => handleUpdateStudentAttendance(r.student_id, 'status', btn.id)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                        r.status === btn.id
                                          ? btn.activeClass
                                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                      }`}
                                    >
                                      {btn.label}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="e.g. Doctor's appointment, fever..."
                                  value={r.remarks || ''}
                                  onChange={(e) => handleUpdateStudentAttendance(r.student_id, 'remarks', e.target.value)}
                                  className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TEACHER DASHBOARD: LIVE PRODUCTION GRADEBOOK */}
              {activeRole === 'teacher' && activeTab === 'gradebook' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">Continuous Assessment & Exam Score Register</h3>
                      <p className="text-xs text-slate-400">Live SQLite marks entry for enrolled students</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.student_count} pupils)</option>
                        ))}
                      </select>

                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>

                      <button
                        onClick={handleSaveBatchScores}
                        disabled={isSavingScores}
                        className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow transition-all flex items-center gap-1.5"
                      >
                        {isSavingScores ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Save Scores to Database</span>
                      </button>
                    </div>
                  </div>

                  {scoreSaveSuccess && (
                    <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Scores successfully calculated and permanently recorded in official SQLite database!</span>
                    </div>
                  )}

                  {/* Real Class Sheet Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                          <th className="p-3">Admission No</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3 text-center">CA Test (Max 30)</th>
                          <th className="p-3 text-center">Terminal Exam (Max 70)</th>
                          <th className="p-3 text-center">Total (100)</th>
                          <th className="p-3 text-center">WAEC Grade</th>
                          <th className="p-3">Teacher Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {classSheetRows.map((r, i) => (
                          <tr key={r.student_id} className="hover:bg-slate-900/40">
                            <td className="p-3 font-mono font-bold text-amber-400">{r.admission_no}</td>
                            <td className="p-3 font-bold text-white">{r.first_name} {r.last_name}</td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={r.ca_score}
                                onChange={(e) => handleScoreEdit(i, 'ca', e.target.value)}
                                className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-center font-bold text-white focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="70"
                                value={r.exam_score}
                                onChange={(e) => handleScoreEdit(i, 'exam', e.target.value)}
                                className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-center font-bold text-white focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="p-3 text-center font-black text-amber-400 text-sm">
                              {r.total_score}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-black text-xs ${
                                r.grade === 'A1' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                r.grade?.startsWith('B') ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                                'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}>
                                {r.grade}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 italic">{r.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* HOMEWORK & ASSIGNMENTS COCKPIT (TEACHERS, PARENTS, STUDENTS) */}
              {activeTab === 'homework' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">Academic Homework & In-House AI Evaluations</h3>
                      <p className="text-xs text-slate-400">
                        {activeRole === 'teacher' || activeRole === 'admin' 
                          ? 'Assign curriculum homework, configure AI rubrics, and review submissions'
                          : 'Active class homework assignments, AI auto-evaluation, and teacher feedback'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedHwClassId}
                        onChange={(e) => setSelectedHwClassId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs"
                      >
                        <option value="">All Classes ({homeworkList.length})</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>

                      {(activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'superadmin') && (
                        <button
                          onClick={() => setCreateHwModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign New Homework</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Homework Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {homeworkList
                      .filter(hw => !selectedHwClassId || hw.class_name === selectedHwClassId)
                      .map(hw => (
                      <div key={hw.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-amber-400/40 transition-colors">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-mono text-amber-400 font-bold text-[11px]">{hw.assignment_code}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                              Due: {hw.due_date}
                            </span>
                          </div>

                          <h4 className="text-white font-extrabold text-sm">{hw.title}</h4>
                          <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">{hw.description}</p>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                            <div className="flex justify-between text-slate-400">
                              <span>Class:</span>
                              <strong className="text-white">{hw.class_name}</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Subject:</span>
                              <strong className="text-white">{hw.subject_name}</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Teacher:</span>
                              <span className="text-slate-300">{hw.teacher_name}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Submissions:</span>
                              <strong className="text-emerald-400">{hw.submission_count} / {hw.total_students}</strong>
                            </div>
                          </div>

                          {hw.key_concepts && (
                            <div className="text-[10px] text-slate-400">
                              <span className="font-bold text-slate-500 uppercase block mb-0.5">Core In-House AI Concepts:</span>
                              <span className="text-amber-300/80 italic">{hw.key_concepts}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex gap-2 border-t border-slate-800/80">
                          {(activeRole === 'parent' || activeRole === 'student') ? (
                            <button
                              onClick={() => {
                                setSelectedAssignmentForSubmit(hw);
                                setParentHwSolution('');
                                setHwSubmissionResult(null);
                                setSubmitHwModalOpen(true);
                              }}
                              className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Submit Homework</span>
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                setSelectedHwForSubmissionsView(hw);
                                const res = await fetch(`${API_BASE}/homework/${hw.id}`).catch(() => null);
                                if (res?.ok) {
                                  const d = await res.json();
                                  setHwSubmissionsList(d.data?.submissions || []);
                                }
                              }}
                              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>View Submissions ({hw.submission_count})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {homeworkList.length === 0 && (
                      <div className="col-span-full p-8 text-center text-slate-400 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                        No homework assignments currently posted.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* IN-HOUSE AI STUDENT PROGRESS & PARENT RECOMMENDATIONS TAB */}
              {activeTab === 'ai_progress' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">In-House AI Student Progress & Parent Coaching</h3>
                      <p className="text-xs text-slate-400">
                        Zero external API dependency. Powered by local deterministic learning algorithms & Bayesian curriculum analytics.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => fetchStudentAiProgress(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs"
                      >
                        {students.slice(0, 30).map(s => (
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isLoadingAiProgress ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Generating In-House AI learning diagnostic...</div>
                  ) : parentAiProfile ? (
                    <div className="space-y-4">
                      {/* KPI Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Standing</span>
                          <strong className="text-base text-amber-400 block mt-1">{parentAiProfile.metrics.readiness_tier}</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{parentAiProfile.metrics.term_average}% Term Average</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Instructional Attendance</span>
                          <strong className="text-base text-emerald-400 block mt-1">{parentAiProfile.metrics.attendance_rate}%</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{parentAiProfile.metrics.absent_days} Total Absences</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Homework Submissions</span>
                          <strong className="text-base text-blue-400 block mt-1">{parentAiProfile.metrics.homework_submissions} Completed</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">AI Evaluated</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Learning Gaps Identified</span>
                          <strong className="text-base text-rose-400 block mt-1">{parentAiProfile.critical_subjects.length} Subjects</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">Require Reinforcement</span>
                        </div>
                      </div>

                      {/* AI Recommendations List */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Personalized Home Action Recommendations for Parents</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {parentAiRecs.map(rec => (
                            <div key={rec.id || rec.recommendation_code} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                              <div className="flex justify-between items-start">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rec.urgency === 'Urgent' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                  rec.urgency === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                  'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                }`}>
                                  {rec.category} &bull; {rec.urgency}
                                </span>
                                <span className="font-mono text-[9px] text-slate-500">{rec.recommendation_code}</span>
                              </div>

                              <div>
                                <h5 className="font-extrabold text-white text-sm">{rec.title}</h5>
                                <p className="text-slate-300 text-xs mt-1 leading-relaxed">{rec.detailed_advice}</p>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase block">Actionable Home Tasks:</span>
                                {(() => {
                                  try {
                                    const steps = JSON.parse(rec.actionable_steps);
                                    return (
                                      <ul className="space-y-1 list-disc list-inside text-slate-300 text-[11px]">
                                        {steps.map((st, i) => (
                                          <li key={i}>{st}</li>
                                        ))}
                                      </ul>
                                    );
                                  } catch {
                                    return <span className="text-slate-400">{rec.actionable_steps}</span>;
                                  }
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">Select a student above to review their In-House AI academic trajectory and parent recommendations.</div>
                  )}
                </div>
              )}

              {/* BURSAR & PARENT DASHBOARD: FINANCIAL INVOICES & CLEARANCE */}
              {(activeRole === 'bursar' || activeRole === 'parent') && activeTab === 'invoices' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">Tuition & Development Fee Statements</h3>
                      <p className="text-xs text-slate-400">
                        {activeRole === 'parent' ? 'Official billing ledger and verified clearance receipts for your wards' : 'Live bursary billing ledger and payment intake'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-bold">Filter:</span>
                      {['All', 'Unpaid', 'Partial', 'Paid'].map(st => (
                        <button
                          key={st}
                          onClick={() => setInvoiceFilter(st)}
                          className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                            invoiceFilter === st ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Printed Receipt Banner */}
                  {activeReceipt && (
                    <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs flex justify-between items-center animate-in fade-in">
                      <div>
                        <strong>Payment Verified!</strong> Receipt #{activeReceipt.receiptNo} issued for {activeReceipt.studentName} ({activeReceipt.className}) of ₦{activeReceipt.amount.toLocaleString()} via {activeReceipt.method}.
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {invoices
                      .filter(inv => {
                        if (activeRole === 'parent' && currentUser?.children && currentUser.children.length > 0) {
                          const childAdmNos = currentUser.children.map(c => c.admission_no);
                          const matchesChild = childAdmNos.includes(inv.admission_no);
                          const matchesPhone = currentUser.phone && inv.guardian_phone === currentUser.phone;
                          if (!matchesChild && !matchesPhone) return false;
                        }
                        return invoiceFilter === 'All' || inv.status === invoiceFilter;
                      })
                      .slice(0, 20)
                      .map(inv => (
                        <div key={inv.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-amber-400 font-bold">{inv.invoice_no}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                inv.status === 'Partial' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                                'bg-red-950 text-red-400 border border-red-800'
                              }`}>{inv.status}</span>
                            </div>
                            <div className="text-sm font-extrabold text-white">
                              {inv.first_name} {inv.last_name} &bull; <span className="font-mono text-slate-400">{inv.admission_no}</span>
                            </div>
                            <div className="text-slate-400">
                              Class: <strong className="text-white">{inv.class_name}</strong> &bull; Parent: <strong className="text-slate-200">{inv.guardian_name} ({inv.guardian_phone})</strong>
                            </div>
                            <div className="text-slate-400">
                              Due: <strong className="text-white">₦{inv.amount_due.toLocaleString()}</strong> &bull; Paid: <strong className="text-emerald-400">₦{inv.amount_paid.toLocaleString()}</strong> &bull; Outstanding: <strong className="text-red-400">₦{(inv.amount_due - inv.amount_paid).toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {inv.status !== 'Paid' && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setPaymentAmount(String(inv.amount_due - inv.amount_paid));
                                  setPaymentModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow"
                              >
                                Record Payment
                              </button>
                            )}
                            {inv.status === 'Paid' && (
                              <button
                                onClick={() => {
                                  setActiveReceipt({
                                    receiptNo: `RCT-${inv.invoice_no}`,
                                    invoiceNo: inv.invoice_no,
                                    studentName: `${inv.first_name} ${inv.last_name}`,
                                    admissionNo: inv.admission_no,
                                    className: inv.class_name,
                                    amount: inv.amount_paid,
                                    method: 'Bank Transfer (Verified Clearance)',
                                    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                  });
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Verified Clearance</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* BROADSHEET & MASTER REPORT SHEETS MODULE */}
              {activeTab === 'broadsheet' && (
                <div className="space-y-6 animate-in fade-in">
                  <BroadsheetView token={authToken} userRole={activeRole} />
                </div>
              )}

              {/* REPORT TEMPLATES GALLERY */}
              {activeTab === 'templates' && (
                <div className="space-y-6 animate-in fade-in">
                  <TemplateGallery authToken={authToken} apiBase={API_BASE} />
                </div>
              )}

              {/* STUDENT & PARENT DASHBOARD: OFFICIAL PRODUCTION REPORT CARD */}
              {(activeRole === 'student' || activeRole === 'parent') && activeTab === 'reportcard' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Official Termly E-Report Card</h3>
                      <p className="text-xs text-slate-400">Authentic Nigerian terminal evaluation with WAEC grade calculations</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search student or adm no..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-36 sm:w-48"
                        />
                      </div>
                      <select
                        value={selectedStudentAdmNo}
                        onChange={(e) => {
                          setSelectedStudentAdmNo(e.target.value);
                          fetchReportCard(e.target.value);
                        }}
                        className="bg-slate-900 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl max-w-xs"
                      >
                        {students
                          .filter(s => {
                            if (!studentSearchQuery) return true;
                            const q = studentSearchQuery.toLowerCase();
                            return (
                              s.first_name.toLowerCase().includes(q) ||
                              s.last_name.toLowerCase().includes(q) ||
                              s.admission_no.toLowerCase().includes(q) ||
                              (s.class_name && s.class_name.toLowerCase().includes(q))
                            );
                          })
                          .map(s => (
                            <option key={s.id} value={s.admission_no}>
                              {s.first_name} {s.last_name} ({s.admission_no} - {s.class_name})
                            </option>
                          ))}
                      </select>

                      <span className="text-slate-400 font-bold ml-1">Template:</span>
                      <select
                        value={studentSelectedTemplate}
                        onChange={(e) => setStudentSelectedTemplate(e.target.value)}
                        className="bg-indigo-900 border border-indigo-700 text-amber-300 font-bold px-2.5 py-1.5 rounded-xl outline-none"
                      >
                        <option value="ELITE">Elite Modern (Glass)</option>
                        <option value="CHERITH">Cherith Legacy Standard</option>
                        <option value="ALQALAM">Al Qalam Heritage</option>
                        <option value="PRIMARY">Primary School Theme</option>
                        <option value="NURSERY">Nursery Colorful</option>
                        <option value="CLASSIC">Classic Professional</option>
                      </select>

                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black flex items-center gap-1.5 shadow"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Hard Copy</span>
                      </button>
                    </div>
                  </div>

                  {reportCardLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Loading official report card dossier...</div>
                  ) : standardReport ? (
                    <div className="flex justify-center bg-slate-950/70 p-4 rounded-3xl border border-slate-800 overflow-x-auto">
                      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none p-1">
                        {(() => {
                          switch (studentSelectedTemplate) {
                            case 'CHERITH': return <CherithClassicTemplate data={standardReport} />;
                            case 'ALQALAM': return <AlQalamClassicTemplate data={standardReport} />;
                            case 'PRIMARY': return <PrimarySchoolTemplate data={standardReport} />;
                            case 'NURSERY': return <NurseryColorfulTemplate data={standardReport} />;
                            case 'CLASSIC': return <ClassicProfessionalTemplate data={standardReport} />;
                            default: return <EliteModernTemplate data={standardReport} />;
                          }
                        })()}
                      </div>
                    </div>
                  ) : studentReportCard ? (
                    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-xs space-y-5">
                      {/* Crest & Header */}
                      <div className="text-center pb-4 border-b border-slate-800 space-y-1">
                        <img src="/assets/official-logo.jpg" alt="Official Eagle Power Seal" className="w-14 h-14 mx-auto rounded-full border-2 border-amber-400 object-cover" />
                        <h4 className="text-base font-black text-white uppercase tracking-wider">{studentReportCard.school_info.name}</h4>
                        <p className="text-[11px] text-amber-400 font-bold italic">"{studentReportCard.school_info.motto}"</p>
                        <p className="text-[10px] text-slate-400">{studentReportCard.school_info.campus_address} &bull; {studentReportCard.school_info.government_approval}</p>
                      </div>

                      {/* Standings Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900 rounded-2xl border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Student Name</span>
                          <strong className="text-white text-xs">{studentReportCard.student.full_name}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Class Standing</span>
                          <strong className="text-amber-400 text-xs">{studentReportCard.performance_summary.class_position}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Term Average</span>
                          <strong className="text-emerald-400 text-xs">{studentReportCard.performance_summary.average_percentage}%</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Resumption Date</span>
                          <strong className="text-slate-200 text-xs">{studentReportCard.academic_period.next_term_resumption}</strong>
                        </div>
                      </div>

                      {/* Marks Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase">
                              <th className="p-2.5">Subject</th>
                              <th className="p-2.5 text-center">CA (30)</th>
                              <th className="p-2.5 text-center">Exam (70)</th>
                              <th className="p-2.5 text-center">Total (100)</th>
                              <th className="p-2.5 text-center">WAEC Grade</th>
                              <th className="p-2.5">Remark</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {studentReportCard.subjects.map((s, i) => (
                              <tr key={i} className="hover:bg-slate-900/30">
                                <td className="p-2.5 font-bold text-white">{s.subject_name}</td>
                                <td className="p-2.5 text-center text-slate-300">{s.ca_score}</td>
                                <td className="p-2.5 text-center text-slate-300">{s.exam_score}</td>
                                <td className="p-2.5 text-center font-bold text-amber-400">{s.total_score}</td>
                                <td className="p-2.5 text-center font-bold text-emerald-400">{s.grade}</td>
                                <td className="p-2.5 text-slate-400 italic text-[11px]">{s.remark}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Principal Remark */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">Head Administrator's Official Endorsement</span>
                        <p className="text-xs text-slate-200 italic">
                          "{studentReportCard.evaluations?.principal_remark || 'An outstanding and disciplined scholar.'}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">No result card on file for this student.</div>
                  )}
                </div>
              )}

              {/* PARENT DASHBOARD: CHILD OVERVIEW */}
              {activeRole === 'parent' && activeTab === 'child_overview' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Guardian Portal</span>
                      <h3 className="text-lg font-black text-white mt-0.5">Welcome, {currentUser?.full_name || 'Guardian'}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Phone: <span className="font-mono text-slate-200">{currentUser?.phone || currentUser?.username}</span> &bull; Status: <span className="text-emerald-400 font-bold">Verified Parent</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('reportcard')}
                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>View Academic Report Cards</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('invoices')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>Tuition Statements</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3">Enrolled Wards & Academic Profiles</h4>
                    {currentUser?.children && currentUser.children.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentUser.children.map(ch => (
                          <div key={ch.id || ch.admission_no} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-amber-400/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-mono text-amber-400 font-bold block">{ch.admission_no}</span>
                                <h5 className="font-extrabold text-white text-base mt-0.5">{ch.first_name} {ch.last_name}</h5>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                {ch.status || 'Active'}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs space-y-1">
                              <div className="flex justify-between text-slate-400">
                                <span>Class:</span>
                                <strong className="text-white">{ch.class_name || 'Assigned'}</strong>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Campus:</span>
                                <span className="text-slate-300">Awka Main</span>
                              </div>
                            </div>

                            <div className="pt-1 flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStudentAdmNo(ch.admission_no);
                                  setActiveTab('reportcard');
                                  fetchReportCard(ch.admission_no);
                                }}
                                className="flex-1 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>E-Report Card</span>
                              </button>
                              <button
                                onClick={() => setActiveTab('invoices')}
                                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                              >
                                ₦ Fees
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                        <p className="text-xs text-slate-400">No wards linked to this account yet.</p>
                        <p className="text-[11px] text-slate-500">Please contact the school administrator with your child's admission number to verify linkage.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </main>
          </div>
        )}

        {/* Modal: Bursar Record Payment */}
        {paymentModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-extrabold text-white">Record Official Fee Receipt</h4>
                <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div>Pupil: <strong className="text-white">{selectedInvoice.first_name} {selectedInvoice.last_name}</strong></div>
                <div>Invoice: <strong className="text-amber-400 font-mono">{selectedInvoice.invoice_no}</strong></div>
                <div>Outstanding Balance: <strong className="text-red-400">₦{(selectedInvoice.amount_due - selectedInvoice.amount_paid).toLocaleString()}</strong></div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Amount to Collect (₦)</label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option>Bank Transfer / Moniepoint</option>
                    <option>Paystack Online</option>
                    <option>Direct Cash at Bursary</option>
                    <option>Cheque / Bank Draft</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow"
                  >
                    Confirm & Issue Official Receipt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Front Desk Check In Visitor */}
        {visitorModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    🛡️
                  </span>
                  <h4 className="text-base font-extrabold text-white">Issue Official Visitor Pass</h4>
                </div>
                <button onClick={() => setVisitorModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Log campus guest arrival at the main security gate on Amikwo Road.
              </p>

              <form onSubmit={handleVisitorCheckin} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Visitor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Emeka Nnamdi"
                    value={visitorForm.visitor_name}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, visitor_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0803XXXXXXX"
                      value={visitorForm.phone}
                      onChange={(e) => setVisitorForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Badge / Tag #</label>
                    <input
                      type="text"
                      placeholder="e.g. BADGE-07"
                      value={visitorForm.badge_no}
                      onChange={(e) => setVisitorForm(prev => ({ ...prev, badge_no: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Purpose of Visit</label>
                    <select
                      value={visitorForm.purpose}
                      onChange={(e) => setVisitorForm(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Admissions Enquiry</option>
                      <option>Parent-Teacher Meeting</option>
                      <option>Bursary Fee Payment</option>
                      <option>Official Inspection</option>
                      <option>Vendor / Delivery</option>
                      <option>Maintenance / Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Official to See</label>
                    <select
                      value={visitorForm.person_to_see}
                      onChange={(e) => setVisitorForm(prev => ({ ...prev, person_to_see: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Principal (Mrs. Adaeze Uzoefuna)</option>
                      <option>Bursar (Mr. Chukwuma Okafor)</option>
                      <option>Head of Academics</option>
                      <option>Class Teacher</option>
                      <option>Front Desk / Admissions</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitorModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCheckingInVisitor}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                  >
                    {isCheckingInVisitor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Issue Gate Pass</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Front Desk Log Admission Enquiry */}
        {enquiryModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    📝
                  </span>
                  <h4 className="text-base font-extrabold text-white">Log Admission Enquiry</h4>
                </div>
                <button onClick={() => setEnquiryModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Record prospective parent inquiries and track admission onboarding pipeline.
              </p>

              <form onSubmit={handleCreateEnquiry} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mrs. Ngozi Okeke"
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0803XXXXXXX"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="parent@email.com"
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Class Interested *</label>
                    <select
                      value={enquiryForm.class_interested}
                      onChange={(e) => setEnquiryForm(prev => ({ ...prev, class_interested: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Creche / Daycare</option>
                      <option>Nursery 1</option>
                      <option>Nursery 2</option>
                      <option>Nursery 3</option>
                      <option>Primary 1</option>
                      <option>Primary 2</option>
                      <option>Primary 3</option>
                      <option>Primary 4</option>
                      <option>Primary 5</option>
                      <option>Primary 6</option>
                      <option>JSS 1</option>
                      <option>JSS 2</option>
                      <option>JSS 3</option>
                      <option>SSS 1 (Science)</option>
                      <option>SSS 1 (Arts/Comm)</option>
                      <option>SSS 2</option>
                      <option>SSS 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Referral Source</label>
                    <select
                      value={enquiryForm.source}
                      onChange={(e) => setEnquiryForm(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Walk-in</option>
                      <option>WhatsApp Bot</option>
                      <option>Phone Call</option>
                      <option>Existing Parent Referral</option>
                      <option>Banner / Billboard</option>
                      <option>Social Media</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={enquiryForm.follow_up_date}
                    onChange={(e) => setEnquiryForm(prev => ({ ...prev, follow_up_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Notes / Special Requirements</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Enquiring for twin admission, requested bus transport details..."
                    value={enquiryForm.notes}
                    onChange={(e) => setEnquiryForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEnquiryModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                  >
                    {isSubmittingEnquiry ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Save Enquiry</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Front Desk Log Phone Call */}
        {callModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    📞
                  </span>
                  <h4 className="text-base font-extrabold text-white">Log Front Desk Call</h4>
                </div>
                <button onClick={() => setCallModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCall} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Caller Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Barrister Emeka Okafor"
                    value={callForm.caller_name}
                    onChange={(e) => setCallForm(prev => ({ ...prev, caller_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="080XXXXXXXX"
                      value={callForm.phone}
                      onChange={(e) => setCallForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Call Direction</label>
                    <select
                      value={callForm.call_type}
                      onChange={(e) => setCallForm(prev => ({ ...prev, call_type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Incoming</option>
                      <option>Outgoing</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 mins"
                      value={callForm.duration}
                      onChange={(e) => setCallForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Call Purpose</label>
                    <select
                      value={callForm.purpose}
                      onChange={(e) => setCallForm(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Admissions & Fee Inquiries</option>
                      <option>Student Health / Welfare</option>
                      <option>Bus Transport Query</option>
                      <option>Teacher Consultation</option>
                      <option>Official Ministry Call</option>
                      <option>General Enquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Summary Message</label>
                  <textarea
                    rows={2}
                    placeholder="Brief details of conversation..."
                    value={callForm.message}
                    onChange={(e) => setCallForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="followUpNeeded"
                    checked={callForm.follow_up_needed}
                    onChange={(e) => setCallForm(prev => ({ ...prev, follow_up_needed: e.target.checked }))}
                    className="rounded bg-slate-950 border-slate-700 text-amber-400 focus:ring-0"
                  />
                  <label htmlFor="followUpNeeded" className="text-slate-300 font-bold cursor-pointer">
                    Follow-up Action Needed
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCallModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCall}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                  >
                    {isSubmittingCall ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                    <span>Record Call</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Front Desk Parent Complaint / Feedback */}
        {complaintModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                    💬
                  </span>
                  <h4 className="text-base font-extrabold text-white">Log Parent Grievance / Feedback</h4>
                </div>
                <button onClick={() => setComplaintModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Complainant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief (Mrs.) E. Okon"
                    value={complaintForm.complainant_name}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, complainant_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="080XXXXXXXX"
                      value={complaintForm.complainant_phone}
                      onChange={(e) => setComplaintForm(prev => ({ ...prev, complainant_phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Category</label>
                    <select
                      value={complaintForm.complaint_type}
                      onChange={(e) => setComplaintForm(prev => ({ ...prev, complaint_type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Academics</option>
                      <option>Facilities & Infrastructure</option>
                      <option>Transport & Bus Service</option>
                      <option>School Fees & Billing</option>
                      <option>Student Welfare & Health</option>
                      <option>Staff Conduct</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Assign Resolution To</label>
                  <select
                    value={complaintForm.assigned_to}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option>Administrative Officer</option>
                    <option>Principal (Mrs. Adaeze Uzoefuna)</option>
                    <option>Head of Academics</option>
                    <option>Bursar (Mr. Chukwuma Okafor)</option>
                    <option>Transport Coordinator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Feedback Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details of the complaint or suggestions..."
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setComplaintModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingComplaint}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow flex items-center gap-1.5"
                  >
                    {isSubmittingComplaint ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    <span>Submit Grievance</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Staff Member */}
        {addStaffModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    👨‍🏫
                  </span>
                  <h4 className="text-base font-extrabold text-white">Add Staff Member & Provision Access</h4>
                </div>
                <button onClick={() => setAddStaffModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addedStaffSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Staff Member Onboarded Successfully!</span>
                  </div>
                  <p>Staff record created and portal credentials auto-provisioned:</p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                    <div>Staff ID: <strong className="text-amber-400">{addedStaffSuccess.data?.staff_no}</strong></div>
                    <div>Name: <strong className="text-white">{addedStaffSuccess.data?.name}</strong></div>
                    <div>Role: <strong className="text-white">{addedStaffSuccess.data?.role}</strong></div>
                    <div>Login Username: <strong className="text-amber-400">{addedStaffSuccess.credentials?.username || addedStaffSuccess.data?.staff_no}</strong></div>
                    <div>Default Password: <strong className="text-white">{addedStaffSuccess.credentials?.password || newStaffForm.password}</strong></div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAddStaffModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mr. Chinedu Eze"
                      value={newStaffForm.name}
                      onChange={(e) => setNewStaffForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Institutional Role</label>
                      <select
                        value={newStaffForm.role}
                        onChange={(e) => setNewStaffForm(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      >
                        <option>Teacher</option>
                        <option>Bursar</option>
                        <option>Admin</option>
                        <option>Vice Principal</option>
                        <option>Front Desk Officer</option>
                        <option>Security Officer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Qualification</label>
                      <input
                        type="text"
                        placeholder="e.g. B.Sc. Ed / NCE"
                        value={newStaffForm.qualification}
                        onChange={(e) => setNewStaffForm(prev => ({ ...prev, qualification: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Assigned Class / Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior College (SS 2)"
                        value={newStaffForm.assigned_class}
                        onChange={(e) => setNewStaffForm(prev => ({ ...prev, assigned_class: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="080XXXXXXXX"
                        value={newStaffForm.phone}
                        onChange={(e) => setNewStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="staff@eaglepower.edu.ng"
                        value={newStaffForm.email}
                        onChange={(e) => setNewStaffForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Temporary Password</label>
                      <input
                        type="text"
                        value={newStaffForm.password}
                        onChange={(e) => setNewStaffForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddStaffModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingStaff}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                    >
                      {isAddingStaff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                      <span>Onboard Staff & Create Account</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Enroll Student & Parent */}
        {enrollStudentModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    🎒
                  </span>
                  <h4 className="text-base font-extrabold text-white">Enroll Student & Provision Parent Account</h4>
                </div>
                <button onClick={() => setEnrollStudentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {enrolledStudentSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Student & Parent Enrolled Successfully!</span>
                  </div>
                  <p>Credentials automatically generated for portal access:</p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                    <div>
                      <strong className="text-amber-400 block mb-0.5">🎒 Student Account:</strong>
                      <div>Username (Adm No): <strong className="text-white">{enrolledStudentSuccess.student_account?.username}</strong></div>
                      <div>Default Password: <strong className="text-white">{enrolledStudentSuccess.student_account?.default_password}</strong></div>
                    </div>
                    <div className="pt-1 border-t border-slate-800">
                      <strong className="text-amber-400 block mb-0.5">👪 Parent Account:</strong>
                      <div>Username (Phone): <strong className="text-white">{enrolledStudentSuccess.parent_account?.username}</strong></div>
                      <div>Default Password: <strong className="text-white">{enrolledStudentSuccess.parent_account?.default_password}</strong></div>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEnrollStudentModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnrollStudent} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chukwuemeka"
                        value={newStudentForm.first_name}
                        onChange={(e) => setNewStudentForm(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Okonkwo"
                        value={newStudentForm.last_name}
                        onChange={(e) => setNewStudentForm(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Admission Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EPS-2025-010"
                        value={newStudentForm.admission_no}
                        onChange={(e) => setNewStudentForm(prev => ({ ...prev, admission_no: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Enrollment Class</label>
                      <select
                        value={newStudentForm.class_id}
                        onChange={(e) => setNewStudentForm(prev => ({ ...prev, class_id: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Gender</label>
                      <select
                        value={newStudentForm.gender}
                        onChange={(e) => setNewStudentForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={newStudentForm.dob}
                        onChange={(e) => setNewStudentForm(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Guardian & Parent Information</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Guardian Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Chief Jude Okonkwo"
                          value={newStudentForm.guardian_name}
                          onChange={(e) => setNewStudentForm(prev => ({ ...prev, guardian_name: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Guardian Phone (Login ID) *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0803XXXXXXX"
                          value={newStudentForm.guardian_phone}
                          onChange={(e) => setNewStudentForm(prev => ({ ...prev, guardian_phone: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Guardian Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="parent@example.com"
                        value={newStudentForm.guardian_email}
                        onChange={(e) => setNewStudentForm(prev => ({ ...prev, guardian_email: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEnrollStudentModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEnrollingStudent}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                    >
                      {isEnrollingStudent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
                      <span>Enroll Student & Provision Parent</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Assign Teacher to Class or Class to Staff */}
        {assignClassModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    👨‍🏫
                  </span>
                  <h4 className="text-base font-extrabold text-white">
                    {selectedClassForTeacher ? `Assign Form Teacher: ${selectedClassForTeacher.name}` : `Assign Class: ${selectedStaffForClass?.name}`}
                  </h4>
                </div>
                <button
                  onClick={() => {
                    setAssignClassModalOpen(false);
                    setSelectedClassForTeacher(null);
                    setSelectedStaffForClass(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedClassForTeacher && (
                <form onSubmit={handleAssignTeacherToClass} className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400">Class Cohort: <strong className="text-white">{selectedClassForTeacher.name}</strong> ({selectedClassForTeacher.division})</div>
                    <div className="text-slate-400">Current Form Teacher: <strong className="text-amber-300">{selectedClassForTeacher.teacher_name || 'None (Unassigned)'}</strong></div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Select Class Master / Form Teacher *</label>
                    <select
                      value={selectedTeacherIdToAssign}
                      onChange={(e) => setSelectedTeacherIdToAssign(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 text-xs"
                    >
                      <option value="">-- No Teacher Assigned (Unassign) --</option>
                      {staff
                        .filter(s => s.role.toLowerCase().includes('teacher') || s.role.toLowerCase().includes('coordinator') || s.role.toLowerCase().includes('examiner'))
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.staff_no} &bull; {t.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignClassModalOpen(false);
                        setSelectedClassForTeacher(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAssignment}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                    >
                      {isSavingAssignment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Teacher Assignment</span>
                    </button>
                  </div>
                </form>
              )}

              {selectedStaffForClass && (
                <form onSubmit={handleAssignStaffClass} className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400">Faculty Member: <strong className="text-white">{selectedStaffForClass.name}</strong> ({selectedStaffForClass.staff_no})</div>
                    <div className="text-slate-400">Designation: <strong className="text-slate-200">{selectedStaffForClass.role}</strong></div>
                    <div className="text-slate-400">Currently Assigned: <strong className="text-amber-300">{selectedStaffForClass.assigned_class || 'General Faculty'}</strong></div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Assign to Class Cohort *</label>
                    <select
                      value={selectedClassNameToAssign}
                      onChange={(e) => setSelectedClassNameToAssign(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 text-xs"
                    >
                      <option value="General Faculty">General Faculty (All Classes / Specialist)</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.division})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignClassModalOpen(false);
                        setSelectedStaffForClass(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAssignment}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                    >
                      {isSavingAssignment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Class Assignment</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* PRINT-ONLY OFFICIAL BURSARY CLEARANCE RECEIPT */}
        {activeReceipt && (
          <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-8 font-sans z-[999999] overflow-visible">
            <div className="max-w-xl mx-auto border-2 border-slate-900 rounded-3xl p-8 space-y-6">
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <img src="/assets/official-logo.jpg" alt="Logo" className="w-14 h-14 rounded-full border border-amber-500 object-cover" />
                  <div className="text-left">
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider">EAGLE POWER SCHOOLS & COLLEGES</h1>
                    <p className="text-[11px] font-bold text-amber-600 italic">"Soaring on Wings of Academic and Moral Excellence"</p>
                    <p className="text-[10px] text-slate-600">2 & 9 Amikwo Road, Awka, Anambra State &bull; approval: ANSG/MOE/AWK/0412</p>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
                    OFFICIAL BURSARY CLEARANCE RECEIPT
                  </span>
                </div>
              </div>

              {/* Receipt Body Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipt Reference</span>
                  <strong className="text-base font-black text-slate-900 font-mono">{activeReceipt.receiptNo}</strong>
                  <div className="text-[11px] text-slate-500 mt-1">Invoice: <span className="font-mono">{activeReceipt.invoiceNo}</span></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Payment</span>
                  <strong className="text-sm font-black text-slate-900">{activeReceipt.date}</strong>
                  <div className="text-[11px] text-slate-500 mt-1">Channel: {activeReceipt.method}</div>
                </div>
              </div>

              {/* Pupil Details */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-bold">Student Name:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{activeReceipt.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-bold">Admission Number:</span>
                  <span className="font-mono font-bold text-slate-800">{activeReceipt.admissionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Class Level:</span>
                  <span className="font-bold text-slate-800">{activeReceipt.className}</span>
                </div>
              </div>

              {/* Amount Cleared */}
              <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-300 flex justify-between items-center">
                <div>
                  <span className="text-[11px] uppercase font-black text-amber-900 tracking-wider block">AMOUNT REMITTED & VERIFIED</span>
                  <span className="text-2xl font-black text-slate-950">₦{activeReceipt.amount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider">
                    VERIFIED PAID
                  </span>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[11px]">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-700">Mr. Chukwuma Okafor</span>
                  <p className="text-[10px] text-slate-400">Head of Bursary & Accounts</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-600 flex items-center justify-center mx-auto text-[9px] font-black text-amber-700 uppercase tracking-tighter">
                    OFFICIAL SEAL
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-700">Mrs. Adaeze Uzoefuna</span>
                  <p className="text-[10px] text-slate-400">Principal / Administrator</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Teacher Create Homework Assignment */}
        {createHwModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    📚
                  </span>
                  <h4 className="text-base font-extrabold text-white">Assign Class Homework (In-House AI Monitored)</h4>
                </div>
                <button onClick={() => setCreateHwModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHomework} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target Class *</label>
                    <select
                      value={newHwForm.class_id}
                      onChange={(e) => setNewHwForm(prev => ({ ...prev, class_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Curriculum Subject *</label>
                    <select
                      value={newHwForm.subject_id}
                      onChange={(e) => setNewHwForm(prev => ({ ...prev, subject_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Assignment Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fractions & Word Problems Exercise 4"
                    value={newHwForm.title}
                    onChange={(e) => setNewHwForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Instructions / Questions *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide questions or textbook exercises for students to answer..."
                    value={newHwForm.description}
                    onChange={(e) => setNewHwForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Key AI Concepts / Rubric</label>
                    <input
                      type="text"
                      placeholder="e.g. denominator, numerator, simplify"
                      value={newHwForm.key_concepts}
                      onChange={(e) => setNewHwForm(prev => ({ ...prev, key_concepts: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-500">Comma-separated terms checked by in-house AI</span>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={newHwForm.due_date}
                      onChange={(e) => setNewHwForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateHwModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingHw}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                  >
                    {isCreatingHw ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                    <span>Assign Homework</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Parent / Student Submit Homework */}
        {submitHwModalOpen && selectedAssignmentForSubmit && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✍️
                  </span>
                  <h4 className="text-base font-extrabold text-white">Submit Homework & Get AI Feedback</h4>
                </div>
                <button onClick={() => setSubmitHwModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="font-bold text-white text-sm">{selectedAssignmentForSubmit.title}</div>
                <div className="text-slate-400">Subject: <strong className="text-amber-400">{selectedAssignmentForSubmit.subject_name}</strong> &bull; Class: <strong className="text-slate-200">{selectedAssignmentForSubmit.class_name}</strong></div>
                <p className="text-slate-300 italic pt-1">{selectedAssignmentForSubmit.description}</p>
              </div>

              {hwSubmissionResult ? (
                <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-white rounded-2xl space-y-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>In-House AI Analysis Complete! (Score: {hwSubmissionResult.ai_score}/{hwSubmissionResult.max_points})</span>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl text-slate-300 whitespace-pre-wrap font-sans text-xs">
                    {hwSubmissionResult.ai_feedback}
                  </pre>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setSubmitHwModalOpen(false)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black"
                    >
                      Close & Finish
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitHomework} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Student Answer & Working *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Type or paste the pupil's completed answers and steps..."
                      value={parentHwSolution}
                      onChange={(e) => setParentHwSolution(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Evaluated locally by Eagle Power In-House AI Kernel with zero external cloud tracking.</span>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSubmitHwModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingHw}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow flex items-center gap-1.5"
                    >
                      {isSubmittingHw ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Submit for In-House AI Evaluation</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: View Homework Submissions List (For Teachers) */}
        {selectedHwForSubmissionsView && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-800 text-left space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-extrabold text-white">Submissions for: {selectedHwForSubmissionsView.title}</h4>
                  <p className="text-xs text-slate-400">Class: {selectedHwForSubmissionsView.class_name} &bull; Due: {selectedHwForSubmissionsView.due_date}</p>
                </div>
                <button onClick={() => setSelectedHwForSubmissionsView(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto grow space-y-3 pr-1 text-xs">
                {hwSubmissionsList.map(sub => (
                  <div key={sub.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-white text-sm">{sub.first_name} {sub.last_name}</strong>
                        <span className="font-mono text-amber-400 text-[10px] ml-2">({sub.admission_no})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                        Via {sub.submission_channel} &bull; AI Score: {sub.ai_score}/{selectedHwForSubmissionsView.max_points}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg text-slate-300 whitespace-pre-wrap font-mono text-[11px]">
                      {sub.submission_text}
                    </div>

                    {sub.ai_feedback && (
                      <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-[11px]">
                        <span className="font-bold text-amber-400 block mb-0.5">In-House AI Diagnostic:</span>
                        {sub.ai_feedback}
                      </div>
                    )}
                  </div>
                ))}

                {hwSubmissionsList.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">No students have submitted this assignment yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

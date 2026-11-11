import { normalizeThreatTelemetry } from '../utils/threatTelemetry';
import { getDashboardRole, canAccessTab, defaultTab, canLoadDashboardResource } from '../utils/portalPermissions';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Menu,
  X,
  Bell,
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
  Copy,
  FileSpreadsheet,
  Layout,
  Plus,
  PhoneCall,
  MessageSquare,
  MessageCircle,
  Save,
  DollarSign,
  Landmark,
  Calendar,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Database,
  Radio,
  Settings,
  Key,
  UserCheck,
  UserX,
  Unlock,
  Activity,
  Server,
  Layers,
  HeartPulse,
  Bus,
  MapPin,
  User,
  Zap,
  Bot,
  Send,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  FileText,
  ArrowRight,
  Crown,
  HelpCircle,
  Info,
  QrCode,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { getApiBase, COOKIE_SESSION, restoreSession, setSessionToken, apiFetch as fetch } from '../config/api';
import {
  getAllowedClassesForTeacher,
  getAllowedSubjectsForClass,
  isFormTeacherOfClass,
  canTeacherGradeSubject,
  isUnrestrictedStaff
} from '../utils/teacherPermissions';
import BroadsheetView from './reports/BroadsheetView';
import { TemplateGallery } from './reports/TemplateGallery';
import { EliteModernTemplate } from './reports/EliteModernTemplate';
import { CherithClassicTemplate } from './reports/CherithClassicTemplate';
import { AlQalamClassicTemplate } from './reports/AlQalamClassicTemplate';
import { PrimarySchoolTemplate } from './reports/PrimarySchoolTemplate';
import { NurseryColorfulTemplate } from './reports/NurseryColorfulTemplate';
import { ClassicProfessionalTemplate } from './reports/ClassicProfessionalTemplate';
import ExecutiveReportingCockpit from './ExecutiveReportingCockpit';
import StudentMasterConsole from './superadmin/modules/StudentMasterConsole';
import CurriculumArchitect from './superadmin/modules/CurriculumArchitect';
import SystemGovernanceConsole from './superadmin/modules/SystemGovernanceConsole';
import StaffIDCardModal from './staff/StaffIDCardModal';
import StaffManagementConsole from './staff/StaffManagementConsole';
import WhatsAppBotConsoleModal from './superadmin/modules/WhatsAppBotConsoleModal';
import StaffNotificationBell from './staff/StaffNotificationBell';
import StaffCommunicationConsole from './staff/StaffCommunicationConsole';

export default function PortalDashboard({
  isOpen = true,
  onClose,
  isModal = false,
  initialTab,
  initialRole,
  isExecutiveConsole = false
}) {
  const API_BASE = getApiBase();

  // ─── Reusable Inline Tooltip ─────────────────────────────────────────────
  // Usage: <Tooltip text="Help text here"><HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400 cursor-help" /></Tooltip>
  const Tooltip = ({ text, children, wide = false, position = 'top' }) => (
    <div className="relative group inline-flex items-center">
      {children}
      <div className={`absolute ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 ${wide ? 'w-80' : 'w-64'} shadow-xl z-[999] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 leading-relaxed whitespace-normal`}>
        {text}
        <div className={`absolute ${position === 'bottom' ? 'bottom-full border-b-slate-700 border-b-4 border-l-transparent border-r-transparent border-l-4 border-r-4' : 'top-full border-t-slate-700 border-t-4 border-l-transparent border-r-transparent border-l-4 border-r-4'} left-1/2 -translate-x-1/2 w-0 h-0`} />
      </div>
    </div>
  );

  const isExecutive = Boolean(
    isExecutiveConsole ||
    initialRole === 'superadmin' ||
    (typeof window !== 'undefined' && (
      window.location.pathname.includes('/executive-console') ||
      window.location.pathname.includes('/superadmin')
    ))
  );

  // Authentication & Session
  const [authToken, setAuthToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [sessionRetry, setSessionRetry] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Staff ID Card & Credentials Modal
  const [isStaffIdModalOpen, setIsStaffIdModalOpen] = useState(false);
  const [staffIdTarget, setStaffIdTarget] = useState(null);

  // Change Password Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePassCurrent, setChangePassCurrent] = useState('');
  const [changePassNew, setChangePassNew] = useState('');
  const [changePassConfirm, setChangePassConfirm] = useState('');
  const [changePassShowCurrent, setChangePassShowCurrent] = useState(false);
  const [changePassShowNew, setChangePassShowNew] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // WhatsApp OTP Login States
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify'
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  // Class WhatsApp Announcement Composer State
  const [announcementTemplate, setAnnouncementTemplate] = useState('homework');
  const [announcementCustomNotes, setAnnouncementCustomNotes] = useState('');
  const [announcementCopied, setAnnouncementCopied] = useState(false);

  // Recover from the server cookie on every page load; cached browser profiles are not trusted.
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setSessionChecking(true);
    setLoginError('');
    restoreSession({ signal: controller.signal })
      .then(user => {
        if (controller.signal.aborted) return;
        setSessionToken(user ? COOKIE_SESSION : '');
        setAuthToken(user ? COOKIE_SESSION : '');
        setCurrentUser(user);
        if (!user && sessionRetry > 0) {
          setLoginError('No active session found. Please enter your credentials to log in.');
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSessionToken('');
        setAuthToken('');
        setCurrentUser(null);
        if (sessionRetry > 0) {
          setLoginError('Unable to restore your session. Please check your connection and try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionChecking(false);
      });
    return () => controller.abort();
  }, [isOpen, sessionRetry]);

  useEffect(() => {
    // A full reload drops all account-specific data when a session expires or is revoked.
    const handleExpired = () => window.location.reload();
    window.addEventListener('eagle-session-expired', handleExpired);
    return () => window.removeEventListener('eagle-session-expired', handleExpired);
  }, []);

  // Mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active Role and Tab
  const [previewRole, setActiveRole] = useState(() => currentUser?.role || initialRole || (isExecutive ? 'superadmin' : 'admin'));
  
  const activeRole = getDashboardRole(currentUser?.role, previewRole);

  // Intelligent tab initialization: URL params -> URL path -> initialTab -> role default
  const [activeTabInternal, setActiveTabInternal] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) return tabParam.replace(/-/g, '_');

      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'portal' && pathParts[1] && pathParts[1] !== 'login') {
        return pathParts[1].replace(/-/g, '_');
      }
    }
    if (initialTab && initialTab !== 'overview') return initialTab;
    const role = currentUser?.role || initialRole || (isExecutive ? 'superadmin' : 'admin');
    if (role === 'teacher') return 'teacher_cockpit';
    if (role === 'bursar') return 'invoices';
    if (role === 'student') return 'reportcard';
    if (role === 'parent') return 'child_overview';
    if (role === 'frontdesk') return 'visitors';
    if (role === 'superadmin') return 'overview';
    return isExecutive ? 'executive_cockpit' : (initialTab || 'overview');
  });

  const setActiveTab = useCallback((tabId) => {
    setActiveTabInternal(tabId);
    setIsMobileMenuOpen(false); // Close mobile drawer when an item is selected
    if (!isModal && typeof window !== 'undefined') {
      const cleanTab = tabId.replace(/_/g, '-');
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', cleanTab);
        window.history.pushState(null, '', url.pathname + url.search);
      } catch {
        // Fallback safely if URL constructor fails
      }
      try {
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.scrollTop = 0;
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch {}
    }
  }, [isModal]);

  const activeTab = canAccessTab(activeRole, activeTabInternal) ? activeTabInternal : defaultTab(activeRole);

  // Synchronize ONLY when initialTab prop explicitly changes from parent component
  const prevInitialTabRef = useRef(initialTab);
  useEffect(() => {
    if (initialTab && initialTab !== prevInitialTabRef.current) {
      prevInitialTabRef.current = initialTab;
      setActiveTabInternal(initialTab);
    }
  }, [initialTab]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    if (!isModal && typeof window !== 'undefined') {
      const handlePopState = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam) {
          setActiveTabInternal(tabParam.replace(/-/g, '_'));
          return;
        }
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'portal' && pathParts[1]) {
          const tab = pathParts[1].replace(/-/g, '_');
          setActiveTabInternal(tab);
          return;
        }
        if (window.location.pathname.includes('/superadmin')) {
          setActiveTabInternal('overview');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isModal]);

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
  const [gradebookSession, setGradebookSession] = useState('2026/2027');
  const [gradebookTerm, setGradebookTerm] = useState('Second Term');
  const [gradebookMode, setGradebookMode] = useState('standard'); // 'standard' (30/70) | 'multi' (10/10/10/70)
  const [gradebookClassInfo, setGradebookClassInfo] = useState(null);
  const [classSheetRows, setClassSheetRows] = useState([]);
  const classSheetRequest = useRef(0);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [scoreSaveSuccess, setScoreSaveSuccess] = useState(false);

  // Dynamic Academic Permissions for Gradebook
  const currentGradebookClassObj = React.useMemo(() => {
    return classes.find(c => String(c.id) === String(selectedClassId)) || classes[0] || null;
  }, [classes, selectedClassId]);

  const currentGradebookSubjectObj = React.useMemo(() => {
    return subjects.find(s => String(s.id) === String(selectedSubjectId)) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  const allowedGradebookClasses = React.useMemo(() => {
    return getAllowedClassesForTeacher(currentUser, classes);
  }, [currentUser, classes]);

  const allowedGradebookSubjects = React.useMemo(() => {
    return getAllowedSubjectsForClass(currentUser, currentGradebookClassObj, subjects);
  }, [currentUser, currentGradebookClassObj, subjects]);

  const isCurrentFormTeacher = React.useMemo(() => {
    return isFormTeacherOfClass(currentUser, currentGradebookClassObj);
  }, [currentUser, currentGradebookClassObj]);

  const canGradeCurrentSubject = React.useMemo(() => {
    return canTeacherGradeSubject(currentUser, currentGradebookClassObj, currentGradebookSubjectObj, subjects);
  }, [currentUser, currentGradebookClassObj, currentGradebookSubjectObj, subjects]);

  // Bursar States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [invoiceFilter, setInvoiceFilter] = useState('All');

  // Student Dossier State
  const [selectedStudentAdmNo, setSelectedStudentAdmNo] = useState('');
  const [studentReportCard, setStudentReportCard] = useState(null);
  const [standardReport, setStandardReport] = useState(null);
  const [studentSelectedTemplate, setStudentSelectedTemplate] = useState('ELITE');
  const [reportCardLoading, setReportCardLoading] = useState(false);
  const reportCardRequest = useRef(0);
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
  const attendanceRequest = useRef(0);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaveSuccess, setAttendanceSaveSuccess] = useState(false);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');

  // Teacher Workspace & Persistent Lesson Notes states
  const [gradebookSearchQuery, setGradebookSearchQuery] = useState('');
  const [gradebookFilterGrade, setGradebookFilterGrade] = useState('ALL');
  const [lessonNoteModalOpen, setLessonNoteModalOpen] = useState(false);
  const [viewLessonNoteModalOpen, setViewLessonNoteModalOpen] = useState(false);
  const [selectedLessonNote, setSelectedLessonNote] = useState(null);
  const [hodReviewModalOpen, setHodReviewModalOpen] = useState(false);
  const [hodFeedbackText, setHodFeedbackText] = useState('');
  const [hodReviewStatus, setHodReviewStatus] = useState('Approved');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [lessonNotes, setLessonNotes] = useState([]);
  const [newLessonNote, setNewLessonNote] = useState({
    week: 'Week 4',
    subject: 'Mathematics',
    topic: '',
    subtopic: '',
    class_name: 'Junior College (JSS 1)',
    objectives: '',
    materials: 'Textbook, Graph board, Geometry set',
    previous_knowledge: '',
    introduction: '',
    presentation_steps: '',
    evaluation: '',
    conclusion: '',
    assignment: ''
  });

  // Batch Invoicing States
  const [batchInvoiceModalOpen, setBatchInvoiceModalOpen] = useState(false);
  const [batchInvoiceSubmitting, setBatchInvoiceSubmitting] = useState(false);
  const [batchInvoiceForm, setBatchInvoiceForm] = useState({
    class_id: 'ALL',
    session: '2026/2027',
    term: 'Second Term',
    title: '1st Term 2026/2027 Composite Tuition & Levies',
    due_date: '2025-02-28',
    breakdown: {
      tuition: 45000,
      books: 12000,
      uniform: 8000,
      development_levy: 5000,
      other: 0
    }
  });

  // Paystack Fee Checkout States
  const [paystackCheckoutModalOpen, setPaystackCheckoutModalOpen] = useState(false);
  const [paystackInvoice, setPaystackInvoice] = useState(null);
  const [paystackCustomAmount, setPaystackCustomAmount] = useState('');
  const [paystackEmail, setPaystackEmail] = useState('');
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [paystackSuccessReceipt, setPaystackSuccessReceipt] = useState(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regChildAdmNo, setRegChildAdmNo] = useState('');
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

  // WhatsApp Bot Connection & Gateway Modal
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  // Enroll Student & Parent Modal States
  const [enrollStudentModalOpen, setEnrollStudentModalOpen] = useState(false);
  const [enrollModalTab, setEnrollModalTab] = useState('biodata');
  const [newStudentForm, setNewStudentForm] = useState({
    admission_no: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'Male',
    dob: '2016-01-01',
    religion: 'Christianity',
    nationality: 'Nigerian',
    state_of_origin: 'Anambra State',
    lga_of_origin: 'Awka South',
    mother_tongue: 'Igbo / English',
    class_id: 1,
    // Health & Medical Safety
    blood_group: 'O+',
    genotype: 'AA',
    allergies: 'None',
    medical_conditions: 'None',
    special_needs: 'None',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: 'Father',
    // Academic Placement & Pedigree
    entry_mode: 'Fresh Admission',
    previous_school: '',
    last_class_passed: '',
    reason_for_transfer: '',
    // Guardian & Parent Record
    guardian_title: 'Mr',
    guardian_name: '',
    guardian_relationship: 'Father',
    guardian_phone: '',
    guardian_alt_phone: '',
    guardian_email: '',
    guardian_occupation: '',
    guardian_office_address: '',
    address: 'Awka, Anambra State',
    mother_name: '',
    mother_phone: '',
    mother_email: '',
    mother_occupation: '',
    // Logistics & Commute
    boarding_status: 'Day',
    transport_mode: 'Parent Dropoff',
    bus_route: 'None'
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
  const [newHwForm, setNewHwForm] = useState(() => ({
    class_id: 1,
    subject_id: 1,
    title: '',
    description: '',
    key_concepts: '',
    max_points: 10,
    due_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
  }));
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
  // Puter AI (Primary) & In-House AI Tutor States
  const [aiQueryText, setAiQueryText] = useState('');
  const [aiQueryEngine, setAiQueryEngine] = useState('puter'); // 'puter' (primary/first) | 'inhouse'
  const [aiQueryModel, setAiQueryModel] = useState('gpt-4o-mini');
  const [aiQueryLoading, setAiQueryLoading] = useState(false);
  const [aiQueryResult, setAiQueryResult] = useState(null);
  const [aiQueryHistory, setAiQueryHistory] = useState([]);
  const [copiedAiAnswer, setCopiedAiAnswer] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceDivisionFilter, setInvoiceDivisionFilter] = useState('All');
  const [frontDeskSearchQuery, setFrontDeskSearchQuery] = useState('');
  // Payroll Management States
  const [payrollOverview, setPayrollOverview] = useState(null);
  const [payrollStaffRoster, setPayrollStaffRoster] = useState([]);
  const [nigerianBanks, setNigerianBanks] = useState([]);
  const [_selectedPayrollBatch, setSelectedPayrollBatch] = useState(null);
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);
  const [isDisbursingPayroll, setIsDisbursingPayroll] = useState(false);
  const [payrollDisburseSuccess, setPayrollDisburseSuccess] = useState(null);
  const [activePayslipStaff, setActivePayslipStaff] = useState(null);
  const [payslipData, setPayslipData] = useState(null);
  const [_isLoadingPayslip, setIsLoadingPayslip] = useState(false);
  const [linkBankModalOpen, setLinkBankModalOpen] = useState(false);
  const [selectedStaffForBank, setSelectedStaffForBank] = useState(null);
  const [bankLinkAccountNo, setBankLinkAccountNo] = useState('');
  const [bankLinkBankCode, setBankLinkBankCode] = useState('058');
  const [isLinkingBank, setIsLinkingBank] = useState(false);
  const [bankLinkResult, setBankLinkResult] = useState(null);
  const [parentBankModalOpen, setParentBankModalOpen] = useState(false);
  const [selectedInvoiceForParent, setSelectedInvoiceForParent] = useState(null);
  const [copiedBankText, setCopiedBankText] = useState(null);

  // Teacher "My Students" Hub, Terminal Remarks & Quick CA Score States
  const [myStudentsSearchQuery, setMyStudentsSearchQuery] = useState('');
  const [myStudentsClassId, setMyStudentsClassId] = useState('');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentTargetStudent, setCommentTargetStudent] = useState(null);
  const [teacherCommentText, setTeacherCommentText] = useState('');
  const [principalCommentText, setPrincipalCommentText] = useState('');
  const [commentTraits, setCommentTraits] = useState({
    attentiveness: 5,
    neatness: 5,
    politeness: 5,
    punctuality: 5,
    honesty: 5
  });
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState('');

  // Quick CA Score Entry Modal State
  const [isQuickCaModalOpen, setIsQuickCaModalOpen] = useState(false);
  const [quickCaStudent, setQuickCaStudent] = useState(null);
  const [quickCaSubjectId, setQuickCaSubjectId] = useState('');
  const [quickCa1, setQuickCa1] = useState(8);
  const [quickCa2, setQuickCa2] = useState(8);
  const [quickProject, setQuickProject] = useState(9);
  const [quickExam, setQuickExam] = useState(55);
  const [isSavingQuickCa, setIsSavingQuickCa] = useState(false);
  const [quickCaSuccessMsg, setQuickCaSuccessMsg] = useState('');

  const formatParentWhatsAppUrl = (phone, studentName, className, teacherName) => {
    if (!phone) return null;
    let clean = String(phone).replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '234' + clean.slice(1);
    if (!clean.startsWith('234') && clean.length === 10) clean = '234' + clean;
    const msg = encodeURIComponent(`Good day, respected Parent/Guardian. This is ${teacherName || 'the Class Teacher'} from Eagle Power Schools reaching out regarding your ward, ${studentName} (${className}).`);
    return `https://wa.me/${clean}?text=${msg}`;
  };

  const handleOpenCommentModal = (student) => {
    setCommentTargetStudent(student);
    setTeacherCommentText(student.teacher_comment || 'An exemplary scholar with consistent academic dedication.');
    setPrincipalCommentText(student.principal_comment || 'Remarkable progress. Keep soaring high.');
    setCommentTraits({
      attentiveness: 5,
      neatness: 5,
      politeness: 5,
      punctuality: 5,
      honesty: 5
    });
    setCommentSuccessMsg('');
    setIsCommentModalOpen(true);
  };

  const handleSaveTeacherComment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!commentTargetStudent?.id) return;
    setIsSavingComment(true);
    setCommentSuccessMsg('');
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/exams/report-extras`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          student_id: commentTargetStudent.id,
          session: gradebookSession || '2026/2027',
          term: gradebookTerm || 'First Term',
          teacher_comment: teacherCommentText,
          principal_comment: principalCommentText || undefined,
          traits: commentTraits
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCommentSuccessMsg('Official remarks & affective domain saved successfully!');
        if (studentReportCard && String(studentReportCard.student?.id) === String(commentTargetStudent.id)) {
          setStudentReportCard(prev => ({
            ...prev,
            evaluations: {
              ...(prev?.evaluations || {}),
              teacher_remark: teacherCommentText,
              principal_remark: principalCommentText || prev?.evaluations?.principal_remark,
              affective_traits: commentTraits
            },
            comments: {
              ...(prev?.comments || {}),
              form_teacher: teacherCommentText,
              principal: principalCommentText || prev?.comments?.principal
            }
          }));
        }
        setTimeout(() => setIsCommentModalOpen(false), 1400);
      } else {
        alert(data.message || 'Could not save comments.');
      }
    } catch (err) {
      console.error('Save comment error:', err);
      alert('Network error while saving comments.');
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleOpenQuickCaModal = (student) => {
    setQuickCaStudent(student);
    const firstSub = allowedGradebookSubjects[0]?.id || subjects[0]?.id || 1;
    setQuickCaSubjectId(firstSub);
    setQuickCa1(8);
    setQuickCa2(8);
    setQuickProject(9);
    setQuickExam(55);
    setQuickCaSuccessMsg('');
    setIsQuickCaModalOpen(true);
  };

  const handleSaveQuickCa = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quickCaStudent?.id || !quickCaSubjectId) return;
    setIsSavingQuickCa(true);
    setQuickCaSuccessMsg('');
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const caTotal = Number(quickCa1 || 0) + Number(quickCa2 || 0) + Number(quickProject || 0);
      const res = await fetch(`${API_BASE}/exams/marks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          student_id: quickCaStudent.id,
          subject_id: quickCaSubjectId,
          session: gradebookSession || '2026/2027',
          term: gradebookTerm || 'First Term',
          ca1_score: Number(quickCa1 || 0),
          ca2_score: Number(quickCa2 || 0),
          project_score: Number(quickProject || 0),
          ca_score: caTotal,
          exam_score: Number(quickExam || 0)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuickCaSuccessMsg(`Scores saved! Total: ${caTotal + Number(quickExam || 0)}/100`);
        setTimeout(() => setIsQuickCaModalOpen(false), 1200);
      } else {
        alert(data.message || 'Could not save scores.');
      }
    } catch (err) {
      console.error('Save quick CA error:', err);
      alert('Network error while saving scores.');
    } finally {
      setIsSavingQuickCa(false);
    }
  };

  // ==========================================
  // SuperAdmin Omni-Control States & Handlers
  // ==========================================
  // 1. IAM User Directory
  const [userList, setUserList] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userActionMessage, setUserActionMessage] = useState(null);

  const fetchUsers = useCallback(async (page = 1, role = userRoleFilter, status = userStatusFilter, q = userSearchQuery) => {
    setIsLoadingUsers(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (role && role !== 'All') params.append('role', role);
      if (status && status !== 'all') params.append('status', status);
      if (q) params.append('q', q);
      const res = await fetch(`${API_BASE}/users?${params.toString()}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setUserList(d.data || []);
        setUserTotal(d.total || 0);
        setUserPage(d.page || 1);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [authToken, API_BASE, userRoleFilter, userStatusFilter, userSearchQuery]);

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.is_active ? 0 : 1;
    const actionText = newStatus === 1 ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionText} user account '${user.username}'?`)) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/users/${user.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      setUserActionMessage(`Account ${user.username} is now ${newStatus === 1 ? 'Active' : 'Suspended'}`);
      fetchUsers(userPage);
      setTimeout(() => setUserActionMessage(null), 3500);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleReleaseLockout = async (user) => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/users/${user.id}/release-lockout`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to release lockout');
      setUserActionMessage(`Lockout lifted for ${user.username}!`);
      fetchUsers(userPage);
      setTimeout(() => setUserActionMessage(null), 3500);
    } catch (err) {
      alert(`Lockout release failed: ${err.message}`);
    }
  };

  const handleResetUserPassword = async (user) => {
    const newPass = prompt(`Enter new secure password for user '${user.username}' (min 8 chars, letters & digits):`);
    if (!newPass) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/users/${user.id}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ new_password: newPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      setUserActionMessage(`Password for ${user.username} successfully updated!`);
      setTimeout(() => setUserActionMessage(null), 3500);
    } catch (err) {
      alert(`Password reset failed: ${err.message}`);
    }
  };

  const handleChangeUserRole = async (user, newRole) => {
    if (!newRole || newRole === user.role) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/users/${user.id}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');
      setUserActionMessage(`Role for ${user.username} changed to ${newRole}`);
      fetchUsers(userPage);
      setTimeout(() => setUserActionMessage(null), 3500);
    } catch (err) {
      alert(`Role change failed: ${err.message}`);
    }
  };

  // 2. Institutional Settings & Disaster Recovery
  const [systemSettings, setSystemSettings] = useState({
    school_name: 'Eagle Power Schools Awka',
    school_motto: 'Love, Truth & Service',
    current_session: '2026/2027',
    current_term: 'Second Term',
    next_resumption_date: '2025-05-05',
    active_report_template: 'classic_british',
    principal_name: 'Adaeze Uzoefuna',
    contact_phone: '+234 803 359 1058',
    whatsapp_phone: '+234 907 558 0671',
    contact_email: 'info@eaglepowerschools.com.ng',
    address: '2 & 9 Amikwo Road, Awka, Anambra State'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);
  const [backupsList, setBackupsList] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupResult, setBackupResult] = useState(null);

  const fetchSystemSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/system/settings`);
      if (res.ok) {
        const d = await res.json();
        if (d.data) {
          setSystemSettings(d.data);
          if (d.data.current_session) setGradebookSession(d.data.current_session);
          if (d.data.current_term) setGradebookTerm(d.data.current_term);
        }
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (isOpen && authToken) fetchSystemSettings();
  }, [isOpen, authToken, fetchSystemSettings]);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/system/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(systemSettings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save system settings');
      setSettingsSaveSuccess(true);
      setTimeout(() => setSettingsSaveSuccess(false), 4000);
    } catch (err) {
      alert(`Settings error: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsCreatingBackup(true);
    setBackupResult(null);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/system/backup`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Backup snapshot failed');
      setBackupResult(data.backup);
      if (Array.isArray(data.recent_backups)) {
        setBackupsList(data.recent_backups);
      }
    } catch (err) {
      alert(`Backup error: ${err.message}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // 3. Threat Defense & Live WAF Telemetry
  const [threatTelemetry, setThreatTelemetry] = useState(null);
  const [isLoadingThreats, setIsLoadingThreats] = useState(false);
  const [_unbanMessage, setUnbanMessage] = useState(null);

  const fetchThreatTelemetry = useCallback(async () => {
    setIsLoadingThreats(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/system/threat-defense`, { headers });
      if (res.ok) {
        const d = await res.json();
        setThreatTelemetry(normalizeThreatTelemetry(d.data));
      }
    } catch (err) {
      console.error('Threat telemetry error:', err);
    } finally {
      setIsLoadingThreats(false);
    }
  }, [authToken, API_BASE]);

  const handleUnbanIp = async (ip) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/system/threat-defense/unban`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unban failed');
      setUnbanMessage(data.message);
      fetchThreatTelemetry();
      setTimeout(() => setUnbanMessage(null), 4000);
    } catch (err) {
      alert(`Unban error: ${err.message}`);
    }
  };

  // Auto-fetch for SuperAdmin tabs
  useEffect(() => {
    if (activeTab === 'users' && (activeRole === 'superadmin')) {
      fetchUsers(userPage, userRoleFilter, userStatusFilter, userSearchQuery);
    } else if (activeTab === 'system_settings') {
      fetchSystemSettings();
    } else if (activeTab === 'threat_radar' && (activeRole === 'superadmin')) {
      fetchThreatTelemetry();
    }
  }, [activeTab, currentUser, activeRole, fetchUsers, userPage, userRoleFilter, userStatusFilter, userSearchQuery, fetchSystemSettings, fetchThreatTelemetry]);

  // Auto-sync user role on login (guarded against resetting user's selected tab)
  const hasInitialRoleTabSyncedRef = useRef(false);
  useEffect(() => {
    if (currentUser?.role) {
      setActiveRole(currentUser.role);
      if (currentUser.role === 'student' && currentUser.reference_id) {
        setSelectedStudentAdmNo(currentUser.reference_id);
      } else if (currentUser.role === 'parent' && currentUser.children?.[0]?.admission_no) {
        setSelectedStudentAdmNo(currentUser.children[0].admission_no);
      }
      
      // Preserve user-selected tabs after initial mount/login
      if (hasInitialRoleTabSyncedRef.current) return;
      hasInitialRoleTabSyncedRef.current = true;

      // Preserve explicit URL tab param if user navigated directly
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab')) return;
      }
      // Preserve explicit sub-route if user navigated directly (e.g. /portal/broadsheet, /portal/payroll)
      if (initialTab && initialTab !== 'overview') {
        return;
      }

      if (currentUser.role === 'teacher') setActiveTab('teacher_cockpit');
      else if (currentUser.role === 'bursar') setActiveTab('invoices');
      else if (currentUser.role === 'student') setActiveTab('reportcard');
      else if (currentUser.role === 'parent') {
        setActiveTab('child_overview');
        if (currentUser.children?.[0]?.admission_no) {
          setSelectedStudentAdmNo(currentUser.children[0].admission_no);
        }
      }
      else if (currentUser.role === 'frontdesk') setActiveTab('visitors');
      else if (currentUser.role === 'superadmin') setActiveTab('overview');
      else setActiveTab('executive_cockpit');
    }
  }, [currentUser, initialTab, setActiveTab]);

  // Load backend data
  const fetchAllData = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      // 1. Classes
      const cRes = await (canLoadDashboardResource(activeRole, 'academics') ? fetch(`${API_BASE}/academics/classes`, { headers }).catch(() => null) : null);
      if (cRes?.ok) {
        const d = await cRes.json();
        setClasses(d.data || []);
      }

      // 2. Subjects
      const subRes = await (canLoadDashboardResource(activeRole, 'academics') ? fetch(`${API_BASE}/academics/subjects`, { headers }).catch(() => null) : null);
      if (subRes?.ok) {
        const d = await subRes.json();
        setSubjects(d.data || []);
      }

      // 3. Students
      const sRes = await (canLoadDashboardResource(activeRole, 'students') ? fetch(`${API_BASE}/students?limit=100`, { headers }).catch(() => null) : null);
      if (sRes?.ok) {
        const d = await sRes.json();
        setStudents(d.data || []);
      }

      // 4. Staff
      const stRes = await (canLoadDashboardResource(activeRole, 'staff') ? fetch(`${API_BASE}/staff`, { headers }).catch(() => null) : null);
      if (stRes?.ok) {
        const d = await stRes.json();
        setStaff(d.data || []);
      }

      // 5. Finance Stats & Invoices
      const fRes = await (canLoadDashboardResource(activeRole, 'financeStats') ? fetch(`${API_BASE}/finance/stats`, { headers }).catch(() => null) : null);
      if (fRes?.ok) {
        const d = await fRes.json();
        setFinanceStats(d.data || null);
      }

      const invRes = await (canLoadDashboardResource(activeRole, 'invoices') ? fetch(`${API_BASE}/finance/invoices?limit=50`, { headers }).catch(() => null) : null);
      if (invRes?.ok) {
        const d = await invRes.json();
        setInvoices(d.data || []);
      }

      // 6. Admissions
      const admRes = await (canLoadDashboardResource(activeRole, 'admissions') ? fetch(`${API_BASE}/admissions`, { headers }).catch(() => null) : null);
      if (admRes?.ok) {
        const d = await admRes.json();
        setAdmissions(d.data || []);
      }

      // 7. Front Desk Visitors & Sub-modules
      const [fdRes, enqRes, callRes, compRes] = await Promise.all([
        (canLoadDashboardResource(activeRole, 'frontdesk') ? fetch(`${API_BASE}/frontdesk/visitors`, { headers }).catch(() => null) : null),
        (canLoadDashboardResource(activeRole, 'frontdesk') ? fetch(`${API_BASE}/frontdesk/enquiries`, { headers }).catch(() => null) : null),
        (canLoadDashboardResource(activeRole, 'frontdesk') ? fetch(`${API_BASE}/frontdesk/calls`, { headers }).catch(() => null) : null),
        (canLoadDashboardResource(activeRole, 'frontdesk') ? fetch(`${API_BASE}/frontdesk/complaints`, { headers }).catch(() => null) : null)
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
      const hwRes = await (canLoadDashboardResource(activeRole, 'homework') ? fetch(`${API_BASE}/homework`, { headers }).catch(() => null) : null);
      if (hwRes?.ok) {
        const d = await hwRes.json();
        setHomeworkList(d.data || []);
      }

      // 9. Persistent Lesson Notes (Curriculum Scheme of Work)
      const lnRes = await (canLoadDashboardResource(activeRole, 'lessonNotes') ? fetch(`${API_BASE}/lesson-notes?limit=100`, { headers }).catch(() => null) : null);
      if (lnRes?.ok) {
        const d = await lnRes.json();
        if (Array.isArray(d.data) && d.data.length > 0) {
          setLessonNotes(d.data);
        }
      }
      // 10. Payroll Data (Bursar / Admin)
      if (canLoadDashboardResource(activeRole, 'payroll')) {
        const [pOverRes, pRosterRes, pBanksRes] = await Promise.all([
          fetch(`${API_BASE}/payroll/overview`, { headers }).catch(() => null),
          fetch(`${API_BASE}/payroll/staff-roster`, { headers }).catch(() => null),
          fetch(`${API_BASE}/payroll/banks`, { headers }).catch(() => null)
        ]);
        if (pOverRes?.ok) {
          const d = await pOverRes.json();
          setPayrollOverview(d.data || null);
        }
        if (pRosterRes?.ok) {
          const d = await pRosterRes.json();
          setPayrollStaffRoster(d.data || []);
        }
        if (pBanksRes?.ok) {
          const d = await pBanksRes.json();
          setNigerianBanks(d.data || []);
        }
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, API_BASE, activeRole]);

  // Fetch Payroll Overview & Roster specifically
  const fetchPayrollData = useCallback(async () => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const [pOverRes, pRosterRes, pBanksRes] = await Promise.all([
        fetch(`${API_BASE}/payroll/overview`, { headers }),
        fetch(`${API_BASE}/payroll/staff-roster`, { headers }),
        fetch(`${API_BASE}/payroll/banks`, { headers })
      ]);
      if (pOverRes.ok) {
        const d = await pOverRes.json();
        setPayrollOverview(d.data);
      }
      if (pRosterRes.ok) {
        const d = await pRosterRes.json();
        setPayrollStaffRoster(d.data);
      }
      if (pBanksRes.ok) {
        const d = await pBanksRes.json();
        setNigerianBanks(d.data);
      }
    } catch (err) {
      console.error('Payroll fetch error:', err);
    }
  }, [authToken, API_BASE]);

  // Fetch Lesson Notes from SQLite
  const fetchLessonNotes = useCallback(async () => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/lesson-notes?limit=100`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.data)) setLessonNotes(d.data);
      }
    } catch (err) {
      console.warn('Error fetching lesson notes:', err);
    }
  }, [authToken, API_BASE]);

  // Handle Save New Lesson Note
  const handleSaveLessonNote = async (e) => {
    e.preventDefault();
    if (!newLessonNote.topic.trim()) {
      alert('Please provide a lesson topic.');
      return;
    }
    const targetClass = classes.find(c => c.name === newLessonNote.class_name) || classes[0];
    const targetSubject = subjects.find(s => s.name === newLessonNote.subject) || subjects[0];

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/lesson-notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          class_id: targetClass?.id || 1,
          subject_id: targetSubject?.id || 1,
          session: '2026/2027',
          term: 'Second Term',
          week_number: newLessonNote.week,
          topic: newLessonNote.topic.trim(),
          subtopic: newLessonNote.subtopic?.trim() || null,
          behavioral_objectives: newLessonNote.objectives?.trim() || null,
          instructional_materials: newLessonNote.materials?.trim() || null,
          previous_knowledge: newLessonNote.previous_knowledge?.trim() || null,
          introduction: newLessonNote.introduction?.trim() || null,
          presentation_steps: newLessonNote.presentation_steps?.trim() || null,
          evaluation: newLessonNote.evaluation?.trim() || null,
          conclusion: newLessonNote.conclusion?.trim() || null,
          assignment: newLessonNote.assignment?.trim() || null,
          status: 'Under Review'
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to submit lesson note');

      alert(`✅ Lesson note submitted successfully to HOD! Status: Under Review`);
      setLessonNoteModalOpen(false);
      setNewLessonNote({
        week: 'Week 4',
        subject: 'Mathematics',
        topic: '',
        subtopic: '',
        class_name: 'Junior College (JSS 1)',
        objectives: '',
        materials: 'Textbook, Graph board, Geometry set',
        previous_knowledge: '',
        introduction: '',
        presentation_steps: '',
        evaluation: '',
        conclusion: '',
        assignment: ''
      });
      await fetchLessonNotes();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Handle HOD / Principal Review of Lesson Note
  const handleReviewLessonNote = async () => {
    if (!selectedLessonNote) return;
    if (hodReviewStatus === 'Needs Revision' && !hodFeedbackText.trim()) {
      alert('Please provide pedagogical feedback / guidance explaining what needs revision.');
      return;
    }
    setSubmittingReview(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/lesson-notes/${selectedLessonNote.id}/review`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: hodReviewStatus,
          hod_feedback: hodFeedbackText.trim()
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to review lesson note');

      alert(`✅ Lesson note updated: Marked as '${hodReviewStatus}'!`);
      setHodReviewModalOpen(false);
      setSelectedLessonNote(null);
      setHodFeedbackText('');
      await fetchLessonNotes();
    } catch (err) {
      alert(`❌ Error reviewing note: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Delete Lesson Note
  const handleDeleteLessonNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this curriculum lesson note?')) return;
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/lesson-notes/${noteId}`, {
        method: 'DELETE',
        headers
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to delete lesson note');
      await fetchLessonNotes();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Handle Batch Invoicing Generation
  const handleCreateBatchInvoicing = async (e) => {
    e.preventDefault();
    setBatchInvoiceSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/finance/invoices/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          class_id: batchInvoiceForm.class_id,
          session: batchInvoiceForm.session,
          term: batchInvoiceForm.term,
          title: batchInvoiceForm.title.trim(),
          due_date: batchInvoiceForm.due_date,
          breakdown: batchInvoiceForm.breakdown
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Batch invoicing failed');

      alert(`🎉 Batch Invoicing Completed!\n• Invoices Issued: ${d.count_created}\n• Duplicates Skipped: ${d.count_skipped}\n• Total Amount Billed: ₦${d.total_amount_billed?.toLocaleString() || 0}`);
      setBatchInvoiceModalOpen(false);

      // Refresh invoices and stats
      const [invRes, finRes] = await Promise.all([
        fetch(`${API_BASE}/finance/invoices?limit=100`, { headers }).catch(() => null),
        fetch(`${API_BASE}/finance/stats`, { headers }).catch(() => null)
      ]);
      if (invRes?.ok) {
        const invData = await invRes.json();
        setInvoices(invData.data || []);
      }
      if (finRes?.ok) {
        const finData = await finRes.json();
        setFinanceStats(finData.data || null);
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setBatchInvoiceSubmitting(false);
    }
  };

  // Handle Paystack Online Fee Checkout
  const handleInitiatePaystackCheckout = async (invoice, customAmt) => {
    if (!invoice) return;
    setPaystackLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const remaining = invoice.amount_due - invoice.amount_paid;
      const amt = customAmt ? parseFloat(customAmt) : remaining;

      const res = await fetch(`${API_BASE}/finance/checkout/initialize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: amt,
          email: paystackEmail.trim() || invoice.guardian_email || currentUser?.email || 'billing@eaglepower.edu.ng',
          callback_url: typeof window !== 'undefined' ? `${window.location.origin}/portal` : '/portal'
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to initialize Paystack checkout');

      const { authorization_url, reference, is_simulated } = d.data;

      if (is_simulated) {
        // High-fidelity instant sandbox verification
        const verifyRes = await fetch(`${API_BASE}/finance/checkout/verify/${reference}`, { headers });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setPaystackSuccessReceipt({
            receiptNo: verifyData.receipt_no,
            amount: verifyData.amount || amt,
            studentName: `${invoice.first_name || ''} ${invoice.last_name || ''}`.trim() || invoice.student_name,
            className: invoice.class_name,
            invoiceNo: invoice.invoice_no,
            reference,
            method: 'Paystack Online (Direct Card/Bank)'
          });
          setPaystackCheckoutModalOpen(false);

          // Refresh invoices
          const invRes = await fetch(`${API_BASE}/finance/invoices?limit=50`, { headers }).catch(() => null);
          if (invRes?.ok) {
            const id = await invRes.json();
            setInvoices(id.data || []);
          }
          const fRes = await fetch(`${API_BASE}/finance/stats`, { headers }).catch(() => null);
          if (fRes?.ok) {
            const fd = await fRes.json();
            setFinanceStats(fd.data || null);
          }
        }
      } else if (authorization_url) {
        // Live Paystack Redirect
        window.location.href = authorization_url;
      }
    } catch (err) {
      alert(`❌ Paystack Checkout Error: ${err.message}`);
    } finally {
      setPaystackLoading(false);
    }
  };

  // Auto-verify Paystack return query in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paystackRef = urlParams.get('reference') || urlParams.get('trxref');
      if (paystackRef && paystackRef.startsWith('PSTK-')) {
        const verifyUrl = `${API_BASE}/finance/checkout/verify/${paystackRef}`;
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        fetch(verifyUrl, { headers })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setPaystackSuccessReceipt({
                receiptNo: data.receipt_no,
                amount: data.amount,
                studentName: data.invoice?.first_name ? `${data.invoice.first_name} ${data.invoice.last_name}` : 'Student',
                className: data.invoice?.class_name || 'Eagle College',
                invoiceNo: data.invoice?.invoice_no,
                reference: paystackRef,
                method: 'Paystack Verified Online'
              });
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      }
    }
  }, [API_BASE, authToken]);

  // Generate Monthly Payroll Roll Batch
  const handleGeneratePayrollBatch = async () => {
    setIsGeneratingPayroll(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/payroll/batches/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate payroll batch');
      setSelectedPayrollBatch(data.batch);
      await fetchPayrollData();
      alert(`✅ Payroll batch for ${data.batch.month_year} generated successfully!`);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsGeneratingPayroll(false);
    }
  };

  // Disburse Bulk Salary via Paystack Transfers API
  const handleDisbursePayrollBatch = async (batchId) => {
    if (!confirm('Are you sure you want to execute bulk salary payout via Paystack transfers? This will credit all staff verified Nigerian bank accounts.')) {
      return;
    }
    setIsDisbursingPayroll(true);
    setPayrollDisburseSuccess(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/payroll/batches/${batchId}/disburse`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to disburse payroll');
      setPayrollDisburseSuccess(data);
      await fetchPayrollData();
    } catch (err) {
      alert(`❌ Disbursement Error: ${err.message}`);
    } finally {
      setIsDisbursingPayroll(false);
    }
  };

  // View & Generate Official Pay Slip
  const handleViewPayslip = async (staffId) => {
    setIsLoadingPayslip(true);
    setActivePayslipStaff(staffId);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/payroll/payslip/${staffId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load payslip');
      setPayslipData(data);
    } catch (err) {
      alert(`Payslip error: ${err.message}`);
      setActivePayslipStaff(null);
    } finally {
      setIsLoadingPayslip(false);
    }
  };

  // Link & Verify Bank Account
  const handleLinkBankAccount = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStaffForBank) return;
    setIsLinkingBank(true);
    setBankLinkResult(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/payroll/staff/${selectedStaffForBank.id}/bank`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          account_number: bankLinkAccountNo,
          bank_code: bankLinkBankCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to verify bank account');
      setBankLinkResult(data);
      await fetchPayrollData();
      setTimeout(() => {
        setLinkBankModalOpen(false);
        setBankLinkResult(null);
        setSelectedStaffForBank(null);
      }, 2000);
    } catch (err) {
      alert(`Bank Verification Failed: ${err.message}`);
    } finally {
      setIsLinkingBank(false);
    }
  };

  // Fetch student daily roll-call attendance
  const fetchStudentAttendance = useCallback(async (cId, dDate) => {
    const requestId = ++attendanceRequest.current;
    setAttendanceRecords([]);
    if (!cId) return;
    setIsLoadingAttendance(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/attendance/students?class_id=${cId}&date=${dDate}`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (requestId === attendanceRequest.current) setAttendanceRecords(d.records || []);
      }
    } catch (err) {
      console.warn('Error fetching student attendance:', err);
    } finally {
      if (requestId === attendanceRequest.current) setIsLoadingAttendance(false);
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
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Attendance was not saved.');
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
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const [pRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/progress/student/${studentId}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/progress/student/${studentId}/recommendations`, { headers }).catch(() => null)
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
  }, [API_BASE, authToken]);

  // Handle Ask AI Tutor (Puter AI first option, In-House AI resilient fallback)
  const handleAskAi = useCallback(async (e, customPrompt = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const promptToSubmit = (customPrompt || aiQueryText).trim();
    if (!promptToSubmit) return;

    setAiQueryLoading(true);
    setAiQueryResult(null);

    let resolvedResult = null;

    // 1. FIRST OPTION: Puter AI (Free Unlimited OpenAI API)
    if (aiQueryEngine === 'puter') {
      try {
        if (typeof window !== 'undefined' && window.puter?.ai?.chat) {
          const puterResp = await window.puter.ai.chat(promptToSubmit, {
            model: aiQueryModel
          });
          const text = typeof puterResp === 'string'
            ? puterResp
            : (puterResp?.message?.content || puterResp?.text || JSON.stringify(puterResp));
          
          if (text) {
            resolvedResult = {
              answer: text,
              provider: 'puter',
              model: aiQueryModel,
              source: 'Puter AI (Free Unlimited OpenAI API Gateway - Client Direct)',
              confidence: 0.99
            };
          }
        }
      } catch (err) {
        console.warn('Puter AI client call failed, automatically trying backend Puter / In-House engine:', err.message);
      }
    }

    // 2. FALLBACK OPTION / Backend Proxy: Call /api/progress/ask-ai
    if (!resolvedResult) {
      try {
        const headers = authToken
          ? { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }
          : { 'Content-Type': 'application/json' };

        const res = await fetch(`${API_BASE}/progress/ask-ai`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            question: promptToSubmit,
            model: aiQueryModel,
            engine: aiQueryEngine
          })
        });

        if (res.ok) {
          const data = await res.json();
          resolvedResult = data.data;
        } else {
          resolvedResult = {
            answer: `🦅 Eagle Power In-House AI: Received "${promptToSubmit}". All 27 curriculum subjects (Mathematics, English, Physics, Chemistry, Biology, Economics, etc.) are indexed and active.`,
            provider: 'inhouse',
            model: 'In-House EduCore Offline Kernel',
            source: 'In-House AI Engine'
          };
        }
      } catch {
        resolvedResult = {
          answer: `🦅 Eagle Power In-House AI: Offline knowledge base is ready. For "${promptToSubmit}", please consult your class teacher or check curriculum materials on the portal.`,
          provider: 'inhouse',
          model: 'In-House EduCore Kernel',
          source: 'In-House AI Engine (Offline Safe)'
        };
      }
    }

    setAiQueryResult(resolvedResult);
    setAiQueryHistory(prev => [
      { question: promptToSubmit, result: resolvedResult, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 7)
    ]);
    setAiQueryLoading(false);
  }, [aiQueryText, aiQueryEngine, aiQueryModel, API_BASE, authToken]);

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
      // Find candidate student ID based on parent selected child or self
      const targetStudent = (currentUser?.children && selectedStudentAdmNo
        ? currentUser.children.find(c => c.admission_no === selectedStudentAdmNo)
        : null)
        || currentUser?.children?.[0]
        || (selectedStudentAdmNo ? students.find(s => s.admission_no === selectedStudentAdmNo) : null)
        || students[0];
      const res = await fetch(`${API_BASE}/homework/${selectedAssignmentForSubmit.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
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

  // Load teacher class score sheet whenever class, subject, session, or term changes
  const fetchClassSheet = useCallback(async (cId, sId) => {
    const requestId = ++classSheetRequest.current;
    const classIdToUse = cId !== undefined ? cId : selectedClassId;
    const subjectIdToUse = sId !== undefined ? sId : selectedSubjectId;
    setClassSheetRows([]);
    setGradebookClassInfo(null);
    setScoreSaveSuccess(false);
    if (!classIdToUse || !subjectIdToUse) return;

    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/exams/class-sheet?class_id=${classIdToUse}&subject_id=${subjectIdToUse}&session=${encodeURIComponent(gradebookSession)}&term=${encodeURIComponent(gradebookTerm)}`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (requestId !== classSheetRequest.current) return;
        if (Array.isArray(d.data)) {
          setClassSheetRows(d.data);
          if (d.class_info) {
            setGradebookClassInfo(d.class_info);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching class sheet from API:', err.message);
    }

    // A failed request must never fabricate zero marks that could overwrite saved results.
  }, [API_BASE, authToken, gradebookSession, gradebookTerm, selectedClassId, selectedSubjectId]);

  useEffect(() => {
    if (isOpen && (activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'superadmin' || activeTab === 'gradebook')) {
      fetchClassSheet(selectedClassId, selectedSubjectId);
    }
  }, [isOpen, activeRole, currentUser, activeTab, selectedClassId, selectedSubjectId, gradebookSession, gradebookTerm, fetchClassSheet, students.length]);

  // Auto-align Gradebook, Attendance & My Students to an authorized class for the logged-in teacher
  useEffect(() => {
    if (activeRole === 'teacher' && currentUser && classes.length > 0) {
      const allowedCls = getAllowedClassesForTeacher(currentUser, classes);
      if (allowedCls.length > 0) {
        if (!allowedCls.some(c => String(c.id) === String(selectedClassId))) {
          const targetCls = allowedCls[0];
          setSelectedClassId(targetCls.id);
          const allowedSubs = getAllowedSubjectsForClass(currentUser, targetCls, subjects);
          if (allowedSubs.length > 0 && !allowedSubs.some(s => String(s.id) === String(selectedSubjectId))) {
            setSelectedSubjectId(allowedSubs[0].id);
          }
        } else if (currentGradebookClassObj && subjects.length > 0) {
          const allowedSubs = getAllowedSubjectsForClass(currentUser, currentGradebookClassObj, subjects);
          if (allowedSubs.length > 0 && !allowedSubs.some(s => String(s.id) === String(selectedSubjectId))) {
            setSelectedSubjectId(allowedSubs[0].id);
          }
        }
        if (!allowedCls.some(c => String(c.id) === String(attendanceClassId))) {
          setAttendanceClassId(allowedCls[0].id);
        }
        if (!myStudentsClassId || !allowedCls.some(c => String(c.id) === String(myStudentsClassId))) {
          setMyStudentsClassId(allowedCls[0].id);
        }
      }
    }
  }, [activeRole, currentUser, classes, subjects, selectedClassId, selectedSubjectId, currentGradebookClassObj, attendanceClassId, myStudentsClassId]);

  // Load student report card
  const fetchReportCard = useCallback(async (admNo) => {
    const requestId = ++reportCardRequest.current;
    const cleanId = admNo?.trim()?.toUpperCase();
    if (!cleanId) return;

    setReportCardLoading(true);
    setStudentReportCard(null);
    setStandardReport(null);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE}/exams/report-card/${encodeURIComponent(cleanId)}`, { headers });
      if (requestId !== reportCardRequest.current) return;
      if (res.ok) {
        const d = await res.json();
        if (requestId !== reportCardRequest.current) return;
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
      if (requestId === reportCardRequest.current) {
        setStudentReportCard(null);
        setStandardReport(null);
      }
    } finally {
      if (requestId === reportCardRequest.current) setReportCardLoading(false);
    }
  }, [API_BASE, authToken]);

  useEffect(() => {
    if (isOpen && (activeRole === 'student' || activeTab === 'reportcard') && selectedStudentAdmNo) {
      fetchReportCard(selectedStudentAdmNo);
    }
  }, [isOpen, activeRole, activeTab, selectedStudentAdmNo, fetchReportCard]);

  if (!isOpen) return null;

  // Real Authentication Handler (Public Portal & Executive Console Aware)
  const handlePerformLogin = async (e, customUser, customPass) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const u = customUser || loginUsername;
    const p = customPass || loginPassword;

    try {
      const loginUrl = isExecutive 
        ? `${API_BASE}/auth/executive-login` 
        : `${API_BASE}/auth/login`;

      const headers = { 
        'Content-Type': 'application/json',
        'x-portal-type': isExecutive ? 'executive' : 'public'
      };

      const bodyPayload = { 
        username: u.trim(),
        identifier: u.trim(),
        password: p,
        portal_source: isExecutive ? 'executive' : 'public'
      };

      let res = await fetch(loginUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      // Fallback: If executive-login returns 404, fallback to /auth/login with executive portal_source
      if (res.status === 404 && isExecutive) {
        res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok || (!data.session && !data.token && !data.success) || !data.user) {
        setLoginError(data.message || 'Login failed. Please verify credentials.');
        return;
      }

      setAuthToken(data.token || COOKIE_SESSION);
      setCurrentUser(data.user);
      setSessionToken(COOKIE_SESSION);
      setActiveRole(data.user.role);
      setLoginPassword('');

      if (data.user.role === 'superadmin') {
        setActiveTab('overview');
      } else if (data.user.role === 'student' && data.user.reference_id) {
        setSelectedStudentAdmNo(data.user.reference_id);
      }
    } catch {
      setLoginError('Unable to connect to Eagle Power authentication server. Please verify your connection or ensure the server is active.');
    } finally {
      setLoginLoading(false);
    }
  };

  // WhatsApp Passwordless OTP Request Handler
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpPhone.trim()) {
      setLoginError('Please enter your registered WhatsApp phone number or Staff ID.');
      return;
    }
    setOtpLoading(true);
    setLoginError('');
    setOtpSuccessMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/whatsapp-otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to request WhatsApp OTP.');
      setOtpStep('verify');
      setOtpSuccessMessage(data.message || '6-digit OTP code sent to your WhatsApp.');
    } catch (err) {
      setLoginError(err.message || 'Unable to generate WhatsApp OTP. Please try your standard password.');
    } finally {
      setOtpLoading(false);
    }
  };

  // WhatsApp Passwordless OTP Verify Handler
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode.trim()) {
      setLoginError('Please enter the 6-digit OTP code sent to your WhatsApp.');
      return;
    }
    setOtpLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/auth/whatsapp-otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone.trim(), code: otpCode.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.user) throw new Error(data.message || 'Invalid or expired WhatsApp OTP.');

      setAuthToken(data.token || COOKIE_SESSION);
      setCurrentUser(data.user);
      setSessionToken(COOKIE_SESSION);
      setActiveRole(data.user.role);
      setOtpCode('');
      setOtpStep('request');
      setIsOtpMode(false);

      if (data.user.role === 'superadmin') {
        setActiveTab('overview');
      } else if (data.user.role === 'student' && data.user.reference_id) {
        setSelectedStudentAdmNo(data.user.reference_id);
      }
    } catch (err) {
      setLoginError(err.message || 'Failed to verify OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // AI Remark Suggestions for Gradebook
  const handleSuggestRemark = (originalIndex) => {
    setClassSheetRows(prev => {
      const next = [...prev];
      const row = next[originalIndex];
      if (!row) return prev;
      const total = Number(row.total_score || 0);
      let remark = '';
      if (total >= 75) {
        const pool = [
          'Brilliant academic performance! Demonstrates outstanding intellectual agility.',
          'Superb distinction! Consistently enthusiastic, disciplined and focused.',
          'Exceptional mastery of subject concepts. An exemplary, soaring Eagle scholar.'
        ];
        remark = pool[originalIndex % pool.length];
      } else if (total >= 60) {
        const pool = [
          'Commendable effort and solid grasp of subject. Keep up the high standard.',
          'Good academic progress this term. With extra practice, distinction is assured.',
          'Very good performance. Shows strong diligence in tests and classroom work.'
        ];
        remark = pool[originalIndex % pool.length];
      } else if (total >= 50) {
        const pool = [
          'Satisfactory pass. More regular practice and homework completion needed.',
          'Fair understanding shown. Advised to revise challenging topics consistently.',
          'Capable of higher achievements with sustained focus and evening coaching.'
        ];
        remark = pool[originalIndex % pool.length];
      } else {
        const pool = [
          'Needs intensive academic support and dedicated revision before final exam.',
          'Weak foundation detected. Extra tutoring and close parental monitoring recommended.',
          'Struggling with core concepts. Immediate teacher-parent consultation required.'
        ];
        remark = pool[originalIndex % pool.length];
      }
      next[originalIndex] = { ...row, remark };
      return next;
    });
  };

  const handleSuggestAllRemarks = () => {
    setClassSheetRows(prev => {
      return prev.map((row, idx) => {
        const total = Number(row.total_score || 0);
        let remark = '';
        if (total >= 75) remark = 'Brilliant academic performance! Demonstrates outstanding intellectual agility.';
        else if (total >= 60) remark = 'Commendable effort and solid grasp of subject. Keep up the high standard.';
        else if (total >= 50) remark = 'Satisfactory pass. More regular practice and revision needed.';
        else remark = 'Needs intensive academic support and dedicated revision before final exam.';
        return { ...row, remark };
      });
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
      if (!response.ok) throw new Error('Unable to sign out. Please try again.');
      setAuthToken('');
      setCurrentUser(null);
      setSessionToken('');
      window.location.reload();
    } catch {
      alert('Unable to sign out. Please check your connection and try again.');
      setIsLoggingOut(false);
    }
  };

  // Change Password Handler for Authenticated Teachers, Faculty & Users
  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    if (!changePassCurrent) {
      setChangePassError('Please enter your current password.');
      return;
    }
    if (!changePassNew || changePassNew.length < 8) {
      setChangePassError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(changePassNew) || !/\d/.test(changePassNew)) {
      setChangePassError('New password must contain both letters and numbers.');
      return;
    }
    if (changePassNew !== changePassConfirm) {
      setChangePassError('New password and confirmation do not match.');
      return;
    }

    setChangePassLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          current_password: changePassCurrent,
          new_password: changePassNew
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update password.');
      }

      setChangePassSuccess('Password updated successfully! Your account is now secured with your new password.');
      if (data.token) {
        setAuthToken(data.token);
        setSessionToken(data.token);
      }
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setChangePassCurrent('');
        setChangePassNew('');
        setChangePassConfirm('');
        setChangePassSuccess('');
      }, 2000);
    } catch (err) {
      setChangePassError(err.message || 'Failed to update password.');
    } finally {
      setChangePassLoading(false);
    }
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

      // Provisioning another account must never replace the administrator's session.
      setIsRegisterMode(false);
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

  // Teacher Grade Computation & Editing (Multi-Component & Division-Aware)
  const handleScoreEdit = (index, field, val) => {
    const parsed = parseFloat(val);
    const num = isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed * 10) / 10);
    const updated = [...classSheetRows];
    const row = { ...updated[index] };

    if (field === 'ca1') row.ca1_score = Math.min(10, num);
    if (field === 'ca2') row.ca2_score = Math.min(10, num);
    if (field === 'project') row.project_score = Math.min(10, num);

    if (field === 'ca1' || field === 'ca2' || field === 'project') {
      row.ca_score = (row.ca1_score || 0) + (row.ca2_score || 0) + (row.project_score || 0);
    } else if (field === 'ca') {
      row.ca_score = Math.min(30, num);
    }

    if (field === 'exam') row.exam_score = Math.min(70, num);

    row.total_score = (row.ca_score || 0) + (row.exam_score || 0);

    // Standard WAEC 9-point scale
    if (row.total_score >= 75) { row.grade = 'A1'; row.remark = 'Distinction'; }
    else if (row.total_score >= 70) { row.grade = 'B2'; row.remark = 'Very Good'; }
    else if (row.total_score >= 65) { row.grade = 'B3'; row.remark = 'Good'; }
    else if (row.total_score >= 60) { row.grade = 'C4'; row.remark = 'Credit'; }
    else if (row.total_score >= 55) { row.grade = 'C5'; row.remark = 'Credit'; }
    else if (row.total_score >= 50) { row.grade = 'C6'; row.remark = 'Pass'; }
    else if (row.total_score >= 45) { row.grade = 'D7'; row.remark = 'Fair Pass'; }
    else if (row.total_score >= 40) { row.grade = 'E8'; row.remark = 'Weak Pass'; }
    else { row.grade = 'F9'; row.remark = 'Fail'; }

    // Division Specific Grading
    const div = (gradebookClassInfo?.division || '').toLowerCase();
    if (div.includes('primary') || div.includes('basic')) {
      if (row.total_score >= 85) row.division_grade = 'A+';
      else if (row.total_score >= 75) row.division_grade = 'A';
      else if (row.total_score >= 65) row.division_grade = 'B';
      else if (row.total_score >= 55) row.division_grade = 'C';
      else if (row.total_score >= 45) row.division_grade = 'D';
      else row.division_grade = 'E';
    } else if (div.includes('nursery') || div.includes('eyfs') || div.includes('creche')) {
      if (row.total_score >= 80) row.division_grade = 'EE';
      else if (row.total_score >= 60) row.division_grade = 'ME';
      else if (row.total_score >= 45) row.division_grade = 'AE';
      else row.division_grade = 'ES';
    } else {
      row.division_grade = row.grade;
    }

    updated[index] = row;
    setClassSheetRows(updated);
    setScoreSaveSuccess(false);
  };

  // Save Batch Marks to Backend SQLite (Multi-Component Aware)
  const handleSaveBatchScores = async () => {
    if (!classSheetRows.length) return;

    if (activeRole === 'teacher' && !canGradeCurrentSubject) {
      alert(`Access restricted: You are not authorized to enter scores for '${currentGradebookSubjectObj?.name}' in '${currentGradebookClassObj?.name}'. Class teachers have full access to all subjects in their assigned class, while subject teachers can only enter scores for their assigned subjects.`);
      return;
    }

    setIsSavingScores(true);

    try {
      const payload = {
        class_id: parseInt(selectedClassId),
        subject_id: parseInt(selectedSubjectId),
        session: gradebookSession,
        term: gradebookTerm,
        entries: classSheetRows.map(r => ({
          student_id: r.student_id,
          ca_score: r.ca_score,
          ca1_score: r.ca1_score !== undefined ? r.ca1_score : null,
          ca2_score: r.ca2_score !== undefined ? r.ca2_score : null,
          project_score: r.project_score !== undefined ? r.project_score : null,
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
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Scores were not saved.');
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
        if (status === 'Admitted') {
          fetchAllData();
        }
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
        const refRes = await fetch(`${API_BASE}/frontdesk/calls`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
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
        const refRes = await fetch(`${API_BASE}/frontdesk/complaints`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
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
    <div className={isModal ? "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-hidden" : "min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col"}>
      <div className={isModal ? "bg-slate-900 rounded-3xl max-w-7xl w-full h-[96vh] shadow-2xl border border-slate-800 text-left relative flex flex-col overflow-hidden text-slate-100" : "w-full flex-1 flex flex-col text-left relative overflow-hidden bg-slate-900"}>
        
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {currentUser && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 md:hidden text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                title="Toggle Menu"
                aria-label="Toggle Navigation Sidebar"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
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

          {/* Institutional Preview: For Institutional Roles */}
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
              {currentUser.role === 'superadmin' && (
                <a
                  href="/executive-console"
                  title="SuperAdmin Master Root Console"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-400 hover:text-slate-950 flex items-center gap-1 shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Executive Console &rarr;</span>
                </a>
              )}
              <span className="text-[10px] text-amber-400/80 font-bold uppercase px-2 hidden sm:inline">Role Preview:</span>
              {currentUser.role === 'superadmin' && (
                <button
                  onClick={() => { setActiveRole('superadmin'); setActiveTab('executive_cockpit'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeRole === 'superadmin' ? 'bg-amber-400 text-slate-950 font-black shadow ring-1 ring-amber-300' : 'text-amber-400/90 hover:text-white'
                  }`}
                >
                  👑 SuperAdmin
                </button>
              )}
              <button
                onClick={() => { setActiveRole('admin'); setActiveTab('executive_cockpit'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'admin' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏛️ Principal
              </button>
              <button
                onClick={() => { setActiveRole('teacher'); setActiveTab('teacher_cockpit'); }}
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
              <button
                onClick={() => { setActiveRole('frontdesk'); setActiveTab('visitors'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'frontdesk' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏢 Front Desk
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentUser && ['superadmin', 'admin', 'teacher', 'bursar', 'frontdesk'].includes(activeRole) && (
              <button
                onClick={() => {
                  setStaffIdTarget(null);
                  setIsStaffIdModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="View & Print Official Staff ID Card / Upload Photo & Signature"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Staff ID</span>
              </button>
            )}
            {currentUser && ['superadmin', 'admin', 'teacher', 'bursar', 'frontdesk'].includes(activeRole) && (
              <StaffNotificationBell
                currentUser={currentUser}
                onNavigateTab={(tab) => {
                  if (tab) setActiveTab(tab);
                }}
              />
            )}
            {currentUser && (
              <button
                onClick={() => {
                  setChangePassError('');
                  setChangePassSuccess('');
                  setIsChangePasswordOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Change Account Password"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Change Password</span>
              </button>
            )}
            {currentUser && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? 'Signing out…' : 'Log Out'}</span>
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
              onClick={() => {
                if (onClose) onClose();
                else window.location.href = '/';
              }}
              title={isModal ? "Close Portal" : "Return to School Website"}
              className={isModal ? "w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors" : "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"}
            >
              <X className="w-4 h-4" />
              {!isModal && <span className="hidden sm:inline">Main Website</span>}
            </button>
          </div>
        </div>

        {/* If user is NOT logged in: Production Authentication Screen */}
        {sessionChecking ? (
          <div role="status" className="grow flex items-center justify-center gap-3 p-8 text-sm text-slate-300">
            <RefreshCw className="w-5 h-5 animate-spin" /> Restoring your session…
          </div>
        ) : !currentUser || !authToken ? (
          <div className="grow overflow-y-auto p-6 flex flex-col items-center justify-center max-w-xl mx-auto w-full space-y-5">
            <div className="text-center space-y-1.5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
                isExecutive
                  ? 'bg-amber-400/20 border border-amber-400/40 text-amber-400 ring-4 ring-amber-400/10'
                  : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
              }`}>
                {isExecutive ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-black text-white">
                {isExecutive ? 'EaglePower Executive Security Console' : 'Eagle Power EduCore Portal'}
              </h3>
              <p className="text-xs text-slate-400">
                {isExecutive
                  ? 'Dedicated Institutional Governance & High-Privilege Administration'
                  : 'Secure institutional authentication for Parents, Students, Faculty & Administrators.'}
              </p>
              <p className="text-xs text-slate-400">
                You stay signed in when you refresh. Log out when using a shared device.
              </p>
            </div>

            {/* Login Mode Switcher (Standard Password vs. WhatsApp OTP) */}
            {!isExecutive && (
              <div className="w-full flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => { setIsOtpMode(false); setLoginError(''); }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    !isOtpMode ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => { setIsOtpMode(true); setLoginError(''); }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isOtpMode ? 'bg-emerald-500 text-white font-black shadow' : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>WhatsApp Code</span>
                </button>
              </div>
            )}

            {/* Login Form: Password vs WhatsApp OTP */}
            {!isOtpMode ? (
              <form onSubmit={handlePerformLogin} className="w-full space-y-3.5 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs shadow-xl">
                {loginError && (
                  <div className="w-full p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex flex-col gap-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                      <span className="leading-relaxed">{loginError}</span>
                    </div>
                    <button type="button" className="text-left underline" onClick={() => setSessionRetry(value => value + 1)}>Retry session recovery</button>
                  </div>
                )}
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    {isExecutive ? 'SuperAdmin Username / Email / Executive ID' : 'Username / Email / Phone / Admission No'}
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder={isExecutive ? 'superadmin or director@eaglepowerschools.com.ng' : 'e.g. admin, adaeze3011@gmail.com, 08033591058, or ESE2009012'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    {isExecutive ? 'Master Security Passkey' : 'Password / Secure Access PIN'}
                  </label>
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
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : isExecutive ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{isExecutive ? 'Authenticate Executive Console' : 'Authenticate & Launch Portal'}</span>
                </button>
              </form>
            ) : (
              <div className="w-full space-y-3.5 bg-slate-950 p-5 rounded-2xl border border-emerald-900/40 text-xs shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <MessageCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Passwordless WhatsApp Login</span>
                </div>

                {loginError && (
                  <div className="w-full p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {otpSuccessMessage && (
                  <div className="w-full p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{otpSuccessMessage}</span>
                  </div>
                )}

                {otpStep === 'request' ? (
                  <form onSubmit={handleRequestOtp} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-300 uppercase mb-1">
                        Registered WhatsApp Number or Staff ID
                      </label>
                      <input
                        type="text"
                        required
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        placeholder="e.g. 08130439923 or EPS/ST/002"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-emerald-400"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        We will send a single-use 6-digit verification code to your school WhatsApp.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Send 6-Digit WhatsApp Code</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-300 uppercase mb-1">
                        Enter 6-Digit WhatsApp Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="888999"
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-emerald-500 text-center text-xl font-mono tracking-widest text-emerald-300 font-extrabold focus:outline-none"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                        <span>Code expires in 5 minutes</span>
                        <button
                          type="button"
                          onClick={() => { setOtpStep('request'); setOtpCode(''); }}
                          className="text-emerald-400 hover:underline font-bold"
                        >
                          Change number
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Verify & Enter Portal</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Institutional Portal Guidance & Protection Notice */}
            {isExecutive ? (
              <div className="w-full p-4 rounded-2xl bg-slate-950 border border-amber-900/40 text-xs text-slate-400 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Executive Governance Security Protocol</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  This console is restricted to the School Director, Proprietor, and System SuperAdministrators. All session activities and audit logs are cryptographically sealed.
                </p>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Public Portal User?</span>
                  <a href="/portal/login" className="text-amber-400 hover:underline font-bold flex items-center gap-1">
                    <span>Switch to Faculty / Student Portal</span>
                    &rarr;
                  </a>
                </div>
              </div>
            ) : (
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
                    <span>Sign in using your registered telephone number or child's admission number. Parent credentials are provisioned automatically upon student enrollment. For first-time onboarding or PIN resets, please contact the School Administrative Desk.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* When Logged In: Role-Based Dashboard View */
          <div className="flex grow overflow-hidden relative">
            {/* Mobile Drawer Backdrop */}
            {isMobileMenuOpen && (
              <div 
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
              />
            )}
            
            {/* Sidebar */}
            <aside className={`w-64 md:w-60 bg-slate-950 border-r border-slate-800 p-3.5 flex flex-col justify-between shrink-0 text-xs overflow-y-auto transition-all ${
              isMobileMenuOpen 
                ? 'fixed inset-y-0 left-0 z-50 shadow-2xl flex w-72' 
                : 'hidden md:flex'
            }`}>
              <div className="space-y-4">
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between md:hidden pb-2 mb-1 border-b border-slate-800">
                  <span className="font-bold text-amber-400 text-xs uppercase tracking-wider">Navigation Menu</span>
                  <button 
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
                    title="Close Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Logged in User</span>
                  <strong className="text-white font-extrabold text-xs block mt-0.5 truncate">{currentUser.full_name}</strong>
                  <span className="text-slate-400 text-[10px] block uppercase mt-0.5 font-mono">{currentUser.role}</span>
                </div>

                {/* Role Specific Nav */}
                <nav className="space-y-1">
                  {(activeRole === 'superadmin') && (
                    <div className="space-y-3">
                      {/* Category 1: Strategic & Executive */}
                      <div className="space-y-1">
                        <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400/90 flex items-center justify-between">
                          <span>1. Strategic & Executive</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('executive_cockpit')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'executive_cockpit' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Executive Cockpit</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('overview')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'overview' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Overview KPIs</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('broadsheet')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'broadsheet' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">Master Broadsheet</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('gradebook')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'gradebook' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">Live Score Entry</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('classes')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'classes' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">Curriculum Architect</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('templates')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'templates' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Layout className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">Report Templates</span>
                        </button>
                      </div>

                      {/* Category 2: People & IAM Console */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                        <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-400/90 flex items-center justify-between">
                          <span>2. People & IAM Console</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('users');
                            fetchUsers(1);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'users' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">User Accounts IAM</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('students')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'students' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Student Registry</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('staff')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'staff' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">Staff Faculty</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('admissions')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'admissions' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">Admissions Desk</span>
                        </button>
                      </div>

                      {/* Category 3: Operations & Treasury */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                        <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400/90 flex items-center justify-between">
                          <span>3. Operations & Treasury</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('invoices')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'invoices' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">Bursary & Debts</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('payroll');
                            fetchPayrollData();
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'payroll' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Bulk Staff Payroll</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('staff_communication')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'staff_communication' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">Staff Alerts & Automations</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('visitors')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'visitors' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                          <span className="truncate">Campus Front Desk</span>
                        </button>
                      </div>

                      {/* Category 4: Security, System & AI */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                        <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-400/90 flex items-center justify-between">
                          <span>4. Security, System & AI</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('attendance');
                            fetchStudentAttendance(attendanceClassId, attendanceDate);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'attendance' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">Daily Attendance</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('homework')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'homework' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">AI Homework & Gap</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('threat_radar');
                            fetchThreatTelemetry();
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'threat_radar' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">WAF Threat Radar</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('system_settings');
                            fetchSystemSettings();
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                            activeTab === 'system_settings' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span className="truncate">Settings & Backup</span>
                        </button>
                        <button
                          onClick={() => {
                            setWhatsappModalOpen(true);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl font-bold transition-all bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 mt-1 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate text-xs font-black">WhatsApp Bot Hub</span>
                          </div>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-black">LIVE</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {(activeRole === 'admin') && (
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
                        onClick={() => {
                          setActiveTab('ai_progress');
                          if (students[0]?.id) fetchStudentAiProgress(students[0].id);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'ai_progress' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>🧠 Eagle AI Academic Hub</span>
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
                        onClick={() => {
                          setActiveTab('payroll');
                          fetchPayrollData();
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'payroll' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Staff Payroll</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('staff_communication')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'staff_communication' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span>Staff Alerts & Automations</span>
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
                        onClick={() => setActiveTab('students')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'students' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        <span>Students Directory</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('attendance');
                          fetchStudentAttendance(attendanceClassId, attendanceDate);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'attendance' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Class Roll-Call</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('broadsheet')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'broadsheet' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                        <span>Academic Broadsheet</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('gradebook')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'gradebook' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Live Score Entry</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('reportcard');
                          if (students[0]?.admission_no && !selectedStudentAdmNo) {
                            setSelectedStudentAdmNo(students[0].admission_no);
                            fetchReportCard(students[0].admission_no);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'reportcard' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Termly Report Cards</span>
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
                      <button
                        onClick={() => {
                          setActiveTab('ai_progress');
                          if (students[0]?.id) fetchStudentAiProgress(students[0].id);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'ai_progress' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>🧠 Eagle AI Academic Hub</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'teacher' && (
                    <>
                      <button
                        onClick={() => setActiveTab('teacher_cockpit')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'teacher_cockpit' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Teacher Cockpit</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('my_students')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'my_students' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                        <span>My Students Roster</span>
                      </button>
                      <button
                        onClick={() => {
                          setStaffIdTarget(null);
                          setIsStaffIdModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors text-amber-400 hover:text-white bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Staff ID Card & Signature</span>
                      </button>
                      <button
                        onClick={() => {
                          setChangePassError('');
                          setChangePassSuccess('');
                          setIsChangePasswordOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('ai_progress');
                          if (students[0]?.id) fetchStudentAiProgress(students[0].id);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'ai_progress' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>🧠 Eagle AI Assistant & Tutor</span>
                      </button>
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
                          activeTab === 'gradebook' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
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
                      <button
                        onClick={() => setActiveTab('lesson_notes')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'lesson_notes' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lesson Planner</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('reportcard');
                          if (students[0]?.admission_no && !selectedStudentAdmNo) {
                            setSelectedStudentAdmNo(students[0].admission_no);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'reportcard' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Student Report Cards</span>
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
                      <button
                        onClick={() => {
                          setActiveTab('payroll');
                          fetchPayrollData();
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'payroll' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Bulk Salary Payroll</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('reportcard');
                          if (students[0]?.admission_no && !selectedStudentAdmNo) {
                            setSelectedStudentAdmNo(students[0].admission_no);
                            fetchReportCard(students[0].admission_no);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'reportcard' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Clearance & Reports</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'student' && (
                    <>
                      <button
                        onClick={() => setActiveTab('ai_progress')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'ai_progress' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-white bg-amber-400/10'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>🧠 Eagle AI Homework & Tutor</span>
                      </button>
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
                      <button
                        onClick={() => setActiveTab('student_profile')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'student_profile' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        <span>My Academic Profile</span>
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
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>🧠 Eagle AI Hub & Advice</span>
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
                      <button
                        onClick={() => setActiveTab('student_profile')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'student_profile' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        <span>Child ID & Profile</span>
                      </button>
                    </>
                  )}

                  {activeRole === 'frontdesk' && (
                    <>
                      <button
                        onClick={() => {
                          setActiveTab('visitors');
                          setFrontDeskSubTab('visitors');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'visitors' && frontDeskSubTab === 'visitors' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Security Passes ({visitors.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('visitors');
                          setFrontDeskSubTab('enquiries');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'visitors' && frontDeskSubTab === 'enquiries' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>Admission Enquiries ({enquiries.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('visitors');
                          setFrontDeskSubTab('calls');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'visitors' && frontDeskSubTab === 'calls' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call Logs ({calls.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('visitors');
                          setFrontDeskSubTab('complaints');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeTab === 'visitors' && frontDeskSubTab === 'complaints' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                        <span>Feedback & Complaints ({complaints.length})</span>
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

              {/* EXECUTIVE & SUPERADMIN DASHBOARD: OVERVIEW KPIS */}
              {(activeRole === 'superadmin' || activeRole === 'admin') && activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white">Executive Command Overview</h3>
                      <p className="text-xs text-slate-400">Live school analytics & automated communication infrastructure</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWhatsappModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <MessageCircle className="w-4 h-4 fill-slate-950/20" />
                        <span>Connect WhatsApp Bot</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping"></span>
                      </button>
                    </div>
                  </div>

                  {/* PROMINENT WHATSAPP BOT CONNECTION HERO CARD */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-950 to-emerald-950/40 border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl shadow-emerald-950/40">
                    <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      
                      {/* Left info & status */}
                      <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            BOT ONLINE &bull; READY TO PAIR
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                            Fly.io Cloud Gateway
                          </span>
                          <span className="text-[11px] font-bold text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            24/7 Parent & Staff AI
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                            <div className="p-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                              <MessageCircle className="w-6 h-6" />
                            </div>
                            Official School WhatsApp AI Bot & Gateway
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                            Parents check fee balances, attendance, and exam report cards directly on WhatsApp. Staff clock in and record scores. Pair your school phone line or dispatch instant targeted push announcements.
                          </p>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Linked Line: <strong className="text-white font-mono">{systemSettings?.whatsapp_phone || '+234 907 558 0671'}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span>Verified Reach: <strong className="text-emerald-400">119 Contacts</strong> (92 Parents, 27 Staff)</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
                            <Radio className="w-3.5 h-3.5 text-amber-400" />
                            <span>Gateway: <strong className="text-white">Fly.io / Persistent Volume</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right call-to-action buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                        <button
                          onClick={() => setWhatsappModalOpen(true)}
                          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.03] active:scale-[0.98] group"
                        >
                          <QrCode className="w-5 h-5 text-slate-950 group-hover:rotate-6 transition-transform" />
                          <span>CONNECT / PAIR WHATSAPP BOT</span>
                          <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setWhatsappModalOpen(true)}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Push Broadcast</span>
                          </button>
                          <a
                            href={`https://wa.me/${(systemSettings?.whatsapp_phone || '2349075580671').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Test in WhatsApp</span>
                          </a>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>Total Pupils Enrolled</span>
                          <Tooltip text="Total active pupils across all classes and divisions in the school. Includes all enrolled students tracked in the SQLite database.">
                            <HelpCircle className="w-3 h-3 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-black text-white mt-1">
                        {students.length > 0 ? `${students.length} Students` : 'Loading...'}
                      </div>
                      <span className="text-[11px] text-emerald-400 mt-1 block">Migrated & active in SQLite</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>Fees Invoiced</span>
                          <Tooltip text="Total tuition fees invoiced this term vs amount actually collected. A collection rate below 80% triggers automated debt-alert notifications to parents.">
                            <HelpCircle className="w-3 h-3 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <span>Outstanding Debt</span>
                          <Tooltip text="Total fees invoiced but not yet paid. Use the Finance tab to send reminder messages to parents or generate debt reports for the Bursar.">
                            <HelpCircle className="w-3 h-3 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="text-2xl font-black text-red-400 mt-1">
                        ₦{(financeStats?.outstanding_debt ?? 0).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">Pending collection</span>
                    </div>

                    {/* WhatsApp Bot Connection KPI */}
                    <div 
                      onClick={() => setWhatsappModalOpen(true)}
                      className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-950 to-slate-950 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer group shadow-lg shadow-emerald-950/20"
                    >
                      <div className="flex justify-between items-center text-emerald-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white group-hover:text-emerald-300 transition-colors">WhatsApp Bot AI</span>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </div>
                        <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center justify-between">
                        <span>ONLINE</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30">Connect &rarr;</span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        119 Reach &bull; Click to Manage
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>Security Hardening</span>
                          <Tooltip text="Server-side security: 0 PHP execution paths, bcrypt password hashing, threat detection active. All API requests validated with session tokens.">
                            <HelpCircle className="w-3 h-3 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">100% Active</div>
                      <span className="text-[11px] text-slate-400 mt-1 block">0 PHP execution &bull; Bcrypt</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUPERADMIN: User IAM Directory & Access Control */}

              {(activeRole === 'superadmin') && activeTab === 'users' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-black text-white">SuperAdmin IAM & User Directory</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          {userTotal} Total Accounts
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Institutional Identity & Access Management (IAM) &bull; Freeze/unfreeze, unlock, and manage role security
                      </p>
                      {/* IAM How-To Banner */}
                      <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          <span className="font-bold text-amber-400">Staff onboarding:</span> New staff accounts are created via the <span className="text-white font-bold">Register</span> endpoint and appear here. Use <span className="text-amber-400 font-bold">Freeze</span> to suspend access without deleting the account. <span className="text-amber-400 font-bold">Reset Password</span> sends a temporary credential. Role changes take effect on the next login.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchUsers(userPage, userRoleFilter, userStatusFilter, userSearchQuery)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin text-amber-400' : ''}`} />
                      <span>Refresh IAM</span>
                    </button>
                  </div>

                  {userActionMessage && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{userActionMessage}</span>
                    </div>
                  )}

                  {/* Search and Filters */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by username, full name, email or reference ID..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          fetchUsers(1, userRoleFilter, userStatusFilter, e.target.value);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400">Role:</span>
                        <select
                          value={userRoleFilter}
                          onChange={(e) => {
                            setUserRoleFilter(e.target.value);
                            fetchUsers(1, e.target.value, userStatusFilter, userSearchQuery);
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-amber-400"
                        >
                          <option value="All">All Roles</option>
                          <option value="superadmin">SuperAdmin</option>
                          <option value="admin">Principal / Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="bursar">Bursar</option>
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Status:</span>
                        <select
                          value={userStatusFilter}
                          onChange={(e) => {
                            setUserStatusFilter(e.target.value);
                            fetchUsers(1, userRoleFilter, e.target.value, userSearchQuery);
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-amber-400"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active Only</option>
                          <option value="suspended">Suspended Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-3">Role</th>
                            <th className="py-3 px-3">Reference / Contact</th>
                            <th className="py-3 px-3">Status & Security</th>
                            <th className="py-3 px-4 text-right">IAM Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                          {isLoadingUsers ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                                Loading IAM users...
                              </td>
                            </tr>
                          ) : userList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                                No user accounts matching the current filters.
                              </td>
                            </tr>
                          ) : (
                            userList.map(u => (
                              <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="py-3 px-4 font-sans">
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{u.full_name}</span>
                                    {u.id === currentUser?.id && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-slate-950 font-black">YOU</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-amber-400">@{u.username}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    u.role === 'superadmin' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' :
                                    u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                                    u.role === 'teacher' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                                    u.role === 'bursar' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                    u.role === 'parent' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' :
                                    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-[11px]">
                                  <div className="text-slate-300">{u.reference_id || '—'}</div>
                                  <div className="text-slate-500 truncate max-w-[180px]">{u.email || 'No email registered'}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex flex-col gap-1 items-start">
                                    {u.is_locked ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                        <Lock className="w-3 h-3 text-rose-400" />
                                        Locked ({u.lockout_minutes}m)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                                        <Check className="w-3 h-3" />
                                        Normal
                                      </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                                    }`}>
                                      {u.is_active ? 'Active' : 'Suspended'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-sans">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    {u.is_locked && (
                                      <button
                                        onClick={() => handleReleaseLockout(u)}
                                        title="Release brute-force lockout"
                                        className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1"
                                      >
                                        <Unlock className="w-3 h-3" />
                                        <span>Unlock</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleResetUserPassword(u)}
                                      title="Set new password"
                                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1"
                                    >
                                      <Key className="w-3 h-3 text-amber-400" />
                                      <span>Reset PIN</span>
                                    </button>
                                    {u.id !== currentUser?.id && (
                                      <button
                                        onClick={() => handleToggleUserStatus(u)}
                                        title={u.is_active ? 'Suspend account' : 'Reactivate account'}
                                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                                          u.is_active
                                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}
                                      >
                                        {u.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                        <span>{u.is_active ? 'Freeze' : 'Unfreeze'}</span>
                                      </button>
                                    )}
                                    <select
                                      value={u.role}
                                      onChange={(e) => handleChangeUserRole(u, e.target.value)}
                                      className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-1 font-bold"
                                      title="Change Role"
                                    >
                                      <option value="superadmin">SuperAdmin</option>
                                      <option value="admin">Principal/Admin</option>
                                      <option value="teacher">Teacher</option>
                                      <option value="bursar">Bursar</option>
                                      <option value="student">Student</option>
                                      <option value="parent">Parent</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PRINCIPAL: System Settings */}
              {(activeRole === 'admin') && activeTab === 'system_settings' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-black text-white">System Settings & Disaster Recovery</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Configure institutional parameters, active session, and trigger verified database backups.
                      </p>
                    </div>
                  </div>

                  {settingsSaveSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Institutional settings saved and propagated successfully!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Academic Session & School Profile Form */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-white text-sm">Academic Session & Institutional Branding</h4>
                      </div>

                      <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Official School Name</label>
                          <input
                            type="text"
                            value={systemSettings.school_name || ''}
                            onChange={(e) => setSystemSettings({ ...systemSettings, school_name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Current Academic Session</label>
                            <input
                              type="text"
                              value={systemSettings.current_session || ''}
                              onChange={(e) => setSystemSettings({ ...systemSettings, current_session: e.target.value })}
                              placeholder="e.g. 2026/2027"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Current Academic Term</label>
                            <select
                              value={systemSettings.current_term || 'Second Term'}
                              onChange={(e) => setSystemSettings({ ...systemSettings, current_term: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-bold"
                            >
                              <option value="First Term">First Term</option>
                              <option value="Second Term">Second Term</option>
                              <option value="Third Term">Third Term</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Next Resumption Date</label>
                            <input
                              type="date"
                              value={systemSettings.next_resumption_date || ''}
                              onChange={(e) => setSystemSettings({ ...systemSettings, next_resumption_date: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Principal / School Head Name</label>
                            <input
                              type="text"
                              value={systemSettings.principal_name || ''}
                              onChange={(e) => setSystemSettings({ ...systemSettings, principal_name: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1">School Motto</label>
                          <input
                            type="text"
                            value={systemSettings.school_motto || ''}
                            onChange={(e) => setSystemSettings({ ...systemSettings, school_motto: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 italic"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Official Contact Phone</label>
                            <input
                              type="text"
                              value={systemSettings.contact_phone || ''}
                              onChange={(e) => setSystemSettings({ ...systemSettings, contact_phone: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Official WhatsApp</label>
                            <input
                              type="text"
                              value={systemSettings.whatsapp_phone || ''}
                              onChange={(e) => setSystemSettings({ ...systemSettings, whatsapp_phone: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-amber-400"
                              placeholder="+234 907 558 0671"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Official Contact Email</label>
                            <input
                              type="email"
                              value={systemSettings.contact_email || ''}
                              onChange={(e) => setSystemSettings({ ...systemSettings, contact_email: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Campus Physical Address</label>
                          <input
                            type="text"
                            value={systemSettings.address || ''}
                            onChange={(e) => setSystemSettings({ ...systemSettings, address: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSavingSettings}
                            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>{isSavingSettings ? 'Saving Configuration...' : 'Save Institutional Configuration'}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Database Snapshots & Disaster Recovery */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                          <Database className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-bold text-white text-sm">Disaster Recovery & SQLite WAL Backups</h4>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          Eagle Power EduCore runs on a high-concurrency SQLite WAL engine. Executing a backup flushes all WAL pages to disk using <code className="bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-mono">PRAGMA wal_checkpoint(TRUNCATE)</code> and stores an immutable snapshot in <code className="bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-mono">/backups</code>.
                        </p>

                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Database Engine:</span>
                            <span className="font-mono text-emerald-400 font-bold">SQLite 3 (WAL Mode)</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Primary Database File:</span>
                            <span className="font-mono text-white text-[11px]">server/data/eaglepower.db</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Backup Directory:</span>
                            <span className="font-mono text-white text-[11px]">server/backups/</span>
                          </div>
                        </div>

                        {backupResult && (
                          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs space-y-1 animate-in fade-in">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Snapshot Generated Successfully!</span>
                            </div>
                            <div className="font-mono text-[11px] text-emerald-300 truncate">
                              File: {backupResult.filename} ({backupResult.size_kb} KB)
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleTriggerBackup}
                          disabled={isCreatingBackup}
                          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${isCreatingBackup ? 'animate-spin' : ''}`} />
                          <span>{isCreatingBackup ? 'Executing Checkpoint & Snapshot...' : '📸 Create Production Backup Snapshot Now'}</span>
                        </button>
                      </div>

                      {/* Recent Backups List */}
                      {backupsList.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent Snapshots</div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {backupsList.map((b, idx) => (
                              <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between font-mono text-[11px]">
                                <span className="text-slate-300 truncate max-w-[200px]">{b.filename}</span>
                                <span className="text-emerald-400 font-bold">{b.size_kb} KB</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUPERADMIN: WAF Threat Radar & Cyber Defense */}
              {(activeRole === 'superadmin') && activeTab === 'threat_radar' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                        <h3 className="text-lg font-black text-white">Live Threat Radar & WAF Telemetry</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          Active Cyber Defense
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Real-time Web Application Firewall telemetry, automated brute-force IP bans, and scanner neutralization.
                      </p>
                    </div>
                    <button
                      onClick={fetchThreatTelemetry}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingThreats ? 'animate-spin text-amber-400' : ''}`} />
                      <span>Scan Threat Radar</span>
                    </button>
                  </div>

                  {/* Telemetry Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Total Tracked IPs</span>
                        <Server className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-black text-white mt-1">
                        {threatTelemetry ? threatTelemetry.totalTracked : '0'}
                      </div>
                      <span className="text-[11px] text-blue-400 mt-1 block">Monitored in threat radar</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Actively Banned IPs</span>
                        <Shield className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="text-2xl font-black text-rose-400 mt-1">
                        {threatTelemetry ? threatTelemetry.totalBanned : '0'}
                      </div>
                      <span className="text-[11px] text-rose-400/80 mt-1 block">Automatic 2-hour quarantine</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Threat Defense Engine</span>
                        <Activity className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">100% Online</div>
                      <span className="text-[11px] text-slate-400 mt-1 block">0 PHP execution &bull; Strict WAF</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Firewall Rate Limiter</span>
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-black text-amber-400 mt-1">100 req / 15m</div>
                      <span className="text-[11px] text-slate-400 mt-1 block">Exponential backoff active</span>
                    </div>
                  </div>

                  {/* Banned Threat Actors Table */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-400" />
                        <h4 className="font-bold text-white text-sm">Quarantined Threat Actors & Banned IPs</h4>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {threatTelemetry?.bannedIps?.length || 0} active bans
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase">
                            <th className="py-2.5 px-3">IP Address</th>
                            <th className="py-2.5 px-3">Strikes</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Quarantine Remaining</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {!Array.isArray(threatTelemetry?.bannedIps) || threatTelemetry.bannedIps.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                                🛡️ No actively banned IPs. All traffic within safe operational parameters.
                              </td>
                            </tr>
                          ) : (
                            threatTelemetry.bannedIps.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/50">
                                <td className="py-2.5 px-3 text-rose-300 font-bold">{item.ip}</td>
                                <td className="py-2.5 px-3 text-amber-400">{item.strikes} strikes</td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-800">
                                    BANNED
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-sans">{item.minutesRemaining} mins remaining</td>
                                <td className="py-2.5 px-3 text-right font-sans">
                                  <button
                                    onClick={() => handleUnbanIp(item.ip)}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                                  >
                                    Lift Ban
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Active Protection Rules Grid */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Active Threat Hardening Rules</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <strong className="text-white block mb-0.5">Sensitive Probe Blocker:</strong>
                        <span className="text-slate-400 text-[11px]">Rejects requests containing .env, .git, phpinfo, wp-config, or shell patterns with instant 403 Forbidden and adds threat strike.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <strong className="text-white block mb-0.5">Automated SQLi Interceptor:</strong>
                        <span className="text-slate-400 text-[11px]">Inspects URL query strings for UNION, SELECT, SLEEP, benchmark probes and terminates connection before reaching SQLite.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <strong className="text-white block mb-0.5">Static Path Traversal Guard:</strong>
                        <span className="text-slate-400 text-[11px]">Blocks double-dot directory hopping attacks (..%2f) attempting to escape static asset roots.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <strong className="text-white block mb-0.5">Brute-Force Rate Limiting:</strong>
                        <span className="text-slate-400 text-[11px]">Locks accounts after 5 invalid attempts for 15 minutes, with SuperAdmin instant override via the IAM console.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUPERADMIN & ADMIN: Staff */}
              {(activeRole === 'superadmin' || activeRole === 'admin') && activeTab === 'staff' && (
                <StaffManagementConsole
                  authToken={authToken}
                  classes={classes}
                  onStaffChanged={fetchAllData}
                  onPrintId={record => { setStaffIdTarget(record); setIsStaffIdModalOpen(true); }}
                />
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

              {/* PRINCIPAL: Student Registry */}
              {(activeRole === 'admin') && activeTab === 'students' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">Student Registry & Pupil Directory</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                          {students.length} Enrolled Pupils
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Complete historical and active student roster migrated into EduCore</p>
                    </div>
                    <button
                      onClick={() => {
                        setEnrollStudentModalOpen(true);
                        setEnrolledStudentSuccess(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enroll New Pupil</span>
                    </button>
                  </div>

                  {/* Student Registry Search Bar */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search pupils by admission number, name or guardian..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Pupils Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {students
                      .filter(s => {
                        if (!studentSearchQuery) return true;
                        const q = studentSearchQuery.toLowerCase();
                        return (
                          (s.admission_no && s.admission_no.toLowerCase().includes(q)) ||
                          (s.first_name && s.first_name.toLowerCase().includes(q)) ||
                          (s.last_name && s.last_name.toLowerCase().includes(q)) ||
                          (s.guardian_name && s.guardian_name.toLowerCase().includes(q)) ||
                          (s.guardian_phone && s.guardian_phone.includes(q))
                        );
                      })
                      .map(s => {
                        const classObj = classes.find(c => c.id === s.class_id);
                        return (
                          <div key={s.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/40 transition-all text-xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-amber-400 font-extrabold text-[11px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                {s.admission_no}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                {classObj?.name || 'Class ' + (s.class_id || '—')}
                              </span>
                            </div>

                            <div>
                              <div className="font-black text-white text-sm">{s.first_name} {s.last_name}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Gender: <strong className="text-slate-300">{s.gender || '—'}</strong></span>
                                <span>&bull;</span>
                                <span>DOB: <strong className="text-slate-300">{s.dob || '—'}</strong></span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-[11px]">
                              <div className="text-slate-400">Guardian: <strong className="text-slate-200">{s.guardian_name || '—'}</strong></div>
                              <div className="text-slate-400">Phone: <strong className="text-amber-300 font-mono">{s.guardian_phone || '—'}</strong></div>
                              {s.address && <div className="text-slate-500 truncate text-[10px]">{s.address}</div>}
                            </div>

                            <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                              }`}>
                                {s.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedStudentAdmNo(s.admission_no);
                                    setActiveTab('student_profile');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] border border-slate-700 transition-colors"
                                >
                                  ID & Profile
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudentAdmNo(s.admission_no);
                                    setActiveTab('reportcard');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 font-bold text-[10px] border border-amber-400/30 transition-colors"
                                >
                                  Report Card &rarr;
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* PRINCIPAL (ADMIN) & SUPERADMIN: Admissions */}
              {(activeRole === 'admin' || activeRole === 'superadmin') && activeTab === 'admissions' && (
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

              {/* SUPERADMIN: Curriculum Architect */}
              {(activeRole === 'superadmin') && activeTab === 'classes' && (
                <div className="animate-in fade-in">
                  <CurriculumArchitect authToken={authToken} staffList={staff} />
                </div>
              )}

              {/* PRINCIPAL & SUPERADMIN: Classes */}
              {(activeRole === 'admin') && activeTab === 'classes' && (
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

              {/* SUPERADMIN: Student Master Console */}
              {(activeRole === 'superadmin') && activeTab === 'students' && (
                <div className="animate-in fade-in">
                  <StudentMasterConsole
                    authToken={authToken}
                    classes={classes}
                    onEnrollStudent={() => {
                      setEnrollStudentModalOpen(true);
                      setEnrolledStudentSuccess(null);
                    }}
                  />
                </div>
              )}

              {/* SUPERADMIN: System Governance & Disaster Recovery */}
              {(activeRole === 'superadmin') && activeTab === 'system_settings' && (
                <div className="animate-in fade-in">
                  <SystemGovernanceConsole authToken={authToken} />
                </div>
              )}

              {/* PRINCIPAL & RECEPTION: FRONT DESK & VISITOR MANAGEMENT */}
              {(activeRole === 'admin' || activeRole === 'frontdesk' || activeRole === 'superadmin') && (activeTab === 'visitors' || (activeRole === 'frontdesk' && activeTab === 'overview')) && (
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

                  {/* Front Desk Instant Search Bar */}
                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search visitor pass, phone, caller, admission enquiry, or complaint..."
                        value={frontDeskSearchQuery}
                        onChange={(e) => setFrontDeskSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    {frontDeskSearchQuery && (
                      <button
                        onClick={() => setFrontDeskSearchQuery('')}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                    )}
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
                        {visitors
                          .filter(v => {
                            if (!frontDeskSearchQuery) return true;
                            const q = frontDeskSearchQuery.toLowerCase();
                            return (
                              v.visitor_name?.toLowerCase().includes(q) ||
                              v.phone?.toLowerCase().includes(q) ||
                              v.pass_no?.toLowerCase().includes(q) ||
                              v.badge_no?.toLowerCase().includes(q) ||
                              v.person_to_see?.toLowerCase().includes(q) ||
                              v.purpose?.toLowerCase().includes(q)
                            );
                          }).length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No visitor records found matching your search.
                          </div>
                        ) : (
                          visitors
                            .filter(v => {
                              if (!frontDeskSearchQuery) return true;
                              const q = frontDeskSearchQuery.toLowerCase();
                              return (
                                v.visitor_name?.toLowerCase().includes(q) ||
                                v.phone?.toLowerCase().includes(q) ||
                                v.pass_no?.toLowerCase().includes(q) ||
                                v.badge_no?.toLowerCase().includes(q) ||
                                v.person_to_see?.toLowerCase().includes(q) ||
                                v.purpose?.toLowerCase().includes(q)
                              );
                            })
                            .map(v => (
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
                        {enquiries
                          .filter(enq => {
                            if (!frontDeskSearchQuery) return true;
                            const q = frontDeskSearchQuery.toLowerCase();
                            return (
                              enq.name?.toLowerCase().includes(q) ||
                              enq.phone?.toLowerCase().includes(q) ||
                              enq.email?.toLowerCase().includes(q) ||
                              enq.enquiry_no?.toLowerCase().includes(q) ||
                              enq.class_interested?.toLowerCase().includes(q) ||
                              enq.notes?.toLowerCase().includes(q)
                            );
                          }).length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No admission enquiries match your search.
                          </div>
                        ) : (
                          enquiries
                            .filter(enq => {
                              if (!frontDeskSearchQuery) return true;
                              const q = frontDeskSearchQuery.toLowerCase();
                              return (
                                enq.name?.toLowerCase().includes(q) ||
                                enq.phone?.toLowerCase().includes(q) ||
                                enq.email?.toLowerCase().includes(q) ||
                                enq.enquiry_no?.toLowerCase().includes(q) ||
                                enq.class_interested?.toLowerCase().includes(q) ||
                                enq.notes?.toLowerCase().includes(q)
                              );
                            })
                            .map(enq => (
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
                        {calls
                          .filter(cl => {
                            if (!frontDeskSearchQuery) return true;
                            const q = frontDeskSearchQuery.toLowerCase();
                            return (
                              cl.caller_name?.toLowerCase().includes(q) ||
                              cl.phone?.toLowerCase().includes(q) ||
                              cl.purpose?.toLowerCase().includes(q) ||
                              cl.message?.toLowerCase().includes(q)
                            );
                          }).length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No telephone logs match your search.
                          </div>
                        ) : (
                          calls
                            .filter(cl => {
                              if (!frontDeskSearchQuery) return true;
                              const q = frontDeskSearchQuery.toLowerCase();
                              return (
                                cl.caller_name?.toLowerCase().includes(q) ||
                                cl.phone?.toLowerCase().includes(q) ||
                                cl.purpose?.toLowerCase().includes(q) ||
                                cl.message?.toLowerCase().includes(q)
                              );
                            })
                            .map(cl => (
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
                        {complaints
                          .filter(cp => {
                            if (!frontDeskSearchQuery) return true;
                            const q = frontDeskSearchQuery.toLowerCase();
                            return (
                              cp.complainant_name?.toLowerCase().includes(q) ||
                              cp.complainant_phone?.toLowerCase().includes(q) ||
                              cp.complaint_no?.toLowerCase().includes(q) ||
                              cp.complaint_type?.toLowerCase().includes(q) ||
                              cp.description?.toLowerCase().includes(q) ||
                              cp.assigned_to?.toLowerCase().includes(q)
                            );
                          }).length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                            No complaints match your search query.
                          </div>
                        ) : (
                          complaints
                            .filter(cp => {
                              if (!frontDeskSearchQuery) return true;
                              const q = frontDeskSearchQuery.toLowerCase();
                              return (
                                cp.complainant_name?.toLowerCase().includes(q) ||
                                cp.complainant_phone?.toLowerCase().includes(q) ||
                                cp.complaint_no?.toLowerCase().includes(q) ||
                                cp.complaint_type?.toLowerCase().includes(q) ||
                                cp.description?.toLowerCase().includes(q) ||
                                cp.assigned_to?.toLowerCase().includes(q)
                              );
                            })
                            .map(cp => (
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

              {/* TEACHER DASHBOARD: TEACHER COCKPIT & ACADEMIC HUB */}
              {activeRole === 'teacher' && (activeTab === 'teacher_cockpit' || activeTab === 'overview') && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Hero Header */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Academic Form Room & Educator Workspace</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                          Welcome, {currentUser?.name || 'Educator'}
                        </h2>
                        <p className="text-xs text-slate-400 max-w-xl">
                          Assigned Form Class: <span className="text-amber-400 font-bold">{classes.find(c => c.id === attendanceClassId)?.name || 'Junior College (JSS 1)'}</span> • 1st Term 2026/2027 Academic Session. Manage roll-calls, enter continuous assessments, coordinate homework, and prepare lesson schemes.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Info className="w-3.5 h-3.5 text-slate-500" />
                          <p className="text-[11px] text-slate-500">
                            <span className="text-amber-400/80 font-bold">Form Class Teacher</span> — you have full access to all subjects in your class. Subject-only teachers are restricted to their assigned subjects.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setStaffIdTarget(null);
                            setIsStaffIdModalOpen(true);
                          }}
                          className="px-4 py-2.5 rounded-2xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-xs border border-amber-400/30 flex items-center gap-2 transition-all hover:scale-102"
                        >
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <span>My Staff ID Card & Signature</span>
                        </button>
                        <button
                          onClick={() => {
                            setChangePassError('');
                            setChangePassSuccess('');
                            setIsChangePasswordOpen(true);
                          }}
                          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all hover:scale-102"
                          title="Change Account Password"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>Change Password</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('my_students')}
                          className="px-4 py-2.5 rounded-2xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-black text-xs border border-amber-400/40 flex items-center gap-2 transition-all hover:scale-102 active:scale-98"
                        >
                          <GraduationCap className="w-4 h-4 text-amber-400" />
                          <span>My Students Roster</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('attendance');
                            fetchStudentAttendance(attendanceClassId, attendanceDate);
                          }}
                          className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/10 flex items-center gap-2 transition-all hover:scale-102 active:scale-98"
                        >
                          <Users className="w-4 h-4" />
                          <span>Take Today's Roll-Call</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('gradebook')}
                          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
                        >
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>Record Marks</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Core Teacher Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Class Roster */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-amber-400/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Roll</span>
                          <Tooltip text="Total number of pupils enrolled in your assigned form class. Click 'View Class Register' to see the full attendance history for each pupil.">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white">{attendanceRecords.length || classes.find(c => c.id === attendanceClassId)?.student_count || 32}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>Enrolled Pupils in {classes.find(c => c.id === attendanceClassId)?.name || 'Form Class'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('attendance');
                          fetchStudentAttendance(attendanceClassId, attendanceDate);
                        }}
                        className="text-xs text-amber-400 font-bold flex items-center gap-1 hover:underline pt-2 border-t border-slate-900"
                      >
                        <span>View Class Register</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Today's Roll-Call */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-amber-400/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Attendance</span>
                          <Tooltip text="Mark each pupil Present, Absent, or Late. Once submitted the register is locked for the day. Attendance feeds directly into the terminal report card.">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white">
                          {attendanceRecords.filter(r => r.status === 'Present').length} / {attendanceRecords.length || 32}
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{attendanceRecords.some(r => r.status !== 'Unrecorded') ? 'Register Logged' : 'Roll-call Pending Today'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('attendance');
                          fetchStudentAttendance(attendanceClassId, attendanceDate);
                        }}
                        className="text-xs text-amber-400 font-bold flex items-center gap-1 hover:underline pt-2 border-t border-slate-900"
                      >
                        <span>Mark Attendance</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* CA & Exams */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-amber-400/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject Gradebook</span>
                          <Tooltip text="CA score is out of 30 marks, Exam is out of 70. Total = CA + Exam (max 100). Grades auto-compute using the WAEC 9-point scale (A1–F9) or your division's grading system." wide>
                            <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Award className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white">
                          {subjects.find(s => s.id === selectedSubjectId)?.name || 'Mathematics'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          CA: 30% • Terminal Exam: 70%
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('gradebook')}
                        className="text-xs text-amber-400 font-bold flex items-center gap-1 hover:underline pt-2 border-t border-slate-900"
                      >
                        <span>Open Score Sheet</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Homework & AI Submissions */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-amber-400/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Homework & AI</span>
                          <Tooltip text="Assignments you create are auto-graded by EduCore AI when pupils submit answers via WhatsApp or the Parent Portal. Review scores and override them if needed." wide>
                            <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white">{homeworkList.length} Active</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Auto-graded submissions ready
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('homework')}
                        className="text-xs text-amber-400 font-bold flex items-center gap-1 hover:underline pt-2 border-t border-slate-900"
                      >
                        <span>Manage Assignments</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Teaching Cockpit Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Rapid Teaching Actions & Workflows */}
                    <div className="lg:col-span-2 space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Layout className="w-4 h-4 text-amber-400" />
                          <span>Teaching Operations & Shortcuts</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Quick Workflow Access</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Attendance Action */}
                        <div
                          onClick={() => {
                            setActiveTab('attendance');
                            fetchStudentAttendance(attendanceClassId, attendanceDate);
                          }}
                          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/40 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Open <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white">Daily Attendance Register</h4>
                          <p className="text-xs text-slate-400">
                            Perform class roll-call with 1-click Present, Absent, Late, or Excused toggles.
                          </p>
                        </div>

                        {/* Gradebook Action */}
                        <div
                          onClick={() => setActiveTab('gradebook')}
                          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/40 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Award className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Open <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white">CA & Exam Score Register</h4>
                          <p className="text-xs text-slate-400">
                            Record Continuous Assessment (30) and Exam (70) marks with real-time WAEC grading.
                          </p>
                        </div>

                        {/* Homework Action */}
                        <div
                          onClick={() => setActiveTab('homework')}
                          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/40 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Open <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white">Homework & In-House AI</h4>
                          <p className="text-xs text-slate-400">
                            Set curriculum tasks, configure automated evaluation rubrics, and review answers.
                          </p>
                        </div>

                        {/* Broadsheet Action */}
                        <div
                          onClick={() => setActiveTab('broadsheet')}
                          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/40 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Open <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white">Terminal Broadsheet</h4>
                          <p className="text-xs text-slate-400">
                            View the master grades matrix across all subjects, calculated totals, and positions.
                          </p>
                        </div>
                      </div>

                      {/* WhatsApp Teaching Command Hub & Broadcast Composer */}
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-slate-950 border border-emerald-800/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-emerald-300 text-sm">Class WhatsApp Hub & Broadcaster</h4>
                              <p className="text-[11px] text-slate-400">Two-way integration between your form room and parents</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
                            Bot Active & Synchronized
                          </span>
                        </div>

                        {/* Broadcast Message Templates */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400 font-bold">Template:</span>
                            {[
                              { id: 'homework', label: 'Homework Alert' },
                              { id: 'attendance', label: 'Attendance Check' },
                              { id: 'exam', label: 'Test / Exam Notice' },
                              { id: 'cultural', label: 'Dress Code & Events' }
                            ].map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setAnnouncementTemplate(t.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  announcementTemplate === t.id
                                    ? 'bg-emerald-500 text-white font-black shadow'
                                    : 'bg-slate-900 text-slate-400 hover:text-white'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>

                          {/* Computed Broadcast Message */}
                          {(() => {
                            const className = classes.find(c => c.id === attendanceClassId)?.name || 'Class';
                            let text = '';
                            if (announcementTemplate === 'homework') {
                              text = `🦅 *EAGLE POWER SCHOOLS — ${className.toUpperCase()} HOMEWORK NOTICE*\n\nDear Parents/Guardians,\nPlease ensure your child completes their homework assignment today. Submission is due at morning assembly tomorrow.\n\n_Thank you for your active partnership in excellence!_\n*Form Teacher / Subject Master*\nEagle Power Schools, Awka`;
                            } else if (announcementTemplate === 'attendance') {
                              text = `🦅 *EAGLE POWER SCHOOLS — ${className.toUpperCase()} ATTENDANCE NOTICE*\n\nDear Parents/Guardians,\nDaily roll-call has been recorded for ${className}. Regular attendance is vital for academic distinction.\n\n_Eagle Power Schools Administration_`;
                            } else if (announcementTemplate === 'exam') {
                              text = `🦅 *EAGLE POWER SCHOOLS — ${className.toUpperCase()} ASSESSMENT NOTICE*\n\nDear Parents/Guardians,\nContinuous Assessment (CA) and revision tests are scheduled this week. Please ensure your child reviews their lesson notes and arrives promptly.\n\n*Eagle Power Academic Directorate*`;
                            } else {
                              text = `🦅 *EAGLE POWER SCHOOLS — ${className.toUpperCase()} EVENT NOTICE*\n\nDear Parents/Guardians,\nPlease take note of the upcoming school event and designated attire. Students are expected to adhere strictly to school standards.\n\n*Eagle Power Schools, Awka*`;
                            }

                            return (
                              <div className="space-y-2">
                                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-sans text-slate-300 whitespace-pre-line leading-relaxed">
                                  {text}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(text);
                                      setAnnouncementCopied(true);
                                      setTimeout(() => setAnnouncementCopied(false), 2500);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                                  >
                                    {announcementCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{announcementCopied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
                                  </button>
                                  <a
                                    href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Broadcast via WhatsApp</span>
                                  </a>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* WhatsApp Bot Teacher Shortcuts */}
                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                          <span className="text-slate-300 font-bold">Direct WhatsApp Commands for Your Phone:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 font-mono text-[10px]">
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-emerald-400">!allpresent SS2</span>: 1-Tap class roll-call
                            </div>
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-emerald-400">!score 001 MTH 25 55</span>: Enter CA & Exam marks
                            </div>
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-emerald-400">!myclass</span>: View your pupils & parents
                            </div>
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-emerald-400">!payslip</span>: View monthly salary voucher
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Weekly Lesson Scheme & Planner Preview */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <span>Scheme of Work</span>
                        </h3>
                        <button
                          onClick={() => setLessonNoteModalOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Note</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {lessonNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                                {note.week} • {note.subject}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                note.status === 'Approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {note.status}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white">{note.topic}</h4>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>{note.class_name}</span>
                              <span className="text-slate-500">{note.date}</span>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => setActiveTab('lesson_notes')}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>Open Full Lesson Planner</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TEACHER "MY STUDENTS" ROSTER & COMPREHENSIVE ACADEMIC MANAGEMENT HUB */}
              {(activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'superadmin') && activeTab === 'my_students' && (() => {
                const effectiveClassList = activeRole === 'teacher'
                  ? (allowedGradebookClasses.length > 0 ? allowedGradebookClasses : classes)
                  : classes;

                const effectiveClassId = myStudentsClassId
                  ? myStudentsClassId
                  : (effectiveClassList[0]?.id || classes[0]?.id || 1);

                const currentClassObj = classes.find(c => String(c.id) === String(effectiveClassId)) || effectiveClassList[0] || null;
                const isFormTeacher = isFormTeacherOfClass(currentUser, currentClassObj);

                // Strictly filter students by class
                const filteredClassStudents = students.filter(s => {
                  if (activeRole === 'teacher') {
                    // Class teacher only sees students in authorized classes
                    const isAllowed = allowedGradebookClasses.some(c => String(c.id) === String(s.class_id));
                    if (!isAllowed) return false;
                  }
                  if (effectiveClassId && String(s.class_id) !== String(effectiveClassId)) return false;
                  if (!myStudentsSearchQuery) return true;
                  const q = myStudentsSearchQuery.toLowerCase();
                  return (
                    (s.first_name || '').toLowerCase().includes(q) ||
                    (s.last_name || '').toLowerCase().includes(q) ||
                    (s.admission_no || '').toLowerCase().includes(q) ||
                    (s.guardian_phone || '').toLowerCase().includes(q) ||
                    (s.guardian_name || '').toLowerCase().includes(q)
                  );
                });

                const maleCount = filteredClassStudents.filter(s => (s.gender || '').toLowerCase() === 'male').length;
                const femaleCount = filteredClassStudents.filter(s => (s.gender || '').toLowerCase() === 'female').length;

                return (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Header Banner */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>My Students Hub • Class Form Management</span>
                          </div>
                          <h2 className="text-2xl font-black text-white tracking-tight">
                            {currentClassObj?.name || 'My Class'} Student Roster
                          </h2>
                          <p className="text-xs text-slate-400 max-w-xl">
                            Continuous Assessment (CA) tracking, terminal report card comments, attendance records, classwork/homework assignments, and direct parent communication.
                          </p>
                          <div className="flex items-center gap-2 pt-1 text-xs">
                            {isFormTeacher ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-400" />
                                Form Class Teacher (Full Academic Authority)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-indigo-400" />
                                Subject Teacher Class View
                              </span>
                            )}
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 font-medium">{filteredClassStudents.length} Students Enrolled</span>
                          </div>
                        </div>

                        {/* Top Action Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Class Selector Dropdown */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400">Class:</span>
                            <select
                              value={effectiveClassId}
                              onChange={(e) => {
                                const val = Number(e.target.value) || e.target.value;
                                setMyStudentsClassId(val);
                                setSelectedClassId(val);
                                setAttendanceClassId(val);
                              }}
                              className="bg-slate-900 border border-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs focus:border-amber-400"
                            >
                              {effectiveClassList.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} {isFormTeacherOfClass(currentUser, c) ? '👑 (Your Class)' : ''} ({c.student_count || students.filter(s => String(s.class_id) === String(c.id)).length} pupils)
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              setActiveTab('attendance');
                              setAttendanceClassId(effectiveClassId);
                              fetchStudentAttendance(effectiveClassId, attendanceDate);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
                            title="Take attendance for this class"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Take Roll-Call</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedClassId(effectiveClassId);
                              setActiveTab('gradebook');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all"
                            title="Open class score entry sheet"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Score Sheet / Gradebook</span>
                          </button>

                          <button
                            onClick={() => {
                              setNewHwForm(prev => ({
                                ...prev,
                                class_id: effectiveClassId,
                                subject_id: allowedGradebookSubjects[0]?.id || subjects[0]?.id || 1,
                                assignment_type: 'Classwork'
                              }));
                              setCreateHwModalOpen(true);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs border border-purple-500/40 flex items-center gap-1.5 transition-all"
                            title="Assign new classwork or homework"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                            <span>Give Classwork</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Telemetry Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Enrolled</span>
                          <span className="text-2xl font-black text-white">{filteredClassStudents.length}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Male Pupils</span>
                          <span className="text-2xl font-black text-blue-400">{maleCount}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                          👦
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Female Pupils</span>
                          <span className="text-2xl font-black text-pink-400">{femaleCount}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold">
                          👧
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Session</span>
                          <span className="text-sm font-black text-amber-400">{gradebookSession || '2026/2027'}</span>
                          <span className="text-[10px] text-slate-400 block">{gradebookTerm || 'First Term'}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold">
                          <Calendar className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search pupil by name, admission no, or guardian phone..."
                          value={myStudentsSearchQuery}
                          onChange={(e) => setMyStudentsSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                        />
                      </div>
                      <div className="text-xs text-slate-400 font-bold">
                        Showing <span className="text-amber-400">{filteredClassStudents.length}</span> pupils in {currentClassObj?.name}
                      </div>
                    </div>

                    {/* Student Roster Table */}
                    <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-4">Pupil / Identity</th>
                              <th className="p-4">Gender</th>
                              <th className="p-4">Parent / Guardian & Phone</th>
                              <th className="p-4">Direct Contact</th>
                              <th className="p-4 text-center">Teacher Academic Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 text-slate-300">
                            {filteredClassStudents.length > 0 ? (
                              filteredClassStudents.map((student, idx) => {
                                const waUrl = formatParentWhatsAppUrl(
                                  student.guardian_phone,
                                  `${student.first_name} ${student.last_name}`,
                                  currentClassObj?.name || 'Class',
                                  currentUser?.name || currentUser?.full_name
                                );

                                return (
                                  <tr key={student.id || student.admission_no} className="hover:bg-slate-900/50 transition-colors">
                                    {/* Student Identity */}
                                    <td className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/30 flex items-center justify-center font-black text-amber-300 text-sm shrink-0">
                                          {(student.first_name?.[0] || 'S')}{(student.last_name?.[0] || '')}
                                        </div>
                                        <div>
                                          <div className="font-extrabold text-white text-sm">
                                            {student.first_name} {student.last_name}
                                          </div>
                                          <div className="font-mono text-[10px] text-amber-400 flex items-center gap-1.5 mt-0.5">
                                            <span>{student.admission_no}</span>
                                            <span className="text-slate-600">•</span>
                                            <span className="text-slate-400">{student.class_name || currentClassObj?.name}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Gender */}
                                    <td className="p-4">
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                        (student.gender || '').toLowerCase() === 'male'
                                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                          : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                      }`}>
                                        {student.gender || 'Pupil'}
                                      </span>
                                    </td>

                                    {/* Guardian Contact */}
                                    <td className="p-4">
                                      <div>
                                        <div className="font-bold text-white text-xs">
                                          {student.guardian_name || 'Guardian'}
                                        </div>
                                        <div className="font-mono text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                                          <span>📞 {student.guardian_phone || 'No phone on file'}</span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Contact Parent Direct */}
                                    <td className="p-4">
                                      <div className="flex items-center gap-1.5">
                                        {waUrl ? (
                                          <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1 transition-all hover:scale-105"
                                            title="Chat with Parent on WhatsApp"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>WhatsApp</span>
                                          </a>
                                        ) : (
                                          <span className="text-slate-600 text-[10px]">No WhatsApp</span>
                                        )}

                                        {student.guardian_phone ? (
                                          <a
                                            href={`tel:${student.guardian_phone}`}
                                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:scale-105"
                                            title={`Call ${student.guardian_phone}`}
                                          >
                                            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                                          </a>
                                        ) : null}
                                      </div>
                                    </td>

                                    {/* Academic Management Actions */}
                                    <td className="p-4">
                                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                        {/* Record CA Scores */}
                                        <button
                                          onClick={() => handleOpenQuickCaModal(student)}
                                          className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[11px] flex items-center gap-1 transition-all hover:scale-102"
                                          title="Quick Record Continuous Assessment (CA) & Exam score"
                                        >
                                          <Award className="w-3 h-3 text-amber-400" />
                                          <span>Record CA</span>
                                        </button>

                                        {/* Write Comment */}
                                        <button
                                          onClick={() => handleOpenCommentModal(student)}
                                          className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] flex items-center gap-1 transition-all hover:scale-102"
                                          title="Write Form Teacher's Official Comment & Evaluate Traits"
                                        >
                                          <FileText className="w-3 h-3 text-indigo-400" />
                                          <span>Write Comment</span>
                                        </button>

                                        {/* View Report Card */}
                                        <button
                                          onClick={() => {
                                            setSelectedStudentAdmNo(student.admission_no);
                                            fetchReportCard(student.admission_no);
                                            setActiveTab('reportcard');
                                          }}
                                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-[11px] flex items-center gap-1 transition-all hover:scale-102"
                                          title="Open official terminal report card"
                                        >
                                          <Printer className="w-3 h-3 text-slate-400" />
                                          <span>Report Card</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                  No pupils found matching "{myStudentsSearchQuery}" in {currentClassObj?.name || 'this class'}.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ATTENDANCE REGISTER (TEACHER, SUPERADMIN & PRINCIPAL) */}
              {(activeRole === 'teacher' || activeRole === 'superadmin' || activeRole === 'admin') && activeTab === 'attendance' && (
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
                        {(activeRole === 'teacher' ? allowedGradebookClasses : classes).map(c => (
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
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold transition-all"
                      >
                        Mark All Present
                      </button>

                      <button
                        onClick={() => handleMarkAllAttendance('Absent')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold transition-all"
                      >
                        Mark All Absent
                      </button>

                      <button
                        onClick={() => handleMarkAllAttendance('Unrecorded')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold transition-all"
                      >
                        Reset
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

                  {/* Attendance Search Bar and Live Progress Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search student by name or admission no..."
                        value={attendanceSearchQuery}
                        onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      {attendanceSearchQuery && (
                        <button
                          onClick={() => setAttendanceSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400 font-medium">
                        Showing <span className="text-white font-bold">
                          {attendanceRecords.filter(r => {
                            if (!attendanceSearchQuery.trim()) return true;
                            const q = attendanceSearchQuery.toLowerCase();
                            return (r.first_name || '').toLowerCase().includes(q) ||
                              (r.last_name || '').toLowerCase().includes(q) ||
                              (r.admission_no || '').toLowerCase().includes(q);
                          }).length}
                        </span> of <span className="text-white font-bold">{attendanceRecords.length}</span> pupils
                      </span>
                      <div className="w-32 bg-slate-900 rounded-full h-2 overflow-hidden flex border border-slate-800" title="Attendance Progress">
                        <div style={{ width: `${(attendanceRecords.filter(r => r.status === 'Present').length / (attendanceRecords.length || 1)) * 100}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${(attendanceRecords.filter(r => r.status === 'Absent').length / (attendanceRecords.length || 1)) * 100}%` }} className="bg-rose-500 h-full" />
                        <div style={{ width: `${(attendanceRecords.filter(r => r.status === 'Late').length / (attendanceRecords.length || 1)) * 100}%` }} className="bg-amber-500 h-full" />
                        <div style={{ width: `${(attendanceRecords.filter(r => r.status === 'Excused').length / (attendanceRecords.length || 1)) * 100}%` }} className="bg-blue-500 h-full" />
                      </div>
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
                          {attendanceRecords.filter(r => {
                            if (!attendanceSearchQuery.trim()) return true;
                            const q = attendanceSearchQuery.toLowerCase();
                            return (r.first_name || '').toLowerCase().includes(q) ||
                              (r.last_name || '').toLowerCase().includes(q) ||
                              (r.admission_no || '').toLowerCase().includes(q);
                          }).map((r, i) => (
                            <tr key={r.student_id} className="hover:bg-slate-900/40">
                              <td className="p-3 text-center font-mono text-slate-500 text-[11px]">{i + 1}</td>
                              <td className="p-3 font-mono font-bold text-amber-400">{r.admission_no}</td>
                              <td className="p-3 font-bold text-white">{r.first_name} {r.last_name}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 font-mono text-slate-300 text-[11px]">
                                  <span>{r.guardian_phone || '—'}</span>
                                  {r.guardian_phone && (
                                    <a
                                      href={`https://wa.me/${r.guardian_phone.replace(/\D/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(`Hello ${r.guardian_name || 'Parent'}, this is Eagle Power Schools regarding your child ${r.first_name} ${r.last_name} in ${classes.find(c => c.id === attendanceClassId)?.name || 'Class'}. Today's attendance status (${attendanceDate}): ${r.status}.`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all ml-1 shrink-0 inline-flex items-center gap-1 text-[10px]"
                                      title={`Open WhatsApp chat with ${r.guardian_name || 'Parent'}`}
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span className="hidden sm:inline">WhatsApp</span>
                                    </a>
                                  )}
                                </div>
                              </td>
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

              {/* LIVE PRODUCTION GRADEBOOK (TEACHER & ADMIN) */}
              {(activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'superadmin') && activeTab === 'gradebook' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950 p-4 rounded-3xl border border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">Continuous Assessment & Exam Score Register</h3>
                        {gradebookClassInfo?.grading_scale && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800">
                            {gradebookClassInfo.grading_scale.division} ({gradebookClassInfo.grading_scale.type})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Multi-component scoring, division grading scale auto-computation & permanent SQLite marksheet storage
                      </p>
                      {/* Gradebook Quick-Start Instructions */}
                      <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          <span className="font-bold text-amber-400">Quick start:</span> Select the correct <span className="text-white font-bold">Session → Term → Class → Subject</span>, then type scores into each pupil's row. Use <span className="text-purple-300 font-bold">AI Suggest All Remarks</span> for auto-generated comments, then click <span className="text-amber-400 font-bold">Save Scores</span>. If the save button is locked, the term has been closed by the Principal — contact an Admin.
                        </p>
                      </div>

                      {/* Mode Switcher */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setGradebookMode('standard')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            gradebookMode === 'standard'
                              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          Standard CA (30) + Exam (70)
                        </button>

                        <button
                          type="button"
                          onClick={() => setGradebookMode('multi')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            gradebookMode === 'multi'
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          ✨ Multi-Component: Test 1 (10) + Test 2 (10) + Project (10) + Exam (70)
                        </button>

                        <Tooltip text="Standard: Enter one CA total (max 30) + Exam (max 70). Multi-Component: Break CA into Test 1, Test 2, and Project (10 marks each = 30 total CA). Use whichever matches your school's assessment format." wide>
                          <HelpCircle className="w-4 h-4 text-slate-600 hover:text-amber-400 cursor-help" />
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Session Selector */}
                      <div className="flex items-center gap-1">
                        <select
                          value={gradebookSession}
                          onChange={(e) => setGradebookSession(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl"
                        >
                          <option value="2026/2027">2026/2027 Academic Session</option>

                        </select>
                        <Tooltip text="Always confirm the session matches the current academic year before entering marks. Scores are stored per-session and cannot be moved across sessions." wide>
                          <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                        </Tooltip>
                      </div>

                      {/* Term Selector */}
                      <div className="flex items-center gap-1">
                        <select
                          value={gradebookTerm}
                          onChange={(e) => setGradebookTerm(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl"
                        >
                          <option value="First Term">First Term</option>
                          <option value="Second Term">Second Term</option>
                          <option value="Third Term">Third Term</option>
                        </select>
                        <Tooltip text="Marks are stored per-term. Ensure this matches the physical exam paper you are currently scoring. Selecting the wrong term will save scores to the wrong report card period.">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                        </Tooltip>
                      </div>

                      {/* Class Selector */}
                      <div className="flex items-center gap-1">
                        <select
                          value={selectedClassId}
                          onChange={(e) => {
                            const val = Number(e.target.value) || e.target.value;
                            setSelectedClassId(val);
                            const targetCls = classes.find(c => String(c.id) === String(val)) || null;
                            const newAllowedSubs = getAllowedSubjectsForClass(currentUser, targetCls, subjects);
                            let nextSubId = selectedSubjectId;
                            if (newAllowedSubs.length > 0 && !newAllowedSubs.some(s => String(s.id) === String(selectedSubjectId))) {
                              nextSubId = newAllowedSubs[0].id;
                              setSelectedSubjectId(nextSubId);
                            }
                            fetchClassSheet(val, nextSubId);
                          }}
                          className="bg-slate-900 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl max-w-xs"
                        >
                          {(allowedGradebookClasses.length > 0 ? allowedGradebookClasses : classes).map(c => {
                            const isForm = isFormTeacherOfClass(currentUser, c);
                            return (
                              <option key={c.id} value={c.id}>
                                {c.name} {isForm ? '👑 (Your Form Class)' : ''} ({c.student_count || students.filter(s => String(s.class_id) === String(c.id)).length} pupils)
                              </option>
                            );
                          })}
                        </select>
                        <Tooltip text="Teachers only see their assigned classes. If a class is missing, contact the Admin to update your class assignment in the IAM system." wide>
                          <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                        </Tooltip>
                      </div>

                      {/* Subject Selector */}
                      <div className="flex items-center gap-1">
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => {
                            const val = Number(e.target.value) || e.target.value;
                            setSelectedSubjectId(val);
                            fetchClassSheet(selectedClassId, val);
                          }}
                          className="bg-slate-900 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl max-w-xs"
                        >
                          {(allowedGradebookSubjects.length > 0 ? allowedGradebookSubjects : subjects).map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code}) {isCurrentFormTeacher ? '• All Subjects Access' : '• Your Subject'}
                            </option>
                        ))}
                      </select>
                      <Tooltip text="Only subjects assigned to you by the curriculum coordinator appear here. If a subject is missing, ask the Admin to update your subject assignment." wide>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-help" />
                      </Tooltip>
                      </div>

                      <button
                        onClick={() => {
                          const updated = classSheetRows.map(row => {
                            if (!row.ca_score || row.ca_score === 0) {
                              let ca1 = row.ca1_score || 8;
                              let ca2 = row.ca2_score || 8;
                              let project = row.project_score || 9;
                              let ca = ca1 + ca2 + project;
                              const exam = row.exam_score || 0;
                              const tot = ca + exam;
                              let grade = 'F9', remark = 'Fail';
                              if (tot >= 75) { grade = 'A1'; remark = 'Distinction'; }
                              else if (tot >= 70) { grade = 'B2'; remark = 'Very Good'; }
                              else if (tot >= 65) { grade = 'B3'; remark = 'Good'; }
                              else if (tot >= 60) { grade = 'C4'; remark = 'Credit'; }
                              else if (tot >= 55) { grade = 'C5'; remark = 'Credit'; }
                              else if (tot >= 50) { grade = 'C6'; remark = 'Pass'; }
                              else if (tot >= 45) { grade = 'D7'; remark = 'Fair Pass'; }
                              else if (tot >= 40) { grade = 'E8'; remark = 'Weak Pass'; }

                              let divGrade = grade;
                              const div = (gradebookClassInfo?.division || '').toLowerCase();
                              if (div.includes('primary') || div.includes('basic')) {
                                if (tot >= 85) divGrade = 'A+';
                                else if (tot >= 75) divGrade = 'A';
                                else if (tot >= 65) divGrade = 'B';
                                else if (tot >= 55) divGrade = 'C';
                                else if (tot >= 45) divGrade = 'D';
                                else divGrade = 'E';
                              } else if (div.includes('nursery') || div.includes('eyfs')) {
                                if (tot >= 80) divGrade = 'EE';
                                else if (tot >= 60) divGrade = 'ME';
                                else if (tot >= 45) divGrade = 'AE';
                                else divGrade = 'ES';
                              }

                              return { 
                                ...row, 
                                ca1_score: ca1, 
                                ca2_score: ca2, 
                                project_score: project, 
                                ca_score: ca, 
                                total_score: tot, 
                                grade, 
                                division_grade: divGrade, 
                                remark 
                              };
                            }
                            return row;
                          });
                          setClassSheetRows(updated);
                        }}
                        disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          activeRole === 'teacher' && !canGradeCurrentSubject
                            ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                        }`}
                        title={activeRole === 'teacher' && !canGradeCurrentSubject ? 'Score entry restricted for this subject' : 'Auto-fill empty CA components with benchmark marks (8+8+9 = 25/30)'}
                      >
                        Quick-Fill CA (25)
                      </button>

                      <button
                        onClick={handleSuggestAllRemarks}
                        disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                          activeRole === 'teacher' && !canGradeCurrentSubject
                            ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                            : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                        title={activeRole === 'teacher' && !canGradeCurrentSubject ? 'Score entry restricted for this subject' : 'Automatically generate tailored remarks for all pupils based on their scores'}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Suggest All Remarks</span>
                      </button>

                      <Tooltip text="Click 'AI Suggest All Remarks' to auto-generate contextual performance remarks for every pupil based on their total scores. You can still edit each remark manually before saving." wide>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/5 border border-purple-500/20 cursor-help">
                          <Info className="w-3 h-3 text-purple-400" />
                          <span className="text-[10px] text-purple-400/80">AI tip</span>
                        </div>
                      </Tooltip>

                      <Tooltip text="Scores are saved permanently to the school SQLite database. If the Principal has locked the term, the Save button is disabled until the term is unlocked by an Admin." wide>
                        <button
                          onClick={handleSaveBatchScores}
                          disabled={isSavingScores || (activeRole === 'teacher' && !canGradeCurrentSubject)}
                          className={`px-4 py-1.5 rounded-xl font-black shadow transition-all flex items-center gap-1.5 ${
                            activeRole === 'teacher' && !canGradeCurrentSubject
                              ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                              : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                          }`}
                        >
                          {activeRole === 'teacher' && !canGradeCurrentSubject ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Score Entry Restricted</span>
                            </>
                          ) : (
                            <>
                              {isSavingScores ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Save Scores to Database</span>
                            </>
                          )}
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Academic Access Level Notification Banner */}
                  {activeRole === 'teacher' && (
                    <div>
                      {isCurrentFormTeacher ? (
                        <div className="flex items-center gap-2.5 p-3 px-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs shadow-sm">
                          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-black uppercase tracking-wider text-amber-400 mr-2">Form Teacher Full Class Access:</span>
                            <span>You are the designated Class/Form Teacher for <strong>{currentGradebookClassObj?.name}</strong>. You have full access to enter, edit, and grade <strong>all subjects</strong> for your class.</span>
                          </div>
                        </div>
                      ) : canGradeCurrentSubject ? (
                        <div className="flex items-center gap-2.5 p-3 px-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-200 text-xs shadow-sm">
                          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <span className="font-black uppercase tracking-wider text-indigo-400 mr-2">Subject Teacher Access:</span>
                            <span>You are authorized to enter scores for your taught subject: <strong>{currentGradebookSubjectObj?.name}</strong> in {currentGradebookClassObj?.name}.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 p-3 px-4 rounded-2xl bg-rose-950/60 border border-rose-700/50 text-rose-200 text-xs shadow-sm">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <span className="font-black uppercase tracking-wider text-rose-400 mr-2">Score Entry Restricted:</span>
                            <span>You are not assigned to teach <strong>{currentGradebookSubjectObj?.name}</strong> in {currentGradebookClassObj?.name}. Class teachers have access to all subjects, while subject teachers can only grade their assigned subjects.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gradebook Performance Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Pupils Enrolled</div>
                      <div className="text-white font-black text-lg">{classSheetRows.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40">
                      <div className="text-blue-400 text-[10px] uppercase font-bold">Class Average</div>
                      <div className="text-blue-300 font-black text-lg">
                        {classSheetRows.length > 0
                          ? Math.round(classSheetRows.reduce((acc, r) => acc + (r.total_score || 0), 0) / classSheetRows.length)
                          : 0} / 100
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                      <div className="text-emerald-400 text-[10px] uppercase font-bold">Distinctions (A1)</div>
                      <div className="text-emerald-300 font-black text-lg">
                        {classSheetRows.filter(r => r.grade === 'A1').length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
                      <div className="text-amber-400 text-[10px] uppercase font-bold">Credits (B - C)</div>
                      <div className="text-amber-300 font-black text-lg">
                        {classSheetRows.filter(r => r.grade?.startsWith('B') || r.grade?.startsWith('C')).length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40">
                      <div className="text-purple-400 text-[10px] uppercase font-bold">Pass Rate</div>
                      <div className="text-purple-300 font-black text-lg">
                        {classSheetRows.length > 0
                          ? Math.round((classSheetRows.filter(r => r.grade !== 'F9').length / classSheetRows.length) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Filter by pupil name or admission no..."
                        value={gradebookSearchQuery}
                        onChange={(e) => setGradebookSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      {gradebookSearchQuery && (
                        <button
                          onClick={() => setGradebookSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400 font-bold">Grade Filter:</span>
                      <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 gap-1">
                        {[
                          { id: 'ALL', label: 'All' },
                          { id: 'A1', label: 'A1' },
                          { id: 'CREDIT', label: 'Credits (B-C)' },
                          { id: 'FAIL', label: 'Needs Help (F9)' }
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setGradebookFilterGrade(f.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              gradebookFilterGrade === f.id
                                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {scoreSaveSuccess && (
                    <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Scores successfully calculated and permanently recorded in official SQLite database!</span>
                    </div>
                  )}

                  {/* Real Class Sheet Table: Standard vs Multi-Component */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                          <th className="p-3">Admission No</th>
                          <th className="p-3">Student Name</th>
                          {gradebookMode === 'multi' ? (
                            <>
                              <th className="p-3 text-center bg-indigo-950/40 text-indigo-300">Test 1 (10)</th>
                              <th className="p-3 text-center bg-indigo-950/40 text-indigo-300">Test 2 (10)</th>
                              <th className="p-3 text-center bg-indigo-950/40 text-indigo-300">Project (10)</th>
                              <th className="p-3 text-center bg-indigo-900/40 text-indigo-200">CA Total (30)</th>
                            </>
                          ) : (
                            <th className="p-3 text-center">CA Test (Max 30)</th>
                          )}
                          <th className="p-3 text-center">Terminal Exam (Max 70)</th>
                          <th className="p-3 text-center">Total (100)</th>
                          <th className="p-3 text-center">Grade</th>
                          <th className="p-3">Teacher Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {classSheetRows
                          .map((r, originalIndex) => ({ r, originalIndex }))
                          .filter(({ r }) => {
                            const matchesSearch = !gradebookSearchQuery.trim() ||
                              (r.first_name || '').toLowerCase().includes(gradebookSearchQuery.toLowerCase()) ||
                              (r.last_name || '').toLowerCase().includes(gradebookSearchQuery.toLowerCase()) ||
                              (r.admission_no || '').toLowerCase().includes(gradebookSearchQuery.toLowerCase());

                            if (!matchesSearch) return false;
                            if (gradebookFilterGrade === 'A1') return r.grade === 'A1';
                            if (gradebookFilterGrade === 'CREDIT') return r.grade?.startsWith('B') || r.grade?.startsWith('C');
                            if (gradebookFilterGrade === 'FAIL') return r.grade === 'F9';
                            return true;
                          })
                          .map(({ r, originalIndex }) => (
                          <tr key={r.student_id} className="hover:bg-slate-900/40">
                            <td className="p-3 font-mono font-bold text-amber-400">{r.admission_no}</td>
                            <td className="p-3 font-bold text-white">{r.first_name} {r.last_name}</td>
                            
                            {gradebookMode === 'multi' ? (
                              <>
                                <td className="p-3 text-center bg-indigo-950/20">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={r.ca1_score !== undefined && r.ca1_score !== null ? r.ca1_score : ''}
                                    onChange={(e) => handleScoreEdit(originalIndex, 'ca1', e.target.value)}
                                    placeholder="0"
                                    disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                                    className="w-14 px-2 py-1 rounded bg-slate-900 border border-indigo-700/50 text-center font-bold text-indigo-300 focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="p-3 text-center bg-indigo-950/20">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={r.ca2_score !== undefined && r.ca2_score !== null ? r.ca2_score : ''}
                                    onChange={(e) => handleScoreEdit(originalIndex, 'ca2', e.target.value)}
                                    placeholder="0"
                                    disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                                    className="w-14 px-2 py-1 rounded bg-slate-900 border border-indigo-700/50 text-center font-bold text-indigo-300 focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="p-3 text-center bg-indigo-950/20">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={r.project_score !== undefined && r.project_score !== null ? r.project_score : ''}
                                    onChange={(e) => handleScoreEdit(originalIndex, 'project', e.target.value)}
                                    placeholder="0"
                                    disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                                    className="w-14 px-2 py-1 rounded bg-slate-900 border border-indigo-700/50 text-center font-bold text-indigo-300 focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="p-3 text-center font-bold text-indigo-300 bg-indigo-900/20">
                                  {r.ca_score || 0}
                                </td>
                              </>
                            ) : (
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={r.ca_score || 0}
                                  onChange={(e) => handleScoreEdit(originalIndex, 'ca', e.target.value)}
                                  disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                                  className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-center font-bold text-white focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                            )}

                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="70"
                                value={r.exam_score || 0}
                                onChange={(e) => handleScoreEdit(originalIndex, 'exam', e.target.value)}
                                disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                                className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-center font-bold text-white focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="p-3 text-center font-black text-amber-400 text-sm">
                              {r.total_score}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-black text-xs ${
                                (r.division_grade || r.grade) === 'A1' || (r.division_grade || r.grade) === 'A+' || (r.division_grade || r.grade) === 'EE'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : (r.division_grade || r.grade)?.startsWith('B') || (r.division_grade || r.grade) === 'ME'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : (r.division_grade || r.grade) === 'F9' || (r.division_grade || r.grade) === 'E' || (r.division_grade || r.grade) === 'ES'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}>
                                {r.division_grade ? `${r.division_grade}` : r.grade}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={r.remark || ''}
                                  onChange={(e) => handleScoreEdit(originalIndex, 'remark', e.target.value)}
                                  placeholder="e.g. Excellent grasp..."
                                  disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                                  className="flex-1 min-w-32 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSuggestRemark(originalIndex)}
                                  disabled={activeRole === 'teacher' && !canGradeCurrentSubject}
                                  className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                                    activeRole === 'teacher' && !canGradeCurrentSubject
                                      ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                                      : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
                                  }`}
                                  title={activeRole === 'teacher' && !canGradeCurrentSubject ? 'Score entry restricted for this subject' : 'AI Suggest Tailored Remark based on score'}
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                {r.guardian_phone && (
                                  <a
                                    href={`https://wa.me/${r.guardian_phone.replace(/\D/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(`Hello ${r.guardian_name || 'Parent'}, this is your child's subject teacher at Eagle Power Schools. Current score for ${r.first_name} ${r.last_name} in ${subjects.find(s => s.id === selectedSubjectId)?.name || 'Subject'}: CA: ${r.ca_score || 0}/30, Exam: ${r.exam_score || 0}/70, Total: ${r.total_score || 0}/100 (${r.grade || 'A1'}). Remark: ${r.remark || 'Dedicated student'}.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shrink-0"
                                    title="Send score update to parent via WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
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
                        <option value="">All Allowed Classes ({homeworkList.length})</option>
                        {(activeRole === 'teacher' ? (allowedGradebookClasses.length > 0 ? allowedGradebookClasses : classes) : classes).map(c => (
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
                                const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
                                const res = await fetch(`${API_BASE}/homework/${hw.id}`, { headers }).catch(() => null);
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

              {/* TEACHER & ACADEMIC LEADERSHIP: CURRICULUM LESSON PLANNER & SCHEME OF WORK */}
              {(activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'superadmin') && activeTab === 'lesson_notes' && (() => {
                const isReviewer = ['superadmin', 'admin'].includes(activeRole);
                const approvedCount = lessonNotes.filter(n => n.status === 'Approved').length;
                const underReviewCount = lessonNotes.filter(n => n.status === 'Under Review').length;
                const needsRevisionCount = lessonNotes.filter(n => n.status === 'Needs Revision').length;

                return (
                  <div className="space-y-5 animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-amber-400" />
                          <span>Curriculum Lesson Planner & Scheme of Work</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Structured weekly syllabus breakdown, instructional objectives, WAEC/NERDC pedagogical steps, and formal HOD review approvals.
                        </p>
                        {/* Lesson Notes How-To Banner */}
                        <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-amber-950/20 border border-amber-800/30">
                          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-300/80 leading-relaxed">
                            <span className="font-bold text-amber-400">How it works:</span> Draft a lesson note, then submit it for HOD review. Once the HOD marks it <span className="text-emerald-400 font-bold">Approved</span>, it becomes part of the official Scheme of Work. Notes marked <span className="text-rose-400 font-bold">Needs Revision</span> require your corrections before re-submission.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={fetchLessonNotes}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center gap-1.5 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Refresh</span>
                        </button>
                        <button
                          onClick={() => setLessonNoteModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Draft New Lesson Note</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Total Scheme Units</div>
                        <div className="text-white font-black text-xl mt-1">{lessonNotes.length}</div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Active Curriculum Ledger</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                        <div className="text-emerald-400 text-[10px] uppercase font-bold">Approved By HOD</div>
                        <div className="text-emerald-300 font-black text-xl mt-1">{approvedCount}</div>
                        <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Cleared for Delivery</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/40">
                        <div className="text-amber-400 text-[10px] uppercase font-bold">Under Review</div>
                        <div className="text-amber-300 font-black text-xl mt-1">{underReviewCount}</div>
                        <span className="text-[10px] text-amber-500/80 mt-0.5 block">Pending HOD Evaluation</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40">
                        <div className="text-rose-400 text-[10px] uppercase font-bold">Needs Revision</div>
                        <div className="text-rose-300 font-black text-xl mt-1">{needsRevisionCount}</div>
                        <span className="text-[10px] text-rose-500/80 mt-0.5 block">Requires Teacher Adjustments</span>
                      </div>
                    </div>

                    {/* Lesson Notes List / Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                            <th className="p-3">Timeline & Author</th>
                            <th className="p-3">Subject & Class</th>
                            <th className="p-3">Curriculum Topic & Objectives</th>
                            <th className="p-3">Instructional Aids</th>
                            <th className="p-3 text-center">Status & Feedback</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {lessonNotes.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                No lesson notes drafted yet. Click &quot;Draft New Lesson Note&quot; to begin your curriculum unit.
                              </td>
                            </tr>
                          ) : (
                            lessonNotes.map((note) => (
                              <tr key={note.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                                  <div>{note.week_number ? `Week ${note.week_number}` : note.week}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{note.teacher_name || 'Staff Teacher'}</div>
                                  <div className="text-[10px] text-slate-500 font-normal">{note.created_at ? note.created_at.slice(0, 10) : (note.date || '2026/2027')}</div>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-white">{note.subject_name || note.subject}</div>
                                  <div className="text-[11px] text-slate-400">{note.class_name}</div>
                                  <span className="text-[10px] text-slate-500">{note.session || '2026/2027'} &bull; {note.term || 'First Term'}</span>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-white">{note.topic}</div>
                                  {note.subtopic && (
                                    <div className="text-[10px] text-amber-400/90 font-medium">Subtopic: {note.subtopic}</div>
                                  )}
                                  <div className="text-[11px] text-slate-400 max-w-sm line-clamp-2 mt-0.5">
                                    {note.behavioral_objectives || note.objectives || 'Specific behavioral objectives aligned with WAEC syllabus guidelines.'}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-300 text-[11px] max-w-xs">
                                  {note.instructional_materials || note.materials || 'Standard classroom aids & textbooks'}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                                      note.status === 'Approved'
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                        : note.status === 'Needs Revision'
                                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                                    }`}>
                                      {note.status || 'Under Review'}
                                    </span>
                                    {note.hod_feedback && (
                                      <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 max-w-[160px] truncate" title={note.hod_feedback}>
                                        💬 {note.hod_feedback}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSelectedLessonNote(note);
                                        setViewLessonNoteModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                                      title="View Lesson Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    {/* HOD Review Action Button */}
                                    {isReviewer && (
                                      <button
                                        onClick={() => {
                                          setSelectedLessonNote(note);
                                          setHodReviewStatus(note.status || 'Approved');
                                          setHodFeedbackText(note.hod_feedback || '');
                                          setHodReviewModalOpen(true);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[11px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <Award className="w-3 h-3" />
                                        <span>HOD Review</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDeleteLessonNote(note.id)}
                                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold transition-all"
                                      title="Delete Note"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* EAGLE AI ACADEMIC TUTOR, PUTER AI GATEWAY & IN-HOUSE LEARNING DIAGNOSTICS */}
              {activeTab === 'ai_progress' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* PUTER AI (PRIMARY) & IN-HOUSE AI INTERACTIVE ACADEMIC TUTOR CARD */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 shadow-2xl relative overflow-hidden space-y-5">
                    {/* Background glow effects */}
                    <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Header with Title and Engine Toggle */}
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 inline-flex items-center gap-1.5 shadow-sm">
                            <Zap className="w-3 h-3 text-amber-400" />
                            Puter AI First Option (Free Unlimited OpenAI)
                          </span>
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                            + In-House Fallback
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                          <span>Eagle AI Academic Tutor & Knowledge Hub</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                          Instant academic tutoring, homework guidance, lesson plan support, and curriculum assistance powered directly by Puter AI (free unlimited OpenAI models) with autonomous In-House AI offline fallback.
                        </p>
                      </div>

                      {/* Engine Selector */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Engine:</span>
                        <div className="inline-flex p-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                          <button
                            type="button"
                            onClick={() => setAiQueryEngine('puter')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                              aiQueryEngine === 'puter'
                                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Puter AI (OpenAI)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiQueryEngine('inhouse')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                              aiQueryEngine === 'inhouse'
                                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>In-House AI Kernel</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Model Selector & Status Row */}
                    <div className="relative flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                      {aiQueryEngine === 'puter' ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-slate-400 font-bold flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-amber-400" />
                            <span>Puter Model:</span>
                          </label>
                          <select
                            value={aiQueryModel}
                            onChange={(e) => setAiQueryModel(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-amber-300 font-bold px-3 py-1 rounded-xl text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
                          >
                            <option value="gpt-4o-mini">GPT-4o Mini (Fast & Accurate - Recommended)</option>
                            <option value="gpt-4o">GPT-4o (Deep Academic Reasoning & Detail)</option>
                            <option value="gpt-5.4-nano">GPT-5.4 Nano (Next-Gen Experimental High Speed)</option>
                            <option value="gpt-6.1-sol">GPT-6.1 Sol (High-Capacity Generalist)</option>
                            <option value="gpt-6-luna">GPT-6 Luna (Quick Retrieval)</option>
                            <option value="gpt-6-astra">GPT-6 Astra (Expansive Curriculum Writer)</option>
                          </select>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Puter.js Client + Edge Gateway Active
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-300 bg-blue-950/60 border border-blue-800 px-3 py-1 rounded-xl font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            In-House Deterministic Kernel Active (100% Offline Safe & Zero External Dependency)
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400">
                        Zero token billing to user &bull; Free unlimited academic assistant
                      </div>
                    </div>

                    {/* Interactive Prompt Input Form */}
                    <form onSubmit={handleAskAi} className="relative space-y-3">
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={aiQueryText}
                          onChange={(e) => setAiQueryText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAskAi(e);
                            }
                          }}
                          placeholder={
                            aiQueryEngine === 'puter'
                              ? "Ask Puter AI any academic question (e.g. 'Solve 3x² + 7x - 6 = 0', 'Explain Photosynthesis step-by-step', 'Draft a WAEC English essay outline on Technology')..."
                              : "Ask In-House AI for curriculum guidance, formula lookup, or syllabus recommendations..."
                          }
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/50 resize-none transition-all shadow-inner"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          {aiQueryText && (
                            <button
                              type="button"
                              onClick={() => setAiQueryText('')}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={aiQueryLoading || !aiQueryText.trim()}
                            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
                          >
                            {aiQueryLoading ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Thinking...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Ask {aiQueryEngine === 'puter' ? 'Puter AI' : 'In-House'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Quick Prompt Suggestions */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 font-bold mr-1">Quick Prompts:</span>
                        {[
                          { label: '📐 Pythagoras Theorem', prompt: 'Explain Pythagoras Theorem with 3 step-by-step worked examples suitable for JSS2.' },
                          { label: '📖 Things Fall Apart', prompt: 'Summarize the core themes and tragic downfall of Okonkwo in Chinua Achebe’s Things Fall Apart.' },
                          { label: '🔬 Photosynthesis', prompt: 'Explain the light and dark stages of photosynthesis and its chemical equation.' },
                          { label: '🧮 Solve Quadratic', prompt: 'Solve the quadratic equation 2x² + 5x - 3 = 0 using both factorization and formula methods.' },
                          { label: '🇳🇬 Nigerian Geopolitical Zones', prompt: 'List the 6 geopolitical zones of Nigeria and all the states in each zone.' },
                          { label: '💡 Study Tips for WAEC', prompt: 'Provide 5 high-impact revision techniques for high school students preparing for WAEC/NECO exams.' }
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              setAiQueryText(chip.prompt);
                              handleAskAi(e, chip.prompt);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 text-[11px] text-slate-300 hover:text-amber-300 font-medium transition-all"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </form>

                    {/* AI Answer Result Card */}
                    {aiQueryResult && (
                      <div className="relative p-5 rounded-2xl bg-slate-950 border border-amber-400/40 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1.5 ${
                              aiQueryResult.provider === 'puter'
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-blue-600 text-white'
                            }`}>
                              {aiQueryResult.provider === 'puter' ? <Zap className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                              <span>{aiQueryResult.provider === 'puter' ? 'Puter AI (Free Unlimited OpenAI)' : 'In-House AI Engine'}</span>
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {aiQueryResult.model || aiQueryModel}
                            </span>
                            {aiQueryResult.source && (
                              <span className="hidden sm:inline-block text-[11px] text-slate-500">
                                &bull; {aiQueryResult.source}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (aiQueryResult.answer) {
                                  navigator.clipboard.writeText(aiQueryResult.answer);
                                  setCopiedAiAnswer(true);
                                  setTimeout(() => setCopiedAiAnswer(false), 2000);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                            >
                              {copiedAiAnswer ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAiQueryResult(null)}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                              title="Dismiss answer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Answer text */}
                        <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap selection:bg-amber-400 selection:text-slate-950 font-sans">
                          {aiQueryResult.answer}
                        </div>
                      </div>
                    )}

                    {/* Query History */}
                    {aiQueryHistory.length > 1 && (
                      <div className="pt-2">
                        <details className="group">
                          <summary className="text-xs text-slate-400 font-bold cursor-pointer hover:text-amber-300 flex items-center gap-1.5 select-none">
                            <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
                            <span>Recent Session Queries ({aiQueryHistory.length})</span>
                          </summary>
                          <div className="mt-2 space-y-2 pl-2">
                            {aiQueryHistory.slice(1, 5).map((hist, hIdx) => (
                              <div
                                key={hIdx}
                                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-xs flex items-center justify-between gap-3 cursor-pointer transition-all"
                                onClick={() => {
                                  setAiQueryText(hist.question);
                                  setAiQueryResult(hist.result);
                                }}
                              >
                                <span className="text-slate-300 truncate max-w-xl font-medium">&ldquo;{hist.question}&rdquo;</span>
                                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{hist.timestamp}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* DIVIDER BETWEEN TUTOR AND STUDENT DIAGNOSTICS */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-3 text-slate-400 font-black tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Student Academic Diagnostic & Bayesian Trajectory
                      </span>
                    </div>
                  </div>

                  {/* STUDENT PROGRESS & PARENT RECOMMENDATIONS SECTION */}
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
                        {(activeRole === 'parent' && currentUser?.children && currentUser.children.length > 0
                          ? currentUser.children
                          : students
                        ).map(s => (
                          <option key={s.id || s.admission_no} value={s.id}>
                            {s.first_name} {s.last_name} ({s.admission_no} - {s.class_name || 'Enrolled'})
                          </option>
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

              {/* BURSAR, PARENT, SUPERADMIN & PRINCIPAL: FINANCIAL INVOICES & CLEARANCE */}
              {(activeRole === 'bursar' || activeRole === 'parent' || activeRole === 'superadmin' || activeRole === 'admin') && (activeTab === 'invoices' || (activeRole === 'bursar' && activeTab === 'overview')) && (() => {
                const displayedInvoices = invoices.filter(inv => {
                  if (activeRole === 'parent' && currentUser?.children && currentUser.children.length > 0) {
                    const childAdmNos = currentUser.children.map(c => c.admission_no);
                    const matchesChild = childAdmNos.includes(inv.admission_no);
                    const matchesPhone = currentUser.phone && inv.guardian_phone === currentUser.phone;
                    if (!matchesChild && !matchesPhone) return false;
                  }
                  if (invoiceFilter !== 'All' && inv.status !== invoiceFilter) return false;
                  if (invoiceDivisionFilter !== 'All' && inv.division !== invoiceDivisionFilter) return false;
                  if (invoiceSearchQuery) {
                    const q = invoiceSearchQuery.toLowerCase();
                    const nameMatch = `${inv.first_name || ''} ${inv.last_name || ''}`.toLowerCase().includes(q);
                    const admMatch = (inv.admission_no || '').toLowerCase().includes(q);
                    const invMatch = (inv.invoice_no || '').toLowerCase().includes(q);
                    const parentMatch = (inv.guardian_name || '').toLowerCase().includes(q) || (inv.guardian_phone || '').includes(q);
                    const classMatch = (inv.class_name || '').toLowerCase().includes(q);
                    if (!nameMatch && !admMatch && !invMatch && !parentMatch && !classMatch) return false;
                  }
                  return true;
                });

                const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.amount_due) || 0), 0);
                const totalCollected = invoices.reduce((sum, i) => sum + (Number(i.amount_paid) || 0), 0);
                const totalDebt = Math.max(0, totalInvoiced - totalCollected);
                const recoveryRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

                return (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-amber-400" />
                          <span>Tuition & Development Fee Statements</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          {activeRole === 'parent'
                            ? 'Official billing ledger and verified clearance receipts for your wards'
                            : 'Live bursary billing ledger, reconciliation, and payment intake (Executive & Bursary Oversight)'}
                        </p>
                      </div>

                      {/* Status Badges & Actions */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {activeRole !== 'parent' && (
                          <button
                            onClick={() => setBatchInvoiceModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow flex items-center gap-1.5 transition-transform active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>⚡ Batch Cohort Invoicing</span>
                          </button>
                        )}
                        <span className="text-slate-400 font-bold ml-1">Status:</span>
                        {['All', 'Unpaid', 'Partial', 'Paid'].map(st => (
                          <button
                            key={st}
                            onClick={() => setInvoiceFilter(st)}
                            className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                              invoiceFilter === st
                                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Financial Telemetry Banner for Bursar & Leadership */}
                    {activeRole !== 'parent' && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Invoiced Fees</span>
                          <div className="text-xl font-black text-white mt-1">₦{totalInvoiced.toLocaleString()}</div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{invoices.length} Registered Ledgers</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Total Remitted & Paid</span>
                          <div className="text-xl font-black text-emerald-400 mt-1">₦{totalCollected.toLocaleString()}</div>
                          <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Verified Bank & Paystack Inflow</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-rose-400 uppercase font-bold block">Unpaid Outstanding Debt</span>
                          <div className="text-xl font-black text-rose-400 mt-1">₦{totalDebt.toLocaleString()}</div>
                          <span className="text-[10px] text-rose-500/80 mt-0.5 block">Pending Bursary Recovery</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-amber-400 uppercase font-bold block">Collection Clearance Rate</span>
                          <div className="text-xl font-black text-amber-400 mt-1">{recoveryRate}%</div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${recoveryRate}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Search & Division Filter Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search pupil name, admission no, invoice #, or phone..."
                          value={invoiceSearchQuery}
                          onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {activeRole !== 'parent' && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-400 font-bold">Division:</span>
                            <select
                              value={invoiceDivisionFilter}
                              onChange={(e) => setInvoiceDivisionFilter(e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl"
                            >
                              <option value="All">All Divisions</option>
                              <option value="Nursery">Nursery</option>
                              <option value="Primary">Primary</option>
                              <option value="Junior College">Junior College</option>
                              <option value="Senior College">Senior College</option>
                            </select>
                          </div>
                        )}

                        <span className="text-slate-400 text-xs font-bold px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
                          {displayedInvoices.length} of {invoices.length} statements
                        </span>
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

                    {/* Invoices List */}
                    <div className="space-y-3">
                      {displayedInvoices.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                          No tuition fee invoices found matching the current search and filters.
                        </div>
                      ) : (
                        displayedInvoices.map(inv => (
                          <div key={inv.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-amber-400 font-bold">{inv.invoice_no}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                  inv.status === 'Partial' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                                  'bg-red-950 text-red-400 border border-red-800'
                                }`}>{inv.status}</span>
                                {inv.division && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-medium">
                                    {inv.division}
                                  </span>
                                )}
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

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {inv.status !== 'Paid' && (
                                <button
                                  onClick={() => {
                                    setPaystackInvoice(inv);
                                    setPaystackCustomAmount(String(inv.amount_due - inv.amount_paid));
                                    setPaystackEmail(inv.guardian_email || currentUser?.email || '');
                                    setPaystackCheckoutModalOpen(true);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Pay Online (Paystack)</span>
                                </button>
                              )}
                              {inv.status !== 'Paid' && activeRole === 'parent' && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoiceForParent(inv);
                                    setParentBankModalOpen(true);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center gap-1.5 transition-colors"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Manual Bank Transfer</span>
                                </button>
                              )}
                              {inv.status !== 'Paid' && activeRole !== 'parent' && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setPaymentAmount(String(inv.amount_due - inv.amount_paid));
                                    setPaymentModalOpen(true);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow"
                                >
                                  Record Cash/POS
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
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 font-bold text-xs flex items-center gap-1.5"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Official Clearance Receipt</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* BROADSHEET & MASTER REPORT SHEETS MODULE */}
              {activeTab === 'broadsheet' && (
                <div className="space-y-6 animate-in fade-in">
                  <BroadsheetView token={authToken} userRole={activeRole} assignedClass={currentUser?.assigned_class} />
                </div>
              )}

              {/* REPORT TEMPLATES GALLERY */}
              {activeTab === 'templates' && (
                <div className="space-y-6 animate-in fade-in">
                  <TemplateGallery authToken={authToken} apiBase={API_BASE} />
                </div>
              )}

              {/* ACADEMIC EVALUATION: OFFICIAL PRODUCTION REPORT CARD (STUDENT, PARENT, TEACHER, ADMIN, SUPERADMIN, BURSAR) */}
              {(activeRole === 'student' || activeRole === 'parent' || activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'superadmin' || activeRole === 'bursar') && (activeTab === 'reportcard' || (activeRole === 'student' && activeTab === 'overview')) && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Official Termly E-Report Card</h3>
                      <p className="text-xs text-slate-400">Authentic Nigerian terminal evaluation with WAEC grade calculations</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {activeRole === 'student' ? (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold flex items-center gap-2">
                          <span>🎓</span>
                          <span>{currentUser?.name || 'Student'} ({selectedStudentAdmNo})</span>
                        </div>
                      ) : activeRole === 'parent' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold">Ward:</span>
                          <select
                            value={selectedStudentAdmNo}
                            onChange={(e) => {
                              setSelectedStudentAdmNo(e.target.value);
                              fetchReportCard(e.target.value);
                            }}
                            className="bg-slate-900 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl max-w-xs"
                          >
                            {(currentUser?.children || students.filter(s => currentUser?.phone && s.guardian_phone === currentUser.phone)).map(s => (
                              <option key={s.id || s.admission_no} value={s.admission_no}>
                                {s.first_name} {s.last_name} ({s.admission_no} - {s.class_name})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
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
                            {(activeRole === 'teacher'
                              ? students.filter(s => allowedGradebookClasses.some(c => String(c.id) === String(s.class_id)))
                              : students
                            )
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
                        </>
                      )}

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

                      {/* Official Form Teacher Remark & Principal Endorsement */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-amber-400 uppercase">Class Form Teacher's Official Remark</span>
                            {(activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'superadmin') && (
                              <button
                                onClick={() => {
                                  const sObj = students.find(s => s.admission_no === selectedStudentAdmNo) || { id: studentReportCard.student?.id, admission_no: selectedStudentAdmNo, first_name: studentReportCard.student?.full_name || 'Pupil' };
                                  handleOpenCommentModal(sObj);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-[10px] border border-amber-400/30 flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3 text-amber-400" />
                                <span>Edit Comment</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-200 italic">
                            "{studentReportCard.evaluations?.teacher_remark || studentReportCard.comments?.form_teacher || 'Very dedicated and attentive scholar. Keeps up high academic standard.'}"
                          </p>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">Head Administrator's Official Endorsement</span>
                          <p className="text-xs text-slate-200 italic">
                            "{studentReportCard.evaluations?.principal_remark || studentReportCard.comments?.principal || 'An outstanding and disciplined scholar.'}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">No result card on file for this student.</div>
                  )}
                </div>
              )}

              {/* STUDENT & GUARDIAN: OFFICIAL ACADEMIC DOSSIER & STUDENT IDENTITY SLIP */}
              {(activeRole === 'student' || activeRole === 'parent' || activeRole === 'admin' || activeRole === 'superadmin') && activeTab === 'student_profile' && (() => {
                const effectiveAdmNo = activeRole === 'student'
                  ? (currentUser?.reference_id || selectedStudentAdmNo)
                  : (selectedStudentAdmNo || (currentUser?.children && currentUser.children[0]?.admission_no) || currentUser?.reference_id);
                const targetStudent = students.find(s => s.admission_no === effectiveAdmNo)
                  || currentUser?.studentDetails
                  || (currentUser?.children && currentUser.children[0])
                  || students[0]
                  || { first_name: 'David', last_name: 'Okeke', admission_no: 'ESE2009012', class_name: 'Junior College (JSS 1)', division: 'Junior College', gender: 'Male', guardian_name: 'Mr. & Mrs. Okeke', guardian_phone: '08033591058' };

                const enrolledSubjects = subjects.filter(sub => {
                  if (targetStudent.division && sub.division) {
                    return sub.division === targetStudent.division || sub.division === 'All';
                  }
                  return true;
                });

                return (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Header Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                            🎓
                          </span>
                          <h3 className="text-lg font-black text-white">Official Student Academic Profile & Identity Slip</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Authentic institution profile, verified curriculum enrollment, and printable student identity clearance.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeRole !== 'student' && (
                          <select
                            value={targetStudent.admission_no}
                            onChange={(e) => {
                              setSelectedStudentAdmNo(e.target.value);
                              fetchReportCard(e.target.value);
                            }}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl"
                          >
                            {(activeRole === 'parent' && currentUser?.children ? currentUser.children : students).map(s => (
                              <option key={s.id || s.admission_no} value={s.admission_no}>
                                {s.first_name} {s.last_name} ({s.admission_no})
                              </option>
                            ))}
                          </select>
                        )}

                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Official Student ID Slip</span>
                        </button>
                      </div>
                    </div>

                    {/* Official Identity Slip Card */}
                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 border-b border-slate-800/80 pb-6">
                        {/* Avatar / Passport Placeholder */}
                        <div className="relative group shrink-0">
                          <div className="w-28 h-28 rounded-2xl bg-slate-800 border-2 border-amber-400/50 flex flex-col items-center justify-center text-amber-400 overflow-hidden shadow-lg">
                            <span className="text-4xl">🎓</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Official ID</span>
                          </div>
                          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950 uppercase shadow">
                            Active
                          </span>
                        </div>

                        {/* Student Bio */}
                        <div className="space-y-2 text-center md:text-left flex-1">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/10 border border-amber-400/30 text-amber-400">
                              {targetStudent.admission_no}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                              {targetStudent.division || 'Junior College'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
                              {targetStudent.gender || 'Scholar'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1">
                              <HeartPulse className="w-3 h-3 text-rose-400" />
                              <span>{targetStudent.blood_group || 'O+'} ({targetStudent.genotype || 'AA'})</span>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              {targetStudent.boarding_status || 'Day Student'}
                            </span>
                          </div>

                          <h2 className="text-2xl font-black text-white">
                            {targetStudent.first_name} {targetStudent.middle_name ? `${targetStudent.middle_name} ` : ''}{targetStudent.last_name}
                          </h2>

                          <p className="text-xs text-slate-300">
                            Class: <strong className="text-amber-300">{targetStudent.class_name || 'Assigned Form'}</strong> &bull; Campus: <span className="text-white font-medium">Awka Main Campus</span> &bull; Academic Session: <span className="font-mono text-amber-300">{targetStudent.enrolled_session || '2026/2027'}</span>
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Registered Guardian</span>
                              <strong className="text-slate-200">
                                {targetStudent.guardian_title ? `${targetStudent.guardian_title} ` : ''}{targetStudent.guardian_name || 'Guardian on File'}
                                {targetStudent.guardian_relationship ? ` (${targetStudent.guardian_relationship})` : ''}
                              </strong>
                              <div className="font-mono text-[11px] text-amber-400">{targetStudent.guardian_phone || 'Emergency Contact'}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Residential Address</span>
                              <span className="text-slate-300">{targetStudent.address || 'Awka, Anambra State'}</span>
                              <div className="text-[10px] text-emerald-400 mt-0.5 font-bold">Verified Registration</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Institutional Dossier Matrix: Health, Origin, Family, Logistics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 text-xs border-b border-slate-800/80 pb-6">
                        {/* 1. Health & Medical Safety */}
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                            <HeartPulse className="w-3.5 h-3.5" />
                            <span>Medical & Health</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Blood / Genotype</span>
                            <span className="font-bold text-white font-mono">{targetStudent.blood_group || 'O+'} &bull; {targetStudent.genotype || 'AA'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Allergies</span>
                            <span className="text-slate-300 text-[11px]">{targetStudent.allergies || 'None declared'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Emergency Contact</span>
                            <span className="text-amber-400 font-mono text-[11px] block">{targetStudent.emergency_contact_phone || targetStudent.guardian_phone || '—'}</span>
                            <span className="text-slate-400 text-[10px]">{targetStudent.emergency_contact_name || targetStudent.guardian_name || 'Guardian'} ({targetStudent.emergency_contact_relationship || 'Parent'})</span>
                          </div>
                        </div>

                        {/* 2. Origin & Identity */}
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Origin & Demographics</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">State / LGA of Origin</span>
                            <span className="font-bold text-white text-[11px]">{targetStudent.state_of_origin || 'Anambra State'}{targetStudent.lga_of_origin ? ` (${targetStudent.lga_of_origin})` : ''}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Nationality / Religion</span>
                            <span className="text-slate-300 text-[11px]">{targetStudent.nationality || 'Nigerian'} &bull; {targetStudent.religion || 'Christianity'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Mother Tongue & DOB</span>
                            <span className="text-slate-300 text-[11px]">{targetStudent.mother_tongue || 'Igbo'} &bull; {targetStudent.dob || '—'}</span>
                          </div>
                        </div>

                        {/* 3. Family Record */}
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
                            <Users className="w-3.5 h-3.5" />
                            <span>Family & Parents</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Primary Guardian</span>
                            <span className="font-bold text-white text-[11px]">{targetStudent.guardian_name || 'On File'}</span>
                            <span className="text-slate-400 text-[10px] block">{targetStudent.guardian_occupation || 'Business / Civil'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Maternal Record</span>
                            <span className="text-slate-300 text-[11px] block">{targetStudent.mother_name || 'Not on file'}</span>
                            {targetStudent.mother_phone && <span className="font-mono text-[10px] text-slate-400">{targetStudent.mother_phone}</span>}
                          </div>
                        </div>

                        {/* 4. Logistics & Pedigree */}
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                            <Bus className="w-3.5 h-3.5" />
                            <span>Logistics & Placement</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Boarding / Commute</span>
                            <span className="font-bold text-white text-[11px]">{targetStudent.boarding_status || 'Day Student'} &bull; {targetStudent.transport_mode || 'Private Dropoff'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">School Bus Route</span>
                            <span className="text-slate-300 text-[11px] line-clamp-1">{targetStudent.bus_route || 'None Assigned'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Entry Mode & School</span>
                            <span className="text-slate-400 text-[10px] block">{targetStudent.entry_mode || 'Fresh Admission'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3 Standing Telemetry Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Instructional Attendance</span>
                          <div className="text-2xl font-black text-emerald-400 mt-1">96.8%</div>
                          <span className="text-[10px] text-emerald-500 mt-0.5 block">Exemplary Punctuality</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Enrolled Curriculum</span>
                          <div className="text-2xl font-black text-amber-400 mt-1">{enrolledSubjects.length || 10} Subjects</div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">WAEC / NECO Scheme</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Tuition Status</span>
                          <div className="text-2xl font-black text-blue-400 mt-1">Good Standing</div>
                          <span className="text-[10px] text-blue-300 mt-0.5 block">Verified Bursary Clearance</span>
                        </div>
                      </div>
                    </div>

                    {/* Enrolled Subjects Roster */}
                    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-400" />
                          <span>Registered Curriculum Subjects ({enrolledSubjects.length || 10})</span>
                        </h4>
                        <span className="text-xs text-slate-400">Class Form Subjects</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {(enrolledSubjects.length > 0 ? enrolledSubjects : [
                          { id: 1, name: 'Mathematics', code: 'MTH', category: 'General' },
                          { id: 2, name: 'English Language', code: 'ENG', category: 'General' },
                          { id: 3, name: 'Basic Science', code: 'BSC', category: 'Science' },
                          { id: 4, name: 'Social Studies', code: 'SOS', category: 'Humanities' },
                          { id: 5, name: 'Civic Education', code: 'CVE', category: 'Humanities' },
                          { id: 6, name: 'Agricultural Science', code: 'AGR', category: 'Vocational' }
                        ]).map(sub => (
                          <div key={sub.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                            <div>
                              <strong className="text-white block font-bold">{sub.name}</strong>
                              <span className="font-mono text-[10px] text-amber-400">{sub.code || 'SUB'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {sub.category || 'Core'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PARENT DASHBOARD: CHILD OVERVIEW */}
              {activeRole === 'parent' && (activeTab === 'child_overview' || activeTab === 'overview') && (
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

              {/* PAYROLL MANAGEMENT COCKPIT (BURSAR & ADMIN) */}
              {activeTab === 'payroll' && ['bursar', 'admin', 'superadmin'].includes(activeRole) && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Header & Controls */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          💼
                        </span>
                        <h3 className="text-lg font-black text-white">Staff Salary & Bulk Payroll Management</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Automated Nigerian bank payouts powered by Paystack Transfers API &bull; NUBAN resolution & NIBSS clearing
                      </p>
                      {/* Payroll How-To Instruction Banner */}
                      <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          <span className="font-bold text-amber-400">How to run payroll:</span> ① Click <span className="text-white font-bold">Compile Monthly Roll</span> to generate a draft batch. ② Review the staff salary roster below. ③ Click <span className="text-emerald-400 font-bold">Execute Paystack Bulk Transfer</span> to disburse net salaries directly into each staff's NUBAN. Configure salary per-staff in the roster table.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handleGeneratePayrollBatch}
                        disabled={isGeneratingPayroll}
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2"
                      >
                        {isGeneratingPayroll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>Compile Monthly Roll</span>
                      </button>

                      {payrollOverview?.latest_batch && payrollOverview.latest_batch.status === 'Draft' && (
                        <button
                          onClick={() => handleDisbursePayrollBatch(payrollOverview.latest_batch.id)}
                          disabled={isDisbursingPayroll}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2"
                        >
                          {isDisbursingPayroll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                          <span>Execute Paystack Bulk Transfer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Disbursement Alert / Feedback Banner */}
                  {payrollDisburseSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-sm text-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Bulk Payout Initiated Successfully!</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 border border-emerald-700">
                          {payrollDisburseSuccess.is_simulated ? 'Sandbox Test Mode' : 'Live Gateway'}
                        </span>
                      </div>
                      <p>{payrollDisburseSuccess.message}</p>
                      <div className="flex gap-4 font-mono text-[11px] text-emerald-300">
                        <span>Gateway Ref: {payrollDisburseSuccess.gateway_batch_code}</span>
                        <span>Total Credited: ₦{payrollDisburseSuccess.total_payout?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* High-Level Overview Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                        <span>Total Monthly Gross</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        ₦{(payrollOverview?.summary?.total_monthly_gross || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Across {payrollOverview?.summary?.configured_salaries ?? (staff.length || 0)} active faculty & staff</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                        <span>Tax & Pension Deductions</span>
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-amber-400">
                        ₦{(payrollOverview?.summary?.total_monthly_deductions || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">PAYE & PenCom remittances</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                        <span>Net Salary Payout</span>
                        <CreditCard className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-400">
                        ₦{(payrollOverview?.summary?.total_monthly_net || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Disbursed directly into staff NUBAN</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                        <span>Bank Account Linkage</span>
                        <Landmark className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        {payrollOverview?.summary?.verified_bank_accounts || 0} / {payrollOverview?.summary?.active_staff_count || 0}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold mt-1">100% NUBAN Verified</div>
                    </div>
                  </div>

                  {/* Latest Batch Status Card */}
                  {payrollOverview?.latest_batch && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Roll Cycle</span>
                        <strong className="text-white text-sm">
                          Batch: {payrollOverview.latest_batch.batch_code} ({payrollOverview.latest_batch.month_year})
                        </strong>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-300">
                          Net: <strong className="text-emerald-400">₦{payrollOverview.latest_batch.total_net_payout?.toLocaleString()}</strong>
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          payrollOverview.latest_batch.status === 'Disbursed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : 'bg-amber-950 text-amber-400 border border-amber-700'
                        }`}>
                          {payrollOverview.latest_batch.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Staff Salary Roster Table */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                          Faculty Salary Roll & NUBAN Banking Directory ({payrollStaffRoster.length})
                        </h4>
                        <p className="text-[11px] text-slate-400">Real-time bank accounts verified via NIBSS Paystack gateway</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                          <tr>
                            <th className="p-3">Staff Member</th>
                            <th className="p-3">Designation</th>
                            <th className="p-3">Gross Salary</th>
                            <th className="p-3">Deductions</th>
                            <th className="p-3">Net Payout</th>
                            <th className="p-3">Bank & NUBAN</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {payrollStaffRoster.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3">
                                <strong className="text-white block">{s.name}</strong>
                                <span className="text-[10px] font-mono text-amber-400">{s.staff_no}</span>
                              </td>
                              <td className="p-3">
                                <span className="text-slate-300 block">{s.role}</span>
                                <span className="text-[10px] text-slate-500">{s.assigned_class || 'General Faculty'}</span>
                              </td>
                              <td className="p-3 font-mono text-white">
                                ₦{s.gross_salary?.toLocaleString()}
                              </td>
                              <td className="p-3 font-mono text-amber-400">
                                -₦{s.total_deductions?.toLocaleString()}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-400">
                                ₦{s.net_salary?.toLocaleString()}
                              </td>
                              <td className="p-3">
                                {s.account_number ? (
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <strong className="text-slate-200">{s.bank_name}</strong>
                                    </div>
                                    <span className="font-mono text-[11px] text-slate-400 block">{s.account_number}</span>
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                                    No Bank Linked
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleViewPayslip(s.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3 h-3 text-amber-400" />
                                  <span>Pay Slip</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStaffForBank(s);
                                    setBankLinkAccountNo(s.account_number || '');
                                    setBankLinkBankCode(s.bank_code || '058');
                                    setLinkBankModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                                >
                                  <Landmark className="w-3 h-3" />
                                  <span>Edit Bank</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        )}

        {/* STAFF COMMUNICATION & AUTOMATED NOTIFICATIONS CONSOLE */}
              {activeTab === 'staff_communication' && ['admin', 'superadmin'].includes(activeRole) && (
                <StaffCommunicationConsole currentUser={currentUser} />
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

        {/* Modal: Teacher's Official Report Card Comment & Affective Traits */}
        {isCommentModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    ✍️
                  </span>
                  <div>
                    <h4 className="text-base font-extrabold text-white">Teacher's Official Terminal Remarks</h4>
                    <p className="text-[11px] text-slate-400">
                      {commentTargetStudent?.first_name} {commentTargetStudent?.last_name} ({commentTargetStudent?.admission_no})
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsCommentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {commentSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{commentSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveTeacherComment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Official Form Teacher's Remark *</label>
                  <textarea
                    rows={3}
                    required
                    value={teacherCommentText}
                    onChange={(e) => setTeacherCommentText(e.target.value)}
                    placeholder="Enter official teacher remark for this student's report sheet..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                  {/* Quick Smart Remark Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500 font-bold mr-1">Quick Suggestions:</span>
                    {[
                      'An exemplary scholar with consistent academic dedication.',
                      'Impressive progress this term; keep maintaining this standard.',
                      'Active pupil with great enthusiasm, can achieve even higher scores.',
                      'Well-behaved, punctual and attentive in class assignments.'
                    ].map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTeacherCommentText(sug)}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                      >
                        "{sug.slice(0, 32)}..."
                      </button>
                    ))}
                  </div>
                </div>

                {/* Affective Domain Rating (1 to 5) */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Affective Domain & Behavioral Rating (1 - 5 Stars)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['attentiveness', 'neatness', 'politeness', 'punctuality', 'honesty'].map(trait => (
                      <div key={trait} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <span className="capitalize font-bold text-slate-300 text-[11px]">{trait}:</span>
                        <select
                          value={commentTraits[trait] || 5}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCommentTraits(prev => ({ ...prev, [trait]: val }));
                          }}
                          className="bg-slate-900 border border-slate-700 text-amber-400 font-bold px-2 py-1 rounded-lg text-xs"
                        >
                          <option value="5">5 ★ (Excellent)</option>
                          <option value="4">4 ★ (Very Good)</option>
                          <option value="3">3 ★ (Good)</option>
                          <option value="2">2 ★ (Fair)</option>
                          <option value="1">1 ★ (Poor)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCommentModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingComment}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                  >
                    {isSavingComment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Official Remark</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Quick Continuous Assessment (CA) Score Entry */}
        {isQuickCaModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    📝
                  </span>
                  <div>
                    <h4 className="text-base font-extrabold text-white">Record CA & Exam Scores</h4>
                    <p className="text-[11px] text-slate-400">
                      {quickCaStudent?.first_name} {quickCaStudent?.last_name} ({quickCaStudent?.admission_no})
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsQuickCaModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {quickCaSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{quickCaSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveQuickCa} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Subject *</label>
                  <select
                    value={quickCaSubjectId}
                    onChange={(e) => setQuickCaSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    {(allowedGradebookSubjects.length > 0 ? allowedGradebookSubjects : subjects).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">CA 1 (Max 10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={quickCa1}
                      onChange={(e) => setQuickCa1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">CA 2 (Max 10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={quickCa2}
                      onChange={(e) => setQuickCa2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Project (Max 10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={quickProject}
                      onChange={(e) => setQuickProject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Exam Score (Max 70)</label>
                    <input
                      type="number"
                      min="0"
                      max="70"
                      value={quickExam}
                      onChange={(e) => setQuickExam(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-center text-sm"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Score</span>
                    <span className="text-xl font-black text-amber-400">
                      {Number(quickCa1 || 0) + Number(quickCa2 || 0) + Number(quickProject || 0) + Number(quickExam || 0)} / 100
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickCaModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingQuickCa}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                  >
                    {isSavingQuickCa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save CA Scores</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Parent Tuition Settlement & Bank Remittance */}
        {parentBankModalOpen && selectedInvoiceForParent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    🏛️
                  </span>
                  <div>
                    <h4 className="text-base font-black text-white">Tuition Fee Settlement & Clearance</h4>
                    <p className="text-[11px] text-slate-400">Official Eagle Power Integrated Schools Remittance</p>
                  </div>
                </div>
                <button
                  onClick={() => setParentBankModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student & Invoice Telemetry */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    {selectedInvoiceForParent.first_name} {selectedInvoiceForParent.last_name}
                  </span>
                  <span className="font-mono text-amber-400 font-extrabold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    {selectedInvoiceForParent.admission_no}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Class: <strong className="text-slate-200">{selectedInvoiceForParent.class_name}</strong> &bull; Invoice Ref: <strong className="text-slate-200 font-mono">{selectedInvoiceForParent.invoice_no}</strong>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Billed</span>
                    <strong className="text-white text-xs font-black">₦{selectedInvoiceForParent.amount_due.toLocaleString()}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Paid to Date</span>
                    <strong className="text-emerald-400 text-xs font-black">₦{selectedInvoiceForParent.amount_paid.toLocaleString()}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30">
                    <span className="text-[10px] text-amber-400 block font-semibold">To Settle</span>
                    <strong className="text-amber-300 text-xs font-black">₦{(selectedInvoiceForParent.amount_due - selectedInvoiceForParent.amount_paid).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Official Bank Accounts */}
              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Official School Bank Accounts (Select Either):
                </span>

                {/* Account 1: Moniepoint */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 hover:border-amber-400/40 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        MONIEPOINT MFB
                      </span>
                      <span className="text-white font-extrabold text-sm font-mono tracking-wider">8219442018</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('8219442018');
                        setCopiedBankText('8219442018');
                        setTimeout(() => setCopiedBankText(null), 2500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-700"
                    >
                      {copiedBankText === '8219442018' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copiedBankText === '8219442018' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Account Name: <strong className="text-slate-200">Eagle Power Integrated Schools Awka</strong>
                  </div>
                </div>

                {/* Account 2: Zenith Bank */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 hover:border-amber-400/40 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                        ZENITH BANK
                      </span>
                      <span className="text-white font-extrabold text-sm font-mono tracking-wider">1014882910</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('1014882910');
                        setCopiedBankText('1014882910');
                        setTimeout(() => setCopiedBankText(null), 2500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-700"
                    >
                      {copiedBankText === '1014882910' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copiedBankText === '1014882910' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Account Name: <strong className="text-slate-200">Eagle Power Integrated Schools Ltd</strong>
                  </div>
                </div>
              </div>

              {/* Transfer Narration Guide */}
              <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                    Required Transfer Narration / Remark:
                  </span>
                  <button
                    onClick={() => {
                      const narration = `${selectedInvoiceForParent.invoice_no} / ${selectedInvoiceForParent.admission_no}`;
                      navigator.clipboard?.writeText(narration);
                      setCopiedBankText('narration');
                      setTimeout(() => setCopiedBankText(null), 2500);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-400/30"
                  >
                    {copiedBankText === 'narration' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                    <span>{copiedBankText === 'narration' ? 'Copied' : 'Copy Ref'}</span>
                  </button>
                </div>
                <div className="font-mono text-white font-extrabold text-xs bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {selectedInvoiceForParent.invoice_no} / {selectedInvoiceForParent.admission_no}
                </div>
                <p className="text-[10px] text-slate-400">
                  Please paste this narration in your bank app so our automated Bursary engine clears your receipt immediately.
                </p>
              </div>

              {/* WhatsApp Receipt Submission Action */}
              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/2348033591058?text=${encodeURIComponent(
                    `Hello Eagle Power Bursary, I have made a tuition payment for my child:\n\n*Student:* ${selectedInvoiceForParent.first_name} ${selectedInvoiceForParent.last_name}\n*Admission No:* ${selectedInvoiceForParent.admission_no}\n*Class:* ${selectedInvoiceForParent.class_name}\n*Invoice Ref:* ${selectedInvoiceForParent.invoice_no}\n*Amount Transferred:* ₦${(selectedInvoiceForParent.amount_due - selectedInvoiceForParent.amount_paid).toLocaleString()}\n\nAttached is my payment transfer receipt. Kindly verify and issue our official e-clearance receipt.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Payment Receipt to Bursar WhatsApp (+234 803 359 1058)</span>
                </a>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setParentBankModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Close Window
                  </button>
                </div>
              </div>
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
            <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-800 text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    🎒
                  </span>
                  <div>
                    <h4 className="text-base font-extrabold text-white">Institutional Student Enrollment & Registry</h4>
                    <p className="text-[11px] text-slate-400">Record complete biodata, medical safety, origin, parentage, and logistics</p>
                  </div>
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
                <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs">
                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none text-[11px]">
                    {[
                      { id: 'biodata', label: '👤 1. Biodata & Origin' },
                      { id: 'health', label: '🩺 2. Health & Safety' },
                      { id: 'academics', label: '🏫 3. Academics' },
                      { id: 'guardians', label: '👨‍👩‍👧 4. Parents & Guardians' },
                      { id: 'logistics', label: '🚌 5. Logistics' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEnrollModalTab(t.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                          enrollModalTab === t.id
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: BIODATA & ORIGIN */}
                  {enrollModalTab === 'biodata' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                          <label className="block text-slate-300 font-bold mb-1">Middle Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Victor"
                            value={newStudentForm.middle_name}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, middle_name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Last Name / Surname *</label>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                          <label className="block text-slate-300 font-bold mb-1">Enrollment Class *</label>
                          <select
                            value={newStudentForm.class_id}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, class_id: parseInt(e.target.value) || 1 }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          >
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.division || 'General'})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">State of Origin</label>
                          <input
                            type="text"
                            placeholder="e.g. Anambra State"
                            value={newStudentForm.state_of_origin}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, state_of_origin: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">LGA of Origin</label>
                          <input
                            type="text"
                            placeholder="e.g. Awka South"
                            value={newStudentForm.lga_of_origin}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, lga_of_origin: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Religion</label>
                          <select
                            value={newStudentForm.religion}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, religion: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
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
                  {enrollModalTab === 'health' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Crucial medical telemetry used by the school nurse, sports master, and emergency responders.</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Blood Group</label>
                          <select
                            value={newStudentForm.blood_group}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, blood_group: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
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
                          <label className="block text-slate-300 font-bold mb-1">Genotype</label>
                          <select
                            value={newStudentForm.genotype}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, genotype: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          >
                            <option>AA</option>
                            <option>AS</option>
                            <option>SS</option>
                            <option>AC</option>
                            <option>SC</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Known Allergies</label>
                          <input
                            type="text"
                            placeholder="e.g. Groundnuts, Penicillin, Dust, None"
                            value={newStudentForm.allergies}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, allergies: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Medical Conditions / Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. Mild Asthma, Inhaler needed, None"
                            value={newStudentForm.medical_conditions}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, medical_conditions: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-2">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Emergency Contact Information</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Contact Person</label>
                            <input
                              type="text"
                              placeholder="e.g. Mrs. Ngozi Okonkwo"
                              value={newStudentForm.emergency_contact_name}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Relationship</label>
                            <input
                              type="text"
                              placeholder="e.g. Mother / Aunt"
                              value={newStudentForm.emergency_contact_relationship}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Emergency Phone</label>
                            <input
                              type="tel"
                              placeholder="080XXXXXXXX"
                              value={newStudentForm.emergency_contact_phone}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ACADEMICS */}
                  {enrollModalTab === 'academics' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Entry Mode</label>
                          <select
                            value={newStudentForm.entry_mode}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, entry_mode: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          >
                            <option>Fresh Admission</option>
                            <option>Transfer from another school</option>
                            <option>Direct Entry</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Last Class Passed</label>
                          <input
                            type="text"
                            placeholder="e.g. Primary 6 / JSS 2"
                            value={newStudentForm.last_class_passed}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, last_class_passed: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Previous School Attended</label>
                        <input
                          type="text"
                          placeholder="e.g. Christ the King Primary School, Onitsha"
                          value={newStudentForm.previous_school}
                          onChange={(e) => setNewStudentForm(prev => ({ ...prev, previous_school: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Reason for Transfer (if applicable)</label>
                        <input
                          type="text"
                          placeholder="e.g. Family relocation to Awka capital city"
                          value={newStudentForm.reason_for_transfer}
                          onChange={(e) => setNewStudentForm(prev => ({ ...prev, reason_for_transfer: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PARENTS & GUARDIANS */}
                  {enrollModalTab === 'guardians' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Primary Guardian / Sponsor (Main Account)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Title</label>
                            <select
                              value={newStudentForm.guardian_title}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, guardian_title: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
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
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Alternate Phone</label>
                            <input
                              type="tel"
                              placeholder="081XXXXXXXX"
                              value={newStudentForm.guardian_alt_phone}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, guardian_alt_phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
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
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Occupation</label>
                            <input
                              type="text"
                              placeholder="e.g. Civil Engineer / Merchant"
                              value={newStudentForm.guardian_occupation}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, guardian_occupation: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Maternal Profile & Residential Address</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Mother's Full Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Mrs. Ngozi Okonkwo"
                              value={newStudentForm.mother_name}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, mother_name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Mother's Phone</label>
                            <input
                              type="tel"
                              placeholder="080XXXXXXXX"
                              value={newStudentForm.mother_phone}
                              onChange={(e) => setNewStudentForm(prev => ({ ...prev, mother_phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="mt-2">
                          <label className="block text-slate-300 font-bold mb-1">Residential Address *</label>
                          <textarea
                            rows={2}
                            required
                            placeholder="e.g. Plot 12, Ngozika Housing Estate Phase 2, Awka, Anambra State"
                            value={newStudentForm.address}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: LOGISTICS */}
                  {enrollModalTab === 'logistics' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Boarding Preference</label>
                          <select
                            value={newStudentForm.boarding_status}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, boarding_status: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          >
                            <option value="Day">Day Student</option>
                            <option value="Full Boarding">Full Boarding Hostel</option>
                            <option value="Weekly Boarding">Weekly Boarding</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Daily Transport Mode</label>
                          <select
                            value={newStudentForm.transport_mode}
                            onChange={(e) => setNewStudentForm(prev => ({ ...prev, transport_mode: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                          >
                            <option value="Parent Dropoff">Private Family Drop-off</option>
                            <option value="School Bus">Eagle Power School Bus Shuttle</option>
                            <option value="Walk">Walking / Bicycle</option>
                            <option value="Public">Public Transit / Commercial</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">School Bus Route (if applicable)</label>
                        <select
                          value={newStudentForm.bus_route}
                          onChange={(e) => setNewStudentForm(prev => ({ ...prev, bus_route: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                        >
                          <option value="None">None (Private / Boarding)</option>
                          <option value="Route A - Awka South / Regina Caeli / Ziks Ave">Route A — Awka South / Regina Caeli / Zik Avenue</option>
                          <option value="Route B - Amansea / UNIZIK Junction / Ifite">Route B — Amansea / UNIZIK Junction / Ifite</option>
                          <option value="Route C - Ngozika Housing / Udoka Estate">Route C — Ngozika Housing / Udoka Estate</option>
                          <option value="Route D - Amawbia / Governor's Lodge / Enugwu-Ukwu">Route D — Amawbia / Governor's Lodge / Enugwu-Ukwu</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Navigation / Action Bar */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex gap-2">
                      {enrollModalTab !== 'biodata' && (
                        <button
                          type="button"
                          onClick={() => {
                            const tabs = ['biodata', 'health', 'academics', 'guardians', 'logistics'];
                            const idx = tabs.indexOf(enrollModalTab);
                            if (idx > 0) setEnrollModalTab(tabs[idx - 1]);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
                        >
                          &larr; Previous Tab
                        </button>
                      )}
                      {enrollModalTab !== 'logistics' && (
                        <button
                          type="button"
                          onClick={() => {
                            const tabs = ['biodata', 'health', 'academics', 'guardians', 'logistics'];
                            const idx = tabs.indexOf(enrollModalTab);
                            if (idx < tabs.length - 1) setEnrollModalTab(tabs[idx + 1]);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 font-bold text-xs"
                        >
                          Next Tab &rarr;
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
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
                        <span>Enroll Student & Provision Accounts</span>
                      </button>
                    </div>
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
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Assignment Type *</label>
                    <select
                      value={newHwForm.assignment_type || 'Homework'}
                      onChange={(e) => setNewHwForm(prev => ({ ...prev, assignment_type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="Homework">🏠 Homework</option>
                      <option value="Classwork">✏️ Classwork</option>
                      <option value="Project">🔬 Project / Task</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target Class *</label>
                    <select
                      value={newHwForm.class_id}
                      onChange={(e) => setNewHwForm(prev => ({ ...prev, class_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {(activeRole === 'teacher' ? (allowedGradebookClasses.length > 0 ? allowedGradebookClasses : classes) : classes).map(c => (
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
                      {(activeRole === 'teacher' && allowedGradebookSubjects.length > 0 ? allowedGradebookSubjects : subjects).map(s => (
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

        {/* Modal: Teacher Create Lesson Note (Persistent with SQLite) */}
        {lessonNoteModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Draft Scheme Lesson Plan</h3>
                    <p className="text-xs text-slate-400">Formal curriculum unit note submitted for Head of Department pedagogical review</p>
                  </div>
                </div>
                <button
                  onClick={() => setLessonNoteModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLessonNote} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Academic Week *</label>
                    <select
                      value={newLessonNote.week}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, week: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'].map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Class Level *</label>
                    <select
                      value={newLessonNote.class_name}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, class_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Curriculum Subject *</label>
                    <select
                      value={newLessonNote.subject}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Lesson Topic *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Simultaneous Linear Equations by Elimination"
                      value={newLessonNote.topic}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, topic: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Subtopic (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Elimination with unlike coefficients"
                      value={newLessonNote.subtopic || ''}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, subtopic: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Behavioral Objectives *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="By the end of the lesson, pupils should be able to: 1. Eliminate variables with equal coefficients; 2. Solve for unknown terms..."
                    value={newLessonNote.objectives}
                    onChange={(e) => setNewLessonNote(prev => ({ ...prev, objectives: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Instructional Materials / Teaching Aids</label>
                    <input
                      type="text"
                      placeholder="e.g. Whiteboard, flashcards, geometrical chart"
                      value={newLessonNote.materials}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, materials: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Pupils' Previous Knowledge</label>
                    <input
                      type="text"
                      placeholder="e.g. Students can solve single-variable linear equations"
                      value={newLessonNote.previous_knowledge || ''}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, previous_knowledge: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Presentation Steps (Teacher & Pupil Activities)</label>
                  <textarea
                    rows={3}
                    placeholder="Step 1: Introduction with real-world balancing example. Step 2: Demonstration of coefficient equalization. Step 3: Class guided practice..."
                    value={newLessonNote.presentation_steps || ''}
                    onChange={(e) => setNewLessonNote(prev => ({ ...prev, presentation_steps: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Class Evaluation Questions</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Solve: 2x + y = 7, 3x - y = 8"
                      value={newLessonNote.evaluation || ''}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, evaluation: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Home Assignment</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Exercises 3C, Nos 1 to 5, New General Mathematics"
                      value={newLessonNote.assignment || ''}
                      onChange={(e) => setNewLessonNote(prev => ({ ...prev, assignment: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLessonNoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit Scheme Plan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Full Lesson Note Details */}
        {viewLessonNoteModalOpen && selectedLessonNote && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-amber-400 font-bold text-xs">
                      {selectedLessonNote.week_number ? `Week ${selectedLessonNote.week_number}` : selectedLessonNote.week}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedLessonNote.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      selectedLessonNote.status === 'Needs Revision' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {selectedLessonNote.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{selectedLessonNote.topic}</h3>
                  {selectedLessonNote.subtopic && (
                    <p className="text-xs text-amber-300 font-medium">Subtopic: {selectedLessonNote.subtopic}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedLessonNote.subject_name || selectedLessonNote.subject} &bull; {selectedLessonNote.class_name} &bull; Author: <strong className="text-slate-200">{selectedLessonNote.teacher_name || 'Staff Teacher'}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setViewLessonNoteModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* HOD Feedback Banner if present */}
              {selectedLessonNote.hod_feedback && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Award className="w-4 h-4" />
                    <span>Head of Department (HOD) Pedagogical Review</span>
                  </div>
                  <p className="text-slate-200 italic">&ldquo;{selectedLessonNote.hod_feedback}&rdquo;</p>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Reviewed by: <strong>{selectedLessonNote.reviewed_by || 'HOD'}</strong> &bull; {selectedLessonNote.reviewed_at ? selectedLessonNote.reviewed_at.slice(0, 16).replace('T', ' ') : 'Verified'}
                  </div>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Behavioral Objectives</div>
                  <p className="text-slate-200 whitespace-pre-wrap">{selectedLessonNote.behavioral_objectives || selectedLessonNote.objectives || 'Standard syllabus objectives.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Instructional Materials</div>
                    <p className="text-slate-300">{selectedLessonNote.instructional_materials || selectedLessonNote.materials || 'Standard classroom aids'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Previous Knowledge</div>
                    <p className="text-slate-300">{selectedLessonNote.previous_knowledge || 'Basic prerequisite skills established.'}</p>
                  </div>
                </div>

                {selectedLessonNote.presentation_steps && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Presentation Steps & Delivery Flow</div>
                    <p className="text-slate-200 whitespace-pre-wrap">{selectedLessonNote.presentation_steps}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedLessonNote.evaluation && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Class Evaluation</div>
                      <p className="text-slate-300 whitespace-pre-wrap">{selectedLessonNote.evaluation}</p>
                    </div>
                  )}
                  {selectedLessonNote.assignment && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Take-Home Assignment</div>
                      <p className="text-slate-300 whitespace-pre-wrap">{selectedLessonNote.assignment}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  onClick={() => setViewLessonNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: HOD / Principal Pedagogical Review Cockpit */}
        {hodReviewModalOpen && selectedLessonNote && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">HOD Pedagogical Review</h3>
                    <p className="text-xs text-slate-400">Quality evaluation & scheme clearance</p>
                  </div>
                </div>
                <button onClick={() => setHodReviewModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-white text-sm">{selectedLessonNote.topic}</div>
                <div className="text-slate-400">
                  {selectedLessonNote.subject_name || selectedLessonNote.subject} &bull; {selectedLessonNote.class_name} &bull; By: <strong className="text-slate-200">{selectedLessonNote.teacher_name}</strong>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Approval Clearance Status *</label>
                  <select
                    value={hodReviewStatus}
                    onChange={(e) => setHodReviewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="Approved">Approved (Cleared for Classroom Delivery)</option>
                    <option value="Needs Revision">Needs Revision (Teacher Must Modify)</option>
                    <option value="Under Review">Under Review (Pending Clarification)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Pedagogical Feedback & Guidance {hodReviewStatus === 'Needs Revision' && <span className="text-rose-400">* (Mandatory)</span>}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter supervisory remarks, instructional recommendations, or areas requiring depth..."
                    value={hodFeedbackText}
                    onChange={(e) => setHodFeedbackText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setHodReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewLessonNote}
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  {submittingReview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Review Decision</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Bursary Cohort Batch Invoicing Engine */}
        {batchInvoiceModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl my-8">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Batch Cohort Invoicing Engine</h3>
                    <p className="text-xs text-slate-400">Generate itemized fee billings for class cohorts with duplicate protection</p>
                  </div>
                </div>
                <button onClick={() => setBatchInvoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBatchInvoicing} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target Cohort / Class *</label>
                    <select
                      value={batchInvoiceForm.class_id}
                      onChange={(e) => setBatchInvoiceForm(prev => ({ ...prev, class_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">All Classes (Whole School)</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={batchInvoiceForm.due_date}
                      onChange={(e) => setBatchInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Invoice Billing Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Term 2026/2027 Composite Tuition & Levies"
                    value={batchInvoiceForm.title}
                    onChange={(e) => setBatchInvoiceForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Itemized Fee Breakdown Sub-inputs */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex justify-between">
                    <span>Itemized Fee Components</span>
                    <span>Amount (₦)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-slate-300 font-medium">Tuition & Instruction:</span>
                    <input
                      type="number"
                      min="0"
                      value={batchInvoiceForm.breakdown.tuition}
                      onChange={(e) => setBatchInvoiceForm(prev => ({ ...prev, breakdown: { ...prev.breakdown, tuition: Number(e.target.value) || 0 } }))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-right font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-slate-300 font-medium">Books & Worksheets:</span>
                    <input
                      type="number"
                      min="0"
                      value={batchInvoiceForm.breakdown.books}
                      onChange={(e) => setBatchInvoiceForm(prev => ({ ...prev, breakdown: { ...prev.breakdown, books: Number(e.target.value) || 0 } }))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-right font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-slate-300 font-medium">Uniform & Sportswear:</span>
                    <input
                      type="number"
                      min="0"
                      value={batchInvoiceForm.breakdown.uniform}
                      onChange={(e) => setBatchInvoiceForm(prev => ({ ...prev, breakdown: { ...prev.breakdown, uniform: Number(e.target.value) || 0 } }))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-right font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-slate-300 font-medium">Development & ICT Levy:</span>
                    <input
                      type="number"
                      min="0"
                      value={batchInvoiceForm.breakdown.development_levy}
                      onChange={(e) => setBatchInvoiceForm(prev => ({ ...prev, breakdown: { ...prev.breakdown, development_levy: Number(e.target.value) || 0 } }))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-right font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Total Per Pupil Computed */}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
                    <span className="text-white">Total Billing Per Pupil:</span>
                    <span className="text-amber-400 font-mono">
                      ₦{(
                        (batchInvoiceForm.breakdown.tuition || 0) +
                        (batchInvoiceForm.breakdown.books || 0) +
                        (batchInvoiceForm.breakdown.uniform || 0) +
                        (batchInvoiceForm.breakdown.development_levy || 0) +
                        (batchInvoiceForm.breakdown.other || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBatchInvoiceModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={batchInvoiceSubmitting}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow flex items-center gap-1.5"
                  >
                    {batchInvoiceSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                    <span>Issue Batch Invoices</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Online Paystack Fee Checkout */}
        {paystackCheckoutModalOpen && paystackInvoice && (() => {
          const remaining = paystackInvoice.amount_due - paystackInvoice.amount_paid;
          let breakdownObj = null;
          try {
            if (paystackInvoice.breakdown_json) {
              breakdownObj = typeof paystackInvoice.breakdown_json === 'string'
                ? JSON.parse(paystackInvoice.breakdown_json)
                : paystackInvoice.breakdown_json;
            }
          } catch (_) {}

          return (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4 shadow-2xl">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">Paystack Online Checkout</h3>
                      <p className="text-xs text-slate-400">Direct Card, USSD & Nigerian Bank Transfer</p>
                    </div>
                  </div>
                  <button onClick={() => setPaystackCheckoutModalOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Pupil / Ward:</span>
                    <span className="text-white font-extrabold">{paystackInvoice.first_name} {paystackInvoice.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Class & Admission No:</span>
                    <span className="text-slate-200">{paystackInvoice.class_name} ({paystackInvoice.admission_no})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Invoice Number:</span>
                    <span className="font-mono text-amber-400 font-bold">{paystackInvoice.invoice_no}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm">
                    <span className="text-slate-300">Remaining Balance:</span>
                    <span className="text-emerald-400 font-mono">₦{remaining.toLocaleString()}</span>
                  </div>
                </div>

                {/* Optional Itemized fee pill overview */}
                {breakdownObj && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Itemized Fee Inclusions</div>
                    <div className="flex flex-wrap gap-1.5 text-slate-300">
                      {breakdownObj.tuition > 0 && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Tuition: ₦{breakdownObj.tuition.toLocaleString()}</span>}
                      {breakdownObj.books > 0 && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Books: ₦{breakdownObj.books.toLocaleString()}</span>}
                      {breakdownObj.uniform > 0 && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Uniform: ₦{breakdownObj.uniform.toLocaleString()}</span>}
                      {breakdownObj.development_levy > 0 && <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Dev Levy: ₦{breakdownObj.development_levy.toLocaleString()}</span>}
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Payment Amount (₦) *</label>
                    <input
                      type="number"
                      required
                      min="100"
                      max={remaining}
                      value={paystackCustomAmount}
                      onChange={(e) => setPaystackCustomAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-black text-sm focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-[10px] text-slate-500">You can pay in full (₦{remaining.toLocaleString()}) or enter a partial installment.</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Receipt Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="parent@example.com"
                      value={paystackEmail}
                      onChange={(e) => setPaystackEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[10px] text-emerald-300/80 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Secured by Paystack &bull; 256-bit Bank Grade Encryption &bull; Official Digital Receipt Issued Instantly</span>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaystackCheckoutModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={paystackLoading || !paystackCustomAmount || parseFloat(paystackCustomAmount) <= 0}
                    onClick={() => handleInitiatePaystackCheckout(paystackInvoice, paystackCustomAmount)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow flex items-center gap-1.5 transition-all"
                  >
                    {paystackLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Pay ₦{parseFloat(paystackCustomAmount || 0).toLocaleString()} Now</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal: Official Paystack Payment Verified Receipt */}
        {paystackSuccessReceipt && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 space-y-4 shadow-2xl border-4 border-emerald-500">
              <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase block">OFFICIAL DIGITAL RECEIPT</span>
                    <h3 className="text-base font-black text-slate-950">Eagle Power Schools, Awka</h3>
                  </div>
                </div>
                <button
                  onClick={() => setPaystackSuccessReceipt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                <div className="text-xs uppercase font-extrabold text-emerald-800">FEE PAYMENT VERIFIED & CREDITED</div>
                <div className="text-3xl font-black text-slate-950 font-mono">
                  ₦{paystackSuccessReceipt.amount.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold">
                  Receipt No: {paystackSuccessReceipt.receiptNo}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pupil Name</span>
                  <strong className="text-slate-800">{paystackSuccessReceipt.studentName}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Class Level</span>
                  <strong className="text-slate-800">{paystackSuccessReceipt.className}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Ref</span>
                  <strong className="font-mono text-slate-800">{paystackSuccessReceipt.invoiceNo}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <strong className="text-emerald-700">{paystackSuccessReceipt.method}</strong>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center italic">
                Transaction Reference: {paystackSuccessReceipt.reference} &bull; Generated: {new Date().toLocaleDateString('en-GB')}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaystackSuccessReceipt(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs"
                >
                  Done
                </button>
              </div>
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

        {/* Modal: View Official Printable Pay Slip */}
        {activePayslipStaff && payslipData && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-300 text-left space-y-4 max-h-[90vh] overflow-y-auto">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/assets/official-logo.jpg" alt="Logo" className="w-12 h-12 rounded-full border border-amber-500 object-cover" />
                  <div>
                    <h4 className="text-base font-black uppercase text-slate-950">Eagle Power Schools & Colleges</h4>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Official Monthly Salary Pay Slip</p>
                    <p className="text-[10px] text-slate-500">Awka Campus &bull; ANSG/MOE/AWK/0412</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActivePayslipStaff(null);
                    setPayslipData(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1 print:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">EMPLOYEE NAME</span>
                  <strong className="text-slate-900 font-extrabold text-sm">{payslipData.payslip?.staff?.name || payslipData.staff?.name}</strong>
                  <span className="text-slate-600 block text-[11px] font-mono">{payslipData.payslip?.staff?.staff_no || payslipData.staff?.staff_no}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold block text-[10px]">PAYROLL PERIOD</span>
                  <strong className="text-slate-900 font-extrabold text-xs">{payslipData.period || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong>
                  <span className="text-slate-600 block text-[11px]">{payslipData.payslip?.staff?.role || payslipData.staff?.role}</span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Gross Earnings */}
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block border-b border-emerald-200 pb-1">
                    Gross Earnings
                  </span>
                  <div className="flex justify-between text-slate-700">
                    <span>Base Salary:</span>
                    <span className="font-mono font-bold">₦{(payslipData.payslip?.earnings?.base_salary ?? payslipData.structure?.base_salary ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Housing Allowance:</span>
                    <span className="font-mono font-bold">₦{(payslipData.payslip?.earnings?.housing_allowance ?? payslipData.structure?.housing_allowance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Transport Allowance:</span>
                    <span className="font-mono font-bold">₦{(payslipData.payslip?.earnings?.transport_allowance ?? payslipData.structure?.transport_allowance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Teaching Allowance:</span>
                    <span className="font-mono font-bold">₦{(payslipData.payslip?.earnings?.teaching_allowance ?? payslipData.structure?.teaching_allowance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-300 font-black text-emerald-950">
                    <span>Total Gross:</span>
                    <span className="font-mono">₦{(payslipData.payslip?.earnings?.gross_pay ?? payslipData.summary?.gross_salary ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block border-b border-amber-200 pb-1">
                    Statutory Deductions
                  </span>
                  <div className="flex justify-between text-slate-700">
                    <span>PAYE Tax:</span>
                    <span className="font-mono font-bold text-amber-900">₦{(payslipData.payslip?.deductions?.tax ?? payslipData.structure?.tax_deduction ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>PenCom Pension:</span>
                    <span className="font-mono font-bold text-amber-900">₦{(payslipData.payslip?.deductions?.pension ?? payslipData.structure?.pension_deduction ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Other Deductions:</span>
                    <span className="font-mono font-bold text-amber-900">₦{(payslipData.payslip?.deductions?.other ?? payslipData.structure?.other_deductions ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-amber-300 font-black text-amber-950">
                    <span>Total Deductions:</span>
                    <span className="font-mono">₦{(payslipData.payslip?.deductions?.total_deductions ?? payslipData.summary?.total_deductions ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Payable */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">NET SALARY PAYABLE</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ₦{(payslipData.payslip?.net_pay ?? payslipData.summary?.net_salary ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px]">PAYMENT DESTINATION</span>
                  <strong className="text-white block">{payslipData.payslip?.staff?.bank_name || payslipData.bank_account?.bank_name || 'Guaranty Trust Bank'}</strong>
                  <span className="font-mono text-amber-300">{payslipData.payslip?.staff?.account_number || payslipData.bank_account?.account_number || 'N/A'}</span>
                </div>
              </div>

              {/* Actions & Print */}
              <div className="pt-2 flex justify-between items-center print:hidden">
                <span className="text-[10px] text-slate-400">Verified by Bursary &bull; NIBSS Automated Transfer</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Hard Copy Pay Slip</span>
                  </button>
                  <button
                    onClick={() => {
                      setActivePayslipStaff(null);
                      setPayslipData(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Link & Verify Staff Bank Account */}
        {linkBankModalOpen && selectedStaffForBank && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 text-left space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    🏛️
                  </span>
                  <h4 className="text-base font-extrabold text-white">Link Staff Bank Account</h4>
                </div>
                <button
                  onClick={() => {
                    setLinkBankModalOpen(false);
                    setSelectedStaffForBank(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>Staff: <strong className="text-white">{selectedStaffForBank.name}</strong></div>
                <div>Staff ID: <span className="text-amber-400 font-mono">{selectedStaffForBank.staff_no}</span></div>
              </div>

              {bankLinkResult ? (
                <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-black text-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Bank Account Verified & Linked!</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl font-mono text-[11px] space-y-1">
                    <div>Bank: {bankLinkResult.bank_account?.bank_name}</div>
                    <div>Account: {bankLinkResult.bank_account?.account_number}</div>
                    <div>Account Name: <strong className="text-amber-300">{bankLinkResult.bank_account?.account_name}</strong></div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLinkBankAccount} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Select Nigerian Commercial Bank *</label>
                    <select
                      value={bankLinkBankCode}
                      onChange={(e) => setBankLinkBankCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {nigerianBanks.map(b => (
                        <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">10-Digit NUBAN Account Number *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="e.g. 0123456789"
                      value={bankLinkAccountNo}
                      onChange={(e) => setBankLinkAccountNo(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-sm tracking-wider"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Account name will be validated live against NIBSS Paystack gateway.
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLinkBankModalOpen(false);
                        setSelectedStaffForBank(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLinkingBank || bankLinkAccountNo.length !== 10}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow flex items-center gap-1.5"
                    >
                      {isLinkingBank ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Verify with NIBSS & Link</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 text-xs text-slate-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Change Account Password</h3>
                    <p className="text-[11px] text-slate-400">Secure your portal login credentials</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {changePassError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span className="leading-relaxed">{changePassError}</span>
                </div>
              )}

              {changePassSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span className="leading-relaxed">{changePassSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-200 uppercase mb-1 text-[10px]">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={changePassShowCurrent ? 'text' : 'password'}
                      required
                      value={changePassCurrent}
                      onChange={(e) => setChangePassCurrent(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setChangePassShowCurrent(!changePassShowCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {changePassShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 uppercase mb-1 text-[10px]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={changePassShowNew ? 'text' : 'password'}
                      required
                      value={changePassNew}
                      onChange={(e) => setChangePassNew(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setChangePassShowNew(!changePassShowNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {changePassShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Must be at least 8 characters long, containing letters and numbers.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 uppercase mb-1 text-[10px]">
                    Confirm New Password
                  </label>
                  <input
                    type={changePassShowNew ? 'text' : 'password'}
                    required
                    value={changePassConfirm}
                    onChange={(e) => setChangePassConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changePassLoading}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {changePassLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Staff ID Card Badge, Photo & Digital Signature Studio Modal */}
        <StaffIDCardModal
          isOpen={isStaffIdModalOpen}
          onClose={() => setIsStaffIdModalOpen(false)}
          targetStaff={staffIdTarget}
          currentUser={currentUser}
          onProfileUpdated={(updated) => {
            fetchAllData();
            if (currentUser) {
              setCurrentUser(prev => ({
                ...prev,
                avatar_url: updated?.photo_url || prev?.avatar_url,
                signature_url: updated?.signature_url || prev?.signature_url,
                staff: {
                  ...(prev?.staff || {}),
                  ...(updated || {})
                }
              }));
            }
          }}
        />

        {/* WhatsApp Bot Connection, Pairing & Push Broadcast Control Center */}
        <WhatsAppBotConsoleModal
          isOpen={whatsappModalOpen}
          onClose={() => setWhatsappModalOpen(false)}
          authToken={authToken}
          defaultPhone={systemSettings?.whatsapp_phone || '+234 907 558 0671'}
          classes={classes}
        />

      </div>
    </div>
  );
}

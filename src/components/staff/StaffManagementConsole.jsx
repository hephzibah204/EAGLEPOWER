import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, RefreshCw, X, Save, Users, KeyRound, CreditCard, Pencil, ShieldCheck, History } from 'lucide-react';
import { apiFetch, getApiBase, getAuthHeaders } from '../../config/api';

const inputStyle = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400';
const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50';
const initialForm = { name: '', role: '', email: '', phone: '', qualification: '', assigned_class: '', gender: '', dob: '', date_employed: '', employment_type: 'Full time', address: '', emergency_contact_name: '', emergency_contact: '', blood_group: '', form_responsibility: '', is_active: 1 };

function Field({ label, name, form, setForm, type = 'text', required = false, children, ...props }) {
  const id = `staff-${name}`;
  return <label htmlFor={id} className="block space-y-1.5 text-xs font-semibold text-slate-300">
    <span>{label}{required ? ' *' : ''}</span>
    {children ? <select id={id} className={inputStyle} value={form[name] ?? ''} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} {...props}>{children}</select>
      : <input id={id} className={inputStyle} type={type} value={form[name] ?? ''} required={required} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} {...props} />}
  </label>;
}

export default function StaffManagementConsole({ authToken, classes = [], onPrintId, onStaffChanged }) {
  const [staff, setStaff] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [portalRole, setPortalRole] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [view, setView] = useState('directory');
  const [editor, setEditor] = useState(null);
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(initialForm);
  const [access, setAccess] = useState({ username: '', password: '', confirm_password: '', portal_role: 'teacher', user_active: '1' });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const api = getApiBase();
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiFetch(`${api}/staff/management`, { headers: getAuthHeaders(authToken), cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load staff records.');
      setStaff(result.data || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [api, authToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!editor) return;
    const handler = e => { if (e.key === 'Escape' && !saving) setEditor(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editor, saving]);
  const openEditor = (record, nextTab = 'profile') => {
    const creating = !record;
    setEditor(creating ? { creating: true } : record); setTab(nextTab); setModalError(''); setCreateAccount(false);
    setForm(Object.fromEntries(Object.keys(initialForm).map(key => [key,
      key === 'is_active' ? Number(record?.is_active ?? 1) : String(record?.[key] ?? initialForm[key]),
    ])));
    setAccess({ username: record?.username || '', password: '', confirm_password: '', portal_role: record?.user_role || 'teacher', user_active: String(record?.user_active ?? 1) });
  };
  const save = async e => {
    e.preventDefault(); setModalError('');
    const portal = tab === 'access' || (editor.creating && createAccount);
    if (portal && access.password !== access.confirm_password) { setModalError('The passwords do not match.'); return; }
    setSaving(true);
    try {
      const endpoint = editor.creating ? '/staff/management' : `/staff/management/${editor.id}${tab === 'access' ? '/portal-access' : ''}`;
      const credentials = { username: access.username, password: access.password, portal_role: access.portal_role, user_active: Number(access.user_active) };
      const payload = editor.creating ? { ...form, create_portal_account: createAccount, ...(createAccount ? credentials : {}) } : tab === 'access' ? credentials : form;
      const response = await apiFetch(`${api}${endpoint}`, { method: editor.creating ? 'POST' : 'PUT', headers: getAuthHeaders(authToken), body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save changes.');
      setNotice(result.message); setEditor(null); setAccess(a => ({ ...a, password: '', confirm_password: '' })); await load(); onStaffChanged?.();
    } catch (err) { setModalError(err.message); } finally { setSaving(false); }
  };
  const showAudit = async () => {
    setView('activity'); setError('');
    try {
      const response = await apiFetch(`${api}/staff/management/audit`, { headers: getAuthHeaders(authToken), cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to load activity.');
      setAudit(result.data || []);
    } catch (err) { setError(err.message); }
  };
  const filtered = staff.filter(s => (status === 'all' || Number(s.is_active) === Number(status))
    && (portalRole === 'all' || (portalRole === 'none' ? !s.has_portal_account : s.user_role === portalRole))
    && (!classFilter || s.assigned_class === classFilter)
    && [s.name, s.staff_no, s.role, s.email, s.phone, s.username].some(v => String(v || '').toLowerCase().includes(query.trim().toLowerCase())));
  const classNames = [...new Set([...classes.map(c => c.name), ...staff.map(s => s.assigned_class)].filter(Boolean))];
  const accessFields = <>
    <Field label="Portal username" name="username" form={access} setForm={setAccess} required minLength={3} maxLength={64} autoComplete="off" />
    <Field label="Portal role" name="portal_role" form={access} setForm={setAccess}><option value="teacher">Teacher</option><option value="admin">Administrator</option><option value="bursar">Bursar</option></Field>
    <Field label={editor?.has_portal_account ? 'New password (leave blank to keep current)' : 'Initial password'} name="password" form={access} setForm={setAccess} type="password" required={!editor?.has_portal_account} minLength={10} maxLength={128} autoComplete="new-password" />
    <Field label="Confirm new password" name="confirm_password" form={access} setForm={setAccess} type="password" required={!!access.password} minLength={10} autoComplete="new-password" />
    <Field label="Portal access" name="user_active" form={access} setForm={setAccess}><option value="1">Enabled</option><option value="0">Disabled</option></Field>
  </>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h3 className="text-xl font-bold text-white">Staff & human resources</h3><p className="mt-1 text-sm text-slate-400">People, employment records and portal access.</p></div>
      <div className="flex gap-2"><button className={buttonStyle} onClick={load} disabled={loading} aria-label="Refresh staff"><RefreshCw size={15} /></button><button className={`${buttonStyle} border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300`} onClick={() => openEditor(null)}><Plus size={15} />Add staff member</button></div>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[['Total staff', staff.length], ['Active employees', staff.filter(s => Number(s.is_active) === 1).length], ['Portal access enabled', staff.filter(s => s.has_portal_account && Number(s.user_active) === 1 && Number(s.is_active) === 1).length], ['Without portal accounts', staff.filter(s => !s.has_portal_account).length]].map(([label, value]) => <div key={label} className="border-l-2 border-amber-400/60 bg-slate-900 px-4 py-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-2xl font-semibold text-white">{value}</div></div>)}
    </div>
    <div className="flex gap-1 border-b border-slate-800"><button className={`${buttonStyle} rounded-b-none ${view === 'directory' ? 'border-amber-400 text-amber-400' : ''}`} onClick={() => setView('directory')}><Users size={15} />Staff directory</button><button className={`${buttonStyle} rounded-b-none ${view === 'activity' ? 'border-amber-400 text-amber-400' : ''}`} onClick={showAudit}><History size={15} />Recent activity</button></div>
    {notice && <div role="status" className="flex justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {error && <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}<button className="ml-3 underline" onClick={load}>Try again</button></div>}
    {view === 'directory' ? <>
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-56 flex-1"><span className="sr-only">Search staff</span><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className={`${inputStyle} pl-10`} placeholder="Search name, staff number, username or phone" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <select aria-label="Filter employment status" className={`${inputStyle} sm:w-auto`} value={status} onChange={e => setStatus(e.target.value)}><option value="all">All employment statuses</option><option value="1">Active staff</option><option value="0">Inactive staff</option></select>
        <select aria-label="Filter portal role" className={`${inputStyle} sm:w-auto`} value={portalRole} onChange={e => setPortalRole(e.target.value)}><option value="all">All portal roles</option><option value="teacher">Teacher</option><option value="admin">Administrator</option><option value="bursar">Bursar</option><option value="none">No portal account</option></select>
        <select aria-label="Filter assigned class" className={`${inputStyle} sm:w-auto`} value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="">All class assignments</option>{classNames.map(name => <option key={name}>{name}</option>)}</select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-sm"><thead className="bg-slate-900 text-xs text-slate-400"><tr>{['Staff member', 'Employment & assignment', 'Contact', 'Portal account', 'Manage'].map(h => <th className="px-4 py-3 font-semibold" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">
        {loading ? <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading staff records…</td></tr> : filtered.length ? filtered.map(s => <tr key={s.id} className="bg-slate-950/50 align-top hover:bg-slate-900/60">
          <td className="min-w-44 px-4 py-4"><button className="text-left font-bold text-white hover:text-amber-400" onClick={() => openEditor(s)}>{s.name}</button><div className="mt-1 text-xs text-slate-400">{s.staff_no}</div><span className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${Number(s.is_active) === 1 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{Number(s.is_active) === 1 ? 'Active' : 'Inactive'}</span></td>
          <td className="min-w-40 px-4 py-4 text-slate-200">{s.role}<div className="mt-1 text-xs text-slate-400">{s.assigned_class || 'No class assigned'}</div><div className="mt-1 text-xs text-slate-500">{s.employment_type || 'Employment type not set'}</div></td>
          <td className="px-4 py-4 text-xs text-slate-300"><div>{s.phone || 'No phone on file'}</div><div className="mt-1 break-all text-slate-400">{s.email || 'No email on file'}</div></td>
          <td className="px-4 py-4 text-xs"><div className="font-semibold text-slate-200">{s.username || 'No portal account'}</div><div className="mt-1 text-slate-400">{s.has_portal_account ? `${s.user_role} · ${Number(s.user_active) === 1 ? 'Enabled' : 'Disabled'}` : 'Create access to enable sign-in'}</div></td>
          <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button className={buttonStyle} onClick={() => openEditor(s)}><Pencil size={13} />Edit record</button><button className={buttonStyle} onClick={() => openEditor(s, 'access')}><KeyRound size={13} />Portal access</button><button className={buttonStyle} onClick={() => onPrintId(s)}><CreditCard size={13} />ID card</button></div></td>
        </tr>) : <tr><td colSpan={5} className="p-10 text-center text-slate-400">No staff match these filters.</td></tr>}
      </tbody></table><div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">Showing {filtered.length} of {staff.length} staff members</div></div>
    </> : <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">{audit.length ? audit.map((entry, i) => <div key={i} className="flex flex-wrap justify-between gap-2 p-4 text-sm"><div className="text-slate-200">{entry.action}<span className="ml-2 text-amber-400">{entry.staff_no}</span><div className="mt-1 text-xs text-slate-400">By {entry.actor_name}</div></div><time className="text-xs text-slate-400">{entry.created_at} UTC</time></div>) : <div className="p-8 text-center text-sm text-slate-400">Staff changes will appear here after you save a record.</div>}</div>}
    {editor && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="staff-editor-title" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-700 p-5"><div><h4 id="staff-editor-title" className="text-lg font-bold text-white">{editor.creating ? 'Add staff member' : editor.name}</h4><p className="mt-1 text-xs text-slate-400">{editor.creating ? 'Create an employment record and optional portal account.' : editor.staff_no}</p></div><button className={buttonStyle} disabled={saving} onClick={() => setEditor(null)} aria-label="Close staff editor"><X size={18} /></button></div>
        {!editor.creating && <div className="flex flex-wrap gap-2 border-b border-slate-700 px-5 py-3">{[['profile', 'Personal details'], ['employment', 'Employment'], ['emergency', 'Emergency contacts'], ['access', 'Portal access']].map(([key, label]) => <button key={key} className={`${buttonStyle} ${tab === key ? 'border-amber-400 text-amber-400' : ''}`} disabled={saving} onClick={() => { setTab(key); setModalError(''); }}>{label}</button>)}</div>}
        <form onSubmit={save} className="flex min-h-0 flex-col">
          <div className="space-y-5 overflow-y-auto p-5">
            {modalError && <div role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{modalError}</div>}
            {(tab === 'profile' || editor.creating) && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" form={form} setForm={setForm} required /><Field label="Designation / job title" name="role" form={form} setForm={setForm} required />
              <Field label="Email address" name="email" form={form} setForm={setForm} type="email" /><Field label="Phone number" name="phone" form={form} setForm={setForm} type="tel" />
              <Field label="Gender" name="gender" form={form} setForm={setForm}><option value="">Not specified</option><option>Female</option><option>Male</option></Field><Field label="Date of birth" name="dob" form={form} setForm={setForm} type="date" />
              <Field label="Home address" name="address" form={form} setForm={setForm} /><Field label="Qualification" name="qualification" form={form} setForm={setForm} />
            </div>}
            {(tab === 'employment' || editor.creating) && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employment type" name="employment_type" form={form} setForm={setForm}><option>Full time</option><option>Part time</option><option>Contract</option><option>Internship</option></Field><Field label="Employment start date" name="date_employed" form={form} setForm={setForm} type="date" />
              <Field label="Assigned class" name="assigned_class" form={form} setForm={setForm}><option value="">No class assigned</option>{classNames.map(name => <option key={name}>{name}</option>)}</Field><Field label="Additional responsibilities" name="form_responsibility" form={form} setForm={setForm} />
              <label className="space-y-1.5 text-xs font-semibold text-slate-300"><span>Employment status</span><select className={inputStyle} value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: Number(e.target.value) }))}><option value={1}>Active</option><option value={0}>Inactive</option></select></label>
              {Number(form.is_active) === 0 && <p className="text-sm text-amber-300">Saving an inactive status also disables portal access.</p>}
            </div>}
            {tab === 'emergency' && <div className="grid gap-4 sm:grid-cols-2"><Field label="Emergency contact name" name="emergency_contact_name" form={form} setForm={setForm} /><Field label="Emergency contact phone" name="emergency_contact" form={form} setForm={setForm} type="tel" /><Field label="Blood group" name="blood_group" form={form} setForm={setForm} /></div>}
            {editor.creating && <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />Create a portal account</label>}
            {(tab === 'access' || (editor.creating && createAccount)) && <><div className="flex gap-3 rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-300"><ShieldCheck className="shrink-0 text-amber-400" size={18} /><p>Set the username, role and sign-in access. Passwords are never displayed. Use at least 10 characters for a new password. Saving access changes signs this staff member out.</p></div><div className="grid gap-4 sm:grid-cols-2">{accessFields}</div></>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-700 p-4"><button type="button" className={buttonStyle} onClick={() => setEditor(null)} disabled={saving}>Cancel</button><button type="submit" disabled={saving} className={`${buttonStyle} border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300`}><Save size={15} />{saving ? 'Saving…' : editor.creating ? 'Add staff member' : 'Save changes'}</button></div>
        </form>
      </section>
    </div>}
  </div>;
}

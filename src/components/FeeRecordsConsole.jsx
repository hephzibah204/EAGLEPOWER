import React, { useState, useEffect, useCallback } from 'react';
import { getApiBase, apiFetch } from '../config/api';

export default function FeeRecordsConsole({ onChange }) {
  const [debts, setDebts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [mismatches, setMismatches] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [overdue, setOverdue] = useState(true);
  const [form, setForm] = useState({ invoice_id: '', kind: 'credit', amount: '', reference: '', reason: '' });
  const load = useCallback(async () => {
    const responses = await Promise.all(['debts?overdue=' + overdue, 'reminders', 'adjustments', 'reconciliation'].map(path => apiFetch(getApiBase() + '/finance/' + path)));
    const data = await Promise.all(responses.map(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.message || 'Unable to load fee records'); return body.data; }));
    setDebts(data[0]); setReminders(data[1]); setCorrections(data[2]); setMismatches(data[3]);
  }, [overdue]);
  useEffect(() => { Promise.resolve().then(load).catch(error => setMessage(error.message)); }, [load]);
  async function submit(path, body, method = 'POST') {
    setBusy(true); setMessage('');
    try {
      const response = await apiFetch(getApiBase() + '/finance/' + path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to save');
      setMessage(path === 'reminders/queue' ? `${result.queued} reminders queued; ${result.missing_contacts} invoices need guardian contact details. Queued does not mean sent.` : path.startsWith('reminders/contact') ? 'Guardian reminder preference recorded.' : path.endsWith('due-date') ? 'Due date updated.' : 'Correction recorded. Original receipts are retained.');
      await load(); onChange?.();
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  function download() {
    const columns = ['invoice_no', 'student_name', 'class_name', 'session', 'term', 'due_date', 'amount_due', 'amount_paid', 'balance_due', 'overdue'];
    const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
    const blob = new Blob([columns.join(',') + '\r\n' + debts.map(row => columns.map(column => cell(row[column])).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'school-fee-debt-register.csv'; link.click(); URL.revokeObjectURL(url);
  }
  const button = 'rounded-lg bg-emerald-400 px-4 py-2 text-slate-950 font-bold disabled:opacity-50';
  const input = 'rounded-lg border border-slate-700 bg-slate-900 p-2 text-white';
  return <section className="mb-6 space-y-4 rounded-2xl border border-slate-700 bg-slate-950 p-5 text-sm">
    <h3 className="text-lg font-bold text-white">Fee records, overdue balances & parent reminders</h3>
    <div className="flex flex-wrap gap-3 items-center">
      <label><input type="checkbox" checked={overdue} onChange={event => setOverdue(event.target.checked)} /> Overdue invoices only</label>
      <button className={button} onClick={download}>Export complete register</button>
      <button className={button} disabled={busy} onClick={() => submit('reminders/queue', {})}>Queue overdue reminders</button>
      <button className={button} disabled={busy} onClick={() => load().catch(error => setMessage(error.message))}>Refresh records</button>
    </div>
    <p>{debts.length} invoices · NGN {debts.reduce((sum, row) => sum + Number(row.balance_due), 0).toLocaleString()} outstanding in this register.</p>
    <p className="text-slate-400">Invoices without a due date are included in the full register and excluded from automatic overdue reminders. Confirm the guardian phone with the parent before enabling reminders. Sending runs during school hours when the messaging service is configured.</p>
    {mismatches.length > 0 && <p role="alert" className="text-rose-300">{mismatches.length} invoices need ledger reconciliation: {mismatches.map(row => row.invoice_no).join(', ')}. Review original receipts before correcting balances.</p>}
    {message && <p role="status" className="text-amber-300">{message}</p>}
    <div className="max-h-80 overflow-auto"><table className="w-full text-left"><thead><tr>{['Invoice', 'Student', 'Class', 'Due date', 'Balance', 'Guardian reminders'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{debts.map(row => <tr key={row.id} className="border-t border-slate-800"><td className="p-2">{row.invoice_no} (ID {row.id})</td><td>{row.student_name}</td><td>{row.class_name}</td><td>{row.due_date || 'Not set'}</td><td>NGN {Number(row.balance_due).toLocaleString()}</td><td><p>{row.guardian_phone || 'Missing guardian phone'}</p><button disabled={busy} className={button} onClick={() => submit('reminders/contact/' + row.student_id, {verified:true,opted_out:false}, 'PUT')}>Confirm guardian contact</button><button disabled={busy} className={button} onClick={() => submit('reminders/contact/' + row.student_id, {verified:false,opted_out:true}, 'PUT')}>Opt out</button></td></tr>)}</tbody></table></div>
    <details><summary className="cursor-pointer font-bold">Set an invoice due date</summary><form className="flex flex-wrap gap-3 py-3" onSubmit={event => {event.preventDefault(); submit('invoices/' + form.invoice_id + '/due-date', {due_date:dueDate}, 'PUT');}}><label>Invoice ID <input className={input} type="number" min="1" required value={form.invoice_id} onChange={e => setForm({...form,invoice_id:e.target.value})}/></label><label>Due date <input className={input} type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}/></label><button disabled={busy} className={button}>Save due date</button></form></details>
    <details><summary className="cursor-pointer font-bold">Record a credit, cancellation, refund or reversal</summary>
      <p className="my-3 text-slate-400">Record refunds after the bursary has returned the money. This form records the correction and does not transfer funds.</p>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); submit('adjustments', form); }}>
        <label>Invoice ID <input className={input + ' w-full'} required type="number" min="1" value={form.invoice_id} onChange={e => setForm({ ...form, invoice_id: e.target.value })} /></label>
        <label>Correction <select className={input + ' w-full'} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>{['credit', 'cancel', 'refund', 'reversal'].map(kind => <option key={kind}>{kind}</option>)}</select></label>
        {['amount', 'reference', 'reason'].map(field => <label key={field}>{field}<input required className={input + ' w-full'} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} /></label>)}
        <button disabled={busy} className={button}>Record correction</button>
      </form>
    </details>
    <details><summary className="cursor-pointer font-bold">Reminder history ({reminders.length}, latest 500)</summary>{reminders.map(row => <p key={row.id} className="py-1">Invoice {row.invoice_id} · {row.status} · {row.created_at}{row.delivered_at ? ' · Delivered ' + row.delivered_at : ''}</p>)}</details>
    <details><summary className="cursor-pointer font-bold">Correction history ({corrections.length})</summary>{corrections.map(row => <p key={row.id} className="py-1">Invoice {row.invoice_id} · {row.kind} · NGN {row.amount} · {row.reference} · {row.reason} · {row.actor}</p>)}</details>
  </section>;
}

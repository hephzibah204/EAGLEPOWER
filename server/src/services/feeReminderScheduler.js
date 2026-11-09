import db from '../config/db.js';
import { queueFeeReminders, dispatchFeeReminders } from './feeWorkflow.js';
let running = false;
export async function runFeeReminders() {
 if (running) return;
 const origin = process.env.WHATSAPP_BOT_ORIGIN;
 const key = process.env.WHATSAPP_SERVICE_KEY;
 if (!origin || !key || key.length < 32) return;
 const url = new URL(origin);
 if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') throw new Error('Invalid bot origin');
 running = true;
 try {
  const response = await fetch(new URL('/fee-reminders/status',url), {redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer ' + key}});
  if (!response.ok) throw new Error('Gateway unavailable');
  const receipts = await response.json();
  for (const [id, receipt] of Object.entries(receipts)) {
   if (receipt.status === 'delivered' && receipt.message_id && receipt.delivered_at) db.prepare("UPDATE fee_reminders SET status = 'delivered', delivered_at = ? WHERE id = ? AND provider_message_id = ?").run(receipt.delivered_at,Number(id),receipt.message_id);
  }
  queueFeeReminders();
  await dispatchFeeReminders(async (phone,text,id) => {
   const response = await fetch(new URL('/fee-reminders/send',url), {method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',Authorization:'Bearer ' + key},body:JSON.stringify({phone,text,id})});
   if (!response.ok) throw new Error('Gateway unavailable');
   const result = await response.json();
   return result.message_id;
  });
 } finally {running = false;}
}
export function startFeeReminderScheduler() {
 if (process.env.ENABLE_FEE_REMINDERS !== 'true') return;
 const run = () => {
  const hour = Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Lagos',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  if(hour >= 9 && hour < 17) runFeeReminders().catch(() => console.warn('Fee reminder run failed; review queue.'));
 };
 const timer = setInterval(run, 15 * 60 * 1000); timer.unref(); run();
}

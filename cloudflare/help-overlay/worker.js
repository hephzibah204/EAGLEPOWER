// eaglepower-help-overlay v1 (2026-11-26)
// Serves the live /help/ page with two additions injected at the edge:
//  A) Form teacher has no phone / reassigning form-teacher duties
//  B) Teacher forgot her password (admin reset, passwords cannot be viewed)
// plus mobile legibility CSS. The underlying Pages deployment is untouched;
// deleting this Worker + its routes restores the original page exactly.
// If the source page is ever updated to contain the marker below, this
// Worker passes the page through unchanged.

const MARKER = "eph-help-v1";

const CSS = `
/* ${MARKER} mobile legibility fixes */
@media (max-width: 640px) {
  main p, main li { line-height: 1.65 !important; }
  main p { font-size: 15px !important; color: #cbd5e1 !important; }
  main .text-xs { font-size: 14px !important; line-height: 1.6 !important; }
  main h3 { font-size: 17px !important; line-height: 1.35 !important; }
  header > div { flex-wrap: wrap !important; }
  header a { min-height: 44px !important; align-items: center !important; }
  main { padding-left: 16px !important; padding-right: 16px !important; }
  main table { font-size: 13px !important; }
  main div:has(> table) { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
  main button, main a { min-height: 44px; }
}
.eph-wrap { max-width: 72rem; margin: 24px auto 0; display: grid; gap: 16px; }
.eph-card { border: 1px solid #f59e0b55; background: #020617; border-radius: 16px; padding: 22px; }
.eph-card h2 { color: #fff; font-weight: 900; font-size: 20px; line-height: 1.3; margin: 0 0 6px; }
.eph-card h3 { color: #fbbf24; font-weight: 800; font-size: 16px; margin: 18px 0 6px; }
.eph-card p, .eph-card li { color: #cbd5e1; font-size: 16px; line-height: 1.65; }
.eph-card ol, .eph-card ul { padding-left: 22px; margin: 6px 0; }
.eph-card ol { list-style: decimal; } .eph-card ul { list-style: disc; }
.eph-tag { display: inline-block; color: #fbbf24; border: 1px solid #f59e0b55; background: #f59e0b1a;
  border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 700; margin-bottom: 10px; }
.eph-card strong { color: #fff; }
.eph-warn { border-left: 4px solid #f59e0b; background: #f59e0b14; padding: 10px 14px; border-radius: 8px; margin-top: 12px; }
`;

const SECTIONS = `
<section class="eph-wrap" id="eph-help-additions" data-marker="${MARKER}">
  <article class="eph-card" id="help-form-teacher-no-phone">
    <span class="eph-tag">New &middot; Form Teachers</span>
    <h2>Form Teacher Has No Phone: Handing Form-Teacher Duties to Another Teacher</h2>
    <h3>First, the simple option</h3>
    <p>The portal is a website, not an Android app. A form teacher does <strong>not</strong> need an Android phone. She can log in from any phone browser (Android or iPhone), a laptop or desktop, or the school computer, with her own staff number and password. Nothing needs to be installed.</p>
    <h3>If she still cannot do the form-teacher work regularly, reassign it</h3>
    <p>Yes, another teacher can be made the SSS 3 form teacher. Only an Admin / SuperAdmin can do this, and it takes under a minute:</p>
    <ol>
      <li>Log in as <strong>Admin / SuperAdmin</strong>.</li>
      <li>Open <strong>Classes</strong> in the left menu.</li>
      <li>Find the <strong>SSS 3</strong> class card. It shows the current form teacher&rsquo;s name (or &ldquo;Unassigned&rdquo;).</li>
      <li>Click <strong>Assign Teacher</strong> (or <strong>Change Teacher</strong>).</li>
      <li>In the pop-up, open the <strong>Select Class Master / Form Teacher</strong> dropdown and choose the replacement teacher.</li>
      <li>Click <strong>Save Teacher Assignment</strong>.</li>
    </ol>
    <p>From her next login, the replacement teacher has full form-teacher access for SSS 3: the class register and attendance, entry and editing of all subjects for SSS 3 in the gradebook, and the form teacher&rsquo;s comment on report cards.</p>
    <div class="eph-warn">
      <p><strong>Please note:</strong> the replacement teacher logs in with <strong>her own</strong> staff number and password. Never share or borrow another teacher&rsquo;s password. Reassigning replaces the previous form teacher for that class; to hand the class back, repeat the same steps and choose the original teacher again. Attendance, scores and comments already saved stay with the class, nothing is lost.</p>
    </div>
  </article>

  <article class="eph-card" id="help-forgot-password">
    <span class="eph-tag">New &middot; Login Help</span>
    <h2>Teacher Forgot Her Password, Even by One Character</h2>
    <h3>What cannot be done</h3>
    <p>Passwords are stored scrambled (hashed). <strong>Nobody, not even the Admin or ICT, can view a password or see what its last character was.</strong> There is no screen that shows it. One wrong character means the password is forgotten, and it must be reset. Please do not keep guessing: repeated wrong attempts can lock the account.</p>
    <h3>How the Admin resets it</h3>
    <ol>
      <li>The teacher tells the Admin / SuperAdmin that she is locked out, giving her <strong>staff number / username</strong>, never a password.</li>
      <li>Admin logs in and opens <strong>Users</strong> (SuperAdmin IAM &amp; User Directory).</li>
      <li>Search for the teacher&rsquo;s account.</li>
      <li>If the account shows as locked, click <strong>Unlock</strong> first.</li>
      <li>Click <strong>Reset PIN / Reset Password</strong> on her row.</li>
      <li>Type a new password for her when prompted: minimum 8 characters, with letters and numbers. Note it exactly, character by character.</li>
      <li>Give that new password to the teacher privately, in person or by a private message to her alone, never in a staff group chat.</li>
    </ol>
    <h3>What the teacher does next</h3>
    <ol>
      <li>Log in with her staff number and the new password the Admin gave her.</li>
      <li>Immediately change it to one only she knows: open <strong>Change Password</strong>, enter the Admin-given password as the current password, then enter and confirm her own new password.</li>
      <li>Keep the new password in a safe private place. If she forgets it again, this same Admin reset is the only route back in.</li>
    </ol>
    <div class="eph-warn">
      <p><strong>When creating a new password:</strong> type it slowly, check capital letters, and make sure both entries match before saving. The portal cannot remind you of any character afterwards.</p>
    </div>
  </article>

  <article class="eph-card" id="help-faq-new">
    <span class="eph-tag">FAQ</span>
    <h2>Quick Answers</h2>
    <p><strong>Q: Our SSS 3 form teacher has no Android phone. What do we do?</strong><br/>She does not need one, the portal works in any browser, including a school computer. If she still cannot carry the duties, an Admin can make another teacher the form teacher: Classes &rarr; SSS 3 &rarr; Assign/Change Teacher &rarr; choose the teacher &rarr; Save Teacher Assignment.</p>
    <p><strong>Q: A teacher forgot her password, she only missed the last character. Can we recover it?</strong><br/>No. Passwords cannot be viewed by anyone, including Admin/ICT. Stop guessing, it can lock the account. An Admin resets it instead: Users &rarr; find the teacher &rarr; Unlock if locked &rarr; Reset PIN &rarr; set a new password and give it to her privately. She then logs in and changes it herself.</p>
    <p><strong>Q: Can two teachers share one login for form-teacher work?</strong><br/>No. Never share passwords. Assign the form-teacher role to the teacher who will do the work, and let her use her own login.</p>
  </article>
</section>
`;

export default {
  async fetch(request) {
    const response = await fetch(request);
    const type = response.headers.get("content-type") || "";
    if (response.status !== 200 || !type.includes("text/html")) return response;

    const html = await response.text();
    if (html.includes(MARKER) || !html.includes("</main>")) {
      return new Response(html, response);
    }

    const out = html
      .replace("</head>", `<style>${CSS}</style></head>`)
      .replace("</main>", `${SECTIONS}</main>`);

    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    headers.set("x-eph-help-overlay", "v1");
    return new Response(out, { status: response.status, headers });
  },
};

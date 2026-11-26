# Eagle Power Schools — Help Page Additions
Prepared 2026-11-26, from Adaeze's questions. Steps below were checked against the portal code (`PortalDashboard.jsx` + the `assign-teacher` and `users/:id/reset-password` endpoints), not guessed.

Live page checked: https://eaglepowerschools.com.ng/help/
Current state: the page lists "3. Managing Classrooms & Form Teacher Appointments" and "7. Staff IAM, Identity Cards & Digital Signature Studio", but neither situation below is explained in plain steps, and there is no FAQ for them. Add both as full sections, plus FAQ entries.

---

## NEW SECTION A — Form teacher has no phone: handing form-teacher duties to another teacher

### A1. First, the simple option
The portal is a website, not an Android app. A form teacher does **not** need an Android phone. She can log in from:
- any phone browser (Android or iPhone),
- a laptop or desktop,
- the school computer / ICT room computer,

at the normal portal address, with her own staff number and password. Nothing is installed.

### A2. If she still cannot do the form-teacher work regularly, reassign it
Yes, another teacher can be made the SSS 3 form teacher. Only an Admin / SuperAdmin can do this. It takes under a minute:

1. Log in as **Admin / SuperAdmin**.
2. Open **Classes** in the left menu.
3. Find the **SSS 3** class card. It shows the current form teacher's name (or "Unassigned").
4. Click **Assign Teacher** (or **Change Teacher** if one is already shown).
5. In the pop-up headed **"Assign Form Teacher: SSS 3"**, open the **Select Class Master / Form Teacher** dropdown.
6. Choose the replacement teacher from the list.
7. Click **Save Teacher Assignment**.

From her next login, the replacement teacher gets full form-teacher access for SSS 3: the class register and attendance, entry and editing of **all subjects** for SSS 3 in the gradebook, and the form teacher's comment on report cards.

### A3. Rules that must be stated on the page
- The replacement teacher logs in **with her own staff number and her own password**. Never share or borrow the original teacher's password.
- Reassigning replaces the previous form teacher for that class. To hand the class back later, repeat the same steps and choose the original teacher again.
- Choosing **"-- No Teacher Assigned (Unassign) --"** in the dropdown leaves the class with no form teacher.
- Nothing already entered is lost: attendance, scores and comments already saved for SSS 3 stay with the class, not with the teacher.

---

## NEW SECTION B — Teacher forgot her password, even by one character

### B1. What cannot be done, stated plainly
Passwords are stored scrambled (hashed). **Nobody, not even the Admin or ICT, can view a password or see what its last character was.** There is no screen that shows it, and guessing is not advised: repeated wrong attempts can lock the account.

So do not keep trying variations. One wrong character means the password is simply forgotten, and it must be reset.

### B2. How the Admin resets it (the fix)
Only an Admin / SuperAdmin can reset a teacher's password:

1. The teacher tells the Admin / SuperAdmin (in person or on WhatsApp) that she is locked out. She should give her **staff number / username**, not any password.
2. Admin logs in and opens **Users** (SuperAdmin IAM & User Directory).
3. Search for the teacher's account.
4. If the account shows as locked, click **Unlock** first.
5. Click **Reset PIN / Reset Password** on her row.
6. Type a **new password for her** when prompted: minimum 8 characters, with letters and numbers. Note it exactly, character by character.
7. Give that new password to the teacher privately, in person or by a private WhatsApp message to her alone, never in a staff group chat.

### B3. What the teacher does next
1. Log in with her staff number and the new password the Admin gave her.
2. Immediately change it to one only she knows: open **Change Password**, enter the Admin-given password as "Current Password", then enter and confirm her own new password (minimum 8 characters, letters and numbers).
3. Write the new password down privately or save it in a safe place. If she forgets it again, the same reset in B2 is the only route back in.

### B4. Prevention note to add to the page
When you create a new password, type it slowly, check capital letters, and confirm it matches before saving. The portal cannot remind you of any character afterwards.

---

## FAQ entries to add (short versions, linking to A and B)

**Q: Our SSS 3 form teacher has no Android phone. What do we do?**
A: She does not need one, the portal works in any browser, including a school computer. If she still cannot carry the duties, an Admin can make another teacher the SSS 3 form teacher in under a minute: Classes → SSS 3 → Assign/Change Teacher → choose the teacher → Save Teacher Assignment. See Section A.

**Q: A teacher forgot her password, she only missed the last character. Can we recover it?**
A: No. Passwords cannot be viewed by anyone, including Admin/ICT. Stop guessing, it can lock the account. An Admin resets it instead: Users → find the teacher → Unlock (if locked) → Reset PIN → set a new password and give it to her privately. She then logs in and changes it herself. See Section B.

**Q: Can two teachers share one login for form-teacher work?**
A: No. Never share passwords. Assign the form-teacher role to the teacher who will do the work, and let her use her own login. See Section A3.

---

## Mobile formatting fixes for /help/ (from Abiodun's screenshot, 2026-11-26)

The content is there, but on a phone the page is hard to read. Fixes to apply to the help page template:

1. **Body text too small and low-contrast on mobile:** body copy is light grey on near-black at roughly 14px. Raise body to **16px minimum, line-height 1.65**, and lift body colour to at least #CBD5E1 on the dark background. Headings stay white.
2. **Header does not stack cleanly:** on a narrow screen the logo/title, "Back to Home" and "Launch Portal" squeeze into one row and the middle button wraps into a tall block. Below 640px, stack them: title on its own row, the two buttons side-by-side full-width underneath, each at least 44px tall.
3. **Cards are too tight to the screen edge:** add 16px page padding on mobile and 20px inside each card so text never touches the card border.
4. **Long scheme text runs as one dense block:** keep each scheme (Primary 40/60, Secondary 30/70) as its own card, with the marks breakdown as short separate lines / a small list, not one paragraph.
5. **Tables overflow:** the subjects directory and assessment matrix tables must sit in a horizontal-scroll wrapper on mobile, with the first column sticky, instead of squeezing or clipping.
6. **Topic filter and section navigation:** make the filter chips horizontally scrollable with larger tap targets (44px), and keep a sticky "back to top / sections" link, because the manual is long.
7. **Tap targets and spacing generally:** minimum 44px tap height for all buttons and links in the manual, and at least 12px between stacked cards.
8. Verify after the change on a real phone at 360px width, in portrait, before calling it done, a screenshot check, not just a desktop preview.

---

## Ready-to-send reply to Adaeze (WhatsApp)

Good evening. On the two issues:

1. SSS 3 form teacher with no Android phone
She does not actually need an Android phone, the portal is a website and works on any phone browser or on a school computer. But yes, if she cannot carry the form-teacher work, another teacher can be given the responsibility. An Admin does it this way: log in as Admin, open Classes, find SSS 3, click Assign Teacher / Change Teacher, select the other teacher, and click Save Teacher Assignment. From her next login, that teacher will have the full SSS 3 form-teacher access. She must use her own staff number and password, nobody should share the first teacher's password.

2. Teacher who forgot the last character of her new password
That one cannot be recovered. Passwords are stored in a way that nobody, not even Admin or ICT, can view them or see the last character. Please tell her to stop guessing, because repeated wrong tries can lock the account. What we do instead is a reset: Admin opens Users, finds her account, clicks Unlock if it is locked, then Reset PIN and sets a new password for her. She logs in with that and immediately changes it to her own new password.

I am adding both explanations, step by step, to the help page at eaglepowerschools.com.ng/help so any teacher can follow them next time.

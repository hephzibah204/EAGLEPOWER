# School-supplied WhatsApp information — 19 October 2026

Source: the user's open conversation with **Eagle Power School Of Excellence** in WhatsApp Web. These are school-supplied statements, not independently verified competition records. Only this school conversation was opened for extraction; unrelated chat-list previews are not part of this record. No messages were sent.

## Website expansion and subsequent confirmations

The user confirmed **Nneka Nwarisi — Head Teacher Nursery** and **Mary Nwoye — Dean of Studies**. Subsequent chat messages explicitly quote the corresponding portrait captions with these names (5:40 PM and 5:41 PM). A forwarded text following the final 2:12 PM portrait identifies **Adaeze Uzoefuna — Vice Principal Admin**. All six management entries now have names, roles and supplied portraits.

The expanded gallery contains **17 event photographs and five MP4 videos**, downloaded through WhatsApp's Download controls. Download/source filenames are recorded in `school-source-media/gallery-import-manifest.json`. Uncaptioned event media use general school-event descriptions rather than invented event dates, venues or speakers. Videos are available through native playback controls without autoplay or initial video-file loading. The gallery initially shows nine items with a Show more control and media/category filters.

All five videos now have individual JPEG thumbnails extracted from their own footage and connected through each gallery item's `poster` field. These images appear on the cards and on the native player before playback. Frames were visually reviewed; portrait clips retain their full frame within navy sidebars. The images are 960 × 540 and approximately 40–85 KB each. No AI-generated scene was substituted for the video content.

Thumbnail update verification: focused lint and the Next.js production build/static export passed. All five poster files and references were verified in `out/`. Two subsequent attempts to publish this thumbnail update failed with Cloudflare connection errors; the earlier successful deployment does not yet include these thumbnails.

Expanded-update checks: all 22 gallery IDs are unique, all media references exist, and each of the five MP4 files has an MP4 header, movie index and H.264/AAC streams. Focused lint passes with the existing unused Navbar prop warning. Both Next.js production build/static export and Vite production build pass; Vite retains its existing bundle-size warning. The in-app browser could not attach to new preview tabs or reach the local preview, so visual layout and actual playback are not reported as browser-verified. No public deployment was performed.

Photos are also used outside the gallery: a large state spelling-bee photograph in the homepage spotlight, management portraits and principal profile in About Us, the supplied school-entrance/community photograph beside Contact Us details, and matching state championship, graduation and Children’s Day trophy photos on news cards.

The principal's latest portrait has an AI-edited slate-grey studio backdrop. His original JPEG and transparent cutout remain preserved. The website uses `public/assets/school-updates/principal-nnamdi-nathaniel-studio.png`; prompt details are in `NNAMDI-PORTRAIT-EDIT.md`.

The earlier extraction notes below describe what was available at the initial review; the confirmations and media collection in this section supersede those earlier pending items. Video speech has not been transcribed, and the exact content of every clip has not been certified through a browser playback test.

## Information extracted and used

### National spelling bee — message at 12:40 PM

- Nigeria Spelling Bee National Grand Finale and 10th Anniversary Celebration: **1 August 2026**, Deeper Life High School, Uyo Campus, Akwa Ibom State.
- **Miss Udemba Chimamanda**, Eaglepower College of Excellence, Awka: **Second Runner-up**, Senior Secondary category.
- Coach: **Mrs. Mary Ndidi Nwoye**.
- She was one of six Anambra representatives in the Senior Secondary category.
- The school states that the placement earned selection among three national champions to represent Nigeria at the Africa Spelling Bee Championship planned for Zambia “next year.” The event narrative is dated 2026, so the website describes this as planned for **2027**, not an event already held or a confirmed current schedule.

### State spelling bee — caption at 12:40 PM

- Nigeria Spelling Bee Anambra State Championship: **14 February 2026**, St. Albert Secondary School, Obosi.
- **Udemba Chimamanda Esther Chidimma**, Eaglepower College of Excellence: **State Champion**, Senior Secondary category.
- **Okechukwu Joachim Chiagozie**, Eaglepower College of Excellence: **Second Runner-up**.
- **Lawrence-Uba Shalom Onyedikachukwu**, Eaglepower College of Excellence: **Third Runner-up**.
- Other schools' placements mentioned in the source: Ejiofor Chiamaka Favour, Susu College (First Runner-up); Ukachukwu Jane Chisom, Loretto Special Science School (Fourth Runner-up); Ifeanyi Chinecherem Stella Maris, St. Albert the Great (Fifth Runner-up).
- Eaglepower's champion and second runner-up joined four other spellers for the national event, **29 July–1 August 2026**, Uyo.

### Children’s Day — message at 12:26 PM

“Primary school won the 1st position in march past competition on Children day 27 May 2026.” No venue or competition organizer was supplied; none has been invented for the website.

### Graduation — image caption at 12:22 PM

“2026 SS3 GRADUATION CEREMONY.” The ceremony's exact calendar date was not supplied; 19 October is the message date, not the event date.

## Staff information and portrait handling

- **Revd Nnamdi Nathaniel — Principal / School manager**, text at 12:47 PM. The user subsequently confirmed that the 12:44 PM portrait belongs to him. It is now used on his public leadership card as `principal-nnamdi-nathaniel.jpeg`; the original remains preserved in the source-media folder.
- **Headteacher Nursery**, portrait caption at 2:02 PM. Name not supplied. The role and supplied portrait are used without inventing a name.
- **Dean of studies**, portrait caption at 2:02 PM. Name not supplied. The role and supplied portrait are used without inventing a name.
- **Echezona Emmanuel Nzekwe — Vice Principal Academics**, portrait caption at 2:02 PM. Name, role and portrait used together.
- **Agbago Adaobi**, portrait caption at 2:12 PM, followed by **“Heat teacher.”** The user subsequently confirmed the role as **Head Teacher**. Her name, confirmed role and portrait are now used on a public leadership card. No school division has been inferred.
- A further uncaptioned picture was visible at 2:12 PM. Its identity and intended use are unknown.

## Media saved

Downloaded through WhatsApp's own Download controls, then copied into the project:

- `public/assets/school-updates/ss3-graduation-2026.jpeg` — 12:22:06 PM graduation attachment.
- `public/assets/school-updates/state-spelling-bee-2026.jpeg` — 12:40:38 PM captioned state championship attachment.
- Five staff portraits under `public/assets/school-updates/`: nursery headteacher, dean of studies, vice principal academics, principal and head teacher. The last two assignments follow the user's clarification.
- Five original staff portraits remain under `docs/school-source-media/`.

The chat also contains additional grouped photos and five video attachments with displayed durations **0:19, 0:02, 0:02, 0:06 and 0:43**. These remaining media have not been downloaded, fully reviewed or transcribed. This extraction does not claim that every photograph or video has been processed.

## Changes applied

- `src/data/schoolUpdates.js` contains sourced news and leadership data.
- `src/data/schoolData.js` uses those four news items, replacing the previous unsubstantiated news placeholders and incorrect October state-championship date.
- News cards use the two correctly captioned event photographs; full stories show supplied details rather than generic filler.
- Leadership cards use the available names/roles and three captioned staff portraits instead of generic staff identities.

## Limits and follow-up

WhatsApp Web reported: **“Use WhatsApp on your phone to see older messages from before 7/21/2026.”** The older-message retrieval control was tried; it returned that limitation. Earlier history is not included. Deleted messages were not recovered.

The Nursery Headteacher's and Dean of Studies' names remain pending; the user will supply further information. Revd Nnamdi Nathaniel's portrait and Agbago Adaobi's Head Teacher title have been confirmed by the user. Review remaining photos/videos before further gallery or media additions. The existing site's other claims, fees, testimonials and statistics were not validated by these chat messages and were not treated as newly confirmed facts.

## Verification

Focused lint passed for the updated content and components. Vite production build passed with the existing large-bundle warning. Image paths were checked against files on disk, including all five leadership entries after the user's clarification. Changes remain local; no website deployment or WhatsApp message was performed.

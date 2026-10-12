# Eagle Power Schools — Official Website Redesign 🦅

> **Citadel of Academic & Moral Excellence**  
> *Eagle Power School of Excellence & Eagle Power College of Excellence*  
> Location: 2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State, Nigeria  
> Domain: `https://www.eaglepowerschools.com.ng/`

---

## 🌟 Executive Summary & Motivation

The original live website hosted at `https://www.eaglepowerschools.com.ng/` suffered from severe infrastructure downtime (connection reset errors / host unavailability at `51.89.7.45` via Afees Host).

This modern redesign re-imagines the digital presence of **Eagle Power Schools** into a world-class, responsive, and high-converting educational portal designed for prospective parents, current students, educators, and alumni.

---

## 🚀 Key Features & Highlights

1. **Brand Identity & Custom Emblem**:
   - Modern SVG school crest featuring the soaring golden eagle, open book of knowledge, academic shield, and royal navy-and-gold visual theme.
   - Distinctive typography using **Plus Jakarta Sans** and **Inter**.

2. **Full Academic Continuum**:
   - **Early Years & Nursery** (Ages 1.5 - 5): Phonics, Montessori sensory discovery, and child care.
   - **Eagle Power School of Excellence** (Primary 1 - 6): Foundational mathematics, diction, STEM, and intro coding.
   - **Eagle Power College of Excellence** (JSS 1 - 3 & SSS 1 - 3): WAEC, NECO, and JAMB distinction preparation with dedicated Science, Arts, and Commercial tracks.

3. **Interactive Features**:
   - **Multi-Step Online Admission Application Modal**:
     - Step 1: Student Information & grade level selection.
     - Step 2: Parent/Guardian contact details & transit preferences.
     - Step 3: Academic background & medical requirements.
     - Step 4: Instant Application Reference generation (e.g. `EPS-2026-XXXX`) with printable slip and celebratory confetti.
   - **Live Tuition & Fee Estimator**:
     - Interactive division selection (Nursery to SSS 3).
     - New intake vs returning student toggles.
     - Optional add-ons: School bus transit, lunch program, uniforms, STEM robotics, and evening exam prep.
     - Real-time termly commitment calculation in Nigerian Naira (`₦`) with copy/share breakdown.
   - **Student & Parent EduPortal Simulator**:
     - Parent authentication with demo login.
     - Termly e-Report Card with subject CA scores, examination totals, letter grades, position, and principal remark.
     - Bursary payment verification & downloadable receipts.
   - **Filterable Campus Life & Facility Gallery**:
     - Interactive inspection of ICT coding lab, science laboratories, spelling bee hall, sports fields, and early years park.
   - **News, Awards & Achievements**:
     - Celebrating victories at the Anambra State Nigeria Spelling Bee, community outreach in Amikwo, and annual STEM exhibitions.
   - **Parent Support & Direct WhatsApp Desk**:
     - Instant one-click WhatsApp chat link with pre-filled admissions inquiry text.
     - Interactive contact and campus tour booking form.
     - Comprehensive FAQ accordion answering admission and transportation queries.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Micro-Interactions**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Deployment Ready**: Optimized static build in `dist/`

---

## 💻 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Create an optimized production build
npm run build

# 4. Preview the production build locally
npm run preview
```

Preview server will run at `http://localhost:4173/` (or port specified in terminal).

---

## 📂 Project Architecture

```
EAGLEPOWER/
├── index.html                   # SEO metadata, OpenGraph tags, Google Fonts, favicon
├── vite.config.js               # Vite config with React & Tailwind CSS v4 plugins
├── package.json                 # Project dependencies & scripts
├── src/
│   ├── main.jsx                 # React root renderer
│   ├── App.jsx                  # Main page assembler & modal manager
│   ├── index.css                # Tailwind import, root variables, scrollbar styling
│   ├── data/
│   │   └── schoolData.js        # Centralized school details, stats, FAQs, fees & news
│   └── components/
│       ├── Logo.jsx             # Custom vector school crest
│       ├── Navbar.jsx           # Top notification bar, navigation, mobile drawer
│       ├── Hero.jsx             # Hero banner, stats counter, credentials
│       ├── AboutSection.jsx     # Director's welcome, vision, mission, core values
│       ├── AcademicsSection.jsx # Divisions, curriculum explorer, co-curriculars
│       ├── WhyUsSection.jsx     # 6 competitive pillars, comparative advantage
│       ├── FeeEstimator.jsx     # Interactive termly tuition calculator (in Naira)
│       ├── CampusLifeSection.jsx# Filterable facility showcase with modal preview
│       ├── NewsSection.jsx      # Latest awards, spelling bee, admissions notice
│       ├── TestimonialsSection.jsx # Parent, alumnus, and educator endorsements
│       ├── FaqSection.jsx       # Interactive accordion for parent questions
│       ├── ContactSection.jsx   # Campus address in Awka, phone, inquiry form
│       ├── Footer.jsx           # Footer directory, newsletter, accreditation note
│       ├── AdmissionModal.jsx   # Multi-step online admission form with confetti
│       ├── PortalDashboard.jsx  # Multi-role EduCore production management portal
│       └── PortalModal.jsx      # Portal entry wrapper
└── dist/                        # Production build output ready for hosting deployment
```

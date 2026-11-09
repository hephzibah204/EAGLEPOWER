import { schoolNews } from './schoolUpdates.js';

export const schoolInfo = {
  name: "Eagle Power Schools",
  tagline: "Soaring on Wings of Academic & Moral Excellence",
  motto: "Love, Truth & Service",
  schoolCodeCollege: "04060088",
  schoolCodePrimary: "04060089",
  foundedYear: 2010,
  address: "2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State, Nigeria",
  shortAddress: "Amikwo, Awka, Anambra State",
  phone: "+234 907 558 0671",
  altPhone: "+234 803 359 1058",
  principalPhone: "+234 706 639 7577",
  whatsapp: "+234 907 558 0671",
  whatsappDisplay: "09075580671",
  whatsappUrl: "https://wa.me/2349075580671?text=Hello%20Eagle%20Power%20Schools,%20I%20would%20like%20to%20inquire%20about%20admissions",
  email: "admissions@eaglepowerschools.com.ng",
  adminEmail: "adaeze3011@gmail.com",
  principalEmail: "principal@eaglepowerschools.com.ng",
  infoEmail: "info@eaglepowerschools.com.ng",
  portalUrl: "https://portal.eaglepowerschools.com.ng/",
  website: "https://www.eaglepowerschools.com.ng",
  schoolHours: "Monday - Friday: 7:30 AM - 3:30 PM",
  divisions: [
    {
      id: "early-years",
      name: "Early Years & Nursery",
      ages: "Ages 1.5 - 5 Years",
      tag: "Foundation Stage",
      description: "Nurturing curiosity, sensory awareness, phonics, and foundational social confidence in a warm, child-centered environment.",
      curriculum: ["Montessori-aligned Phonics", "Early Number Concepts", "Sensory Discovery & Motor Skills", "Creative Arts & Music", "Health & Hygiene Habits"],
      highlights: "Child-safe play grounds, patient caregivers, and stimulating interactive learning kits."
    },
    {
      id: "primary",
      name: "Eagle Power School of Excellence",
      ages: "Primary 1 - 6 (Ages 5 - 11)",
      tag: "Primary Division",
      description: "Developing robust intellectual rigor, critical thinking, linguistic eloquence, and computational ability rooted in strong moral character.",
      curriculum: ["Mathematics & Mental Arithmetic", "English Language, Diction & Literature", "Basic Science & Technology (STEM)", "ICT & Intro to Coding", "Civic Education & History", "French & Cultural Studies"],
      highlights: "Small class sizes, active spelling bee drills, and interactive science discovery."
    },
    {
      id: "secondary",
      name: "Eagle Power College of Excellence",
      ages: "JSS 1 - SSS 3 (Ages 11 - 17)",
      tag: "Secondary & College",
      description: "Prepares students for supreme academic achievement, leadership, and tertiary admissions with track records in WAEC, NECO, and National Competitions.",
      curriculum: [
        "Junior Secondary (BECE): Basic Tech, Business Studies, Intro STEM, French, Agri Science",
        "Senior Science: Physics, Chemistry, Biology, Further Maths, Technical Drawing, Computer Studies",
        "Senior Arts & Humanities: Literature, Government, CRK, History, Civic, Economics",
        "Senior Commercial: Financial Accounting, Commerce, Economics, Marketing"
      ],
      highlights: "Equipped science laboratories, certified WAEC/NECO examiners on faculty, and dedicated JAMB/UTME preparatory clinics."
    }
  ],
  stats: [
    { value: '2026', label: 'Anambra State Spelling Bee Champion', sublabel: 'Udemba Chimamanda Esther Chidimma · Senior Secondary' },
    { value: 'Top 3', label: 'National Spelling Bee Finish', sublabel: 'Second runner-up · Uyo · 1 August 2026' },
    { value: '1st', label: 'Children’s Day March-Past', sublabel: 'Primary school · 27 May 2026' },
    { value: '2026', label: 'SS3 Graduating Class', sublabel: 'Celebrating our students and their next chapter' }
  ],
  coreValues: [
    {
      title: "Excellence",
      desc: "Relentless pursuit of the highest standards in academics, extracurriculars, and personal conduct.",
      icon: "Award"
    },
    {
      title: "Integrity",
      desc: "Instilling deep honesty, moral transparency, and righteous accountability from earliest childhood.",
      icon: "ShieldCheck"
    },
    {
      title: "Innovation & STEM",
      desc: "Empowering children with modern digital literacy, coding, and problem-solving tools for the 21st century.",
      icon: "Cpu"
    },
    {
      title: "Leadership & Service",
      desc: "Cultivating empathetic young men and women prepared to make positive impacts in their communities.",
      icon: "Users"
    }
  ],
  features: [
    {
      title: "State Championship Spelling Bee Heritage",
      desc: "Our college scholars consistently emerge as top champions in the prestigious Nigeria Spelling Bee (Anambra State Chapter), demonstrating master-level vocabulary and poise.",
      icon: "Trophy"
    },
    {
      title: "Ultra-Modern Science & Computer Labs",
      desc: "Fully equipped Physics, Chemistry, Biology, and ICT workstations allowing hands-on experimental learning and practical coding experience.",
      icon: "FlaskConical"
    },
    {
      title: "Safe & Air-Cooled Campus in Awka",
      desc: "Located in the quiet and accessible Amikwo district with 24/7 security, backup solar power, and clean treated water facilities.",
      icon: "Building2"
    },
    {
      title: "Holistic Moral & Spiritual Growth",
      desc: "Structured morning devotionals, character mentoring, etiquette training, and anti-bullying culture ensure rounded development.",
      icon: "HeartHandshake"
    },
    {
      title: "Reliable School Transit Fleet",
      desc: "Air-conditioned school buses with verified drivers and attendants servicing major residential zones across Awka, Amawbia, and environs.",
      icon: "Bus"
    },
    {
      title: "Dynamic Sports & Creative Arts",
      desc: "Football pitch, basketball court, athletics track, debate society, press club, and music orchestra training.",
      icon: "Activity"
    }
  ],
  testimonials: [
    {
      quote: "Enrolling my three children at Eagle Power Schools is one of the best decisions our family has made. Their spoken English, confidence, and mathematical reasoning within just one year left our extended family in awe.",
      author: "Barrister (Mrs.) Chinyere Nwoye",
      role: "Parent of Primary 4 & JSS 2 Scholars",
      location: "Awka"
    },
    {
      quote: "The dedication of the teachers at Eagle Power College is unmatched. They don't just teach for exam pass; they mentor students to be independent thinkers. Winning the Anambra Spelling Bee trophy was a testament to their coaching.",
      author: "Master Kenechukwu Eze",
      role: "College Alumnus & State Spelling Bee Winner",
      location: "Now studying Medicine, UNIZIK"
    },
    {
      quote: "As working parents, knowing our daughter is safe, well-fed, and academically challenged gives us complete peace of mind. The portal makes checking her weekly performance so effortless.",
      author: "Engr. & Dr. Emeka Okafor",
      role: "Parents of Nursery 2 & Primary 1 Pupils",
      location: "Awka South"
    }
  ],
  news: schoolNews,
  faqs: [
    {
      question: "What is the admission procedure for new students?",
      answer: "Prospective parents can fill out our online application form on this website or obtain forms physically at our administrative office in Amikwo, Awka. Candidates for Primary and Secondary sit for a diagnostic entrance exam covering English and Mathematics, followed by a brief parent interview."
    },
    {
      question: "What curriculum do Eagle Power Schools follow?",
      answer: "We run a rich, blended curriculum integrating the Nigerian National Curriculum (NERDC) with international best practices and British curriculum benchmarks. This equips our students to excel in BECE, WAEC, NECO, JAMB/UTME, and international scholarship exams."
    },
    {
      question: "Do you offer school bus transportation?",
      answer: "Yes! We operate dedicated, air-conditioned school buses with monitored routes covering Amikwo, Agu-Awka, Ifite, Amawbia, Okpuno, Aroma Junction, and surrounding neighborhoods with certified drivers and child chaperones."
    },
    {
      question: "How do parents track their children's progress?",
      answer: "Eagle Power Schools provides a modern online Student & Parent Portal. Parents receive unique credentials to view real-time attendance, continuous assessment (CA) scores, termly e-report cards, disciplinary logs, and upcoming assignments from any smartphone."
    },
    {
      question: "What extracurricular clubs and sports are available?",
      answer: "Students participate weekly in Jet & Robotics Club, Spelling & Debating Society, Press & Media Club, Red Cross, Scouts, Music & Choir, Drama & Cultural Troupe, Football, Table Tennis, and Chess."
    },
    {
      question: "What are the school operating hours?",
      answer: "School assembly begins promptly at 7:30 AM, Monday to Friday. Classes conclude at 1:30 PM for Nursery, 2:30 PM for Primary, and 3:30 PM for College students (with optional prep & coaching till 4:30 PM for exam candidates)."
    }
  ],
  feeEstimatorData: {
    divisions: [
      { id: "nursery", name: "Early Years / Nursery", tuitionBase: 85000, desc: "Creche, Reception & Nursery 1-3" },
      { id: "primary-lower", name: "Lower Primary (Basic 1 - 3)", tuitionBase: 95000, desc: "Foundational numeracy & literacy" },
      { id: "primary-upper", name: "Upper Primary (Basic 4 - 6)", tuitionBase: 105000, desc: "Preparation for National Common Entrance" },
      { id: "jss", name: "Junior Secondary (JSS 1 - 3)", tuitionBase: 125000, desc: "BECE & Basic Technology focus" },
      { id: "sss", name: "Senior Secondary (SSS 1 - 3)", tuitionBase: 145000, desc: "WAEC, NECO & JAMB intensive prep" }
    ],
    studentTypes: [
      { id: "new", name: "New Intake / Fresh Registration", regFee: 25000, developmentLevy: 15000 },
      { id: "returning", name: "Returning / Continuing Student", regFee: 0, developmentLevy: 5000 }
    ],
    optionalServices: [
      { id: "bus", name: "School Bus Transit (Return)", cost: 45000, desc: "Daily home pick-up & drop-off" },
      { id: "lunch", name: "Nutritious Hot Lunch Program", cost: 35000, desc: "Balanced chef-prepared daily meals" },
      { id: "uniforms", name: "Complete Uniform Package (2 pairs + sportswear)", cost: 30000, desc: "New students or replacement" },
      { id: "robotics", name: "STEM & Robotics Academy Club", cost: 15000, desc: "Hands-on coding & hardware kits" },
      { id: "prep", name: "Evening Exam Prep / Extra Lesson", cost: 20000, desc: "After-school tutoring & WAEC/JAMB clinics" }
    ]
  }
};

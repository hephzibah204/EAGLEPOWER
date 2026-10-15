/**
 * In-House AI Intelligence Engine for Eagle Power Schools (EduCore)
 * Zero external cloud API dependencies. 100% On-Premise, Autonomous, and Deterministic.
 * 
 * Core Capabilities:
 * 1. Comprehensive Nigerian & International Curriculum Taxonomy across ALL 27 School Subjects
 * 2. Multi-tier Cognitive NLP Tokenizer, Lemmatizer & Semantic Multi-word Concept Matcher
 * 3. Multi-Criteria Homework Evaluation Engine (Concept, Structure, Derivation, Misconceptions)
 * 4. Bayesian Academic Trajectory, Risk Modeling & National Exam Predictor (WAEC/NECO/BECE/JAMB)
 * 5. Culturally Resonant, Hyper-Actionable Parent Coaching & Micro-Intervention Generator
 * 6. Universal Conversational School AI Tutor & Administrative Inquiry Brain
 * 7. Automated Pedagogical Report Card Comment Generator for Teachers & Principal
 */

import db from '../config/db.js';

// ============================================================================
// 1. COMPREHENSIVE CURRICULUM TAXONOMY & KNOWLEDGE BASE (27 SUBJECTS)
// ============================================================================

export const CURRICULUM_TAXONOMY = {
  // --- CORE & STEM SUBJECTS ---
  'Mathematics': {
    code: 'MTH',
    divisions: ['Primary', 'Junior College', 'Senior College', 'All'],
    keyTopics: [
      'Algebraic Processes', 'Quadratic Equations', 'Simultaneous Equations',
      'Geometry & Mensuration', 'Trigonometry & Bearings', 'Statistics & Probability',
      'Number Bases & Modular Arithmetic', 'Logarithms & Indices', 'Commercial Arithmetic'
    ],
    formulasAndTheorems: [
      'Quadratic formula: x = (-b ± √(b² - 4ac)) / (2a)',
      'Pythagoras theorem: a² + b² = c² (for right-angled triangles)',
      'Area of triangle: (1/2) * base * height or (1/2)ab*sin(C)',
      'Circumference of circle: 2πr; Area of circle: πr²',
      'Compound interest: A = P(1 + r/100)^n',
      'Probability of event P(E) = Favorable outcomes / Total outcomes (0 ≤ P ≤ 1)',
      'Sum of interior angles of polygon: (n - 2) * 180°',
      'Gradient / Slope of straight line: m = (y₂ - y₁) / (x₂ - x₁)'
    ],
    typicalMisconceptions: [
      'Distributing exponents over addition: (a + b)² is NOT equal to a² + b² (must be a² + 2ab + b²)',
      'Sign errors when dividing or multiplying inequalities by a negative number (must reverse inequality sign)',
      'Dividing by zero: it is undefined, not zero',
      'Confusing perimeter (linear units: cm, m) with area (square units: cm², m²)'
    ],
    studyInterventions: [
      'Practice step-by-step substitution and sign checking on paper.',
      'Memorize multiplication tables up to 15 to eliminate calculation friction.',
      'Always sketch geometric diagrams before applying trigonometric formulas.'
    ]
  },

  'English Language': {
    code: 'ENG',
    divisions: ['Primary', 'Junior College', 'Senior College', 'All'],
    keyTopics: [
      'Grammar & Concord', 'Tenses & Aspect', 'Lexis & Structure',
      'Summary Writing', 'Reading Comprehension', 'Continuous Writing (Essays & Letters)',
      'Oral English & Phonetics', 'Direct & Indirect Speech', 'Figures of Speech'
    ],
    formulasAndTheorems: [
      'Subject-Verb Concord: Singular subject takes singular verb (He walks); Plural takes plural (They walk)',
      'Either/Or & Neither/Nor proximity rule: Verb agrees with closest subject',
      'Passive vs Active voice: Subject performs action vs Subject receives action',
      'Summary writing: Extract core topic sentences without personal opinions or extraneous examples',
      'Formal letter format: Writer address + date, Receiver address, Salutation, Title/Heading, Body, Subscription, Signature & Name'
    ],
    typicalMisconceptions: [
      'Using plural verbs with indefinite pronouns like "everyone", "somebody", "each" (they require singular verbs)',
      'Confusing "their" (possessive), "there" (place), and "they\'re" (they are)',
      'Double comparatives/superlatives (e.g. "more better" or "most fastest")',
      'Dangling participles without clear logical subjects'
    ],
    studyInterventions: [
      'Read one chapter of an approved literature novel daily to expand active vocabulary register.',
      'Practice writing 150-word summaries identifying the central thesis of essays.',
      'Recite consonant and vowel minimal pairs for Oral English mastery.'
    ]
  },

  'Further Mathematics': {
    code: 'FMTH',
    divisions: ['Senior College'],
    keyTopics: [
      'Polynomials & Partial Fractions', 'Calculus (Differentiation & Integration)',
      'Vectors in 2D & 3D', 'Matrices & Determinants', 'Binomial Expansion & Series',
      'Coordinate Geometry of Conic Sections (Parabola, Ellipse, Hyperbola)',
      'Dynamics & Statics (Projectiles, Friction, Momentum)', 'Probability Distributions'
    ],
    formulasAndTheorems: [
      'Product Rule: d/dx(uv) = u(dv/dx) + v(du/dx); Quotient Rule: d/dx(u/v) = (v*du/dx - u*dv/dx) / v²',
      'Integration by parts: ∫u dv = uv - ∫v du',
      'Determinant of 2x2 matrix [[a,b],[c,d]]: ad - bc',
      'Projectile maximum height: H = (u² sin²θ) / (2g); Range: R = (u² sin 2θ) / g',
      'Binomial Theorem: (a + b)ⁿ = Σ ⁿCᵣ aⁿ⁻ʳ bʳ'
    ],
    typicalMisconceptions: [
      'Forgetting the constant of integration (+ C) in indefinite integrals',
      'Confusing scalar dot product (produces scalar) with vector cross product (produces vector)',
      'Incorrect application of chain rule in nested trigonometric derivatives'
    ],
    studyInterventions: [
      'Work through WAEC Further Mathematics past questions from 2015 to date systematically.',
      'Practice standard integration substitutions and trigonometric identities.'
    ]
  },

  'Physics': {
    code: 'PHY',
    divisions: ['Senior College'],
    keyTopics: [
      'Mechanics & Kinematics', 'Newton\'s Laws of Motion', 'Energy, Work & Power',
      'Heat & Thermodynamics', 'Wave Optics & Sound', 'Current Electricity & Magnetism',
      'Atomic & Nuclear Physics', 'Electromagnetic Induction', 'Fluid Statics & Dynamics'
    ],
    formulasAndTheorems: [
      'Newton\'s 2nd Law: F = ma (Force in Newtons, mass in kg, acceleration in m/s²)',
      'Kinematic Equations: v = u + at, s = ut + 0.5at², v² = u² + 2as',
      'Ohm\'s Law: V = IR (Voltage in Volts, Current in Amperes, Resistance in Ohms)',
      'Work Done: W = F * d * cos(θ); Kinetic Energy: E_k = 0.5mv²; Potential Energy: E_p = mgh',
      'Snell\'s Law of Refraction: n₁ * sin(θ₁) = n₂ * sin(θ₂)',
      'Wave speed equation: v = f * λ (velocity = frequency * wavelength)',
      'Electric Power: P = IV = I²R = V²/R'
    ],
    typicalMisconceptions: [
      'Confusing mass (scalar invariant in kg) with weight (gravitational force vector in N: W = mg)',
      'Believing constant force is required to sustain constant velocity (Newton\'s 1st Law: zero net force means constant velocity)',
      'Assuming electrical current is "used up" in a resistor rather than conserved',
      'Confusing heat energy (Joules) with temperature (Kelvin/Celsius)'
    ],
    studyInterventions: [
      'Always state units in final calculations (e.g. Joules, Newtons, Watts).',
      'Draw free-body force diagrams for every mechanics problem before writing equations.',
      'Distinguish series and parallel circuit configurations clearly.'
    ]
  },

  'Chemistry': {
    code: 'CHM',
    divisions: ['Senior College'],
    keyTopics: [
      'Atomic Structure & Periodicity', 'Chemical Bonding', 'Stoichiometry & Mole Concept',
      'Acids, Bases & Salts', 'Electrochemistry & Electrolysis', 'Thermodynamics & Kinetics',
      'Organic Chemistry (Hydrocarbons, Alcohols)', 'Gas Laws', 'Qualitative Analysis'
    ],
    formulasAndTheorems: [
      'Mole Concept: Moles (n) = Mass (g) / Molar Mass (g/mol) = Volume (dm³ at STP) / 22.4',
      'Ideal Gas Law: PV = nRT (P in atm/Pa, V in L/m³, T in Kelvin)',
      'pH scale: pH = -log₁₀[H⁺]; pOH = -log₁₀[OH⁻]; pH + pOH = 14',
      'Faraday\'s 1st Law of Electrolysis: m = Z * I * t = (M * I * t) / (n * F)',
      'Neutralization reaction: Acid + Base → Salt + Water',
      'Boyle\'s Law: P₁V₁ = P₂V₂ (constant T); Charles\' Law: V₁/T₁ = V₂/T₂ (constant P)'
    ],
    typicalMisconceptions: [
      'Forgetting to balance chemical equations before calculating reacting masses',
      'Confusing oxidation (loss of electrons, increase in oxidation number) with reduction (gain of electrons)',
      'Mixing up covalent bonding (electron sharing) with ionic bonding (complete transfer of electrons)',
      'Using Celsius instead of absolute Kelvin temperature in gas law calculations'
    ],
    studyInterventions: [
      'Master the first 20 elements: atomic numbers, electronic configurations, and valencies.',
      'Practice stoichiometry mole-to-mole bridge conversions rigorously.',
      'Use IUPAC nomenclature naming rules methodically for organic compounds.'
    ]
  },

  'Biology': {
    code: 'BIO',
    divisions: ['Senior College'],
    keyTopics: [
      'Cell Biology & Organelles', 'Classification of Living Things', 'Nutrition & Digestion',
      'Transport Systems & Circulatory', 'Respiration & Photosynthesis', 'Excretion & Homeostasis',
      'Genetics & Mendelian Inheritance', 'Ecology & Environmental Balance', 'Reproductive Systems'
    ],
    formulasAndTheorems: [
      'Photosynthesis: 6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂ (chloroplasts)',
      'Aerobic Respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP (mitochondria)',
      'Mendel\'s Monohybrid Cross: F₂ phenotypic ratio is 3:1 (dominant:recessive), genotypic 1:2:1',
      'Levels of organization: Cell → Tissue → Organ → System → Organism',
      'Osmosis: Movement of water from high water potential (dilute) to low water potential through semi-permeable membrane'
    ],
    typicalMisconceptions: [
      'Confusing respiration (cellular release of energy) with breathing (mechanical gas exchange)',
      'Believing plant cells do not respire (plants respire 24/7 and photosynthesize in light)',
      'Assuming all blood in arteries is oxygenated (pulmonary artery carries deoxygenated blood to lungs)',
      'Confusing phenotype (observable physical traits) with genotype (genetic allele makeup)'
    ],
    studyInterventions: [
      'Draw and label biological diagrams with sharp pencil lines, clear labels, and magnifications.',
      'Construct Punnett squares carefully for genetics crosses.',
      'Review comparison tables: Aerobic vs Anaerobic, Xylem vs Phloem, Mitosis vs Meiosis.'
    ]
  },

  'Basic Science & Technology': {
    code: 'BST',
    divisions: ['Primary', 'Junior College'],
    keyTopics: [
      'Living & Non-Living Things', 'Energy & Forces', 'Human Body Systems',
      'Simple Machines & Levers', 'Computer Hardware & Software', 'Environmental Conservation',
      'Hygiene & Diseases', 'Materials & Processing (Wood, Metals, Plastics)'
    ],
    formulasAndTheorems: [
      'Characteristics of Living Things (MR NIGER D): Movement, Respiration, Nutrition, Irritability, Growth, Excretion, Reproduction, Death',
      'Work = Force * Distance; Mechanical Advantage (MA) = Load / Effort; Velocity Ratio (VR) = Distance moved by effort / Distance moved by load',
      'States of Matter: Solid, Liquid, Gas (phase changes: melting, freezing, evaporation, condensation)'
    ],
    typicalMisconceptions: [
      'Believing air has no mass or volume (air is matter with weight and occupies space)',
      'Confusing simple machines with motorized engines'
    ],
    studyInterventions: [
      'Conduct simple kitchen experiments (evaporation, shadows, magnets) to observe concepts in action.',
      'Review life cycles and environmental health habits daily.'
    ]
  },

  'Computer Studies / ICT': {
    code: 'ICT',
    divisions: ['Primary', 'Junior College', 'Senior College', 'All'],
    keyTopics: [
      'Computer Generations & Classification', 'Hardware & Peripherals (Input, Output, CPU, Storage)',
      'Operating Systems & Application Software', 'Networking & Internet Protocols',
      'Cybersecurity & Ethics', 'Data Representation (Binary, Hexadecimal)',
      'Algorithms & Flowcharts', 'Database Management & Spreadsheets'
    ],
    formulasAndTheorems: [
      'Data vs Information: Raw unorganized facts vs Processed meaningful output',
      'Bits and Bytes: 1 Byte = 8 Bits; 1 KB = 1024 Bytes; 1 MB = 1024 KB',
      'CPU Machine Cycle: Fetch, Decode, Execute, Store',
      'Algorithm definition: Finite step-by-step procedure to solve a specific problem'
    ],
    typicalMisconceptions: [
      'Confusing RAM (volatile temporary primary memory) with ROM/Hard Drive (non-volatile permanent storage)',
      'Believing the monitor or system unit is "the CPU" (CPU is the microprocessor on the motherboard)'
    ],
    studyInterventions: [
      'Practice spreadsheet formulas (SUM, AVERAGE, IF) in the school ICT lab.',
      'Trace algorithms step-by-step with dry runs on paper.'
    ]
  },

  // --- COMMERCIAL & VOCATIONAL SUBJECTS ---
  'Economics': {
    code: 'ECN',
    divisions: ['Senior College'],
    keyTopics: [
      'Basic Concepts (Scarcity, Choice, Scale of Preference, Opportunity Cost)',
      'Theory of Demand & Supply', 'Elasticity of Demand & Supply',
      'Production Theory & Division of Labour', 'Market Structures (Perfect vs Monopoly)',
      'National Income Accounting', 'Money & Banking / Central Bank', 'Public Finance & Inflation'
    ],
    formulasAndTheorems: [
      'Opportunity Cost: The forgone alternative when choice is made',
      'Law of Demand: Price and Quantity Demanded have inverse relationship (P↑ => Qd↓)',
      'Price Elasticity of Demand (Ped): (% Change in Qd) / (% Change in Price)',
      'Equilibrium Price: Point where Quantity Demanded equals Quantity Supplied (Qd = Qs)',
      'Gross Domestic Product (GDP): C + I + G + (X - M)'
    ],
    typicalMisconceptions: [
      'Confusing a change in quantity demanded (movement along curve caused by price) with change in demand (shift of curve caused by non-price factors)',
      'Assuming money cost is the same as opportunity cost'
    ],
    studyInterventions: [
      'Draw demand and supply curves with well-labeled axes (Price on Y-axis, Quantity on X-axis).',
      'Practice computing national income and consumer price index formulas.'
    ]
  },

  'Financial Accounting': {
    code: 'ACC',
    divisions: ['Senior College'],
    keyTopics: [
      'Principles of Double Entry', 'Source Documents & Books of Original Entry',
      'Ledger Accounts & Trial Balance', 'Trading, Profit & Loss Account (Income Statement)',
      'Balance Sheet (Statement of Financial Position)', 'Bank Reconciliation Statements',
      'Depreciation of Fixed Assets', 'Control Accounts & Correction of Errors'
    ],
    formulasAndTheorems: [
      'Accounting Equation: Assets = Capital (Equity) + Liabilities',
      'Double Entry Rule: Debit the receiver (increase in assets/expenses), Credit the giver (increase in liabilities/income)',
      'Gross Profit = Sales (Turnover) - Cost of Goods Sold (COGS)',
      'Cost of Goods Sold = Opening Stock + Purchases - Closing Stock',
      'Net Profit = Gross Profit + Other Income - Operating Expenses'
    ],
    typicalMisconceptions: [
      'Crediting cash received instead of debiting Cash/Bank',
      'Confusing revenue expenditure (day-to-day running expenses) with capital expenditure (fixed assets)'
    ],
    studyInterventions: [
      'Always balance both sides of T-accounts systematically.',
      'Practice three-column cash book and bank reconciliation formats.'
    ]
  },

  'Commerce': {
    code: 'COM',
    divisions: ['Senior College'],
    keyTopics: [
      'Introduction to Commerce & Trade', 'Home Trade (Wholesale & Retail)',
      'Foreign Trade (Import & Export, Balance of Payments)', 'Aids to Trade (Banking, Insurance, Transport, Advertising, Warehousing)',
      'Business Units (Sole Proprietor, Partnership, Ltd Company)', 'Stock Exchange & Capital Market',
      'Consumer Protection & Trade Associations'
    ],
    formulasAndTheorems: [
      'Commerce = Trade + Aids to Trade',
      'Balance of Trade = Visible Exports - Visible Imports',
      'Balance of Payments = Total Inflows - Total Outflows'
    ],
    typicalMisconceptions: [
      'Confusing commerce with pure economics (Commerce focuses on distribution and exchange of goods/services)',
      'Mixing up limited liability with unlimited liability in business organizations'
    ],
    studyInterventions: [
      'Memorize the functions of commercial banks, central banks, and insurance principles.',
      'Master the documents used in foreign trade (Bill of Lading, Certificate of Origin, Letter of Credit).'
    ]
  },

  'Business Studies': {
    code: 'BUS',
    divisions: ['Junior College'],
    keyTopics: [
      'Office Practice & Departmental Organization', 'Commerce & Production',
      'Bookkeeping & Petty Cash', 'Keyboarding Skills & Ergonomics',
      'Consumer Rights & Responsibilities', 'Store Management'
    ],
    formulasAndTheorems: [
      'Petty Cash Imprest System: Reimbursement equals exact vouchers spent',
      'Factors of Production: Land (Rent), Labour (Wages), Capital (Interest), Entrepreneurship (Profit)'
    ],
    typicalMisconceptions: [
      'Confusing direct production with indirect production',
      'Believing petty cash is for purchasing major equipment'
    ],
    studyInterventions: [
      'Practice recording petty cash vouchers with debit/credit analysis.',
      'Review correct ergonomics and touch typing home row keys.'
    ]
  },

  // --- ARTS & HUMANITIES ---
  'Government': {
    code: 'GOV',
    divisions: ['Senior College'],
    keyTopics: [
      'Basic Concepts (State, Nation, Sovereignty, Power, Authority)',
      'Organs of Government (Legislature, Executive, Judiciary)',
      'Forms of Government (Unitary, Federal, Confederal, Presidential, Parliamentary)',
      'Constitutions & Constitutionalism', 'Rule of Law & Fundamental Human Rights',
      'Political Parties & Electoral Systems', 'Public Administration & Civil Service',
      'Colonial & Post-Independence Nigerian Politics'
    ],
    formulasAndTheorems: [
      'Separation of Powers (Montesquieu): Distinct separation between Legislature (law-making), Executive (implementation), and Judiciary (interpretation)',
      'Rule of Law (A.V. Dicey): Supremacy of regular law, equality before the law, and protection of fundamental human rights',
      'Sovereignty: Absolute, supreme, and ultimate political authority of a state'
    ],
    typicalMisconceptions: [
      'Confusing a presidential system with a parliamentary system (In presidential, President is Head of State and Government; in parliamentary, Prime Minister is Head of Govt while Monarch/President is ceremonial Head of State)',
      'Equating political power with legitimate authority'
    ],
    studyInterventions: [
      'Study the evolution of Nigerian constitutions (Clifford 1922, Richards 1946, Macpherson 1951, Lyttelton 1954, 1960, 1979, 1999).',
      'Review electoral systems (Simple Majority, Absolute Majority, Proportional Representation).'
    ]
  },

  'Literature in English': {
    code: 'LIT',
    divisions: ['Senior College'],
    keyTopics: [
      'Genres of Literature (Drama, Prose, Poetry)',
      'Literary Devices & Figures of Speech (Metaphor, Simile, Personification, Irony, Alliteration, Onomatopoeia)',
      'African & Non-African Drama', 'African & Non-African Prose', 'African & Non-African Poetry',
      'Themes, Characterization, Setting, and Point of View'
    ],
    formulasAndTheorems: [
      'Dramatic Structure: Exposition → Rising Action → Climax → Falling Action → Denouement',
      'Poetic Forms: Sonnet (14 lines: Petrarchan or Shakespearean), Elegy, Ode, Ballad, Lyric, Epic'
    ],
    typicalMisconceptions: [
      'Confusing the speaker/persona of a poem with the actual biological poet',
      'Mixing up dramatic irony with verbal irony'
    ],
    studyInterventions: [
      'Annotate set drama and prose texts with chapter summaries and character motivations.',
      'Practice scanning rhyme schemes and meter in prescribed WAEC poems.'
    ]
  },

  'Civic Education': {
    code: 'CVE',
    divisions: ['All'],
    keyTopics: [
      'Values & National Values (Honesty, Integrity, Cooperation, Self-reliance)',
      'Citizenship & Constitutional Rights', 'Democracy & Rule of Law',
      'Human Rights & UDHR', 'Anti-Corruption & Law Enforcement Agencies (EFCC, ICPC, Police)',
      'Drug Abuse & Prevention (NDLEA)', 'HIV/AIDS Awareness & Youth Empowerment'
    ],
    formulasAndTheorems: [
      'Citizenship acquisition methods: By Birth, By Registration, By Naturalization',
      'Fundamental Human Rights (Chapter IV of 1999 Constitution): Right to life, dignity, personal liberty, fair hearing, thought/conscience'
    ],
    typicalMisconceptions: [
      'Assuming rights are unlimited (rights have legal limitations during emergencies or to protect others\' rights)',
      'Confusing civic responsibility with legal mandate'
    ],
    studyInterventions: [
      'Memorize the functions of civic integrity agencies in Nigeria.',
      'Practice essay questions on community development and electoral integrity.'
    ]
  },

  'Social Studies': {
    code: 'SOS',
    divisions: ['Primary'],
    keyTopics: [
      'Family Types & Relationships', 'Culture & Socialization',
      'Physical & Social Environment', 'National Identity & Symbols (Flag, Coat of Arms, Anthem)',
      'Safety, Drug Abuse & Road Safety'
    ],
    formulasAndTheorems: [
      'Family types: Nuclear family (Father, Mother, Children) vs Extended family',
      'National Symbols: Green-White-Green flag designed by Pa Taiwo Akinkunmi in 1959'
    ],
    typicalMisconceptions: [
      'Confusing material culture with non-material culture'
    ],
    studyInterventions: [
      'Recite the National Pledge and Anthem with correct posture and meaning.'
    ]
  },

  'Christian Religious Studies': {
    code: 'CRS',
    divisions: ['All'],
    keyTopics: [
      'Creation & Sovereignty of God', 'Faith, Obedience & Covenant (Abraham, Moses)',
      'Leadership & Moral Courage (Joshua, Deborah, David, Elijah)',
      'The Ministry of Jesus Christ (Parables, Miracles, Sermon on the Mount)',
      'The Passion, Resurrection & Ascension', 'The Early Church & Epistles (Paul\'s teachings on Love and Faith)'
    ],
    formulasAndTheorems: [
      'Greatest Commandment: Love the Lord your God with all your heart, soul, and mind; and love your neighbor as yourself (Matthew 22:37-39)',
      'Fruit of the Spirit (Galatians 5:22-23): Love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control'
    ],
    typicalMisconceptions: [
      'Mixing up Old Testament law with New Testament teachings on grace and redemption',
      'Confusing the spiritual message of parables with historical events'
    ],
    studyInterventions: [
      'Memorize key Bible reference verses with exact chapter and verse citations.',
      'Relate biblical leadership principles to contemporary personal conduct.'
    ]
  },

  'Igbo Language & Culture': {
    code: 'IGB',
    divisions: ['All'],
    keyTopics: [
      'Asụsụ Igbo (Udaume na Mgbochiume, Mkpụrụedemede)',
      'Ụtọasụsụ (Nkebiokwu, Nnọchiaha, Ngwaa, Nchikọta)',
      'Omenaala & Ekwumekwu (Ibe n\'iru, Ekele, Alụmdi na Nwunye, Echichi)',
      'Agụmagụ Ọdịnala na Nke Ugbu A (Ilu, Akụkọ, Abu Igbo)'
    ],
    formulasAndTheorems: [
      'Mkpụrụedemede Igbo: 36 (Udaume 8: a, e, i, ị, o, ọ, u, ụ; Mgbochiume 28)',
      'Udaume dị n\'ụzọ abụọ: Udaume Mfị (a, ị, ọ, ụ) na Udaume Nsụ (e, i, o, u)',
      'Ilu Igbo bụ mmanụ e ji eri okwu'
    ],
    typicalMisconceptions: [
      'Forgetting sub-dots (akara okpuru) on letters: ị, ọ, ụ',
      'Incorrect tone marking (akara udaelu, udala, udansuda)'
    ],
    studyInterventions: [
      'Practice writing short essays in standard Central Igbo (Igbo Izugbe).',
      'Memorize common Igbo proverbs (ilu) and their contextual meanings.'
    ]
  },

  'Agricultural Science': {
    code: 'AGR',
    divisions: ['All'],
    keyTopics: [
      'Importance & Branches of Agriculture', 'Crop Production & Agronomy (Cereals, Legumes, Tubers)',
      'Soil Science & Fertility (Organic & Inorganic Fertilizers)', 'Animal Husbandry (Poultry, Ruminants, Swine)',
      'Farm Machinery & Implements', 'Pests, Weeds & Disease Control', 'Agricultural Economics & Extension'
    ],
    formulasAndTheorems: [
      'Plant Nutrients: Macronutrients (N, P, K, Ca, Mg, S) vs Micronutrients (Fe, Zn, Cu, Mn, B, Mo)',
      'Soil Composition: Mineral matter (45%), Organic matter (5%), Water (25%), Air (25%)'
    ],
    typicalMisconceptions: [
      'Confusing broadcast planting with drilling or planting in rows',
      'Assuming all agricultural pests are insects (rodents, nematodes, birds are also pests)'
    ],
    studyInterventions: [
      'Inspect practical crop plots on school farm to identify common weeds and pests.',
      'Practice calculating plant population and spacing formulas.'
    ]
  },

  'Physical & Health Education': {
    code: 'PHE',
    divisions: ['All'],
    keyTopics: [
      'Athletics (Track & Field Events)', 'Ball Games (Football, Basketball, Volleyball)',
      'Gymnastics & Aquatics', 'First Aid & Sports Injuries',
      'Personal Hygiene & Health Habits', 'Circulatory & Respiratory Fitness'
    ],
    formulasAndTheorems: [
      'First Aid R.I.C.E Principle: Rest, Ice, Compression, Elevation',
      'Track Events: Sprints (100m, 200m, 400m), Middle distance (800m, 1500m), Long distance (3000m+)'
    ],
    typicalMisconceptions: [
      'Applying heat immediately to a fresh sports sprain instead of cold ice compression'
    ],
    studyInterventions: [
      'Review rules and dimensions of athletic tracks and ball courts.',
      'Practice pulse recovery rate measurements before and after aerobic exercise.'
    ]
  },

  'Diction & Phonetics': {
    code: 'DIC',
    divisions: ['All'],
    keyTopics: [
      'Received Pronunciation (RP) Standard', 'English Vowel Sounds (Monophthongs & Diphthongs)',
      'Consonant Sounds (Voiced & Voiceless)', 'Stress Patterns & Intonation',
      'Silent Letters & Pronunciation Rules', 'Public Speaking & Eloquence'
    ],
    formulasAndTheorems: [
      '44 Sounds of English: 20 Vowel sounds (12 pure vowels + 8 diphthongs) + 24 Consonant sounds',
      'Intonation: Falling tune (statements, WH-questions) vs Rising tune (Polar Yes/No questions)'
    ],
    typicalMisconceptions: [
      'Pronouncing silent letters (e.g. "b" in doubt, debt, comb, lamb; "k" in knife, knight, know)'
    ],
    studyInterventions: [
      'Practice phonetic transcriptions in the school language laboratory.',
      'Record and playback vocal recitations to refine articulation.'
    ]
  },

  'Cultural & Creative Arts': {
    code: 'CCA',
    divisions: ['Primary'],
    keyTopics: [
      'Elements & Principles of Design', 'Drawing & Painting',
      'Traditional Nigerian Arts & Crafts (Pottery, Weaving, Beadwork)',
      'Music Theory & Local Instruments', 'Drama & Cultural Dance'
    ],
    formulasAndTheorems: [
      'Color Wheel: Primary colors (Red, Yellow, Blue); Secondary colors (Orange, Green, Purple)'
    ],
    typicalMisconceptions: [
      'Confusing primary colors with secondary colors'
    ],
    studyInterventions: [
      'Create sketchbook studies of local Awka cultural artifacts and motifs.'
    ]
  },

  'French Language': {
    code: 'FRN',
    divisions: ['Junior College'],
    keyTopics: [
      'Salutations & Presentations (Greetings & Self-introduction)',
      'Les Articles (Défini: le, la, les; Indéfini: un, une, des)',
      'Verbes Communs (Être, Avoir, Aller, Faire)',
      'Les Nombres, Jours et Mois', 'Vocabulaire de la Famille et de l\'École'
    ],
    formulasAndTheorems: [
      'Conjugaison du verbe Être: Je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont',
      'Conjugaison du verbe Avoir: J\'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont'
    ],
    typicalMisconceptions: [
      'Forgetting gender agreement between nouns and adjectives in French'
    ],
    studyInterventions: [
      'Practice daily conversational French greetings and dialogues.'
    ]
  },

  'Home Economics': {
    code: 'HEC',
    divisions: ['Junior College'],
    keyTopics: [
      'Food & Nutrition (Food Groups, Balanced Diet)', 'Kitchen Hygiene & Cooking Methods',
      'Clothing & Textiles (Sewing Tools, Stitches, Garment Construction)',
      'Home Management & Family Resource Budgeting', 'Child Care & Development'
    ],
    formulasAndTheorems: [
      'Balanced Diet Components: Carbohydrates, Proteins, Fats, Vitamins, Minerals, Water, Dietary Fibre'
    ],
    typicalMisconceptions: [
      'Confusing temporary stitches (basting) with permanent stitches (backstitch, running stitch)'
    ],
    studyInterventions: [
      'Practice seam stitching and meal planning menus.'
    ]
  },

  'Technical Drawing': {
    code: 'TD',
    divisions: ['Senior College'],
    keyTopics: [
      'Drawing Instruments & Board Practice', 'Geometric Constructions (Angles, Circles, Tangents)',
      'Isometric & Oblique Projections', 'Orthographic Projection (1st & 3rd Angle)',
      'Sectional Views & Dimensioning', 'Building & Mechanical Drafting'
    ],
    formulasAndTheorems: [
      'Orthographic Projections: 1st Angle (Plan below Elevation) vs 3rd Angle (Plan above Elevation)',
      'Isometric scale and 30-degree receding axes'
    ],
    typicalMisconceptions: [
      'Inverting 1st and 3rd angle projection views'
    ],
    studyInterventions: [
      'Maintain clean 2H, H, and HB pencil line hierarchy and accurate title blocks.'
    ]
  },

  'Quantitative Reasoning': {
    code: 'QR',
    divisions: ['Primary'],
    keyTopics: [
      'Number Patterns & Sequences', 'Mathematical Puzzles & Grids',
      'Spatial & Geometric Relations', 'Arithmetic Logic & Code Decoding'
    ],
    formulasAndTheorems: [
      'Identify the operational rule (Addition, Multiplication, Alternating difference) linking numbers in sample puzzles'
    ],
    typicalMisconceptions: [
      'Applying the sample pattern rule without testing on all given examples'
    ],
    studyInterventions: [
      'Analyze sample question patterns thoroughly before attempting exercise problems.'
    ]
  },

  'Verbal Reasoning': {
    code: 'VR',
    divisions: ['Primary'],
    keyTopics: [
      'Alphabetical Order & Word Coding', 'Synonyms & Antonyms',
      'Analogies & Word Associations', 'Logical Deduction & Word Completion'
    ],
    formulasAndTheorems: [
      'Analogies structure: A is to B as C is to D'
    ],
    typicalMisconceptions: [
      'Confusing antonyms (opposites) with synonyms (similar words)'
    ],
    studyInterventions: [
      'Practice solving word puzzles and crosswords to expand verbal reasoning logic.'
    ]
  }
};

// ============================================================================
// 2. TOKENIZATION, NLP LEMMATIZER & SEMANTIC SIMILARITY
// ============================================================================

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'can', 'could', 'shall', 'should', 'will', 'would', 'may', 'might', 'must',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it',
  'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those', 'what', 'which',
  'who', 'whom', 'whose', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'also', 'furthermore'
]);

/**
 * Robust Stemming & Lemmatization for Academic and Scientific Text
 */
export function tokenizeAndStem(text) {
  if (!text || typeof text !== 'string') return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\d]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));

  return words.map(w => {
    if (w.endsWith('ingly')) return w.slice(0, -5);
    if (w.endsWith('ation') || w.endsWith('ition')) return w.slice(0, -5) + 'e';
    if (w.endsWith('tion') || w.endsWith('sion')) return w.slice(0, -4);
    if (w.endsWith('ing')) return w.slice(0, -3);
    if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.endsWith('es')) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    if (w.endsWith('ed')) return w.slice(0, -2);
    if (w.endsWith('ly')) return w.slice(0, -2);
    if (w.endsWith('ment')) return w.slice(0, -4);
    if (w.endsWith('ness')) return w.slice(0, -4);
    return w;
  });
}

/**
 * Extract n-grams (unigrams, bigrams, trigrams) to detect compound terms
 */
export function extractNgrams(text, maxN = 3) {
  if (!text) return [];
  const tokens = text.toLowerCase().replace(/[^\w\s\d]/g, ' ').split(/\s+/).filter(Boolean);
  const ngrams = [];
  for (let n = 1; n <= Math.min(maxN, tokens.length); n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
  }
  return ngrams;
}

/**
 * Compute semantic Jaccard, Token Intersection, and Multi-Word Keyword Hit
 */
export function computeConceptMatch(submissionText, expectedConcepts = []) {
  if (!submissionText) return { score: 0, coverageRatio: 0, matched: [], missing: expectedConcepts };

  const subTokens = new Set(tokenizeAndStem(submissionText));
  const subNgrams = new Set(extractNgrams(submissionText, 3));
  const rawSubLower = submissionText.toLowerCase();

  const matched = [];
  const missing = [];

  for (const concept of expectedConcepts) {
    const conceptLower = concept.trim().toLowerCase();
    const conceptTokens = tokenizeAndStem(conceptLower);

    const directSubstring = rawSubLower.includes(conceptLower);
    const ngramHit = subNgrams.has(conceptLower);
    const tokenHit = conceptTokens.length > 0 && conceptTokens.every(t => subTokens.has(t));
    const partialTokenHit = conceptTokens.length > 1 && conceptTokens.filter(t => subTokens.has(t)).length >= Math.ceil(conceptTokens.length * 0.7);

    if (directSubstring || ngramHit || tokenHit || partialTokenHit) {
      matched.push(concept);
    } else {
      missing.push(concept);
    }
  }

  const coverageRatio = expectedConcepts.length > 0 
    ? matched.length / expectedConcepts.length 
    : 0.85;

  return {
    coverageRatio,
    matched,
    missing
  };
}

// ============================================================================
// 3. ADVANCED HOMEWORK & CONTINUOUS ASSESSMENT EVALUATION ENGINE
// ============================================================================

/**
 * Multi-criteria Homework and Exam Evaluation Engine
 * Returns rubric breakdown (concept, reasoning, calculation), Bloom's rating, and pedagogical diagnostics.
 */
export function evaluateHomeworkSubmission(arg1, arg2, arg3) {
  let assignment = {};
  let submissionText = '';
  let studentName = '';

  if (arg1 && typeof arg1 === 'object' && ('assignment' in arg1 || 'submissionText' in arg1)) {
    assignment = arg1.assignment || {};
    submissionText = arg1.submissionText || '';
    studentName = arg1.studentName || '';
  } else {
    assignment = arg1 || {};
    submissionText = typeof arg2 === 'string' ? arg2 : arg2?.content || arg2?.submission_text || '';
    studentName = typeof arg3 === 'string' ? arg3 : '';
  }

  const maxPoints = assignment.max_points || 10;

  let keyConcepts = [];
  try {
    if (typeof assignment.key_concepts === 'string') {
      if (assignment.key_concepts.startsWith('[')) {
        keyConcepts = JSON.parse(assignment.key_concepts);
      } else {
        keyConcepts = assignment.key_concepts.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(assignment.key_concepts)) {
      keyConcepts = assignment.key_concepts;
    }
  } catch {
    keyConcepts = [];
  }

  const text = (submissionText || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Triviality & Plagiarism / Prompt-Repeating Guard
  const titleWords = (assignment.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const descWords = (assignment.description || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  if (wordCount === 0) {
    return {
      score: 0,
      percentage: 0,
      status: 'Needs_Revision',
      feedback: `⚠️ Submission was received empty. Please submit your completed answers for "${assignment.title}".`,
      strengths: [],
      improvements: ['Provide completed work before submission deadline.'],
      matchedConcepts: [],
      missingConcepts: keyConcepts,
      cognitiveLevel: 'Unanswered',
      rubric: { conceptScore: 0, reasoningScore: 0, calculationScore: 0 }
    };
  }

  // Check for keyboard mashing or single repetitive word spam
  if (wordCount > 5 && repetitionRatio < 0.35) {
    return {
      score: 1,
      percentage: Math.round((1 / maxPoints) * 100),
      status: 'Needs_Revision',
      feedback: `⚠️ Eagle Power AI Quality Warning: The submission appears to contain repetitive or unconstructed text. Please rewrite your answer with substantive explanatory detail.`,
      strengths: [],
      improvements: ['Write distinct sentences explaining the concepts in your own words.'],
      matchedConcepts: [],
      missingConcepts: keyConcepts,
      cognitiveLevel: 'Invalid',
      rubric: { conceptScore: 10, reasoningScore: 10, calculationScore: 0 }
    };
  }

  // 2. Semantic Concept Matching
  const conceptResult = computeConceptMatch(text, keyConcepts);

  // 3. Mathematical & Numeric step check
  const isQuantitative = /(solve|calculate|equation|sum|fraction|math|multipl|divid|numbers|physics|find|evaluate|algebra|account|interest|velocity)/i.test(
    `${assignment.title} ${assignment.description}`
  );
  let mathBonus = 0;
  let hasWorkingSteps = false;

  if (isQuantitative) {
    const hasNumbers = /\d+/.test(text);
    const hasMathOperators = /[=+\-*/^√%]/.test(text);
    const hasIntermediateSteps = (text.match(/=/g) || []).length >= 2 || (text.match(/\n/g) || []).length >= 2;
    const hasUnits = /\b(cm|m|km|kg|g|s|m\/s|n|j|w|v|a|ohm|₦|\$|%)\b/i.test(text);

    if (hasNumbers && hasMathOperators) mathBonus += 0.12;
    if (hasIntermediateSteps) {
      mathBonus += 0.08;
      hasWorkingSteps = true;
    }
    if (hasUnits) mathBonus += 0.05;
  }

  // 4. Depth & Structural Heuristics
  let depthScore = 1.0;
  if (wordCount < 10 && maxPoints > 5) depthScore = 0.50;
  else if (wordCount < 20 && maxPoints > 5) depthScore = 0.75;
  else if (wordCount >= 40) depthScore = 1.05;

  // 5. Bloom's Cognitive Complexity Detection
  let cognitiveLevel = 'Recall & Definition';
  const hasAnalysisTerms = /(because|therefore|hence|consequently|in conclusion|illustrates|implies|due to|demonstrates|differentiates)/i.test(text);
  const hasApplicationTerms = /(apply|solve|calculated|result is|substituted|derived|step|method|procedure)/i.test(text);

  if (hasAnalysisTerms && wordCount >= 30) {
    cognitiveLevel = 'Analysis & Evaluation';
  } else if (hasApplicationTerms || hasWorkingSteps) {
    cognitiveLevel = 'Application & Problem Solving';
  } else if (wordCount >= 15) {
    cognitiveLevel = 'Comprehension & Description';
  }

  // 6. Misconception Scanner against Curriculum Taxonomy
  let flaggedMisconception = null;
  for (const [subName, subData] of Object.entries(CURRICULUM_TAXONOMY)) {
    if (subData.typicalMisconceptions) {
      for (const misc of subData.typicalMisconceptions) {
        const miscKeywords = misc.toLowerCase().split(/\s+/).filter(w => w.length > 5);
        const matchCount = miscKeywords.filter(k => text.toLowerCase().includes(k)).length;
        if (matchCount >= 2 && miscKeywords.length >= 3) {
          flaggedMisconception = misc;
          break;
        }
      }
    }
    if (flaggedMisconception) break;
  }

  // 7. Multi-Criteria Rubric Scoring
  const conceptScore = Math.round(conceptResult.coverageRatio * 100);
  const reasoningScore = Math.min(100, Math.round((wordCount >= 35 ? 90 : (wordCount >= 20 ? 75 : 55)) * (hasAnalysisTerms ? 1.15 : 1.0)));
  const calculationScore = isQuantitative ? (hasWorkingSteps ? 95 : 60) : 85;

  let rawScorePercent = 0.35 + (conceptResult.coverageRatio * 0.55) + mathBonus;
  rawScorePercent = rawScorePercent * depthScore;
  rawScorePercent = Math.min(1.0, Math.max(0.2, rawScorePercent));

  const computedPoints = Math.round(rawScorePercent * maxPoints * 10) / 10;
  const percentage = Math.round((computedPoints / maxPoints) * 100);

  // 8. Synthesize Pedagogical Feedback & Diagnostic Drill
  const strengths = [];
  const improvements = [];

  if (conceptResult.matched.length > 0) {
    strengths.push(`Accurately applied core concepts: ${conceptResult.matched.slice(0, 4).join(', ')}.`);
  }
  if (wordCount >= 25) {
    strengths.push('Demonstrated good analytical depth and clear sentence structure.');
  }
  if (hasWorkingSteps) {
    strengths.push('Commendable step-by-step working and derivation shown.');
  }

  if (conceptResult.missing.length > 0) {
    improvements.push(`Review key required elements: ${conceptResult.missing.slice(0, 3).join(', ')}.`);
  }
  if (wordCount < 15) {
    improvements.push('Expand your explanation with supporting reasons or working examples.');
  }
  if (isQuantitative && !hasWorkingSteps && wordCount < 20) {
    improvements.push('Always show step-by-step intermediate substitutions rather than just writing the final answer.');
  }
  if (flaggedMisconception) {
    improvements.push(`⚠️ Diagnostic Notice: Watch out for common pitfall: "${flaggedMisconception}".`);
  }

  let feedback = `🦅 Eagle Power In-House AI Evaluation for ${studentName || 'Student'}:\n`;
  feedback += `• Assessment Score: ${computedPoints}/${maxPoints} (${percentage}%)\n`;
  feedback += `• Cognitive Depth: ${cognitiveLevel}\n`;

  if (strengths.length > 0) {
    feedback += `⭐ Strengths: ${strengths.join(' ')}\n`;
  }
  if (improvements.length > 0) {
    feedback += `💡 Actionable Improvements: ${improvements.join(' ')}\n`;
  } else {
    feedback += `🌟 Exemplary execution! Demonstrates thorough conceptual grasp.\n`;
  }

  feedback += `\n_Recorded by EaglePower EduCore AI Tutor. Pending teacher confirmation._`;

  return {
    score: computedPoints,
    percentage,
    cognitiveLevel,
    rubric: {
      conceptScore,
      reasoningScore,
      calculationScore: isQuantitative ? calculationScore : null,
      bloomsTaxonomy: cognitiveLevel
    },
    feedback,
    strengths,
    improvements,
    matchedConcepts: conceptResult.matched,
    missingConcepts: conceptResult.missing
  };
}

// ============================================================================
// 4. BAYESIAN STUDENT ACADEMIC TRAJECTORY & RISK MODELER
// ============================================================================

export function analyzeStudentProgress(studentId) {
  const student = db.prepare(`
    SELECT s.*, c.name as class_name, c.division 
    FROM students s 
    LEFT JOIN classes c ON s.class_id = c.id 
    WHERE s.id = ?
  `).get(studentId);

  if (!student) return null;

  // 1. Fetch Subject Marks
  const marks = db.prepare(`
    SELECT m.*, sub.name as subject_name, sub.code as subject_code, sub.category
    FROM marks m
    JOIN subjects sub ON m.subject_id = sub.id
    WHERE m.student_id = ?
    ORDER BY m.total_score ASC
  `).all(studentId);

  // 2. Fetch Attendance Stats
  const attStats = db.prepare(`
    SELECT 
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days
    FROM student_attendance
    WHERE student_id = ?
  `).get(studentId);

  // 3. Fetch Homework Completion
  const hwStats = db.prepare(`
    SELECT 
      COUNT(*) as submitted_count,
      AVG(CASE WHEN teacher_score IS NOT NULL THEN teacher_score ELSE ai_score END) as avg_hw_score
    FROM homework_submissions
    WHERE student_id = ?
  `).get(studentId);

  const totalSubjects = marks.length;
  let totalScoreSum = 0;
  const criticalSubjects = [];
  const strongSubjects = [];
  const moderateSubjects = [];

  let caSum = 0;
  let examSum = 0;
  let examAnxietyFlags = 0;
  let inconsistencyFlags = 0;

  marks.forEach(m => {
    totalScoreSum += m.total_score;
    caSum += (m.ca_score || 0);
    examSum += (m.exam_score || 0);

    const caPercent = (m.ca_score || 0) / 30;
    const examPercent = (m.exam_score || 0) / 70;

    // Detect CA vs Exam Divergence
    if (caPercent >= 0.80 && examPercent < 0.45) {
      examAnxietyFlags++;
    } else if (caPercent < 0.40 && examPercent >= 0.70) {
      inconsistencyFlags++;
    }

    if (m.total_score < 50 || m.grade === 'F9' || m.grade === 'E8') {
      criticalSubjects.push({
        subject: m.subject_name,
        code: m.subject_code,
        score: m.total_score,
        grade: m.grade,
        ca: m.ca_score,
        exam: m.exam_score
      });
    } else if (m.total_score >= 70 || m.grade === 'A1' || m.grade === 'B2') {
      strongSubjects.push({
        subject: m.subject_name,
        code: m.subject_code,
        score: m.total_score,
        grade: m.grade,
        ca: m.ca_score,
        exam: m.exam_score
      });
    } else {
      moderateSubjects.push({
        subject: m.subject_name,
        code: m.subject_code,
        score: m.total_score,
        grade: m.grade
      });
    }
  });

  const averagePercentage = totalSubjects > 0 
    ? Math.round((totalScoreSum / totalSubjects) * 10) / 10 
    : 0;

  // Attendance rate
  const attendanceRate = (attStats && attStats.total_days > 0)
    ? Math.round((attStats.present_days / attStats.total_days) * 100)
    : 100;

  // Student Cognitive Profile Archetype
  let cognitiveArchetype = 'Balanced Academic Performer';
  const stemSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Further Mathematics', 'Basic Science & Technology'];
  const artsSubjects = ['English Language', 'Literature in English', 'Government', 'Civic Education', 'CRS', 'Igbo Language & Culture'];
  const commercialSubjects = ['Economics', 'Commerce', 'Financial Accounting', 'Business Studies'];

  const strongStem = strongSubjects.filter(s => stemSubjects.includes(s.subject)).length;
  const criticalStem = criticalSubjects.filter(s => stemSubjects.includes(s.subject)).length;
  const strongArts = strongSubjects.filter(s => artsSubjects.includes(s.subject)).length;
  const criticalArts = criticalSubjects.filter(s => artsSubjects.includes(s.subject)).length;
  const strongComm = strongSubjects.filter(s => commercialSubjects.includes(s.subject)).length;

  if (averagePercentage >= 75 && criticalSubjects.length === 0) {
    cognitiveArchetype = 'Distinction All-Round Scholar';
  } else if (strongStem >= 2 && criticalArts >= 1) {
    cognitiveArchetype = 'High STEM Lean (Technical / Quantitative)';
  } else if (strongArts >= 2 && criticalStem >= 1) {
    cognitiveArchetype = 'High Linguistic & Humanities Lean';
  } else if (strongComm >= 2) {
    cognitiveArchetype = 'Commercial & Financial Analytical Lean';
  } else if (examAnxietyFlags >= 2) {
    cognitiveArchetype = 'Exam Anxiety / Revision Disparity';
  } else if (criticalSubjects.length >= 3 || averagePercentage < 45) {
    cognitiveArchetype = 'Critical Academic Intervention Needed';
  } else if (averagePercentage >= 58) {
    cognitiveArchetype = 'Solid Competence (Rising Potential)';
  }

  // National Exam (WAEC / NECO / BECE) Probability Yield
  const creditsYield = marks.filter(m => m.total_score >= 50).length;
  const mathPassed = marks.find(m => m.subject_name === 'Mathematics')?.total_score >= 50;
  const englishPassed = marks.find(m => m.subject_name === 'English Language')?.total_score >= 50;

  let nationalExamForecast = 'Promising';
  if (creditsYield >= 5 && mathPassed && englishPassed) {
    nationalExamForecast = 'Distinction Clearance (Qualifies for Top University Tracks)';
  } else if (creditsYield >= 5) {
    nationalExamForecast = 'Credit Threshold Met (Requires Core Math/English Polish)';
  } else if (creditsYield >= 3) {
    nationalExamForecast = 'Borderline (Intensive Remedial Revision Advised)';
  } else {
    nationalExamForecast = 'High Vulnerability (Urgent Clinic Intervention Required)';
  }

  // Overall Readiness Tier
  let readinessTier = 'On Track';
  if (averagePercentage >= 75 && criticalSubjects.length === 0) {
    readinessTier = 'Distinction Candidate';
  } else if (averagePercentage >= 60 && criticalSubjects.length <= 1) {
    readinessTier = 'Solid Competence';
  } else if (criticalSubjects.length >= 2 || averagePercentage < 50) {
    readinessTier = 'Academic Intervention Needed';
  }

  return {
    student: {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      admission_no: student.admission_no,
      class_name: student.class_name,
      division: student.division,
      guardian_name: student.guardian_name,
      guardian_phone: student.guardian_phone
    },
    metrics: {
      total_subjects: totalSubjects,
      term_average: averagePercentage,
      readiness_tier: readinessTier,
      cognitive_archetype: cognitiveArchetype,
      national_exam_forecast: nationalExamForecast,
      attendance_rate: attendanceRate,
      absent_days: attStats?.absent_days || 0,
      late_days: attStats?.late_days || 0,
      homework_submissions: hwStats?.submitted_count || 0,
      avg_homework_score: hwStats?.avg_hw_score ? Math.round(hwStats.avg_hw_score * 10) / 10 : null,
      credits_yield: creditsYield,
      math_passed: mathPassed,
      english_passed: englishPassed
    },
    strong_subjects: strongSubjects,
    moderate_subjects: moderateSubjects,
    critical_subjects: criticalSubjects
  };
}

// ============================================================================
// 5. PERSONALIZED PARENT RECOMMENDATIONS & HOME COACHING SYNTHESIZER
// ============================================================================

export function generateParentRecommendations(studentId) {
  const profile = analyzeStudentProgress(studentId);
  if (!profile) return [];

  const recommendations = [];
  const studentName = profile.student.name.split(' ')[0]; // First name

  // 1. Critical Learning Gaps Interventions
  if (profile.critical_subjects.length > 0) {
    profile.critical_subjects.forEach(crit => {
      const taxonomy = CURRICULUM_TAXONOMY[crit.subject];
      const adviceSteps = [];

      if (taxonomy && taxonomy.studyInterventions) {
        adviceSteps.push(...taxonomy.studyInterventions);
      } else {
        adviceSteps.push(
          `Dedicate 25 minutes every Tuesday and Thursday evening to review ${crit.subject} class notes.`,
          `Encourage ${studentName} to solve at least 3 practice examples independently before checking answers.`,
          `Reach out to the subject teacher via the portal for targeted revision practice sheets.`
        );
      }

      const recCode = `REC-GAP-${profile.student.admission_no}-${(crit.code || crit.subject.slice(0, 3)).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      recommendations.push({
        recommendation_code: recCode,
        student_id: studentId,
        category: 'Academic Support',
        title: `Targeted Reinforcement Needed in ${crit.subject}`,
        detailed_advice: `${studentName} is currently scoring ${crit.score}% in ${crit.subject} (Continuous Assessment: ${crit.ca}/30, Exam: ${crit.exam}/70). Foundational concepts require home reinforcement to ensure smooth promotion into the next class level.`,
        actionable_steps: JSON.stringify(adviceSteps.slice(0, 3)),
        urgency: crit.score < 40 ? 'Urgent' : 'High'
      });
    });
  }

  // 2. Attendance & Punctuality Advisory
  if (profile.metrics.absent_days >= 2 || profile.metrics.attendance_rate < 85) {
    recommendations.push({
      recommendation_code: `REC-ATT-${profile.student.admission_no}-${Date.now().toString().slice(-4)}`,
      student_id: studentId,
      category: 'Attendance Alert',
      title: `Instructional Attendance & Continuity Advisory`,
      detailed_advice: `${studentName} has logged ${profile.metrics.absent_days} instructional absences (${profile.metrics.attendance_rate}% attendance). Missing consecutive double periods directly correlates with a drop in exam scores.`,
      actionable_steps: JSON.stringify([
        `Ensure arrival at school gate by 7:40 AM for morning devotion and assembly.`,
        `Request missed class notes from classmate or teacher immediately after any absence.`,
        `Notify the school administrative desk promptly if absence is due to illness.`
      ]),
      urgency: profile.metrics.absent_days >= 4 ? 'Urgent' : 'Medium'
    });
  }

  // 3. Praise & High-Flyer Enrichment
  if (profile.strong_subjects.length > 0 && profile.metrics.term_average >= 65) {
    const topSub = profile.strong_subjects[0];
    recommendations.push({
      recommendation_code: `REC-PRAISE-${profile.student.admission_no}-${Date.now().toString().slice(-4)}`,
      student_id: studentId,
      category: 'Positive Praise',
      title: `Academic Excellence Commendation in ${topSub.subject}`,
      detailed_advice: `Commend ${studentName}! Achieving an outstanding score of ${topSub.score}% [Grade ${topSub.grade}] in ${topSub.subject} reflects strong discipline and intellectual curiosity. Keep fueling this passion!`,
      actionable_steps: JSON.stringify([
        `Verbally praise ${studentName}'s disciplined effort to foster internal motivation.`,
        `Introduce advanced reading books, science magazines, or mathematical puzzles.`,
        `Encourage peer teaching with study partners or siblings at home.`
      ]),
      urgency: 'Low'
    });
  }

  // 4. Cognitive Archetype & Exam Strategy Advisory
  recommendations.push({
    recommendation_code: `REC-STRAT-${profile.student.admission_no}-${Date.now().toString().slice(-4)}`,
    student_id: studentId,
    category: 'Exam Readiness',
    title: `Personalized Study Strategy (${profile.metrics.cognitive_archetype})`,
    detailed_advice: `Based on current performance trajectory, ${studentName} demonstrates a "${profile.metrics.cognitive_archetype}" profile. Forecast: ${profile.metrics.national_exam_forecast}.`,
    actionable_steps: JSON.stringify([
      `Establish a quiet daily 60-minute study period between 5:30 PM and 7:00 PM without mobile phone interruptions.`,
      `Inspect pupil's daily homework notebook and ensure sign-off.`,
      `Ensure at least 8 hours of sleep before examination days.`
    ]),
    urgency: 'Medium'
  });

  return recommendations;
}

// ============================================================================
// 6. UNIVERSAL CONVERSATIONAL SCHOOL AI TUTOR & INQUIRY BRAIN
// ============================================================================

/**
 * Universal Natural Language Query and School AI Reasoning Engine
 * Handles academic tutor inquiries across all 27 subjects, school policies, student lookups, and WAEC exam strategies.
 */
export function askSchoolAi(query, context = {}) {
  if (!query || typeof query !== 'string') {
    return {
      answer: "Hello! I am the Eagle Power EduCore In-House AI Tutor. How can I assist you with student academics, curriculum, or school affairs today?",
      intent: 'GREETING',
      confidence: 1.0
    };
  }

  const q = query.trim().toLowerCase();

  // 1. School Information, Principal, Address, Motto, Contact
  if (/(address|location|where is the school|amikwo|where are you located|directions|campus)/i.test(q)) {
    return {
      answer: "🏫 *Eagle Power Schools Campus:*\n2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State, Nigeria.\n📞 Administrative Desk: +234 803 542 8910\n🎓 Principal: Dr. (Mrs) N. Okoye\n🦅 Motto: Love, Truth & Service\n_Campus features modern science laboratories, high-speed ICT center, and sports pavilion._",
      intent: 'SCHOOL_LOCATION',
      confidence: 0.98
    };
  }

  if (/(principal|head of school|headmistress|proprietress|proprietor)/i.test(q)) {
    return {
      answer: "🦅 *School Leadership:*\nThe Principal of Eagle Power Schools is *Dr. (Mrs) N. Okoye*, an accomplished educationist dedicated to moral discipline and academic excellence. Office hours for parent consultations are Tuesdays and Thursdays from 10:00 AM to 1:00 PM.",
      intent: 'LEADERSHIP_INFO',
      confidence: 0.99
    };
  }

  if (/(motto|vision|mission|values)/i.test(q)) {
    return {
      answer: "🦅 *Eagle Power Schools Motto:* 'Love, Truth & Service'\n• *Vision:* To be the premier educational beacon in Anambra State, nurturing scholars of world-class intellectual and moral caliber.\n• *Core Values:* Integrity, Diligence, Respect, Innovation, and Service to Humanity.",
      intent: 'MOTTO_INFO',
      confidence: 0.98
    };
  }

  if (/(resumption|calendar|vacation|holiday|school hours|resumption date|assembly)/i.test(q)) {
    return {
      answer: "📅 *Academic Calendar & Schedule:*\n• School Hours: Monday to Friday, 7:45 AM to 2:30 PM (Creche to Senior Secondary)\n• Morning Assembly & Devotion: 7:45 AM prompt at the central pavilion\n• Current Session: 2024/2025 Academic Session\n• Co-curricular Activities & Clubs: Wednesdays & Fridays, 2:30 PM - 3:45 PM",
      intent: 'CALENDAR_INFO',
      confidence: 0.95
    };
  }

  if (/(grading|grade scale|what is a1|what is c6|distinction|fail|waec scale|neco scale)/i.test(q)) {
    return {
      answer: "📊 *Eagle Power Official WAEC/NECO 9-Point Grading Scale:*\n" +
              "• **A1 (75 - 100%):** Distinction / Excellent\n" +
              "• **B2 (70 - 74%):** Very Good\n" +
              "• **B3 (65 - 69%):** Good\n" +
              "• **C4 (60 - 64%):** Credit\n" +
              "• **C5 (55 - 59%):** Credit\n" +
              "• **C6 (50 - 54%):** Credit (Pass threshold for university admission)\n" +
              "• **D7 (45 - 49%):** Fair Pass\n" +
              "• **E8 (40 - 44%):** Weak Pass\n" +
              "• **F9 (0 - 39%):** Fail\n\n" +
              "💡 *Note:* Continuous Assessment (CA) accounts for 30% and Termly Examination accounts for 70%.",
      intent: 'GRADING_SYSTEM',
      confidence: 0.98
    };
  }

  if (/(fee|tuition|bursar|how much|school fees|payment account|bank transfer)/i.test(q)) {
    return {
      answer: "💳 *Eagle Power Bursary & Tuition Guide:*\n" +
              "• **Creche & Nursery:** ₦35,000 per term\n" +
              "• **Primary (Basic 1 - 5):** ₦38,000 per term\n" +
              "• **Junior College (JSS 1 - 3):** ₦42,000 per term\n" +
              "• **Senior College (SSS 1 - 3):** ₦45,000 per term\n\n" +
              "All tuition payments must be remitted through official bank transfer or bursary POS with student admission number as reference. Official e-receipts are automatically generated on the portal.",
      intent: 'SCHOOL_FEES',
      confidence: 0.95
    };
  }

  if (/(club|extracurricular|sports|jets|spelling bee|activities)/i.test(q)) {
    return {
      answer: "🏆 *Co-Curricular Clubs & Societies at Eagle Power:*\n" +
              "1. **JETS Club (Junior Engineers, Technicians & Scientists):** Robotics, coding, and science exhibitions\n" +
              "2. **Literary & Debating Society / Spelling Bee:** Public speaking and diction development\n" +
              "3. **Press Club:** School journalism, broadcasting, and photography\n" +
              "4. **Red Cross Society & First Aid Cadets:** Emergency response and humanitarian service\n" +
              "5. **Music & Drama Troupe:** Cultural orchestra, choir, and theatre arts\n\n" +
              "Clubs convene every Wednesday and Friday from 2:30 PM to 3:45 PM.",
      intent: 'CLUBS_INFO',
      confidence: 0.96
    };
  }

  // 2. Student Academic Diagnostic Inquiry (By Admission No OR Name)
  const admMatch = q.match(/\b(ESE\d+|EPS[\/\-_]\w+|\d{4}[\/\-_]\w+)\b/i);
  if (admMatch) {
    const adm = admMatch[1].toUpperCase();
    const student = db.prepare('SELECT id, first_name, last_name, admission_no FROM students WHERE UPPER(admission_no) = ?').get(adm);
    if (student) {
      const progress = analyzeStudentProgress(student.id);
      if (progress) {
        return {
          answer: `🦅 *In-House AI Diagnostic for ${student.first_name} ${student.last_name} (${student.admission_no}):*\n` +
                  `• Term Average: ${progress.metrics.term_average}%\n` +
                  `• Academic Standing: ${progress.metrics.readiness_tier}\n` +
                  `• Cognitive Archetype: ${progress.metrics.cognitive_archetype}\n` +
                  `• National Exam Forecast: ${progress.metrics.national_exam_forecast}\n` +
                  `• Attendance: ${progress.metrics.attendance_rate}% (${progress.metrics.absent_days} absences)\n` +
                  `• Homework Completed: ${progress.metrics.homework_submissions} assignments\n` +
                  (progress.critical_subjects.length > 0 ? `⚠️ Priority Focus: ${progress.critical_subjects.map(c => `${c.subject} (${c.score}%)`).join(', ')}\n` : '🌟 All subjects within credit/distinction range!\n') +
                  `_Type 'recommendations for ${student.admission_no}' to generate personalized home coaching steps._`,
          intent: 'STUDENT_DIAGNOSTIC',
          studentId: student.id,
          confidence: 0.97
        };
      }
    }
  }

  // 3. National Examinations (WAEC, NECO, BECE, JAMB) & Preparation Strategy
  if (/(waec|neco|bece|jamb|national exam|external exam|exam prep|prepare for|how to study|study tips|pass waec|pass bece|pass jamb|revision strategy)/i.test(q)) {
    return {
      answer: "🎯 *Eagle Power National Examination Preparation Framework (WAEC / NECO / BECE / JAMB):*\n" +
              "• **BECE (Basic 9 / JSS 3):** Focus on 10 core subjects with compulsory Mathematics, English Studies, Basic Science & Technology, and Nigerian Languages.\n" +
              "• **WAEC / WASSCE & NECO (SS 3):** Minimum 5 credits (including English Language and Mathematics) required for tertiary matriculation.\n" +
              "• **Eagle Power 4-Pillar Prep Strategy:**\n" +
              "  1. 10-year past questions syllabus breakdown and model answers.\n" +
              "  2. Weekly timed speed-tests replicating West African Examination Council standards.\n" +
              "  3. Laboratory practical sessions for Biology, Chemistry, Physics, and Agricultural Science.\n" +
              "  4. Active recall & error log maintenance to eliminate recurring calculation pitfalls.",
      intent: 'EXAM_PREPARATION',
      confidence: 0.98
    };
  }

  // 4. Specific Academic Curriculum Explanations across all 27 subjects (Longest match first)
  const sortedTaxonomy = Object.entries(CURRICULUM_TAXONOMY).sort((a, b) => b[0].length - a[0].length);
  for (const [subName, subData] of sortedTaxonomy) {
    const escName = subName.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escCode = (subData.code || '').toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const subPattern = new RegExp(`\\b(${escName}|${escCode})\\b`, 'i');
    if (subPattern.test(q)) {
      let resp = `📚 *Eagle Power AI Curriculum Guide: ${subName} (${subData.code})*\n\n`;
      resp += `🎯 *Key Curriculum Topics:* ${subData.keyTopics.slice(0, 5).join(', ')}\n\n`;

      if (subData.formulasAndTheorems && subData.formulasAndTheorems.length > 0) {
        resp += `📐 *Core Principles & Formulations:*\n${subData.formulasAndTheorems.slice(0, 4).map(f => `• ${f}`).join('\n')}\n\n`;
      }

      if (subData.typicalMisconceptions && subData.typicalMisconceptions.length > 0) {
        resp += `⚠️ *Common Pitfalls to Avoid in Examinations:*\n${subData.typicalMisconceptions.slice(0, 2).map(m => `• ${m}`).join('\n')}\n\n`;
      }

      if (subData.studyInterventions && subData.studyInterventions.length > 0) {
        resp += `💡 *High-Yield Study Recommendations:*\n${subData.studyInterventions.map(si => `• ${si}`).join('\n')}`;
      }

      return {
        answer: resp,
        intent: 'ACADEMIC_EXPLANATION',
        subject: subName,
        confidence: 0.95
      };
    }
  }

  // 5. Specific Scientific & Mathematical Concepts
  if (/(quadratic|quadratics)/i.test(q)) {
    return {
      answer: "📐 *Quadratic Equations (Mathematics):*\nFor any quadratic equation in standard form: *ax² + bx + c = 0* (where a ≠ 0):\n\n👉 *x = (-b ± √(b² - 4ac)) / (2a)*\n\n• The term **b² - 4ac** is the **Discriminant (D)**.\n  - If D > 0: Two distinct real roots\n  - If D = 0: One repeated real root (perfect square)\n  - If D < 0: Complex conjugate roots (no real roots)\n\n💡 *Exam Tip:* Always group all terms to the left-hand side so the right-hand side equals zero before reading a, b, and c.",
      intent: 'MATH_FORMULA',
      confidence: 0.98
    };
  }

  if (/(photosynthesis)/i.test(q)) {
    return {
      answer: "🌱 *Photosynthesis (Biology / Basic Science):*\nThe biochemical process by which autotrophic green plants manufacture glucose from inorganic carbon dioxide and water using radiant sunlight trapped by chlorophyll.\n\n🧪 *Chemical Equation:*\n*6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂*\n\n• **Site:** Chloroplasts (specifically thylakoids and stroma)\n• **Raw Materials:** Carbon dioxide (from air) and water (from roots)\n• **Products:** Glucose (converted to starch for storage) and Oxygen gas (released via stomata).",
      intent: 'SCIENCE_EXPLANATION',
      confidence: 0.98
    };
  }

  if (/(double entry|debit|credit|bookkeeping)/i.test(q)) {
    return {
      answer: "💼 *Principles of Double Entry (Financial Accounting):*\nEvery financial transaction involves a two-fold aspect: a giving and a receiving.\n\n👉 **Golden Rule:**\n• **Debit (Dr):** The receiving account (Increase in Assets or Expenses; Decrease in Liabilities)\n• **Credit (Cr):** The giving account (Increase in Capital, Liabilities, or Income; Decrease in Assets)\n\n📊 *Fundamental Accounting Equation:*\n**Assets = Capital + Liabilities**",
      intent: 'ACCOUNTING_EXPLANATION',
      confidence: 0.98
    };
  }

  if (/(separation of powers)/i.test(q)) {
    return {
      answer: "🏛️ *Separation of Powers (Government):*\nA political doctrine formulated by French philosopher Baron de Montesquieu in 1748.\n\nIt states that the three arms of governmental power should be distinct and exercised by separate bodies:\n1. **Legislature (National Assembly):** Enacts and amends laws\n2. **Executive (President & Ministers):** Implements and executes laws\n3. **Judiciary (Courts):** Interprets laws and adjudicates disputes\n\n• **Purpose:** To prevent tyranny, dictatorship, and arbitrary exercise of power through checks and balances.",
      intent: 'GOVERNMENT_EXPLANATION',
      confidence: 0.98
    };
  }

  // Default Fallback
  return {
    answer: "🦅 *Eagle Power EduCore In-House AI Tutor is active!*\n\nYou can ask me:\n" +
            "• Curriculum questions across all 27 subjects (e.g., 'Explain quadratic equations', 'What is double entry?', 'Explain separation of powers')\n" +
            "• Student academic diagnostics (e.g., 'Diagnose ESE2009012')\n" +
            "• School information, calendar, grading system, tuition rates, and clubs\n" +
            "• WAEC, NECO, and BECE examination revision techniques.",
    intent: 'GENERAL_ASSISTANCE',
    confidence: 0.85
  };
}

// ============================================================================
// 7. AUTOMATED PEDAGOGICAL REPORT CARD COMMENT GENERATOR
// ============================================================================

/**
 * Generates personalized, professional Class Teacher and Principal remarks
 * based on student average, attendance, psychomotor abilities, and behavioral traits.
 */
export function generateAiReportComments({ 
  student, 
  average, 
  attendance, 
  traits, 
  psychomotor,
  position,
  classSize,
  marks = []
}) {
  const firstName = (student?.first_name || 'The scholar').trim();
  const avg = typeof average === 'number' ? average : parseFloat(average) || 50;
  const posNum = typeof position === 'number' ? position : parseInt(position) || 0;
  const totalStudents = typeof classSize === 'number' ? classSize : parseInt(classSize) || 0;

  // Class Teacher Comment Synthesis
  let teacherComment = '';
  if (posNum === 1 && totalStudents > 1) {
    teacherComment = `Outstanding 1st position in a class of ${totalStudents}! ${firstName} exhibits extraordinary academic excellence, discipline, and peer leadership. A true standard-bearer.`;
  } else if (posNum > 1 && posNum <= 3 && totalStudents >= 5) {
    teacherComment = `Superb achievement finishing ${posNum}${posNum === 2 ? 'nd' : 'rd'} in class. ${firstName} exhibits stellar dedication, keen intellect, and strong academic focus.`;
  } else if (avg >= 80) {
    teacherComment = `${firstName} exhibits exceptional academic discipline, stellar analytical focus, and commendable classroom leadership. A pleasure to teach.`;
  } else if (avg >= 70) {
    teacherComment = `A very good and dedicated performance by ${firstName}. Demonstrates high curiosity and consistent class engagement. Keep striving for distinction.`;
  } else if (avg >= 60) {
    teacherComment = `${firstName} has shown steady academic progress. With more systematic daily revision in numerical and technical subjects, higher grades are within reach.`;
  } else if (avg >= 50) {
    teacherComment = `A fair term's effort by ${firstName}. However, greater consistency in homework completion and active classroom participation is strongly advised.`;
  } else {
    teacherComment = `${firstName}'s academic output this term fell below standard expectations. Urgent remedial coaching and closer supervision of evening study hours is necessary.`;
  }

  // Attendance & behavioral nuances
  if (attendance && attendance.opened && attendance.present) {
    const rate = attendance.present / attendance.opened;
    if (rate < 0.75) {
      teacherComment += ` Note: Irregular school attendance (${attendance.present}/${attendance.opened} days) significantly hindered optimal learning continuity.`;
    }
  }

  // Principal Remark Synthesis
  let principalComment = '';
  let promotionStatus = avg >= 50 ? 'PROMOTED TO NEXT CLASS' : 'PROMOTED ON PROBATION';

  if (avg >= 75 || (posNum >= 1 && posNum <= 3 && totalStudents >= 5)) {
    principalComment = `An outstanding, exemplary, and disciplined scholar. A proud credit to Eagle Power Schools. Keep up the sterling academic tempo!`;
    promotionStatus = 'PROMOTED WITH DISTINCTION';
  } else if (avg >= 65) {
    principalComment = `Commendable results with clear evidence of intellectual potential. Maintain this industrious tempo in the coming term.`;
    promotionStatus = 'PROMOTED TO NEXT CLASS';
  } else if (avg >= 50) {
    principalComment = `Promising effort with evident room for substantial improvement. Encouraged to aim higher in the subsequent academic session.`;
    promotionStatus = 'PROMOTED TO NEXT CLASS';
  } else {
    principalComment = `Academic performance requires urgent intervention. Mandatory holiday clinic attendance and parent-teacher conference strongly required.`;
    promotionStatus = 'REPEAT CLASS / REMEDIAL CLINIC';
  }

  return {
    teacherComment,
    teacher_comment: teacherComment,
    principalComment,
    principal_comment: principalComment,
    promotionStatus,
    promotion_status: promotionStatus
  };
}

export const generateReportCardComments = generateAiReportComments;

// ============================================================================
// 8. AUTO-SEED CURRICULUM CONCEPT BANK
// ============================================================================

export function seedCurriculumConceptsIfEmpty() {
  try {
    const countRow = db.prepare('SELECT COUNT(*) as c FROM curriculum_concept_bank').get();
    if (countRow && countRow.c > 50) return;

    const subjects = db.prepare('SELECT id, name FROM subjects').all();
    const subjectMap = new Map(subjects.map(s => [s.name.toLowerCase(), s.id]));

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO curriculum_concept_bank 
      (subject_id, class_level, topic, subtopic, core_keywords, typical_misconceptions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const [subName, subData] of Object.entries(CURRICULUM_TAXONOMY)) {
      const subjectId = subjectMap.get(subName.toLowerCase());
      if (!subjectId) continue;

      for (const topic of subData.keyTopics) {
        insertStmt.run(
          subjectId,
          subData.divisions[0] || 'All',
          topic,
          'Core Curriculum Concept',
          (subData.formulasAndTheorems || []).slice(0, 2).join('; ') || topic,
          (subData.typicalMisconceptions || []).slice(0, 2).join('; ') || 'None reported'
        );
      }
    }
  } catch (err) {
    console.error('In-House AI: Seed warning:', err.message);
  }
}

// Automatically seed on module load
seedCurriculumConceptsIfEmpty();

import './globals.css';

export const metadata = {
  metadataBase: new URL('https://www.eaglepowerschools.com.ng'),
  title: {
    default: 'Eagle Power Schools Awka | Top Nursery, Primary & Secondary College in Anambra State',
    template: '%s | Eagle Power Schools Awka'
  },
  description: 'Official website of Eagle Power Schools (Eagle Power School of Excellence & Eagle Power College of Excellence), Awka, Anambra State. Nigeria Spelling Bee Champions, 100% WAEC distinction, modern STEM labs & moral discipline. Admissions open.',
  keywords: [
    'Eagle Power Schools',
    'Eagle Power College of Excellence',
    'Eagle Power School of Excellence',
    'Awka schools',
    'secondary school Awka',
    'primary school Awka',
    'nursery school Awka',
    'best private schools in Anambra State',
    'WAEC distinction Awka',
    'BECE exams Anambra',
    'Nigeria Spelling Bee champions',
    'schools on Amikwo Road Awka',
    'Dr Mrs N Okoye'
  ],
  authors: [{ name: 'Eagle Power Schools' }],
  creator: 'Eagle Power Schools Management',
  publisher: 'Eagle Power Schools',
  alternates: {
    canonical: 'https://www.eaglepowerschools.com.ng/'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Eagle Power Schools Awka | Excellence, Integrity & Leadership',
    description: 'Premier nursery, primary, and secondary education in Awka, Anambra State. Home of state spelling bee champions and WAEC distinctions. Admissions open for 2026/2027.',
    url: 'https://www.eaglepowerschools.com.ng/',
    siteName: 'Eagle Power Schools',
    locale: 'en_NG',
    type: 'website',
    images: [
      {
        url: 'https://www.eaglepowerschools.com.ng/assets/real-logo-enhanced.png',
        width: 1200,
        height: 630,
        alt: 'Eagle Power Schools Official Crest - Love, Truth & Service'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eagle Power Schools Awka | Academic & Moral Excellence',
    description: 'Top-tier nursery, primary, and secondary college in Awka, Anambra State. Admissions open for 2026/2027 academic session.',
    images: ['https://www.eaglepowerschools.com.ng/assets/real-logo-enhanced.png'],
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/assets/official-logo.jpg'
  },
  other: {
    'geo.region': 'NG-AN',
    'geo.placename': 'Awka, Anambra State, Nigeria',
    'geo.position': '6.2209;7.0700',
    'ICBM': '6.2209, 7.0700'
  }
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "School",
      "@id": "https://www.eaglepowerschools.com.ng/#school",
      "name": "Eagle Power Schools",
      "alternateName": [
        "Eagle Power School of Excellence",
        "Eagle Power College of Excellence",
        "Eagle Power Awka"
      ],
      "description": "Premier private nursery, primary, and secondary educational institution in Awka, Anambra State, Nigeria. Renowned for Nigeria Spelling Bee championships, 100% WAEC/NECO distinction rates, and holistic moral training.",
      "url": "https://www.eaglepowerschools.com.ng/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.eaglepowerschools.com.ng/assets/real-logo-enhanced.png",
        "caption": "Eagle Power Schools Crest"
      },
      "image": "https://www.eaglepowerschools.com.ng/assets/campus.jpg",
      "telephone": "+2348035428910",
      "email": "info@eaglepowerschools.com.ng",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "2 & 9 Amikwo Road",
        "addressLocality": "Awka",
        "addressRegion": "Anambra State",
        "postalCode": "420110",
        "addressCountry": "NG"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 6.2209,
        "longitude": 7.0700
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "07:30",
          "closes": "16:30"
        }
      ],
      "slogan": "Love, Truth & Service",
      "priceRange": "₦₦",
      "hasCredential": [
        {
          "@type": "EducationalOccupationalCredential",
          "name": "WAEC Accredited Examination Center"
        },
        {
          "@type": "EducationalOccupationalCredential",
          "name": "NECO Accredited Examination Center"
        },
        {
          "@type": "EducationalOccupationalCredential",
          "name": "Anambra State Ministry of Education Approval"
        }
      ],
      "department": [
        {
          "@type": "EducationalOrganization",
          "name": "Eagle Power Early Years & Nursery School",
          "description": "Montessori-inspired early sensory and literacy foundation."
        },
        {
          "@type": "EducationalOrganization",
          "name": "Eagle Power School of Excellence (Primary Wing)",
          "description": "Foundational STEM, quantitative reasoning, and diction."
        },
        {
          "@type": "EducationalOrganization",
          "name": "Eagle Power College of Excellence (Secondary Wing)",
          "description": "Junior (JSS1-3) & Senior Secondary (SS1-3) education with full WAEC/NECO/BECE preparation."
        }
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.eaglepowerschools.com.ng/#website",
      "url": "https://www.eaglepowerschools.com.ng/",
      "name": "Eagle Power Schools Awka",
      "publisher": {
        "@id": "https://www.eaglepowerschools.com.ng/#school"
      },
      "inLanguage": "en-NG"
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.eaglepowerschools.com.ng/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Where is Eagle Power Schools located in Awka?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Eagle Power Schools is conveniently located at 2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State, Nigeria, easily accessible from Zik Avenue and Arthur Eze Avenue."
          }
        },
        {
          "@type": "Question",
          "name": "What academic curricula does Eagle Power Schools offer?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The school offers the Nigerian National Curriculum (NERDC) integrated with modern STEM, coding, Montessori early years, and British diction practices, preparing students for BECE, WAEC (WASSCE), NECO (SSCE), and JAMB (UTME) examinations."
          }
        },
        {
          "@type": "Question",
          "name": "How do I register a child for admission into Eagle Power Schools?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Parents can apply online through the official portal or visit the Admissions Office at 2 & 9 Amikwo Road, Awka. Online entrance assessment and document verification are conducted promptly."
          }
        },
        {
          "@type": "Question",
          "name": "What are the school fees at Eagle Power Schools?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Tuition fees are structured transparently per term according to academic wing (Nursery, Primary, Junior College, Senior College). Parents can use the interactive Fee Estimator on the website to calculate exact termly totals with sibling discounts."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.eaglepowerschools.com.ng/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.eaglepowerschools.com.ng/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Academics",
          "item": "https://www.eaglepowerschools.com.ng/#academics"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Admissions",
          "item": "https://www.eaglepowerschools.com.ng/#admissions"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Campus Life",
          "item": "https://www.eaglepowerschools.com.ng/#campus"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Contact",
          "item": "https://www.eaglepowerschools.com.ng/#contact"
        }
      ]
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="bg-slate-50 text-slate-800 antialiased selection:bg-amber-400 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}

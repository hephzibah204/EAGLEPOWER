import './globals.css';

export const metadata = {
  title: 'Eagle Power Schools | Awka, Anambra State | Excellence, Integrity & Leadership',
  description: 'Official website of Eagle Power Schools (Eagle Power School of Excellence & Eagle Power College of Excellence), Awka, Anambra State, Nigeria. Nurturing leaders with world-class academic, moral, and STEM education.',
  keywords: 'Eagle Power Schools, Eagle Power College of Excellence, Eagle Power School of Excellence, Awka schools, secondary school Awka, primary school Awka, Anambra State schools, best private schools Awka, Nigeria Spelling Bee winners',
  openGraph: {
    title: 'Eagle Power Schools | Soaring on Wings of Academic & Moral Excellence',
    description: 'Premier nursery, primary, and secondary education in Awka, Anambra State. Admissions open for 2026/2027 academic session.',
    type: 'website',
    url: 'https://www.eaglepowerschools.com.ng/',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23092347'/><circle cx='50' cy='50' r='42' fill='none' stroke='%23f59e0b' stroke-width='2'/><path d='M50 20 L62 42 L84 46 L68 62 L72 84 L50 72 L28 84 L32 62 L16 46 L38 42 Z' fill='%23f59e0b'/><path d='M50 30 L58 45 L74 48 L62 60 L65 76 L50 67 L35 76 L38 60 L26 48 L42 45 Z' fill='%23092347'/></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-800 antialiased selection:bg-amber-400 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}

export const metadata = {
  title: 'EduCore ERP Portal | Eagle Power Schools Awka',
  description: 'Enterprise School Management & Academic ERP System for Eagle Power Schools Awka.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {children}
    </div>
  );
}

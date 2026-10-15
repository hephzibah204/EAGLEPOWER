import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-black text-amber-400 mb-4">404</h1>
      <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-md">
        The requested resource or page could not be located on the EaglePower EduCore portal.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-colors shadow-lg"
      >
        Return to Home Portal
      </Link>
    </div>
  );
}

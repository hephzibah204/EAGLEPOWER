import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  Menu, 
  X, 
  User, 
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import Logo from './Logo';
import { schoolInfo } from '../data/schoolData';

export default function Navbar({ onOpenAdmission, onOpenPortal }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About Us", href: "#about" },
    { name: "Academics", href: "#academics" },
    { name: "Why Us", href: "#why-us" },
    { name: "Campus Life", href: "#campus" },
    { name: "News & Honors", href: "#news" },
    { name: "Contact", href: "#contact" },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Banner Bar */}
      <div className="bg-[#051429] bg-navy-dark text-slate-300 text-xs py-2 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Location & Contact info */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Amikwo, Awka, Anambra State</span>
            </span>
            <a 
              href={`tel:${schoolInfo.phone}`} 
              className="flex items-center gap-1.5 text-slate-300 hover:text-amber-300 active:text-amber-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{schoolInfo.phone}</span>
            </a>
          </div>

          {/* Right: Admission announcement & portal link */}
          <div className="flex items-center gap-4 ml-auto">
            <span className="hidden md:inline-flex text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded">
              2026/2027 Admissions Open
            </span>
            <a
              href="/portal/overview"
              className="flex items-center gap-1.5 text-slate-200 hover:text-amber-300 active:text-amber-400 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Sign In</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav 
        className={`w-full ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-3' 
            : 'bg-white border-b border-slate-200 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#home" onClick={(e) => handleLinkClick(e, '#home')} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500">
            <Logo size="md" />
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-medium text-slate-700 hover:text-navy active:text-navy-dark transition-colors py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="/portal/overview"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded border border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              <GraduationCap className="w-4 h-4 text-[#092347] text-navy" />
              <span>EduCore Portal</span>
            </a>

            <button
              type="button"
              onClick={onOpenAdmission}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 bg-gold hover:bg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              <span>Apply for Admission</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={onOpenAdmission}
              className="sm:hidden px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 bg-gold hover:bg-gold-hover disabled:opacity-50 rounded focus-visible:outline-2 focus-visible:outline-amber-500 whitespace-nowrap"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-amber-500"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-lg">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="px-3 py-2 rounded text-sm font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  {link.name}
                </a>
              ))}
              
              <div className="pt-4 border-t border-slate-200 flex flex-col gap-2.5">
                <a
                  href="/portal/overview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded transition-colors"
                >
                  <User className="w-4 h-4 text-navy" />
                  <span>Student &amp; Parent Portal Sign In</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmission();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-gold hover:bg-gold-hover active:bg-amber-600 disabled:opacity-50 rounded shadow-sm transition-colors whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">Apply for Admission</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

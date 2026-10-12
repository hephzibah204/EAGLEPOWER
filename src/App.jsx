import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import AcademicsSection from './components/AcademicsSection';
import WhyUsSection from './components/WhyUsSection';
import FeeEstimator from './components/FeeEstimator';
import CampusLifeSection from './components/CampusLifeSection';
import NewsSection from './components/NewsSection';
import TestimonialsSection from './components/TestimonialsSection';
import FaqSection from './components/FaqSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import AdmissionModal from './components/AdmissionModal';
import PortalDashboard from './components/PortalDashboard';
import { MessageCircle, ArrowUp } from 'lucide-react';

export default function App() {
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [admissionDivision, setAdmissionDivision] = useState('primary');
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const handleOpenAdmission = (division = 'primary') => {
    setAdmissionDivision(division);
    setIsAdmissionOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* Navigation */}
      <Navbar
        onOpenAdmission={() => handleOpenAdmission('primary')}
        onOpenPortal={() => setIsPortalOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="grow">
        <Hero 
          onOpenAdmission={() => handleOpenAdmission('primary')} 
        />
        
        <AboutSection />
        
        <AcademicsSection 
          onOpenAdmission={handleOpenAdmission} 
        />
        
        <WhyUsSection />
        
        <FeeEstimator 
          onOpenAdmission={handleOpenAdmission} 
        />
        
        <CampusLifeSection />
        
        <NewsSection />
        
        <TestimonialsSection />
        
        <FaqSection />
        
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmission={() => handleOpenAdmission('primary')}
        onOpenPortal={() => setIsPortalOpen(true)}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* WhatsApp Direct Pill */}
        <a
          href="https://wa.me/2348035428910?text=Hello%20Eagle%20Power%20Schools,%20I%20would%20like%20to%20inquire%20about%20admissions"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all text-xs sm:text-sm border-2 border-white"
          title="Chat with Eagle Power Admissions on WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">WhatsApp Helpdesk</span>
        </a>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shadow-lg transition-all hover:-translate-y-0.5"
            aria-label="Scroll back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Interactive Modals */}
      <AdmissionModal
        isOpen={isAdmissionOpen}
        onClose={() => setIsAdmissionOpen(false)}
        initialDivision={admissionDivision}
      />

      <PortalDashboard
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
      />
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Images, Play, Maximize2, X } from 'lucide-react';
import { schoolGallery } from '../data/schoolGallery.js';

const categoryLabels = {
  graduation: 'Graduation',
  'school-life': 'School life',
  competitions: 'Competitions',
};

export default function CampusLifeSection() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [visibleCount, setVisibleCount] = useState(9);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const categories = [...new Set(schoolGallery.map(item => item.category))];
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'image', label: 'Photos' },
    { id: 'video', label: 'Videos' },
    ...categories.map(category => ({ id: category, label: categoryLabels[category] || category })),
  ];
  const filteredItems = schoolGallery.filter(item => activeFilter === 'all' || item.type === activeFilter || item.category === activeFilter);

  useEffect(() => {
    if (!selectedItem) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    dialog?.querySelector('button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedItem(null);
      }
      if (event.key === 'Tab' && dialog) {
        const controls = [...dialog.querySelectorAll('button, video[controls], a[href], [tabindex="0"]')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const keepFocusInside = event => {
      if (dialog && !dialog.contains(event.target)) dialog.querySelector('button')?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', keepFocusInside);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', keepFocusInside);
      openerRef.current?.focus();
    };
  }, [selectedItem]);

  return (
    <section id="campus" aria-labelledby="gallery-heading" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <Images className="w-8 h-8 text-amber-600 mx-auto" aria-hidden="true" />
          <h2 id="gallery-heading" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Life at Eagle Power</h2>
          <p className="text-slate-600 text-base sm:text-lg">Explore photos and videos of our school community, celebrations, and achievements.</p>
        </div>
        <div role="group" aria-label="Filter school gallery" className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {filters.map(filter => (
            <button key={filter.id} type="button" aria-pressed={activeFilter === filter.id} onClick={() => { setActiveFilter(filter.id); setVisibleCount(9); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600 ${activeFilter === filter.id ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{filter.label}</button>
          ))}
        </div>
        <p className="sr-only" role="status">{Math.min(visibleCount, filteredItems.length)} of {filteredItems.length} gallery items shown</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.slice(0, visibleCount).map(item => (
            <button key={item.id} type="button" aria-label={`${item.type === 'video' ? 'Watch' : 'View'} ${item.title}`} onClick={event => { openerRef.current = event.currentTarget; setSelectedItem(item); }} className="group text-left rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600">
              <div className="h-64 sm:h-72 w-full relative overflow-hidden bg-slate-900">
                {(item.type === 'image' || item.poster) && <img src={item.type === 'image' ? item.src : item.poster} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                <span className="absolute top-4 left-4 bg-slate-950/80 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">{categoryLabels[item.category] || item.category}</span>
                {item.type === 'video' ? <span className="absolute inset-0 flex items-center justify-center"><span className="p-4 rounded-full bg-amber-400 text-slate-950"><Play className="w-7 h-7" aria-hidden="true" /></span></span> : <Maximize2 className="absolute top-4 right-4 w-5 h-5 text-white" aria-hidden="true" />}
                <span className="absolute bottom-4 left-5 text-white text-sm font-semibold">{item.type === 'video' ? 'Watch video' : 'View photo'}</span>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
        {filteredItems.length > visibleCount && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setVisibleCount(count => count + 9)} className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600">Show more photos and videos</button>
          </div>
        )}
        {filteredItems.length === 0 && <p className="text-center text-slate-600 py-10">More school memories will be added here soon.</p>}
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) setSelectedItem(null); }}>
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="gallery-preview-title" aria-describedby="gallery-preview-description" className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                <h3 id="gallery-preview-title" className="text-lg sm:text-2xl font-bold text-slate-900">{selectedItem.title}</h3>
                <button type="button" aria-label="Close gallery preview" onClick={() => setSelectedItem(null)} className="shrink-0 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 focus-visible:outline-2 focus-visible:outline-amber-600"><X className="w-5 h-5" aria-hidden="true" /></button>
              </div>
              <div className="bg-slate-950 flex items-center justify-center">
                {selectedItem.type === 'video' ? <video key={selectedItem.id} src={selectedItem.src} poster={selectedItem.poster} controls playsInline preload="none" aria-label={selectedItem.title} className="w-full max-h-[65vh]">Your browser does not support this video. <a href={selectedItem.src}>Open the video</a>.</video> : <img src={selectedItem.src} alt={selectedItem.title} className="w-full max-h-[65vh] object-contain" />}
              </div>
              <p id="gallery-preview-description" className="p-4 sm:p-5 text-slate-600 text-sm leading-relaxed">{selectedItem.description}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

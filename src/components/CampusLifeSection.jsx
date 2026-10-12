import React, { useState } from 'react';
import { 
  Building2, 
  Trophy, 
  Activity, 
  Palette, 
  Maximize2,
  X
} from 'lucide-react';

const galleryItems = [
  {
    id: 1,
    category: "arts",
    title: "Cultural Day & Heritage Exhibition",
    desc: "Eagle Power pupils proudly celebrating our rich cultural heritage in royal traditional regalia. 'Education is a gift that lasts forever.'",
    tag: "Cultural & Arts Day",
    image: "/assets/cultural-day.jpg",
    gradient: "from-amber-700 to-amber-950",
    icon: Palette
  },
  {
    id: 2,
    category: "competitions",
    title: "National Spelling Bee Championship Squad",
    desc: "Our secondary college spellers in sharp burgundy blazers and federation hats posing with coaches at the Nigeria Spelling Bee finals.",
    tag: "Championship Team",
    image: "/assets/spelling-team.jpg",
    gradient: "from-blue-900 to-slate-950",
    icon: Trophy
  },
  {
    id: 3,
    category: "competitions",
    title: "Anambra State Best Senior Speller Champion",
    desc: "Proud Eagle Power College scholar holding the gold victory trophy and National Finalist award after winning the state championship.",
    tag: "Gold Medalist",
    image: "/assets/spelling-champion.png",
    gradient: "from-amber-600 to-amber-950",
    icon: Trophy
  },
  {
    id: 4,
    category: "facilities",
    title: "Primary & Nursery Performance Showcase",
    desc: "Pupils displaying vibrant music, stage recitation, and joyful choreography during the annual school celebration.",
    tag: "Pupils Showcase",
    image: "/assets/pupils-dancing.jpg",
    gradient: "from-emerald-700 to-teal-950",
    icon: Activity
  },
  {
    id: 5,
    category: "facilities",
    title: "Eagle Power School Assembly & Learning Community",
    desc: "Students in official red and green school polos seated together in unity, discipline, and attentive focus.",
    tag: "School Assembly",
    image: "/assets/pupils-seated.jpg",
    gradient: "from-red-700 to-rose-950",
    icon: Building2
  },
  {
    id: 6,
    category: "facilities",
    title: "Official Eagle Power School of Excellence Crest",
    desc: "The authentic circular school seal symbolizing Love, Truth & Service with the academic mortarboard, soaring eagle, and open book.",
    tag: "Official Seal",
    image: "/assets/official-logo.jpg",
    gradient: "from-slate-800 to-slate-950",
    icon: Building2
  }
];

export default function CampusLifeSection() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  const filters = [
    { id: 'all', label: 'All Facilities' },
    { id: 'labs', label: 'STEM & Labs' },
    { id: 'competitions', label: 'Spelling Bee & Oratory' },
    { id: 'sports', label: 'Sports & PE' },
    { id: 'arts', label: 'Arts & Culture' },
    { id: 'facilities', label: 'Early Years' },
  ];

  const filteredItems = activeFilter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter);

  return (
    <section id="campus" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Campus Life & Infrastructure</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            An Enriching Environment Built for Flourishing
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Take a virtual look into our world-class facilities in Amikwo, Awka, meticulously designed to inspire creativity, curiosity, and sportsmanship.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeFilter === f.id
                  ? 'bg-slate-900 text-amber-400 shadow-md scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200/80 bg-slate-900"
              >
                {/* Styled Card Image Canvas with Real Photo */}
                <div className="h-64 sm:h-72 w-full relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${item.gradient}`} />
                  )}

                  {/* Dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className="bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      {IconComp && <IconComp className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span>{item.tag}</span>
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Bottom title preview */}
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight drop-shadow-md">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Card footer description */}
                <div className="p-5 bg-white text-left">
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                    {item.desc}
                  </p>
                  <div className="mt-3 flex items-center text-xs font-bold text-amber-600 group-hover:text-amber-700">
                    <span>Click to inspect facility details &rarr;</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Lightbox */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
              <div className="relative h-56 w-full">
                {selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${selectedItem.gradient}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="bg-black/50 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/30">
                    {selectedItem.tag}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2 leading-tight drop-shadow-md">
                    {selectedItem.title}
                  </h3>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-slate-700 text-sm leading-relaxed">
                  {selectedItem.desc}
                </p>
                <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
                  <span className="font-bold text-slate-900">Campus Location: </span>
                  Eagle Power Campus, Amikwo, Awka, Anambra State. Open for guided parent tours Monday to Friday.
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react"; // J'ai retiré 'Grip' car on n'a plus le bouton

export default function ApartmentGallery({ photos, name }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const openLightbox = (index) => {
    setCurrentPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  // Si pas de photos ou liste vide
  if (!photos || photos.length === 0) return null;

  return (
    <div className="relative max-w-7xl mx-auto mb-8 mt-6">
      
      {/* LA GRILLE DE PHOTOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden">
        
        {/* Grande photo */}
        <div className="md:col-span-2 md:row-span-2 relative group cursor-pointer" onClick={() => openLightbox(0)}>
          <img src={photos[0]} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>

        {/* Petites photos (2, 3, 4, 5) */}
        {[1, 2, 3, 4].map((idx) => (
          photos[idx] && (
            <div key={idx} className="hidden md:block relative cursor-pointer group" onClick={() => openLightbox(idx)}>
              <img src={photos[idx]} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          )
        ))}
      </div>

      {/* J'ai supprimé le bloc du bouton "Grip" ici */}

      {/* --- LA LIGHTBOX (MODALE) --- */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <button onClick={closeLightbox} className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-50">
            <X size={40} />
          </button>

          <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-2 rounded-full transition-all">
            <ChevronLeft size={48} />
          </button>

          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img src={photos[currentPhotoIndex]} alt={`Vue ${currentPhotoIndex + 1}`} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-lg font-medium">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </div>

          <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-2 rounded-full transition-all">
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
}
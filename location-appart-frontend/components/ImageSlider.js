// src/components/ImageSlider.js
"use client";

import { useState } from "react";
import Link from "next/link"; // <--- Import nécessaire

export default function ImageSlider({ images, heightClass = "h-64", slug = null }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages = images && images.length > 0 
    ? images 
    : ["https://placehold.co/800x600?text=Pas+d+image"];

  const prevSlide = (e) => {
    e.preventDefault(); // Empêche le clic de traverser vers le lien
    e.stopPropagation(); // Arrête la propagation
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? safeImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isLastSlide = currentIndex === safeImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // L'élément Image seul
  const ImageElement = (
    <img
      src={safeImages[currentIndex]}
      alt="Appartement"
      className={`w-full h-full object-cover transition-opacity duration-500 ${slug ? 'cursor-pointer hover:opacity-95' : ''}`}
    />
  );

  return (
    <div className={`w-full ${heightClass} relative group overflow-hidden`}>
      
      {/* LOGIQUE DU LIEN : Si on a un slug, on entoure l'image d'un lien */}
      {slug ? (
        <Link href={`/appartement/${slug}`} className="block h-full w-full">
          {ImageElement}
        </Link>
      ) : (
        ImageElement
      )}

      {/* Flèche Gauche */}
      {safeImages.length > 1 && (
        <button
          onClick={prevSlide}
          className="hidden group-hover:block absolute top-[50%] -translate-y-[50%] left-2 text-2xl rounded-full p-2 bg-black/50 text-white cursor-pointer hover:bg-black/70 z-20"
        >
          ❮
        </button>
      )}

      {/* Flèche Droite */}
      {safeImages.length > 1 && (
        <button
          onClick={nextSlide}
          className="hidden group-hover:block absolute top-[50%] -translate-y-[50%] right-2 text-2xl rounded-full p-2 bg-black/50 text-white cursor-pointer hover:bg-black/70 z-20"
        >
          ❯
        </button>
      )}

      {/* Indicateurs */}
      {safeImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
          {safeImages.map((_, slideIndex) => (
            <div
              key={slideIndex}
              className={`transition-all w-2 h-2 rounded-full shadow-sm ${
                currentIndex === slideIndex ? "bg-white p-1" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
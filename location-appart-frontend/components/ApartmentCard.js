// src/components/ApartmentCard.js
import Link from 'next/link';
import ImageSlider from './ImageSlider';

export default function ApartmentCard({ apartment }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow duration-300 relative">
      
      <div className="relative">
        {/* MODIFICATION ICI : On ajoute la prop "slug" */}
        <ImageSlider 
          images={apartment.images} 
          heightClass="h-56" 
          slug={apartment.slug} 
        />
        
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md font-bold text-sm shadow z-10 pointer-events-none">
          {apartment.price_per_night/100} € / semaine
        </div>
      </div>

      <div className="p-4">
        {/* ... le reste ne change pas ... */}
        <h2 className="text-xl font-bold text-gray-800 mb-2">{apartment.name + " - "+apartment.capacity+" personnes"}</h2>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {apartment.description || "Aucune description..."}
        </p>
        
        <Link 
          href={`/appartement/${apartment.slug}`}
          className="block w-full text-center bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Voir les disponibilités
        </Link>
      </div>
    </div>
  );
}
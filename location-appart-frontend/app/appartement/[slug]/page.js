import Link from 'next/link';
import ImageSlider from '../../../components/ImageSlider';
import BookingForm from '../../../components/BookingForm';
import LocationSection from '../../../components/LocationSection';

import {Check, MapPin, Calendar, Users, // <--- Ajouté
  CalendarClock, // <--- Ajouté
  Ban, CigaretteOff, Cat, Accessibility} from "lucide-react"; // Ajoute 'Check'
// Fonction pour récupérer UN seul appartement via son slug
async function getApartment(slug) {
  try {
    const res = await fetch(`http://localhost:5000/api/apartments/${slug}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Erreur:", error);
    return null;
  }
}

// Petite fonction pour choisir l'icône selon le texte
const getRestrictionIcon = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('fume')) return <CigaretteOff size={20} />;
  if (lowerText.includes('animau') || lowerText.includes('chien')) return <Cat size={20} />;
  if (lowerText.includes('pmr') || lowerText.includes('handicap')) return <Accessibility size={20} />;
  return <Ban size={20} />; // Icône "Interdit" générique par défaut
};


export default async function ApartmentPage({ params }) {
  // 1. On récupère le slug de l'URL (ex: "super-chalet")
  // Note: Dans les dernières versions Next.js, params est parfois une Promise, 
  // mais ici on fait simple. Si ça bug, dis-le moi.
  const { slug } = await params; 
  // 2. On charge les données
  const apartment = await getApartment(slug);

  // 3. Si l'appart n'existe pas
  if (!apartment) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Oups ! Appartement introuvable.</h1>
        <Link href="/" className="text-blue-500 underline mt-4 block">Retour à l'accueil</Link>
      </div>
    );
  }

  // Image principale
  const mainImage = apartment.images && apartment.images.length > 0 
    ? apartment.images[0] 
    : 'https://placehold.co/800x400?text=Pas+d+image';
      {/* BOUTON RETOUR */}

  return (
    <main className="min-h-screen bg-gray-50 pb-20">

      {/*2. LA NOUVELLE BARRE DE NAVIGATION */}
      {/* top-0 ou top-20 selon la hauteur de ton menu principal */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto py-4">
            <a href="#le-logement" className="text-gray-600 hover:text-blue-600 font-bold whitespace-nowrap transition-colors">
               Le Logement
            </a>
            <a href="#equipements" className="text-gray-600 hover:text-blue-600 font-bold whitespace-nowrap transition-colors">
               Équipements
            </a>
            <a href="#localisation" className="text-gray-600 hover:text-blue-600 font-bold whitespace-nowrap transition-colors">
               Localisation
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-6 px-4">
        <Link href="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
          ← Retour aux appartements
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* COLONNE GAUCHE */}
          <div className="lg:col-span-2">
            
            {/* 👇 3. SECTION LE LOGEMENT (Avec l'ID) */}
            <section id="le-logement" className="scroll-mt-32 mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{apartment.name}</h1>
              
              {/* --- BANDEAU INFOS CLÉS (Capacité & Rotation) --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 mt-6">
                
                {/* BLOC CAPACITÉ */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                  <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                    <Users size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-0.5">
                      Capacité
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {apartment.capacity} Personnes
                    </p>
                  </div>
                </div>

                {/* BLOC ROTATION */}
              <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                  <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm">
                    <CalendarClock size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                      Arrivée / Départ
                    </p>
                    <p className="text-lg font-bold text-indigo-900">
                      {/* 👇 LA FORMULE MAGIQUE : On convertit le chiffre en texte */}
                      Le {
                        ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][apartment.changeover_day] 
                        || "Samedi" // (Si jamais c'est vide, on met Samedi par défaut)
                      }
                    </p>
                  </div>
                </div>

              </div>

              <p className="text-gray-600 leading-relaxed text-lg">
                {apartment.description}
              </p>
            </section>

            {/* 👇 4. SECTION ÉQUIPEMENTS (Avec l'ID et ton joli bloc) */}
            {apartment.features && apartment.features.length > 0 && (
              <section id="equipements" className="scroll-mt-32 mb-12">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                     Équipements inclus
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apartment.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                         {/* ... ton icône Check ... */}
                        <div className="text-blue-600"><Check size={20} /></div>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {/* --- SECTION RESTRICTIONS / RÈGLEMENT --- */}
            {apartment.restrictions && apartment.restrictions.length > 0 && (
              <div className="mt-8 bg-red-50 p-8 rounded-2xl border border-red-100">
                
                <h3 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-2">
                  ⛔ À savoir 
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apartment.restrictions.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                      <div className="flex-shrink-0 text-red-500">
                        {/* On appelle notre fonction magique pour l'icône */}
                        {getRestrictionIcon(item)}
                      </div>
                      <span className="text-red-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
            {/* 👇 5. SECTION LOCALISATION (Avec l'ID) */}
            {/* Assure-toi d'avoir une map ici ou l'image de la map */}
            <section id="localisation" className="scroll-mt-32 mb-12">
               <h3 className="text-2xl font-bold text-gray-900 mb-6">📍 Localisation</h3>
               <div className="bg-gray-200 rounded-xl h-96 w-full overflow-hidden shadow-sm relative">
                  {/* SI TU AS L'URL GOOGLE MAPS DANS LA BDD */}
                  {apartment.map_url ? (
                    <iframe 
                      src={apartment.map_url} 
                      width="100%" 
                      height="100%" 
                      style={{border:0}} 
                      allowFullScreen="" 
                      loading="lazy">
                    </iframe>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Carte non disponible
                    </div>
                  )}
               </div>
            </section>

          </div>

          {/* COLONNE DROITE (Formulaire - Reste fixe ou pas) */}
          <div className="lg:col-span-1">
             {/* Ton composant BookingForm */}
             <div className="sticky top-24">
                <BookingForm apartment={apartment} />
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}
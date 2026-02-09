import Link from 'next/link';
import BookingForm from '@/components/BookingForm'; // Assure-toi que le chemin est bon
import ApartmentGallery from "@/components/ApartmentGallery"; // Ton nouveau composant galerie
import { 
  Check, Users, CalendarClock, 
  Ban, CigaretteOff, Cat, Accessibility 
} from "lucide-react";

// Fonction pour récupérer l'appartement via l'API (Server Side)
async function getApartment(slug) {
  try {
    // Si tu es en local, utilise localhost. En prod, il faudra changer l'URL de base.
    // L'idéal est d'utiliser une variable d'environnement : process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/apartments/${slug}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Erreur récupération appartement:", error);
    return null;
  }
}

// Petite fonction pour choisir l'icône des restrictions
const getRestrictionIcon = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('fume')) return <CigaretteOff size={20} />;
  if (lowerText.includes('animau') || lowerText.includes('chien')) return <Cat size={20} />;
  if (lowerText.includes('pmr') || lowerText.includes('handicap')) return <Accessibility size={20} />;
  return <Ban size={20} />;
};

export default async function ApartmentPage({ params }) {
  // 1. Récupération du slug (Compatible Next.js 15)
  const { slug } = await params; 
  
  // 2. Chargement des données
  const apartment = await getApartment(slug);

  // 3. Si l'appart n'existe pas
  if (!apartment) {
    return (
      <div className="p-20 text-center min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Oups ! Appartement introuvable.</h1>
        <p className="text-gray-500 mb-6">Il semble que ce logement n'existe plus ou que l'adresse soit incorrecte.</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">

      {/* --- MENU DE NAVIGATION SECONDAIRE --- */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto py-4 scrollbar-hide">
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

      {/* --- BOUTON RETOUR --- */}
      <div className="max-w-6xl mx-auto pt-6 px-4">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors mb-4">
          ← Retour aux appartements
        </Link>
      </div>

      {/* --- GALERIE PHOTOS (Composant Client) --- */}
      <ApartmentGallery photos={apartment.images} name={apartment.name} />

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* COLONNE GAUCHE (Infos) */}
          <div className="lg:col-span-2">
            
            {/* 1. SECTION LE LOGEMENT */}
            <section id="le-logement" className="scroll-mt-32 mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{apartment.name}</h1>
              
              {/* BANDEAU INFOS CLÉS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 mt-6">
                
                {/* Capacité */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                  <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                    <Users size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-0.5">Capacité</p>
                    <p className="text-lg font-bold text-blue-900">{apartment.capacity} Personnes</p>
                  </div>
                </div>

                {/* Rotation */}
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                  <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm">
                    <CalendarClock size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Arrivée / Départ</p>
                    <p className="text-lg font-bold text-indigo-900">
                      Le {
                        ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][apartment.changeover_day] 
                        || "Samedi"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-lg text-gray-600 leading-relaxed max-w-none">
                <p>{apartment.description}</p>
              </div>
            </section>

            {/* 2. SECTION ÉQUIPEMENTS */}
            {apartment.features && apartment.features.length > 0 && (
              <section id="equipements" className="scroll-mt-32 mb-12">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                     Équipements inclus
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apartment.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-blue-600 flex-shrink-0">
                            <Check size={20} />
                        </div>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 3. SECTION RESTRICTIONS */}
            {apartment.restrictions && apartment.restrictions.length > 0 && (
              <div className="mb-12 bg-red-50 p-8 rounded-2xl border border-red-100">
                <h3 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-2">
                  ⛔ À savoir (Règlement)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apartment.restrictions.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                      <div className="flex-shrink-0 text-red-500">
                        {getRestrictionIcon(item)}
                      </div>
                      <span className="text-red-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. SECTION LOCALISATION */}
            <section id="localisation" className="scroll-mt-32 mb-12">
               <h3 className="text-2xl font-bold text-gray-900 mb-6">📍 Localisation</h3>
               <div className="bg-gray-200 rounded-xl h-96 w-full overflow-hidden shadow-sm relative border border-gray-300">
                 {apartment.map_url ? (
                   <iframe 
                     src={apartment.map_url} 
                     width="100%" 
                     height="100%" 
                     style={{border:0}} 
                     allowFullScreen="" 
                     loading="lazy"
                     referrerPolicy="no-referrer-when-downgrade"
                   ></iframe>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                     <Ban size={40} className="opacity-50" />
                     <p>Carte non disponible pour ce logement.</p>
                   </div>
                 )}
               </div>
            </section>

          </div>

          {/* COLONNE DROITE (Formulaire Fixe) */}
          <div className="lg:col-span-1">
             <div className="sticky top-24">
                {/* On passe l'objet apartment complet au formulaire */}
                <BookingForm apartment={apartment} />
             </div>
          </div>

        </div>
      </div>
      
    </main>
  );
}
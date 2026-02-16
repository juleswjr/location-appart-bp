import ApartmentCard from '../components/ApartmentCard';
import LocationSection from '../components/LocationSection';
import ContactSection from '../components/ContactSection';
import Navbar from '../components/Navbar';
import ReviewsSection from '../components/ReviewsSection';
export const dynamic = "force-dynamic";
import Image from "next/image";
async function getApartments() {
  try {
    // On utilise la variable d'environnement OU localhost par défaut
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // Utilise apiUrl dans ton fetch
  const res = await fetch(`${apiUrl}/api/apartments`, { cache: 'no-store' });
  
    if (!res.ok) {
      throw new Error('Erreur réseau');
    }
    return res.json();
  } catch (error) {
    console.error("Erreur Backend:", error);
    return [];

  }
  
}

export default async function Home() {
  const apartments = await getApartments();

  return (
<main className="min-h-screen bg-white">
      
      {/* 2. LA BARRE DE NAVIGATION (Tout en haut) */}
      <Navbar />

      {/* HERO (En-tête avec Image de fond) */}
      <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center text-white text-center px-4">
        
        {/* 1. L'IMAGE DE FOND (Optimisée par Next.js) */}
        <Image
          src="/images/IMG_54581.jpg" // 👈 Mets le bon chemin vers ton image ici
          alt="Vue de Belle Plagne"
          fill // Remplit tout le conteneur parent
          className="object-cover z-0 pointer-events-none" // S'assure que l'image couvre tout sans être déformée
          priority // Charge l'image en priorité (important pour le LCP)
        />

        {/* 2. LE FILTRE SOMBRE (Overlay) */}
        {/* C'est crucial pour que le texte blanc reste lisible sur une photo claire */}
        <div className="absolute inset-0 bg-blue-900/40 z-10"></div>
        {/* Tu peux changer la couleur : bg-black/50, bg-blue-900/60, etc. */}


        {/* 3. LE TEXTE (Au premier plan) */}
        <div className="relative z-20 mt-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            Location Belle Plagne
          </h1>
          <p className="text-xl md:text-2xl opacity-90 drop-shadow-md">
            Vos vacances commencent ici.
          </p>
        </div>

      </div>

      {/* 3. LISTE APPARTEMENTS (Ajout de l'ID pour le menu) */}
      {/* 'scroll-mt-24' sert à laisser de la place pour le menu quand on arrive dessus */}
      <div id="appartements" className="max-w-6xl mx-auto px-4 py-16 scroll-mt-24">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 border-l-4 border-blue-600 pl-4">
          Nos Appartements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apartments.map((appart) => (
            <ApartmentCard key={appart.id} apartment={appart} />
          ))}
        </div>
      </div>

      {/* 4. Review section*/}
      <ReviewsSection />

      {/* 5. LOCALISATION (Ajout de l'ID) */}
      <div id="localisation" className="scroll-mt-20">
        <LocationSection />
      </div>

      {/* 6. CONTACT (Ajout de l'ID) */}
      <div id="contact" className="scroll-mt-20">
        <ContactSection />
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <p>© 2026 MyBellePlagne - Tous droits réservés</p>
      </footer>
    </main>
  );
}
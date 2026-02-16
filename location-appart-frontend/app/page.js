import ApartmentCard from '../components/ApartmentCard';
import LocationSection from '../components/LocationSection';
import ContactSection from '../components/ContactSection';
import Navbar from '../components/Navbar';
import ReviewsSection from '../components/ReviewsSection';
export const dynamic = "force-dynamic";
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

      {/* HERO (En-tête) */}
      <div className="bg-blue-900 text-white py-32 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 mt-10">
          Location Belle Plagne
        </h1>
        <p className="text-xl opacity-90">Vos vacances commencent ici.</p>

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
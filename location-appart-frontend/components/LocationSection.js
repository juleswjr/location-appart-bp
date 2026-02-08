export default function LocationSection({ mapUrl }) {
  // Si on nous donne un lien précis (page appart), on l'utilise.
  // Sinon (page accueil), on utilise la carte par défaut de la station.
  const finalMapUrl = mapUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11184.716426348918!2d6.6966052629125645!3d45.50647302542264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47897a4f1a48648d%3A0x7851eafa14da5992!2sBelle%20Plagne%2C%2073210%20La%20Plagne%20Tarentaise!5e0!3m2!1sfr!2sfr!4v1768753705407!5m2!1sfr!2sfr";
  // On change aussi le titre selon le contexte
  const title = mapUrl ? "Situation de l'appartement" : "📍 Localisation idéale";

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {title}
        </h2>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          {/* Cadre de la carte */}
          <div className="w-full h-96 rounded-lg overflow-hidden relative">
            <iframe 
              width="100%" 
              height="100%" 
              title="Carte"
              className="absolute inset-0 border-0"
              loading="lazy"
              allowFullScreen
              src={finalMapUrl}
            ></iframe>
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">
            {mapUrl 
              ? "L'emplacement exact de votre futur logement." 
              : "Nos appartements sont situés au cœur de la station, à proximité immédiate des pistes."}
          </p>
        </div>
      </div>
    </section>
  );
}


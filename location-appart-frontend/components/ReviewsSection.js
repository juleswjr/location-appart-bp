import { Star } from "lucide-react";

export default function ReviewsSection() {
  // Tu pourras changer ces textes plus tard
  const reviews = [
    {
      name: "Sophie Martin",
      date: "Il y a 2 mois",
      rating: 5,
      text: "Appartement impeccable et idéalement situé au pied des pistes. Le propriétaire est très réactif. Nous reviendrons l'année prochaine !",
    },
    {
      name: "Thomas Bernard",
      date: "Il y a 1 mois",
      rating: 5,
      text: "Super séjour ! L'appartement est bien équipé, propre et la vue est magnifique. Je recommande vivement.",
    },
    {
      name: "Julie Dubois",
      date: "Il y a 3 semaines",
      rating: 4,
      text: "Très bon rapport qualité/prix. L'accès aux commerces est facile. Seul petit bémol : il a fait un peu chaud, mais c'était super.",
    },
    {
      name: "Julie Dubois",
      date: "Il y a 3 semaines",
      rating: 4,
      text: "Très bon rapport qualité/prix. L'accès aux commerces est facile. Seul petit bémol : il a fait un peu chaud, mais c'était super.",
    }
  ];

  return (
    <section id="avis" className="py-16 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
          ⭐ Avis Clients
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.date}</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                "{review.text}"
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
            <a href="https://maps.google.com" target="_blank" className="text-blue-600 underline font-medium">
                Voir tous les avis sur Google
            </a>
        </div>
      </div>
    </section>
  );
}
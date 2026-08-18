export default function MentionsLegales() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mentions Légales et Confidentialité</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Éditeur du site</h2>
        <p><strong>Propriétaire :</strong> Pierre Wejroch</p>
        <p><strong>Adresse :</strong> Chemin du Bois de Maud, 26200 Montélimar</p>
        <p><strong>Contact :</strong> [Ton email de contact]</p>
        <p><em>Statut : Particulier (Loueur en Meublé Non Professionnel)</em></p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Hébergement</h2>
        <p>Ce site est hébergé par :</p>
        <p><strong>Vercel Inc.</strong></p>
        <p>340 Pine Street, San Francisco, CA 94104, USA</p>
        <p>Téléphone : +1 (559) 288-7060</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">3. Données personnelles (RGPD)</h2>
        <p>
          Les données collectées lors de la réservation (nom, prénom, email) sont utilisées 
          uniquement dans le cadre strict de la gestion de votre location. Elles ne sont 
          jamais revendues ni transmises à des tiers. Vous pouvez demander leur suppression 
          à tout moment en nous contactant par email.
        </p>
      </section>
    </main>
  );
}
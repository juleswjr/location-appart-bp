export default function MentionsLegales() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mentions Légales et Confidentialité</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Éditeur du site</h2>
        <p><strong>Propriétaire :</strong> Pierre Wejroch</p>
        <p><strong>Adresse :</strong> Chemin du Bois de Laud, 26200 Montélimar</p>
        <p><strong>Contact :</strong> mybelleplagne@gmail.com</p>
        <p><em>Statut : Particulier </em></p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Hébergement et Infrastructure</h2>
        <p className="mb-4">L'architecture technique de ce site s'appuie sur plusieurs prestataires spécialisés :</p>
        
        <ul className="list-disc pl-5 space-y-4">
          <li>
            <strong>Hébergement du site (Frontend) :</strong><br />
            Vercel Inc.<br />
            440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
            Site web : https://vercel.com
          </li>
          <li>
            <strong>Hébergement du serveur (Backend) :</strong><br />
            Render Services, Inc.<br />
            525 3rd Street, Suite 200, San Francisco, CA 94107, USA<br />
            Site web : https://render.com
          </li>
          <li>
            <strong>Hébergement de la base de données :</strong><br />
            Supabase, Inc.<br />
            970 16th Street, San Francisco, CA 94103, USA<br />
            Site web : https://supabase.com
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">3. Données personnelles (RGPD)</h2>
        <p>
          Les données collectées lors de la réservation (nom, prénom, email, adresse) sont utilisées 
          uniquement dans le cadre strict de la gestion de votre location. Elles ne sont 
          jamais revendues ni transmises à des tiers. Vous pouvez demander leur suppression 
          à tout moment en nous contactant par email.
        </p>
      </section>
    </main>
  );
}
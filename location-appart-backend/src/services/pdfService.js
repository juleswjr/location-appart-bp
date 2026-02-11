const PDFDocument = require('pdfkit');
// Vérifie bien que ce fichier existe et exporte ton client supabase initialisé !
const supabase = require('../config/supabaseClient'); 

// On renomme la fonction pour matcher ton Controller : generateContractPDF
// On change les arguments pour recevoir un seul objet "data"
exports.generateContractPDF = async (data) => {
  return new Promise((resolve, reject) => {
    
    // 1. Création du document PDF en mémoire
    const doc = new PDFDocument();
    let buffers = [];

    // On capture les morceaux du fichier PDF
    doc.on('data', buffers.push.bind(buffers));
    
    // Quand le PDF est fini
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        
        // Nom du fichier : contract_TIMESTAMP_NOMCLIENT.pdf
        // On nettoie le nom (enlève les espaces)
        const safeName = data.customer_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `contract_${Date.now()}_${safeName}.pdf`;

        // 2. Upload vers Supabase Storage (Bucket 'contracts')
        const { error: uploadError } = await supabase
          .storage
          .from('contracts') // Assure-toi que ce bucket existe sur Supabase !
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
            console.error("Erreur Upload Supabase:", uploadError);
            return reject(uploadError);
        }

        // 3. Générer l'URL signée (Lien temporaire pour télécharger)
        const { data: signedUrlData, error: urlError } = await supabase
          .storage
          .from('contracts')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // Valide 1 an

        if (urlError) return reject(urlError);

        // On renvoie l'URL au controller
        resolve(signedUrlData.signedUrl);

      } catch (err) {
        reject(err);
      }
    });

    // --- 3. DESSIN DU PDF ---
    // On utilise les données de l'objet "data" envoyé par le controller
    
    doc.fontSize(20).text('CONTRAT DE LOCATION SAISONNIÈRE', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Entre les soussignés :`);
    doc.text(`Le Propriétaire : Pierre Wejroch`);
    doc.text(`ET`);
    doc.text(`Le Locataire : ${data.customer_name}`);
    // Vérifie si ces champs existent dans ton objet data, sinon mets une chaine vide
    doc.text(`Adresse : ${data.customer_address || ''}`);
    doc.text(`Téléphone : ${data.customer_phone || ''}`);
    doc.moveDown();

    doc.text(`Il a été convenu ce qui suit :`);
    doc.moveDown();
    doc.text(`APPARTEMENT : ${data.apartment_name}`);
    
    // Formatage propre des dates
    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startStr = new Date(data.start_date).toLocaleDateString('fr-FR', dateOptions);
    const endStr = new Date(data.end_date).toLocaleDateString('fr-FR', dateOptions);

    doc.text(`DATES : Du ${startStr} au ${endStr}`);
    
    // Attention : data.total_price est déjà en euros dans ton controller ? 
    // Si c'est des centimes, garde la division /100. Sinon enlève-la.
    // Supposons que c'est des euros comme dans ton controller précédent :
    doc.text(`PRIX TOTAL : ${data.total_price} €`); 
    
    if (data.has_parking) {
        doc.moveDown();
        doc.text(`✅ OPTION PARKING INCLUS`, { underline: true });
    }

    doc.moveDown(2);
    
    doc.text(`RÈGLEMENT INTÉRIEUR :`);
    doc.text(`- Non fumeur`);
    doc.text(`- Pas de fêtes`);
    doc.text(`- Arrivée 14h / Départ 10h`);
    
    doc.moveDown(2);
    doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}, à validation automatique.`);
    doc.text(`(Signature numérique via réservation en ligne)`);

    doc.end(); // Déclenche l'événement 'end'
  });
};
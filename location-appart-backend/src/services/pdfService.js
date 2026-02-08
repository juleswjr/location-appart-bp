// src/services/pdfService.js
const PDFDocument = require('pdfkit');
const supabase = require('../config/supabaseClient');

exports.generateAndUploadContract = async (bookingData, apartmentName, price) => {
  return new Promise((resolve, reject) => {
    // 1. Création du document PDF en mémoire
    const doc = new PDFDocument();
    let buffers = [];

    // On capture le flux de données du PDF
    doc.on('data', buffers.push.bind(buffers));
    
    // Quand le PDF est fini d'écrire
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      
      // 3. Upload vers Supabase Storage (Bucket 'contracts')
      const fileName = `contract_${Date.now()}_${bookingData.customer_name.replace(/\s/g, '_')}.pdf`;

      const { data, error } = await supabase
        .storage
        .from('contracts')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf'
        });

      if (error) return reject(error);

      // On crée une URL signée (valide 1 an par exemple) pour que tu puisses le télécharger
      // car le bucket est privé.
      const { data: signedUrlData } = await supabase
        .storage
        .from('contracts')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // Valide 1 an

      resolve(signedUrlData.signedUrl);
    });

    // --- 2. CONTENU DU PDF (Le Design du Contrat) ---
    doc.fontSize(20).text('CONTRAT DE LOCATION SAISONNIÈRE', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Entre les soussignés :`);
    doc.text(`Pierre Wejroch`);
    doc.text(`ET`);
    doc.text(`Le Locataire : ${bookingData.customer_name}`);
    doc.text(`Adresse : ${bookingData.customer_address}`);
    doc.text(`Téléphone : ${bookingData.customer_phone}`);
    doc.moveDown();

    doc.text(`Il a été convenu ce qui suit :`);
    doc.moveDown();
    doc.text(`APPARTEMENT : ${apartmentName}`);
    doc.text(`DATES : Du ${bookingData.start_date} au ${bookingData.end_date}`);
    doc.text(`PRIX TOTAL : ${price / 100} €`); // Prix stocké en centimes
    doc.moveDown();
    
    doc.text(`RÈGLEMENT INTÉRIEUR :`);
    doc.text(`- Non fumeur`);
    doc.text(`- Pas de fêtes`);
    doc.text(`- Arrivée 14h / Départ 10h`);
    
    doc.moveDown(2);
    doc.text(`Fait le ${new Date().toLocaleDateString()}, pour valoir ce que de droit.`);
    doc.text(`(Signature numérique validée par l'envoi du formulaire)`);

    doc.end(); // On ferme le document, ce qui déclenche l'événement 'end' ci-dessus
  });
};
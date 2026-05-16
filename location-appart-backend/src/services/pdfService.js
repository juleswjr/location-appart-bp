const PDFDocument = require('pdfkit');
const supabase = require('../config/supabaseClient');

exports.generateContractPDF = async (data) => {
  return new Promise(async (resolve, reject) => {

    // 0. Récupérer number et building depuis la table apartments
    let apartmentNumber = '';
    let buildingName = '';
    let capacity = data.capacity || '';

    try {
      const { data: aptData, error } = await supabase
        .from('apartments')
        .select('number, building, capacity')
        .eq('id', data.apartment_id)
        .single();

      if (!error && aptData) {
        apartmentNumber = aptData.number || '';
        buildingName = aptData.building || '';
        capacity = aptData.capacity || capacity;
      }
    } catch (e) {
      console.error('Erreur récupération infos appart:', e.message);
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));

    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        const safeName = data.customer_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `contract_${Date.now()}_${safeName}.pdf`;

        const { error: uploadError } = await supabase
          .storage
          .from('contracts')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) return reject(uploadError);

        const { data: signedUrlData, error: urlError } = await supabase
          .storage
          .from('contracts')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);

        if (urlError) return reject(urlError);

        resolve(signedUrlData.signedUrl);
      } catch (err) {
        reject(err);
      }
    });

    // ─── DONNÉES ───────────────────────────────────────────
    const totalPrice = data.total_price / 100;
    const acompte = (totalPrice / 2).toFixed(2);
    const solde = (totalPrice / 2).toFixed(2);
    const caution = (totalPrice / 2).toFixed(2);

    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startStr = new Date(data.start_date + 'T12:00:00').toLocaleDateString('fr-FR', dateOptions);
    const endStr = new Date(data.end_date + 'T12:00:00').toLocaleDateString('fr-FR', dateOptions);
    const todayStr = new Date().toLocaleDateString('fr-FR', dateOptions);

    // ─── HELPER ────────────────────────────────────────────
    const addSection = (title) => {
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').text(title);
      doc.font('Helvetica');
    };

    const addParagraph = (text, options = {}) => {
      doc.fontSize(10).font('Helvetica').text(text, { align: 'justify', ...options });
    };

    // ─── EN-TÊTE ───────────────────────────────────────────
    doc.fontSize(16).font('Helvetica-Bold').text('CONTRAT DE LOCATION', { align: 'center' });
    doc.moveDown(1.5);

    // Deux colonnes : Loueur / Locataire
    const leftX = 50;
    const rightX = 320;
    let currentY = doc.y;

    doc.fontSize(10).font('Helvetica-Bold').text('Le Loueur :', leftX, currentY);
    doc.font('Helvetica')
      .text('M. Pierre WEJROCH', leftX, doc.y)
      .text('Chemin du Bois de Maud', leftX, doc.y)
      .text('26200 MONTELIMAR', leftX, doc.y);

    const loueurEndY = doc.y;

    doc.fontSize(10).font('Helvetica-Bold').text('Le Locataire :', rightX, currentY);
    doc.font('Helvetica')
      .text(data.customer_name, rightX, doc.y)
      .text(data.customer_address || '', rightX, doc.y)
      .text(`Tél. ${data.customer_phone || ''}`, rightX, doc.y)
      .text(`Mail : ${data.customer_email || ''}`, rightX, doc.y);

    doc.y = Math.max(loueurEndY, doc.y) + 20;

    doc.y = Math.max(loueurEndY, doc.y) + 20;

// ─── ADRESSE DE LOCATION ───────────────────────────────
doc.fontSize(10).font('Helvetica-Bold').text('Adresse de location :', 50, doc.y);
doc.font('Helvetica')
  .text(`Résidence ${buildingName}`, 50, doc.y)
  .text(`Appartement ${apartmentNumber}`, 50, doc.y)
  .text('73210 BELLE PLAGNE', 50, doc.y);

doc.moveDown();

// ─── DATES ET PRIX ─────────────────────────────────────
doc.fontSize(10).font('Helvetica-Bold').text('Dates du séjour et prix :', 50, doc.y);
doc.font('Helvetica')
  .text(`Du ${startStr} à 16h au ${endStr} à 10h`, 50, doc.y)
  .text(`Prix : ${totalPrice} €`, 50, doc.y)
  .text(`Nombre d'occupants maximum : ${capacity}`, 50, doc.y)
  .text(`Dépôt de garantie : ${caution} €`, 50, doc.y);

doc.moveDown();

    // ─── ARTICLES ──────────────────────────────────────────
    addSection('Art. 1 Objet du contrat');
    addParagraph(`Le présent contrat a pour objet de définir les conditions de location des lieux identifiés ci-après par le Loueur au Locataire pour la durée et aux conditions déterminées aux présentes. Ces conditions sont conformes aux règlements et lois applicables aux locations de meublés. La réservation vaut acceptation de ces conditions de vente.`);

    addSection('Art. 2 Désignation des biens loués');
    addParagraph(`Les lieux loués sont situés à Belle Plagne, résidence ${buildingName}, appartement ${apartmentNumber}, 73210 La Plagne Tarentaise. Il s'agit d'un appartement meublé pour ${capacity} personnes avec un balcon, un casier à ski. Les lieux loués sont prévus pour ${capacity} personnes au maximum. Dans le cas où le nombre d'occupants envisagés serait supérieur, le Locataire s'engage à demander l'accord préalable du Loueur. En cas d'acceptation, le Loueur facturera une surcharge de location de 150 € par jour par locataire.`);

    addSection('Art. 3 Durée de la location');
    addParagraph(`La location est conclue du ${startStr} à 16h (date d'entrée) au ${endStr} jusqu'à 10h (date de sortie). Le Locataire ne peut en aucun cas se prévaloir du droit de maintien dans les lieux loués à l'expiration de la période de location prévue. En cas de dépassement non autorisé, un montant de 150 € sera facturé au Locataire par heure supplémentaire d'occupation des lieux loués.`);

    addSection('Art. 4 Loyer');
    doc.fontSize(10).font('Helvetica-Bold').text('Art. 4.1 Montant et paiement du loyer');
    doc.font('Helvetica');
    addParagraph(`La présente location est consentie pour un loyer de ${totalPrice} €. Le Locataire versera au Loueur 50% du prix de location (${acompte} €) au moment de la réservation. Il s'engage à verser le solde (${solde} €) au plus tard 30 jours avant la date de début de la location.`);

    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Art. 4.2 Taxe de séjour');
    doc.font('Helvetica');
    addParagraph(`En plus du présent loyer, la taxe de séjour est à régler au Loueur lors du règlement du solde de la location.`);

    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Art. 4.3 Dépôt de garantie');
    doc.font('Helvetica');
    addParagraph(`Le Locataire versera au Loueur un dépôt de garantie d'un montant de ${caution} €. Si aucune dégradation n'était constatée, le dépôt de garantie sera restitué au plus tard 4 semaines suivant la date de sortie. Dans le cas contraire, le solde sera restitué déduction faite des frais de remise en état, dans un délai maximum de 3 mois.`);

    addSection('Art. 5 Utilisation des lieux loués');
    addParagraph(`Les lieux loués sont destinés à l'habitation familiale. L'appartement est non fumeur. La sous-location est interdite. Les animaux ne sont pas acceptés, leur présence entraînerait la rupture immédiate du présent contrat. En cas de perte d'un trousseau de clé, il vous sera demandé 100 €.`);

    addSection('Art. 6 État des lieux et inventaire');
    addParagraph(`Un état des lieux sera effectué à l'entrée du Locataire par le service de conciergerie. Si le Locataire constatait un manque ou défaut important, il serait tenu d'en informer le concierge au plus tard le lendemain du jour d'arrivée.`);

    addSection('Art. 7 Conditions d\'annulation');
    addParagraph(`Toute annulation doit être notifiée par lettre recommandée dans les meilleurs délais.\n- Plus de 60 jours avant la date d'entrée : restitution totale de l'acompte.\n- Entre 60 et 30 jours : le Loueur conserve la totalité de l'acompte.\n- Moins de 30 jours : l'ensemble du prix du séjour est dû.\nSi le voyageur ne verse pas le solde au plus tard 30 jours avant le début de la location, la réservation sera considérée comme annulée entre 30 et 60 jours.`);

    addSection('Art. 8 Assurance');
    addParagraph(`L'assurance villégiature est obligatoire. Il appartient au Locataire de vérifier qu'il est assuré pour l'incendie, dégâts des eaux et responsabilité civile. Tous vols durant la période de location seront à la charge du Locataire.`);

    addSection('Art. 9 Arrivée et départ');
    addParagraph(`Le lieu de remise des clés vous sera transmis après la réception du solde du loyer. Le locataire s'engage à laisser l'appartement dans l'état de propreté dans lequel il l'a trouvé. Merci de contacter le service de conciergerie avant votre arrivée pour préciser les modalités de remise des clés.`);

    // ─── MODALITÉS DE RÉSERVATION ──────────────────────────
    doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').text('Modalités de réservation :');
    doc.font('Helvetica').fontSize(10);
    addParagraph(`La réservation prendra effet dès réception de :\n- Un exemplaire du contrat signé\n- Un acompte de 50% du montant total, hors taxe de séjour (réglé par virement), soit ${acompte} €\n- Une caution (formalités à accomplir auprès du prestataire internet).\n\nLe Locataire s'engage à verser le solde de la location et le montant de la taxe de séjour au plus tard 30 jours avant la date de début de la location, soit ${solde} €.\n\nLe locataire déclare avoir pris connaissance des conditions générales de location ci-dessus.`);

    doc.moveDown();
    addParagraph(`Fait à ............, le ${todayStr}.`);
    addParagraph(`Faire précéder la signature de la mention « lu et approuvé » avec paraphes en bas de chaque page.`);

    doc.moveDown(3);

    // Signatures
    const sigLeftX = 50;
    const sigRightX = 350;
    const sigY = doc.y;

    doc.fontSize(10).font('Helvetica-Bold')
      .text('Le Loueur', sigLeftX, sigY)
      .text('Le Locataire', sigRightX, sigY);

    doc.moveDown(4);
    const sigLineY = doc.y;
    doc.moveTo(sigLeftX, sigLineY).lineTo(250, sigLineY).stroke();
    doc.moveTo(sigRightX, sigLineY).lineTo(550, sigLineY).stroke();

    doc.end();
  });
};
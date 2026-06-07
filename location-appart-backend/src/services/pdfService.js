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
        console.log('📄 PDF généré, taille:', pdfBuffer.length, 'bytes');

        const safeName = data.customer_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `contract_${Date.now()}_${safeName}.pdf`;
        console.log('📤 Upload vers Supabase:', fileName);

        const { error: uploadError } = await supabase
          .storage
          .from('contracts')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) return reject(uploadError);
        console.log('✅ Upload OK, génération URL...');

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

// Loueur
doc.fontSize(10).font('Helvetica-Bold').text('Le Loueur :', 50);
doc.font('Helvetica')
  .text('M. Pierre WEJROCH', 50)
  .text('Chemin du Bois de Maud', 50)
  .text('26200 MONTELIMAR', 50);

doc.moveDown();

// Locataire
doc.fontSize(10).font('Helvetica-Bold').text('Le Locataire :', 50);
doc.font('Helvetica')
  .text(data.customer_name, 50)
  .text(data.customer_address || '', 50)
  .text(`Tél. ${data.customer_phone || ''}`, 50)
  .text(`Mail : ${data.customer_email || ''}`, 50);

doc.moveDown();

// ─── ADRESSE DE LOCATION ───────────────────────────────
doc.fontSize(10).font('Helvetica-Bold').text('Adresse de location :', 50);
doc.font('Helvetica')
  .text(`Résidence ${buildingName}`, 50)
  .text(`Appartement ${apartmentNumber}`, 50)
  .text('73210 BELLE PLAGNE', 50);

doc.moveDown();



// ─── DATES ET PRIX ─────────────────────────────────────
doc.fontSize(10).font('Helvetica-Bold').text('Dates du séjour et prix :', 50, doc.y);

const taxeSejour = (data.adults_count || 0) * 6;


doc.font('Helvetica')
  .text(`Du ${startStr} à 16h au ${endStr} à 10h`, 50, doc.y)
  .text(`Prix : ${totalPrice} €`, 50, doc.y)
  .text(`Taxe de séjour : ${taxeSejour} €`, 50)
  .text(`Nombre d'occupants maximum : ${capacity}`, 50, doc.y)
  .text(`Dépôt de garantie : ${caution} €`, 50, doc.y);

doc.moveDown();

    // ─── ARTICLES ──────────────────────────────────────────
    addSection('Art. 1 Objet du contrat');
    addParagraph(`Le présent contrat a pour objet de définir les conditions de location des lieux identifiés ci-après par le Loueur au Locataire pour la durée et aux conditions déterminées aux présentes. Ces conditions sont conformes aux règlements et lois applicables aux locations de meublés. La réservation vaut acceptation de ces conditions de vente.`);

    addSection('Art. 2 Désignation des biens loués');
    addParagraph(`Les biens loués sont situés à Belle Plagne, résidence ${buildingName}, appartement ${apartmentNumber}, 73210 La Plagne Tarentaise. Il s'agit d'un appartement meublé pour ${capacity} personnes avec un balcon, un casier à ski. Les lieux loués sont prévus pour ${capacity} personnes au maximum. Dans le cas où le nombre d'occupants envisagés serait supérieur, le Locataire s'engage à demander l'accord préalable du Loueur. En cas d'acceptation, le Loueur facturera une surcharge de location de 150 € par jour par locataire.`);

    addSection('Art. 3 Durée de la location');
    addParagraph(`La location est conclue du ${startStr} à 16h (date d'entrée) au ${endStr} jusqu'à 10h (date de sortie). Le Locataire ne peut en aucun cas se prévaloir du droit de maintien dans les lieux loués à l'expiration de la période de location prévue. En cas de dépassement non autorisé de la location par rapport à la date et heure de sortie mentionnée ci-dessus, un montant de 150 € sera facturé au Locataire par heure supplémentaire d'occupation des lieux loués.`);

    addSection('Art. 4 Loyer');
    doc.fontSize(10).font('Helvetica-Bold').text('Art. 4.1 Montant et paiement du loyer');
    doc.font('Helvetica');
    addParagraph(`La présente location est consentie pour un loyer de ${totalPrice} €. Les modalités de validation de la réervation sont précisées en dernière page du présent contrat. Le Locataire versera au Loueur 50% du prix de location (${acompte} €) au moment de la réservation. Il s'engage à verser le solde (${solde} €) au plus tard 30 jours avant la date de début de la location.`);

    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Art. 4.2 Taxe de séjour');
    doc.font('Helvetica');
    addParagraph(`En plus du présent loyer, la taxe de séjour est à régler au Loueur lors du règlement du solde de la location.`);

    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Art. 4.3 Dépôt de garantie');
    doc.font('Helvetica');
    addParagraph(`Le Locataire versera au Loueur un dépôt de garantie en sus du loyer d'un montant de ${caution} €. Le dépôt de garantie à pour objet de couvrir les réparations ou remise en état qui seraient nécessaires suite au départ du locataire. Le dépôt de garantie ne doit pas être considéré comme une participation au paiement du loyer. Si aucune dégradation n'était constatée, le dépôt de garantie sera restitué par le loueur au locataire au plus tard 4 semaines suivant la date de sortie. Dans le cas contraire, le solde du dépôt de garantie sera restitué au locataire, déduction faite des frais de remise en état, dans un délai maximum de 3 mois après la date de sortie. Le montant de remise en état sera déterminé à l'amiable entre le loueur et le locataire. En cas de désaccord, un devis de remise en état sera effectué par un professionnel ou autre organisme habilité au choix du loueur et indépendant de celui-ci. Le locataire s'engage à régler le surplus si les frais de remise en état étaient supérieurs au dépôt de garantie.`);

    addSection('Art. 5 Utilisation des lieux loués');
    addParagraph(`Les lieux loués sont destinés à l'habitation familiale et doivent être occupés par le locataire en "bon père de famille". L'appartement est non fumeur. La sous-location est interdite. Les animaux ne sont pas acceptés, leur présence entraînerait la rupture immédiate du présent contrat. En cas de perte d'un trousseau de clé, il vous sera demandé 100 €.`);

    addSection('Art. 6 État des lieux et inventaire');
    addParagraph(`Un état des lieux sera effectué à l'entrée du Locataire par le service de conciergerie. Si le Locataire constatait un manque ou défaut important de l'appartement, une casse ou dégradation présente à son entrée, il serait tenu d'en informer le concierge. Dans le cas où ce manque, défaut, dégradation ne serait pas communiqué au plus tard le lendemain du jour d'arrivée par le locataire, le loueur considèrera le locataire à l'origine de ce manque, défaut, dégradation.`);

    addSection('Art. 7 Conditions d\'annulation');
    addParagraph(`Toute annulation doit être notifiée par lettre recommandée dans les meilleurs délais.\n En cas d'annulation par le locataire : \n- Plus de 60 jours avant la date d'entrée, le loueur restitura la totalité de l'accompte versé par le locataire dans un délais maximum de deux semaines après la réception de la notification.\n- Entre 60 et 30 jours, le Loueur conservera la totalité de l'acompte.\n- Moins de 30 jours avant la date d'entrée, l'ensemble du prix du séjour sera dû au loueur.\nEn cas d'interruption anticipée du séjour par le locataire, et si la responsabilité du loueur n'est pas mise en cause, il ne sera procédé à aucun remboursement, hormis celui du dépôt de garantie aux conditions définies ci-dessus.\nSi le voyageur ne verse pas le solde de la location au plus tard 30 jours avant le début de la période de location, la réservation sera considérée comme annulée entre 30 et 60 jours avant la date d'entrée. Le loueur conservera dans ce cas la totalité de l'accompte.\nSi le locataire annule son séjour moins de 30 jours avant la date d'entrée et que la totalité des frais de séjour a été réglée, le loueur remboursera au locataire le montant de la taxe de séjour dans un délais maximum de 2 semaines après la réception de la notification.`);

    addSection('Art. 8 Assurance');
    addParagraph(`L'assurance villégiature est obligatoire. Elle est généralement comprise dans l'assurance de votre logement. Il appartient au Locataire de vérifier qu'il est assuré pour l'incendie, dégâts des eaux et responsabilité civile. Dans l'hypothèse contraire, le locataire doit souscrire l'extension nécessaire. Tous vols durant la période de location seront à la charge du Locataire.`);

    addSection('Art. 9 Arrivée et départ');
    addParagraph(`Le lieu de remise des clés vous sera transmis après la réception du solde du loyer. Le locataire s'engage à laisser l'appartement dans l'état de propreté et de rangement dans lequel il l'a trouvé. Le locataire informera le loueur si les lieux ne sont pas propre à son arrivée.`);
    addSection('Formalités avec la conciergerie');
    addParagraph(`Merci de contacter le serve de conciergerie avant votre arrivée pour préciser les modalités de remise des clés et état des lieux. Il en sera de même pour fixer la fin du séjour.`);

    // ─── MODALITÉS DE RÉSERVATION ──────────────────────────
    doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').text('Modalités de réservation :');
    doc.font('Helvetica').fontSize(10);
    addParagraph(`La réservation prendra effet dès réception de :\n- Un exemplaire du contrat signé\n- Un acompte de 50% du montant total, hors taxe de séjour (réglé par virement), soit ${acompte} €\n- Une caution (formalités à accomplir auprès du prestataire internet).\n\nLe Locataire s'engage à verser le solde de la location et le montant de la taxe de séjour au plus tard 30 jours avant la date de début de la location, soit ${solde+taxeSejour} €.\n\nLe locataire déclare avoir pris connaissance des conditions générales de location ci-dessus.`);

    doc.moveDown();
    addParagraph(`Fait à ............, le ........`);
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
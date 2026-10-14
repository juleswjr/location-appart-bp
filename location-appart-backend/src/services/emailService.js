// src/services/emailService.js



const { Resend } = require('resend');

console.log("\n========================================");
console.log("🔧 CONFIGURATION RESEND");
console.log("========================================");
console.log("   API Key:", process.env.RESEND_API_KEY ? "✅ Défini" : "❌ NON DÉFINI");
console.log("   Proprio:", process.env.EMAIL_PROPRIO || "❌ NON DÉFINI");
console.log("   Email From:", process.env.EMAIL_FROM || "noreply@mybelleplagne.fr");
console.log("========================================\n");

const resend = new Resend(process.env.RESEND_API_KEY);

// Empêche le HTML saisi par un visiteur d'être interprété dans le mail
const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// 1. Mail au PROPRIO
exports.sendNewBookingNotification = async (data) => {
  console.log("\n📧 ========== ENVOI EMAIL PROPRIO ==========");
  
  try {
    const { data: email, error } = await resend.emails.send({
      from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,// Email par défaut Resend
      to: process.env.EMAIL_PROPRIO,
      subject: `🔔 Nouvelle demande : ${data.apartment_name}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Nouvelle demande reçue !</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Récapitulatif :</h3>
              <p><strong>Appartement :</strong> ${data.apartment_name}</p>
              <p><strong>Client :</strong> ${escapeHtml(data.customer_name)}</p>
              <p><strong>Dates :</strong> du ${data.start_date} au ${data.end_date}</p>
              <p><strong>Prix total :</strong> ${data.total_price/100} €</p>
              
          </div>
          <br>
          <p>👉 <a href="https://www.mybelleplagne.fr/admin">Accéder au centre de contrôle</a></p>
        </div>
      `
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      throw error;
    }

    console.log("✅ Email PROPRIO envoyé via Resend");
    console.log("   ID:", email.id);
    console.log("========================================\n");
    
    return email;
    
  } catch (err) {
    console.error("❌ Erreur envoi:", err.message);
    throw err;
  }
};

// 2. Mail de confirmation au CLIENT
exports.sendBookingConfirmation = async (email, name, details, contractUrl) => {
  console.log("\n📧 ========== CONFIRMATION CLIENT ==========");
  
  try {
    const pdfResponse = await fetch(contractUrl);
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const { data: result, error } = await resend.emails.send({
  from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
  to: email,
  cc: process.env.EMAIL_PROPRIO,
  subject: `✅ Réservation Confirmée - ${details.apartment_name}`,
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
      <p>Bonjour,</p>

      <p>Nous avons bien reçu votre contrat, ainsi que le virement de l’acompte pour l'appartement <strong>${details.apartment_name}</strong> du <strong>${details.start_date}</strong> au <strong>${details.end_date}</strong>.</p>

      <p>Votre réservation est validée.</p>

      <p>Pour toutes les questions pratiques, concernant l’organisation de votre séjour, vous pouvez contacter directement le service de conciergerie au <strong>0612575135</strong>.</p>

      <p>Bien cordialement,<br>
      <strong>Pierre Wejroch</strong></p>
    </div>
  `
});

    if (error) throw error;

    console.log("✅ Email CLIENT envoyé via Resend");
    console.log("========================================\n");
    
    return result;
    
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    throw err;
  }
};

//Mail d'acceptation 
exports.sendContractToClient = async (clientEmail, clientName, details, contractUrl) => {
  console.log("\n📧 ========== CONTRAT CLIENT ==========");

  try {
    const pdfResponse = await fetch(contractUrl);
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    const { data: result, error } = await resend.emails.send({
      from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
      to: clientEmail,
      cc: process.env.EMAIL_PROPRIO,
      subject: `📄 Location prise en compte – ${details.apartment_name}`,
      attachments: [
        {
          filename: `contrat-${clientName.replace(/\s+/g, '-')}.pdf`,
          content: pdfBuffer,
        }
      ],
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
          <p>Bonjour ${escapeHtml(clientName)},</p>

          <p>Votre demande de réservation pour l'appartement <strong>${details.apartment_name}</strong> du <strong>${details.start_date}</strong> au <strong>${details.end_date}</strong> a bien été prise en compte.</p>
          <p>L'appartement est désormais bloqué à votre nom. Nous vous remercions de bien vouloir effectuer les formalités de réservation dans un délai de 3 jours afin de confirmer votre séjour.</p>
          <p>Je vous prie de trouver ci-joint le contrat de location pour l'appartement de Belle Plagne, où nous serons heureux de vous accueillir.</p>

          <p>Vous retrouverez en dernière page du contrat les modalités de réservation.</p>

          <p>Pour valider la location, je vous demanderais de me renvoyer le contrat paraphé au bas de chaque pages, signé en dernière page (signature précédée de la mention "Lu et approuvé"), à l'adresse mail suivante : mybelleplagne@gmail.com et de verser un acompte de 50 % du prix par virement bancaire.<br>
          Je vous adresse un RIB par SMS pour le virement.</p>

          <p>Par la suite, je vous remercie de régler le solde du séjour au plus tard un mois avant la date de début de la location.</p>

         <p>Il conviendra également de réaliser les formalités pour la caution, au plus tard un mois avant le début de la location.<br>
          Vous recevrez 45 jours avant le début de votre séjour un mail avec un lien pour accomplir cette formalité (aucune somme ne sera débitée sur votre compte).</p>
          <p>En restant à votre disposition pour toute précision complémentaire (mybelleplagne@gmail.com),</p>

          <p>Bien cordialement,<br>
          <strong>Pierre Wejroch</strong></p>
        </div>
      `
    });

    if (error) throw error;
    console.log("✅ Contrat envoyé au client via Resend");
    console.log("========================================\n");
    return result;

  } catch (err) {
    console.error("❌ Erreur:", err.message);
    throw err;
  }
};



// 3. Mail de demande reçue au CLIENT
exports.sendConfirmationAskEmail = async (clientEmail, clientName, bookingDetails, pdfUrl) => {
  console.log("\n📧 ========== DEMANDE REÇUE CLIENT ==========");
  
  try {
    const { data: result, error } = await resend.emails.send({
      from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
      to: clientEmail,
      subject: `⏳ Demande reçue - ${bookingDetails.apartment_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
          <h1 style="color: #2563EB;">Bonjour ${escapeHtml(clientName)},</h1>
          <p>Nous avons bien reçu votre demande pour <strong>${bookingDetails.apartment_name}</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Récapitulatif :</h3>
            <p>📅 <strong>Du :</strong> ${bookingDetails.start_date}</p>
            <p>📅 <strong>Au :</strong> ${bookingDetails.end_date}</p>
            <p>💰 <strong>Prix :</strong> ${bookingDetails.total_price/100} €</p>
          </div>

          <p>Le propriétaire va étudier votre demande rapidement.</p>
          <p>Cordialement,</p>
          <br>
          <p>L'équipe de MyBellePlagne</p>
        </div>
      `
    });

    if (error) throw error;

    console.log("✅ Email DEMANDE envoyé via Resend");
    console.log("========================================\n");
    
    return result;
    
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    throw err;
  }
};

// 4. Mail de contact
// apartmentName est optionnel : absent quand le message vient de la page d'accueil
exports.sendContactMessage = async (name, email, message, apartmentName) => {
  const { data: result, error } = await resend.emails.send({
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_PROPRIO,
    replyTo: email,
    subject: apartmentName
      ? `📩 [${apartmentName}] Nouveau message de ${name}`
      : `📩 Nouveau message de ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Nouveau message depuis le site</h3>
        ${apartmentName ? `<p><strong>Appartement :</strong> ${escapeHtml(apartmentName)}</p>` : ''}
        <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
        <p><strong>Email :</strong> ${escapeHtml(email)}</p>
        <hr>
        <p><strong>Message :</strong></p>
        <p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #2563EB; white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `
  });

  if (error) throw error;
  return result;
};

// 5. Mail de refus
exports.sendBookingRejectedEmail = async (clientEmail, clientName, apartmentName) => {
  const { data: result, error } = await resend.emails.send({
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    subject: `❌ Mise à jour - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Bonjour ${escapeHtml(clientName)},</h2>
        <p>Votre demande pour <strong>${apartmentName}</strong> n'a pas pu être retenue.</p>
        <p>Nous espérons vous accueillir une prochaine fois !</p>
      </div>
    `
  });

  if (error) throw error;
  return result;
};

exports.sendDepositReminderEmail = async (clientEmail, clientName, details) => {
  const { apartment_name, start_date, end_date, total_price, adults_count } = details;

  const startStr = new Date(start_date + 'T12:00:00').toLocaleDateString('fr-FR');
  const endStr = new Date(end_date + 'T12:00:00').toLocaleDateString('fr-FR');
  const taxeSejour = (adults_count || 0) * 6;
  const solde = Math.round(total_price / 100 / 2) + taxeSejour;
  const { data: result, error } = await resend.emails.send({
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    cc: process.env.EMAIL_PROPRIO,
    subject: `💰 Rappel solde & caution – ${apartment_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
        <p>Bonjour ${escapeHtml(clientName)},</p>

        <p>Je reviens vers vous dans le cadre de votre réservation pour l'appartement <strong>${apartment_name}</strong> du <strong>${startStr}</strong> au <strong>${endStr}</strong>.</p>

        <p>Si vous ne l'avez pas déjà fait, je vous remercie de régler le solde de la location, soit <strong>${solde} €</strong>, par virement au plus tard 30 jours avant le début du séjour.</p>

        <p>Vous allez recevoir également un mail de <strong>Swikly</strong> avec un lien sécurisé pour valider la caution (aucun prélèvement ne sera effectué).</p>

        <p>Pour l'organisation de votre arrivée et toutes les questions pratiques concernant votre séjour, vous pouvez contacter le service de conciergerie au <strong>0612575135</strong>.</p>

        <p>Bien cordialement,<br>
        <strong>Pierre Wejroch</strong></p>
      </div>
    `
  });

  if (error) throw error;
  return result;
};

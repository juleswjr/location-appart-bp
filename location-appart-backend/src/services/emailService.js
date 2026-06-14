// src/services/emailService.js
/*
const nodemailer = require('nodemailer');
const { format } = require("date-fns");
const { fr } = require("date-fns/locale");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ ERREUR CRITIQUE SMTP :', error);
  } else {
    console.log('✅ Serveur SMTP prêt à envoyer des emails !');
  }
});
// 1. Mail pour prévenir le PROPRIO (Toi)
exports.sendNewBookingNotification = async (data) => {

  console.log("📤 Envoi mail PROPRIO...");
  try{
  const mailOptions = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_PROPRIO, // Tu te l'envoies à toi-même
    subject: `🔔 Nouvelle demande : ${data.apartment_name}`,
    text: `
      Nouvelle demande reçue !
      
      Appartement : ${data.apartment_name}
      Client : ${data.customer_name}
      Dates : du ${new Date(data.start_date).toLocaleDateString('fr-FR')} au ${new Date(data.end_date).toLocaleDateString('fr-FR')}
      
      Prix total estimé : ${data.total_price/100} €
      Option Parking : ${data.has_parking}

      Va sur ton dashboard pour valider ou refuser.
    `});
    console.log("✅ Mail PROPRIO envoyé:", mailOptions.messageId);
    return mailOption;
  }
  catch (err) {
    console.error("❌ Erreur envoi mail PROPRIO:", err);
    throw err;
  }
  //return transporter.sendMail(mailOptions);
};

// 2. Mail pour prévenir le CLIENT (Confirmation de reservation)

exports.sendBookingConfirmation = async (email, name, details, contractUrl) => {
  
  const mailOptions = {
    from: `"Loc'Montagne" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Réservation Confirmée - ${details.apartment_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #166534;">Félicitations ${name} !</h2>
        <p>Nous avons le plaisir de vous confirmer votre réservation pour <strong>${details.apartment_name}</strong>.</p>
        <p><strong>Dates :</strong> Du ${details.start_date} au ${details.end_date}</p>
        <br>
        <p>📄 <strong>Vous trouverez votre contrat de location en pièce jointe de cet email.</strong></p>
        <p>Merci de votre confiance et à très bientôt !</p>
      </div>
    `,
    // Pièce jointe : Le PDF via l'URL Supabase
    attachments: [
      {
        filename: `Contrat_Location_${details.apartment_name.replace(/\s/g, '_')}.pdf`,
        path: contractUrl
      }
    ]
  };

  return transporter.sendMail(mailOptions);
};



// 3. Mail pour prévenir le CLIENT (Confirmation de demande)
exports.sendConfirmationAskEmail = async (clientEmail, clientName, bookingDetails, pdfUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: clientEmail,
    subject: `⏳ Demande reçue - ${bookingDetails.apartment_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563EB;">Bonjour ${clientName},</h1>
        
        <p>Nous avons bien reçu votre demande de réservation pour l'appartement <strong>${bookingDetails.apartment_name}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Récapitulatif de la demande :</h3>
          <p><strong>📅 Du :</strong> ${bookingDetails.start_date}</p>
          <p><strong>📅 Au :</strong> ${bookingDetails.end_date}</p>
          <p><strong>💰 Prix total :</strong> ${bookingDetails.total_price/100} €</p>
        </div>

        <p>Le propriétaire va étudier votre demande dans les plus brefs délais.</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${pdfUrl}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Télécharger votre récapitulatif (PDF)
          </a>
        </p>

        <p>Vous recevrez un nouvel email dès que la réservation sera confirmée.</p>
        <br>
        <p>À très vite !</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

// 4. Mail pour le Formulaire de CONTACT (Page d'accueil)
exports.sendContactMessage = async (name, email, message) => {
  const mailOptions = {
    from: `"Bot Appart BP" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_PROPRIO, // Ça arrive chez toi
    replyTo: email, // Pour répondre directement au client en cliquant sur "Répondre"
    subject: `📩 Nouveau message de ${name}`,
    text: `
      Message reçu depuis le site de location d'appart :
      
      Nom : ${name}
      Email : ${email}
      
      Message :
      ${message}
    `
  };
  return transporter.sendMail(mailOptions);
};

// 5. Mail de REFUS (Quand tu refuses manuellement ou automatiquement)
exports.sendBookingRejectedEmail = async (clientEmail, clientName, apartmentName) => {
  const mailOptions = {
    from: `"Bot Location" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `❌ Mise à jour de votre demande - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Bonjour ${clientName},</h2>
        <p>Nous vous informons que votre demande de réservation pour l'appartement <strong>${apartmentName}</strong> n'a malheureusement pas pu être retenue.</p>
        <p>Cela est souvent dû à l'indisponibilité des dates choisies ou à la validation d'un autre dossier sur la même période.</p>
        <br>
        <p>Nous espérons avoir l'occasion de vous accueillir une prochaine fois !</p>
        <p>Cordialement,<br>L'équipe Location</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

exports.sendArrivedEmail = async (clientEmail, clientName, apartmentName,custom_arrival_message) => {
  const mailOptions = {
    from: `"Bot Location" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `Rappel pour votre arrivé au - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>${custom_arrival_message},</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

exports.sendDepartureEmail = async (clientEmail, apartmentName, messageHtml) => {
  console.log(`📤 Envoi mail DÉPART à ${clientEmail}...`);
  
  const mailOptions = {
    from: `"Loc'Montagne" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `👋 Départ demain - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        ${messageHtml}
        <br>
        <p style="font-size: 12px; color: gray; margin-top: 20px;">Ceci est un email automatique.</p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};
exports.sendParkingEmail = async (clientEmail, apartmentName, messageHtml) => {
  console.log(`📤 Envoi mail parking à ${clientEmail}...`);
  
  const mailOptions = {
    from: `"Loc'Montagne" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `🅿️ Votre accès Parking - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        ${messageHtml}
        <br>
        <p style="font-size: 12px; color: gray; margin-top: 20px;">Ceci est un email automatique.</p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};
<p style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📄 Télécharger le récapitulatif
            </a>
          </p>
*/


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
              <p><strong>Client :</strong> ${data.customer_name}</p>
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
  subject: `✅ Réservation Confirmée - ${details.apartment_name}`,
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
      <p>Bonjour,</p>

      <p>Nous avons bien reçu votre contrat, ainsi que le virement de l’acompte pour l'appartement <strong>${details.apartment_name}</strong> du <strong>${details.start_date}</strong> au <strong>${details.end_date}</strong>.</p>

      <p>Votre réservation est validée.</p>

      <p>Pour toutes les questions pratiques, concernant l’organisation de votre séjour, vous pouvez contacter directement à le service de conciergerie au <strong>0612575135</strong>.</p>

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
      subject: `📄 Location prise en compte – ${details.apartment_name}`,
      attachments: [
        {
          filename: `contrat-${clientName.replace(/\s+/g, '-')}.pdf`,
          content: pdfBuffer,
        }
      ],
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
          <p>Bonjour ${clientName},</p>

          <p>Votre demande de réservation pour l'appartement <strong>${details.apartment_name}</strong> du <strong>${details.start_date}</strong> au <strong>${details.end_date}</strong> est prise en compte.</p>

          <p>Je vous prie de trouver ci-joint le contrat de location pour l'appartement de Belle Plagne, où nous serons heureux de vous accueillir.</p>

          <p>Vous retrouverez en dernière page du contrat les modalités de réservation.</p>

          <p>Pour valider la location, je vous demanderais de me renvoyer le contrat signé et de verser un acompte de 50 % du prix par virement bancaire.<br>
          Je vous adresse un RIB par SMS pour le virement.</p>

          <p>Par la suite, je vous remercie de régler le solde du séjour au plus tard un mois avant la date de début de la location.</p>

          <p>Il conviendra également de réaliser les formalités pour la caution une semaine avant le début de la location.<br>
          Vous recevrez un mail avec un lien pour une préautorisation bancaire (aucune somme ne sera débitée sur votre compte).</p>
          <p>Il conviendra également de réaliser les formalités pour la caution, au plus tard un mois avant le début de la location.<br>
          Vous recevrez 45 jours avant le début de votre séjour un mail avec un lien pour accomplir cette formalité (aucune somme ne sera débitée sur votre compte).</p>

          <p>Restant à votre disposition pour toute précision complémentaire,</p>
          <p>En restant à votre disposition pour toute précision complémentaire,</p>

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
          <h1 style="color: #2563EB;">Bonjour ${clientName},</h1>
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
exports.sendContactMessage = async (name, email, message) => {
  const { data: result, error } = await resend.emails.send({
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_PROPRIO,
    replyTo: email,
    subject: `📩 Nouveau message de ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Nouveau message depuis le site</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <hr>
        <p><strong>Message :</strong></p>
        <p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #2563EB;">
          ${message}
        </p>
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
        <h2>Bonjour ${clientName},</h2>
        <p>Votre demande pour <strong>${apartmentName}</strong> n'a pas pu être retenue.</p>
        <p>Nous espérons vous accueillir une prochaine fois !</p>
      </div>
    `
  });

  if (error) throw error;
  return result;
};

exports.sendDepositReminderEmail = async (clientEmail, clientName, details) => {
  const { apartment_name, start_date, end_date, total_price } = details;

  const startStr = new Date(start_date + 'T12:00:00').toLocaleDateString('fr-FR');
  const endStr = new Date(end_date + 'T12:00:00').toLocaleDateString('fr-FR');

  const { data: result, error } = await resend.emails.send({
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    subject: `💰 Rappel solde & caution – ${apartment_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
        <p>Bonjour ${clientName},</p>

        <p>Je reviens vers vous dans le cadre de votre réservation pour l'appartement <strong>${apartment_name}</strong> du <strong>${startStr}</strong> au <strong>${endStr}</strong>.</p>

        <p>Si vous ne l'avez pas déjà fait, je vous remercie de régler le solde de la location par virement au plus tard 30 jours avant le début du séjour.</p>

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
/*
// 6. Mail d'arrivée
exports.sendArrivedEmail = async (clientEmail, clientName, apartmentName, custom_arrival_message) => {
  const { data: result, error } = await resend.emails.send({
    from: `Location MyBellePlagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    subject: `Rappel accompte - ${apartmentName}`,
    html: `<div style="font-family: Arial, sans-serif;">${custom_arrival_message}</div>`
  });

  if (error) throw error;
  return result;
};

exports.sendDepartureEmail = async (clientEmail, apartmentName, custom_departure_message) =>{
    const { data: result, error } = await resend.emails.send({
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    subject: `Informations pour votre départ - ${apartmentName}`,
    html: `<div style="font-family: Arial, sans-serif;">${custom_departure_message}</div>`
  });

  if (error) throw error;
  return result;
};

exports.sendDepartureEmail = async (clientEmail, apartmentName, messageHtml) => {
  console.log(`📤 Envoi mail DÉPART à ${clientEmail}...`);
  
  const mailOptions = {
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    subject: `👋 Départ demain - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        ${messageHtml}
        <br>
        <p style="font-size: 12px; color: gray; margin-top: 20px;">Ceci est un email automatique.</p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};
exports.sendParkingEmail = async (clientEmail, apartmentName, messageHtml) => {
  console.log(`📤 Envoi mail parking à ${clientEmail}...`);
  
  const mailOptions = {
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    subject: `🅿️ Votre accès Parking - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        ${messageHtml}
        <br>
        <p style="font-size: 12px; color: gray; margin-top: 20px;">Ceci est un email automatique.</p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

*/
exports.sendContractToOwner = async (clientEmail, clientName, details, contractUrl) => {

  console.log("\n📧 ========== CONTRAT PROPRIO ==========");

  // Télécharger le PDF depuis Supabase pour l'attacher
  const pdfResponse = await fetch(contractUrl);
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

  const { data: result, error } = await resend.emails.send({
        from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
        to: process.env.EMAIL_PROPRIO,
        subject: `📄 Contrat envoyé – ${details.apartment_name} – ${clientName}`,
        attachments: [{ filename: `contrat-${clientName.replace(/\s+/g, '-')}.pdf`, content: pdfBuffer }],
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <p>Le contrat a été envoyé au client <strong>${clientName}</strong> pour la réservation suivante :</p>
            <ul>
              <li><strong>Appartement :</strong> ${details.apartment_name}</li>
              <li><strong>Du :</strong> ${details.start_date}</li>
              <li><strong>Au :</strong> ${details.end_date}</li>
            </ul>
          </div>
        `
      });

  if (error) {
    console.error("❌ Erreur Resend contrat proprio:", error);
    throw error;
  }

  console.log("✅ Contrat envoyé au proprio via Resend");
  console.log("========================================\n");
  return result;
};
/*

```

5. **Variables sur Render :**
```
RESEND_API_KEY=re_votre_clé_api_resend
EMAIL_PROPRIO=votre-email@gmail.com */
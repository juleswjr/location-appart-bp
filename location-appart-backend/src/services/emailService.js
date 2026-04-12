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
          <p><strong>Appartement :</strong> ${data.apartment_name}</p>
          <p><strong>Client :</strong> ${data.customer_name}</p>
          <p><strong>Dates :</strong> du ${data.start_date} au ${data.end_date}</p>
          <p><strong>Prix total :</strong> ${data.total_price/100} €</p>
          <p><strong>Parking :</strong> ${data.has_parking}</p>
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
    const { data: result, error } = await resend.emails.send({
      from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `✅ Réservation Confirmée - ${details.apartment_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #166534;">Félicitations ${name} !</h2>
          <p>Votre réservation pour <strong>${details.apartment_name}</strong> est confirmée.</p>
          <p><strong>Dates :</strong> Du ${details.start_date} au ${details.end_date}</p>
          <p><strong>Prix :</strong> ${details.total_price/100} €</p>
          <br>
          <p>📄 <a href="${contractUrl}">Télécharger votre contrat</a></p>
          <p>À très bientôt !</p>
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

// 6. Mail d'arrivée
exports.sendArrivedEmail = async (clientEmail, clientName, apartmentName, custom_arrival_message) => {
  const { data: result, error } = await resend.emails.send({
    from: `Location Belle Plagne <${process.env.EMAIL_FROM}>`,
    to: clientEmail,
    subject: `📍 Informations pour votre arrivée - ${apartmentName}`,
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


exports.sendContractToOwner = async (bookingInfo, contractPath) => {
  const { apartment_name, customer_name, start_date, end_date, total_price, has_parking } = bookingInfo;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.OWNER_EMAIL, // ← à définir dans ton .env
    subject: `📄 Contrat de location – ${apartment_name} – ${customer_name}`,
    html: `
      <h2>Contrat de location</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint le contrat pour la réservation suivante :</p>
      <ul>
        <li><strong>Appartement :</strong> ${apartment_name}</li>
        <li><strong>Client :</strong> ${customer_name}</li>
        <li><strong>Du :</strong> ${start_date}</li>
        <li><strong>Au :</strong> ${end_date}</li>
        <li><strong>Prix total :</strong> ${total_price} €</li>
        <li><strong>Parking :</strong> ${has_parking ? "Oui" : "Non"}</li>
      </ul>
    `,
    attachments: [
      {
        filename: `contrat-${customer_name.replace(/\s+/g, '-')}.pdf`,
        path: contractPath, // chemin local ou URL selon ta config pdfService
      }
    ]
  });
};
/*

```

5. **Variables sur Render :**
```
RESEND_API_KEY=re_votre_clé_api_resend
EMAIL_PROPRIO=votre-email@gmail.com */
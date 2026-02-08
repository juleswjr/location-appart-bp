// src/services/emailService.js
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

// 1. Mail pour prévenir le PROPRIO (Toi)
exports.sendNewBookingNotification = async (bookingDetails, apartmentName,bookingId) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_PROPRIO, // Tu te l'envoies à toi-même
    subject: `🔔 Nouvelle demande : ${apartmentName}`,
    text: `
      Nouvelle demande reçue !
      
      Numéro de réservation : #${bookingId}

      Client : ${bookingDetails.customer_name}
      Email : ${bookingDetails.customer_email}
      Dates : du ${bookingDetails.start_date} au ${bookingDetails.end_date}
      Message : "${bookingDetails.message}"
      Va sur ton dashboard pour valider ou refuser.
    `
  };
  return transporter.sendMail(mailOptions);
};

// 2. Mail pour prévenir le CLIENT (Confirmation de reservation)

exports.sendBookingConfirmation = async (email, name, apartmentName, startDate, endDate, contractUrl) => {
  
  const mailOptions = {
    from: `"Loc'Montagne" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Réservation Confirmée - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #166534;">Félicitations ${name} !</h2>
        <p>Nous avons le plaisir de vous confirmer votre réservation pour <strong>${apartmentName}</strong>.</p>
        <p><strong>Dates :</strong> Du ${startDate} au ${endDate}</p>
        <br>
        <p>📄 <strong>Vous trouverez votre contrat de location en pièce jointe de cet email.</strong></p>
        <p>Merci de votre confiance et à très bientôt !</p>
      </div>
    `,
    // 👇 C'EST ICI LA MAGIE : ON ATTACHE LE PDF VIA L'URL
    attachments: [
      {
        filename: `Contrat_Location_${apartmentName}.pdf`, // Le nom que verra le client
        path: contractUrl // L'URL Supabase (ex: https://Supabase.../contract.pdf)
      }
    ]
  };

  return transporter.sendMail(mailOptions);
};



// 3. Mail pour prévenir le CLIENT (Confirmation de demande)
exports.sendConfirmationAskEmail = async (clientEmail, clientName, apartmentName, bookingId) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: clientEmail,
    subject: `⏳ Demande reçue - ${apartmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1>Bonjour ${clientName},</h1>
        <p>Nous avons bien reçu votre demande de réservation pour l'appartement <strong>${apartmentName}</strong>.</p>
        <p>Votre numéro de dossier est le : <strong>#${bookingId}</strong></p>
        <br>
        <p>Le propriétaire va étudier votre demande dans les plus brefs délais.</p>
        <p>Si celle-ci est validée, vous recevrez un second email contenant votre contrat de location.</p>
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
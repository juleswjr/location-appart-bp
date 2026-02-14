// src/services/emailService.js
const nodemailer = require('nodemailer');
const { format } = require("date-fns");
const { fr } = require("date-fns/locale");
/*
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
*/
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port:  '465', // Force 465
  secure: true, // Vrai pour le port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// 1. Mail pour prévenir le PROPRIO (Toi)
exports.sendNewBookingNotification = async (data) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_PROPRIO, // Tu te l'envoies à toi-même
    subject: `🔔 Nouvelle demande : ${data.apartment_name}`,
    text: `
      Nouvelle demande reçue !
      
      Appartement : ${data.apartment_name}
      Client : ${data.customer_name}
      Dates : du ${new Date(data.start_date).toLocaleDateString('fr-FR')} au ${new Date(data.end_date).toLocaleDateString('fr-FR')}
      
      Prix total estimé : ${data.total_price} €
      Option Parking : ${data.has_parking}

      Va sur ton dashboard pour valider ou refuser.
    `
  };
  
  return transporter.sendMail(mailOptions);
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
          <p><strong>💰 Prix total :</strong> ${bookingDetails.total_price} €</p>
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
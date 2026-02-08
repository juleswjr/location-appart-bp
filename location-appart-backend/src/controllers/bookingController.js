// src/controllers/bookingController.js
const supabase = require('../config/supabaseClient');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const { format } = require("date-fns");
const { fr } = require("date-fns/locale");


// 1. Récupérer les dates réservées
exports.getBookedDates = async (req, res) => {
  const { apartmentId } = req.params;

  const { data, error } = await supabase
    .from('bookings')
    .select('start_date, end_date, status')
    .eq('apartment_id', apartmentId)
    .neq('status', 'rejected'); 

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.createBooking = async (req, res) => {
  const { 
    apartment_id, start_date, end_date, // On garde les bruts juste pour lire le body
    customer_name, customer_email, message,
    customer_address, customer_phone, customer_dob 
  } = req.body;

  // --- A. RÉCUPÉRER L'APPARTEMENT ---
  const { data: apartment, error: aptError } = await supabase
    .from('apartments')
    .select('id, name, changeover_day, price_per_night, arrival_instruction, departure_instruction')
    .eq('id', apartment_id)
    .single();

  if (aptError || !apartment) {
    return res.status(404).json({ message: "Appartement introuvable." });
  }

  // --- B. VALIDATION DES DATES ---
  const start = new Date(start_date);
  const end = new Date(end_date);

  // 1. ON FORCE TOUT LE MONDE À MIDI 
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  
  // On convertit ces dates "propres" en texte pour Supabase
  const safeStart = start.toISOString();
  const safeEnd = end.toISOString();
  const formattedStart = format(start, 'dd/MM/yyyy', { locale: fr });
  const formattedEnd = format(end, 'dd/MM/yyyy', { locale: fr });
  const requiredDay = apartment.changeover_day !== null ? apartment.changeover_day : 6;
  const dayName = requiredDay === 0 ? "Dimanche" : "Samedi";

  // Vérif jour semaine
  if (start.getDay() !== requiredDay || end.getDay() !== requiredDay) {
    return res.status(400).json({ 
      message: `Pour cet appartement, les locations se font uniquement du ${dayName} au ${dayName}.` 
    });
  }

  // Vérif durée
  const oneDay = 1000 * 60 * 60 * 24;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / oneDay);

  if (diffDays < 7 || diffDays % 7 !== 0) {
    return res.status(400).json({ message: "La durée doit être d'au moins 7 jours." });
  }

  // --- C. VÉRIFICATION DISPO (Overlap) ---
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('apartment_id', apartment_id)
    .eq('status', 'confirmed')
    .lt('start_date', safeEnd) 
    .gt('end_date', safeStart);
  
  if (conflicts && conflicts.length > 0) {
    return res.status(409).json({ message: "Désolé, l'appartement n'est plus disponible pour ces dates." });
  }

  try {
    const totalPrice = apartment.price_per_night;

    // --- D. GÉNÉRATION DU PDF ---
    // (Pour le PDF on peut garder l'affichage brut ou safe, peu importe, safe est plus sûr)
    console.log("Génération du contrat...");
    const contractUrl = await pdfService.generateAndUploadContract(
      { customer_name, customer_address, customer_phone, start_date: formattedStart, 
        end_date: formattedEnd },
      apartment.name,
      totalPrice
    );

    // --- E. INSERTION EN BDD ---
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([{ 
          apartment_id, 
          start_date: safeStart, 
          end_date: safeEnd, 
          customer_name, customer_email, 
          customer_address, customer_phone, customer_dob,
          message, 
          status: 'pending',
          total_price: totalPrice,
          contract_url: contractUrl,

          custom_arrival_message: apartment.arrival_instruction,
          custom_departure_message: apartment.departure_instruction,
          
          //arrival_mail_date: mailArrivalDate.toISOString().split('T')[0],
          //departure_mail_date: mailDepartureDate.toISOString().split('T')[0]
        }])
      .select()
      .single();

    if (insertError) throw insertError;

    // --- F. ENVOI DES EMAILS ---
    emailService.sendNewBookingNotification(
      { customer_name, customer_email, start_date: formattedStart, 
        end_date: formattedEnd, message }, 
      apartment.name,
      newBooking.id 
    ).catch(err => console.error("Erreur mail proprio:", err));

    if (emailService.sendConfirmationAskEmail) {
        emailService.sendConfirmationAskEmail(
          customer_email,
          customer_name,
          apartment.name,
          newBooking.id
        ).catch(err => console.error("Erreur mail accusé réception:", err));
    }

    res.status(201).json({ message: "Demande reçue avec succès !", booking: newBooking });

  } catch (error) {
    console.error("Erreur CreateBooking:", error);
    res.status(500).json({ error: "Erreur lors de la création du dossier." });
  }
};

// 3. Confirmer une réservation (Email Client)
exports.confirmBooking = async (req, res) => {
  const { id } = req.params; 

  // 1. Récupérer la résa
  const { data: bookingToConfirm, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !bookingToConfirm) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }

  // 2. Confirmer
  const { error: confirmError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id);

  if (confirmError) return res.status(500).json({ error: confirmError.message });

  // 3. Rejeter les concurrents
  const { data: rejectedBookings } = await supabase
    .from('bookings')
    .update({ status: 'rejected' }) 
    .eq('apartment_id', bookingToConfirm.apartment_id) 
    .eq('status', 'pending') 
    .neq('id', id) 
    .lt('start_date', bookingToConfirm.end_date)
    .gt('end_date', bookingToConfirm.start_date)
    .select(); 

  // 4. ENVOI EMAIL CLIENT
  // On récupère le nom de l'appart pour le mail
  const { data: aptData } = await supabase
      .from('apartments')
      .select('name')
      .eq('id', bookingToConfirm.apartment_id)
      .single();
  
  const aptName = aptData ? aptData.name : "votre appartement";
  const formattedStart = format(new Date(currentBooking.start_date), 'dd/MM/yyyy', { locale: fr });
  const formattedEnd = format(new Date(currentBooking.end_date), 'dd/MM/yyyy', { locale: fr });
  emailService.sendConfirmationEmail(
    bookingToConfirm.customer_email,
    bookingToConfirm.customer_name,
    aptName,
    formattedStart,
    formattedEnd,
    bookingToConfirm.contract_url
  ).catch(err => console.error("Erreur envoi mail client:", err));

  res.json({ 
    message: "Réservation confirmée, concurrents rejetés et mail envoyé !", 
    confirmed: bookingToConfirm,
    rejectedCount: rejectedBookings ? rejectedBookings.length : 0
  });
};

exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status, custom_arrival_message, custom_departure_message, 
    arrival_mail_date,   
    departure_mail_date,amount_paid } = req.body;
  let updates = {};
  if (status) updates.status = status;
  if (custom_arrival_message !== undefined) updates.custom_arrival_message = custom_arrival_message;
  if (custom_departure_message !== undefined) updates.custom_departure_message = custom_departure_message;  
  
  if (arrival_mail_date) updates.arrival_mail_date = arrival_mail_date;
  if (departure_mail_date) updates.departure_mail_date = departure_mail_date;
  if (amount_paid !== undefined) updates.amount_paid = amount_paid;
  try {
    // 1. Mise à jour de la réservation principale
    const { data: currentBooking, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select('*, apartments(name)')
      .single();

    if (error) throw error;

    // --- CAS 1 : TU VALIDÉ (CONFIRMED) ---
    if (status === 'confirmed') {
      // A. Mail de confirmation pour l'heureux élu
      const formattedStart = format(new Date(currentBooking.start_date), 'dd/MM/yyyy', { locale: fr });
      const formattedEnd = format(new Date(currentBooking.end_date), 'dd/MM/yyyy', { locale: fr });
      emailService.sendBookingConfirmation(
        currentBooking.customer_email,
        currentBooking.customer_name,
        currentBooking.apartments.name,
        formattedStart,
        formattedEnd,
        currentBooking.contract_url
      ).catch(err => console.error("Erreur mail confirmation:", err));

      // B. AUTO-REJET et MAILS pour les autres
      const { data: rejectedBookings, error: rejectError } = await supabase
        .from('bookings')
        .update({ status: 'rejected' }) // On passe en 'rejected'
        .eq('apartment_id', currentBooking.apartment_id)
        .neq('id', id)
        .eq('status', 'pending')
        .lt('start_date', currentBooking.end_date)
        .gt('end_date', currentBooking.start_date)
        .select('*, apartments(name)'); // IMPORTANT: On récupère leurs infos pour envoyer le mail !

      // On boucle sur tous les malchanceux pour leur envoyer un mail
      if (rejectedBookings && rejectedBookings.length > 0) {
        rejectedBookings.forEach(booking => {
          emailService.sendBookingRejectedEmail(
            booking.customer_email, 
            booking.customer_name, 
            booking.apartments.name // Note: grâce à select('*, apartments(name)')
          ).catch(err => console.error("Erreur mail refus auto:", err));
        });
      }
    }

    // --- CAS 2 : TU REFUSES MANUELLEMENT (REJECTED) ---
    if (status === 'rejected') {
      emailService.sendBookingRejectedEmail(
        currentBooking.customer_email,
        currentBooking.customer_name,
        currentBooking.apartments.name
      ).catch(err => console.error("Erreur mail refus manuel:", err));
    }

    res.status(200).json({ message: "Statut mis à jour et emails envoyés !", booking: currentBooking });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour." });
  }
};
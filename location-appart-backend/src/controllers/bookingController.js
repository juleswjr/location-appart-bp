// src/controllers/bookingController.js
const supabase = require('../config/supabaseClient');
const emailService = require('../services/emailService');
const { generateContractPDF } = require('../services/pdfService');
const priceService = require('../services/priceService');

// A. Récupérer les dates réservées
exports.getBookedDates = async (req, res) => {
  const { apartmentId } = req.params;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_date, end_date, status')
      .eq('apartment_id', apartmentId)
      .in('status', ['confirmed']); // ✅ On ignore 'cancelled' et 'rejected'

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// B. Créer une nouvelle réservation
exports.createBooking = async (req, res) => {
  const { 
    apartment_id, 
    start_date, 
    end_date, 
    has_parking,
    customer_name, 
    customer_email, 
    customer_phone, 
    customer_address, 
    customer_dob, 
    message 
  } = req.body;

  try {
    // 1. Récupérer infos de l'appart
    const { data: apartment } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', apartment_id)
      .single();

    if (!apartment) {
      return res.status(404).json({ message: "Appartement introuvable" });
    }

 // 2. NORMALISATION & SÉCURITÉ DES DATES 🛡️
    const start = new Date(start_date);
    const end = new Date(end_date);
    
// apartment.changeover_day vaut 0 (Dimanche) ou 6 (Samedi)
    const requiredDay = apartment.changeover_day; 
    
    if (start.getDay() !== requiredDay || end.getDay() !== requiredDay) {
      const dayName = requiredDay === 0 ? "dimanche" : "samedi";
      return res.status(400).json({ 
        message: `Pour cet appartement, les locations doivent commencer et finir un ${dayName}.` 
      });
    }

    // B. Vérifier que la fin est après le début
    if (end <= start) {
      return res.status(400).json({ message: "La date de départ doit être après l'arrivée." });
    }

    const normalizedStartDate = start.toISOString().split('T')[0];
    const normalizedEndDate = end.toISOString().split('T')[0];

    console.log('🔍 Vérification des conflits...');
    console.log('   - Dates normalisées:', normalizedStartDate, '→', normalizedEndDate);

    // 3. VÉRIFICATION DES CONFLITS (LOGIQUE BACK-TO-BACK) 🧠
    // On cherche si une réservation CONFIRMÉE croise nos dates.
    // .lt ('start_date', end) -> Elle commence AVANT que je parte
    // .gt ('end_date', start) -> Elle finit APRÈS que j'arrive
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('apartment_id', apartment_id)
      .eq('status', 'confirmed') // Uniquement les confirmées
      .lt('start_date', normalizedEndDate) 
      .gt('end_date', normalizedStartDate);

    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({ message: "Ces dates ne sont plus disponibles." });
    }

    // 4. ✅ CALCUL DU PRIX VIA LE SERVICE
    console.log('💰 Calcul du prix via priceService...');
    const finalPrice = await priceService.calculateStayPrice(
      apartment_id,
      apartment.price_per_night, // Prix par défaut en centimes
      normalizedStartDate,
      normalizedEndDate,
      has_parking
    );

    console.log("💰 PRIX TOTAL FINAL :", finalPrice, "€");

    // 5. CRÉATION DU PDF
    const pdfPath = await generateContractPDF({
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      apartment_name: apartment.name,
      start_date: normalizedStartDate,
      end_date: normalizedEndDate,
      total_price: finalPrice, // ✅ Prix calculé par le service
      has_parking: has_parking
    });

    // 6. INSERTION EN BDD (avec dates normalisées)
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([{ 
          apartment_id, 
          start_date: normalizedStartDate,
          end_date: normalizedEndDate,
          status: 'pending',
          total_price: finalPrice, // ✅ Prix calculé
          has_parking: has_parking,
          customer_name, 
          customer_email, 
          customer_phone, 
          customer_address, 
          customer_dob, 
          message,
          contract_url: pdfPath
        }])
      .select()
      .single();

    if (insertError) throw insertError;
    /*
    // 7. ENVOI DES EMAILS
    await emailService.sendConfirmationAskEmail(
      customer_email, 
      customer_name, 
      {
        apartment_name: apartment.name,
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        total_price: finalPrice // ✅ Prix calculé
      }, 
      pdfPath
    );

    await emailService.sendNewBookingNotification({
        apartment_name: apartment.name,
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        customer_name,
        total_price: finalPrice, // ✅ Prix calculé
        has_parking: has_parking ? "OUI" : "NON"
    });
        
    res.status(201).json({ 
      message: "Réservation créée avec succès !", 
      booking: newBooking 
    });
*/
        // 7. ENVOI DES EMAILS (SÉCURISÉ) 🛡️
    // On met ça dans un try/catch SPÉCIFIQUE pour ne pas bloquer la réponse au client
    try {
        console.log("📧 Tentative d'envoi des emails...");
        
        // On lance les deux envois en parallèle pour gagner du temps
        await Promise.all([
            emailService.sendConfirmationAskEmail(
              customer_email, 
              customer_name, 
              {
                apartment_name: apartment.name,
                start_date: normalizedStartDate,
                end_date: normalizedEndDate,
                total_price: finalPrice // ✅ Prix calculé
              }, 
              pdfPath
            ),
            emailService.sendNewBookingNotification({
                apartment_name: apartment.name,
                start_date: normalizedStartDate,
                end_date: normalizedEndDate,
                customer_name,
                total_price: finalPrice, // ✅ Prix calculé
                has_parking: has_parking ? "OUI" : "NON"
            })
        ]);
        
        console.log("✅ Emails envoyés avec succès !");

    } catch (emailError) {
        // ⚠️ ICI C'EST IMPORTANT : On log l'erreur mais ON NE LANCE PAS D'EXCEPTION (pas de throw)
        console.error("⚠️ ATTENTION : La réservation est faite mais les emails ont échoué.", emailError.message);
        // On continue comme si de rien n'était pour répondre au client
    }

    // 8. RÉPONSE AU CLIENT (Même si l'email a planté, on renvoie 201 Created)
    res.status(201).json({ 
      message: "Réservation créée avec succès !", 
      booking: newBooking 
    });


  } catch (error) {
    console.error('❌ Erreur dans createBooking:', error);
    res.status(500).json({ message: "Erreur serveur lors de la réservation." });
  }
};

// C. Confirmer une réservation
exports.confirmBooking = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Récupérer la réservation avec les infos de l'appartement
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, apartments(name, price_per_night)')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    // 2. ✅ RECALCULER LE PRIX (au cas où il a changé)
    console.log('💰 Recalcul du prix pour confirmation...');
    const officialPrice = await priceService.calculateStayPrice(
      booking.apartment_id,
      booking.apartments.price_per_night,
      booking.start_date,
      booking.end_date,
      booking.has_parking
    );

    console.log('   - Prix recalculé:', officialPrice, '€');

    // 3. Générer le PDF avec le prix officiel
    const pdfUrl = await generateContractPDF({
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      customer_address: booking.customer_address,
      apartment_name: booking.apartments.name,
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_price: officialPrice, // ✅ Prix recalculé
      has_parking: booking.has_parking
    });

    // 4. Envoyer l'email de confirmation avec le bon prix
    await emailService.sendBookingConfirmation(
      booking.customer_email,
      booking.customer_name,
      {
        apartment_name: booking.apartments.name,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_price: officialPrice // ✅ Prix recalculé
      },
      pdfUrl
    );

    // 5. Mettre à jour le statut ET le prix (au cas où)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        total_price: officialPrice, // ✅ On met à jour avec le prix recalculé
        contract_url: pdfUrl
      })
      .eq('id', id);
      



    if (updateError) throw updateError;

    console.log("⚔️ Recherche des conflits à annuler...");

    // On cherche les réservations :
    // - Pour le MÊME appartement
    // - Qui sont encore "pending" (en attente)
    // - Qui ne sont PAS la réservation actuelle (id != id)
    // - Et dont les dates se chevauchent
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('*')
      .eq('apartment_id', booking.apartment_id)
      .eq('status', 'pending')
      .neq('id', id) // On n'annule pas celle qu'on vient de valider !
      // Logique de chevauchement de dates :
      // (StartA < EndB) ET (EndA > StartB)
      .lt('start_date', booking.end_date) 
      .gt('end_date', booking.start_date);

    if (conflicts && conflicts.length > 0) {
      console.log(`🚫 ${conflicts.length} réservation(s) en conflit trouvée(s). Refus automatique...`);

      for (const conflict of conflicts) {
        // A. On passe le statut en "rejected" dans la BDD
        await supabase
          .from('bookings')
          .update({ status: 'rejected' })
          .eq('id', conflict.id);

        // B. On envoie un mail de refus gentil au client
        // (Assure-toi que cette fonction existe bien dans emailService.js, tu me l'as montrée avant)
        try {
            await emailService.sendBookingRejectedEmail(
                conflict.customer_email, 
                conflict.customer_name, 
                booking.apartments.name
            );
            console.log(`   ❌ Conflit refusé : ${conflict.customer_name}`);
        } catch (mailError) {
            console.error(`   ⚠️ Erreur envoi mail refus pour ${conflict.customer_name}`, mailError);
        }
      }
    } else {
        console.log("✅ Aucun conflit détecté.");
    }


    res.status(200).json({ 
      message: "Réservation confirmée, contrat généré et envoyé !", 
      pdfUrl,
      price: officialPrice
    });

    
   



  } catch (error) {
    console.error("❌ Erreur lors de la confirmation :", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// D. Mettre à jour le statut d'une réservation
exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;

    // TODO: Envoyer un email d'annulation si status === 'cancelled'
    res.status(200).json({ 
      message: `Statut mis à jour vers : ${status}`, 
      booking: data[0] 
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour statut :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// D. Mettre à jour N'IMPORTE QUEL champ d'une réservation
exports.updateBooking = async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // On récupère tous les champs envoyés

  console.log('📝 Mise à jour de la réservation:', id);
  console.log('   - Champs à modifier:', updates);

  try {
    // Validation : empêcher de modifier l'ID ou l'apartment_id par erreur
    delete updates.id;
    delete updates.apartment_id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('bookings')
      .update(updates) // ✅ Met à jour TOUS les champs envoyés
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    console.log('✅ Réservation mise à jour:', data[0]);

    res.status(200).json({ 
      message: "Réservation mise à jour avec succès", 
      booking: data[0] 
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour réservation :", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// E. Envoyer le contrat au propriétaire
exports.sendContractToOwner = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Récupérer la réservation avec le contract_url existant
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, apartments(name)')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    if (!booking.contract_url) {
      return res.status(400).json({ message: "Aucun contrat généré pour cette réservation." });
    }

    // 2. Envoyer le mail au propriétaire avec le contrat en PJ
    await emailService.sendContractToOwner(
      {
        apartment_name: booking.apartments.name,
        customer_name: booking.customer_name,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_price: booking.total_price,
        has_parking: booking.has_parking
      },
      booking.contract_url
    );

    console.log(`✅ Contrat envoyé au propriétaire pour la réservation ${id}`);

    res.status(200).json({ message: "Contrat envoyé au propriétaire avec succès !" });

  } catch (error) {
    console.error("❌ Erreur envoi contrat propriétaire :", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};
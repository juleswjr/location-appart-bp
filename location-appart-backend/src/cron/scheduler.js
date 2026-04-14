const cron = require('node-cron');
const supabase = require('../config/supabaseClient');
const emailService = require('../services/emailService');

const initScheduledJobs = () => {
  console.log('⏰ Système de planification des emails (Cron) activé.');

  cron.schedule('* * * *', async () => {
    console.log("🔄 [CRON] Vérification quotidienne acompte...");

    // ✅ FIX DATE : On construit la date en local, pas en UTC
    const in40Days = new Date();
    in40Days.setDate(in40Days.getDate() + 305);
    // On force le format YYYY-MM-DD en heure locale (pas UTC)
    const target = `${in40Days.getFullYear()}-${String(in40Days.getMonth() + 1).padStart(2, '0')}-${String(in40Days.getDate()).padStart(2, '0')}`;

    console.log(`📅 Recherche des réservations démarrant le : ${target}`);

    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, apartments(name)')
        .eq('status', 'confirmed')
        .eq('start_date', target)
        .eq('sent_deposit_email', false) // ✅ Colonne à créer (voir ci-dessous)
        .eq('skip_deposit_email', false);
      if (error) throw error;

      if (!bookings || bookings.length === 0) {
        console.log("✅ Aucun acompte à rappeler aujourd'hui.");
        return;
      }

      console.log(`💰 ${bookings.length} rappel(s) d'acompte à envoyer.`);

      for (const booking of bookings) {
        try {
          // Envoi au client ET au proprio en parallèle
          await Promise.all([
            emailService.sendDepositReminderEmail(
              booking.customer_email,
              booking.customer_name,
              {
                apartment_name: booking.apartments.name,
                start_date: booking.start_date,
                total_price: booking.total_price,
                deposit_amount: booking.total_price / 2,
              }
            ),
            emailService.sendDepositReminderEmail(
              process.env.EMAIL_PROPRIO, // ✅ Même mail, envoyé au proprio aussi
              `Rappel proprio – ${booking.customer_name}`, // Nom affiché dans le mail
              {
                apartment_name: booking.apartments.name,
                start_date: booking.start_date,
                total_price: booking.total_price,
                deposit_amount: booking.total_price / 2,
              }
            ),
          ]);

          await supabase
            .from('bookings')
            .update({ sent_deposit_email: true })
            .eq('id', booking.id);

          console.log(`   ✅ Rappel acompte envoyé à ${booking.customer_name}`);

        } catch (err) {
          console.error(`   ❌ Erreur pour ${booking.customer_name}:`, err.message);
        }
      }

    } catch (error) {
      console.error("❌ Erreur CRITIQUE Cron :", error);
    }
  });
};

module.exports = initScheduledJobs;

/*

const cron = require('node-cron');
const supabase = require('../config/supabaseClient'); 
const emailService = require('../services/emailService');

const initScheduledJobs = () => {
  console.log('⏰ Système de planification des emails (Cron) activé.');

  // Tâche planifiée : Tous les jours à 09h00
  // Pour tester rapidement, tu peux mettre '* * * * *' (chaque minute), mais remets '0 9 * * *' après !
  cron.schedule('30 11 * * *', async () => {

    console.log("🔄 [CRON] Vérification quotidienne des emails...");
    
    // On calcule les dates clés
    const today = new Date().toISOString().split('T')[0]; // ex: "2026-02-16"
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 40);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // ex: "2026-02-26"

    try {
      // ============================================================
      // 1. GESTION DES ARRIVÉES (Check-in)
      // ============================================================
      // Logique :
      // - Soit la date d'envoi personnalisée est AUJOURD'HUI
      // - Soit il n'y a pas de date perso, et l'arrivée est DEMAIN
      const { data: arrivals, error: errArrivals } = await supabase
        .from('bookings')
        .select('*, apartments(name, arrival_instruction)')
        .eq('status', 'confirmed')
        .eq('sent_arrival_email', false) // On ne renvoie jamais deux fois
        .or(`arrival_mail_date.eq.${today},and(arrival_mail_date.is.null,start_date.eq.${tomorrowStr})`);

      if (errArrivals) console.error("❌ Erreur récupération arrivées:", errArrivals);

      if (arrivals && arrivals.length > 0) {
        console.log(`📥 ${arrivals.length} arrivées à traiter.`);

        for (const booking of arrivals) {
          try {
            // 1. Choix du message
            let rawMessage = booking.custom_arrival_message || booking.apartments.arrival_instruction || "Bienvenue !";

            // 2. Remplacement des variables
            const finalMessage = rawMessage
              .replace(/{{name}}/g, booking.customer_name)
              .replace(/{{date}}/g, new Date(booking.start_date).toLocaleDateString('fr-FR'));

            // 3. Envoi
            await emailService.sendArrivedEmail(
              booking.customer_email,   
              booking.customer_name,    
              booking.apartments.name, 
              finalMessage
            );

            // 4. Validation
            await supabase.from('bookings').update({ sent_arrival_email: true }).eq('id', booking.id);
            console.log(`   ✅ Mail arrivée envoyé à ${booking.customer_name}`);

          } catch (err) {
            console.error(`   ❌ Erreur envoi arrivée pour ${booking.customer_name}:`, err.message);
          }
        }
      }

      // ============================================================
      // 2. GESTION DES DÉPARTS (Check-out)
      // ============================================================
      // Logique :
      // - Soit la date d'envoi personnalisée est AUJOURD'HUI
      // - Soit il n'y a pas de date perso, et le départ est DEMAIN
      const { data: departures, error: errDepartures } = await supabase
        .from('bookings')
        .select('*, apartments(name, departure_instruction)')
        .eq('status', 'confirmed')
        .eq('sent_departure_email', false)
        .or(`departure_mail_date.eq.${today},and(departure_mail_date.is.null,end_date.eq.${tomorrowStr})`);

      if (errDepartures) console.error("❌ Erreur récupération départs:", errDepartures);

      if (departures && departures.length > 0) {
        console.log(`📤 ${departures.length} départs à traiter.`);

        for (const booking of departures) {
          try {
            // 1. Choix du message
            let rawMessage = booking.custom_departure_message || booking.apartments.departure_instruction || "Bon retour !";

            // 2. Remplacement des variables
            const finalMessage = rawMessage
              .replace(/{{name}}/g, booking.customer_name);

            // 3. Envoi
            await emailService.sendDepartureEmail(
              booking.customer_email,
              booking.apartments.name,
              finalMessage
            );

            // 4. Validation
            await supabase.from('bookings').update({ sent_departure_email: true }).eq('id', booking.id);
            console.log(`   ✅ Mail départ envoyé à ${booking.customer_name}`);

          } catch (err) {
            console.error(`   ❌ Erreur envoi départ pour ${booking.customer_name}:`, err.message);
          }
        }
      }

    const { data: parkingBookings, error: errParking } = await supabase
        .from('bookings')
        .select('*, apartments(name, parking_instruction)')
        .eq('status', 'confirmed')
        .eq('has_parking', true)             // 👈 Seulement si parking choisi
        .eq('sent_parking_email', false)     // 👈 Pas encore envoyé
        .or(`arrival_mail_date.eq.${today},and(arrival_mail_date.is.null,start_date.eq.${tomorrowStr})`); // Même timing que l'arrivée

      if (errParking) console.error("❌ Erreur récupération Parking:", errParking);

      if (parkingBookings && parkingBookings.length > 0) {
        console.log(`🅿️ ${parkingBookings.length} mails parking à envoyer.`);

        for (const booking of parkingBookings) {
          try {
            // On récupère l'instruction de l'appartement (ou un texte par défaut)
            const instructions = booking.apartments.parking_instruction || "Garez-vous sur la place réservée à l'appartement.";

            await emailService.sendParkingEmail(
              booking.customer_email,
              booking.apartments.name,
              instructions
            );

            // On coche la case
            await supabase.from('bookings').update({ sent_parking_email: true }).eq('id', booking.id);
            console.log(`   ✅ Mail Parking envoyé à ${booking.customer_name}`);

          } catch (err) {
            console.error(`   ❌ Erreur envoi Parking pour ${booking.customer_name}:`, err.message);
          }
        }
      }


    } catch (error) {
      console.error("❌ Erreur CRITIQUE Cron Job :", error);
    }
  });
};

module.exports = initScheduledJobs;

*/
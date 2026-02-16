const cron = require('node-cron');
const supabase = require('../config/supabaseClient'); 
const emailService = require('../services/emailService');

const initScheduledJobs = () => {
  console.log('⏰ Système de planification des emails (Cron) activé.');

  // Tâche planifiée : Tous les jours à 09h00
  // Pour tester rapidement, tu peux mettre '* * * * *' (chaque minute), mais remets '0 9 * * *' après !
  cron.schedule('12 11 * * *', async () => {

    console.log("🔄 [CRON] Vérification quotidienne des emails...");
    
    // On calcule les dates clés
    const today = new Date().toISOString().split('T')[0]; // ex: "2026-02-16"
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // ex: "2026-02-17"

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
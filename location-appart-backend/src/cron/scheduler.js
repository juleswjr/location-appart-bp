const cron = require('node-cron');
const supabase = require('../config/supabaseClient'); // Ton client supabase
const emailService = require('../services/emailService');

// Fonction utilitaire pour calculer "Demain" (sans les heures)
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0]; // Renvoie format "YYYY-MM-DD"
};

const initScheduledJobs = () => {
  console.log(' Système de planification des emails démarré...');

  // Tâche planifiée : Tous les jours à 09h00 du matin
  // La syntaxe cron : "0 9 * * *" (Minutes Heures Jour Mois Semaine)
  cron.schedule('0 10 * * *', async () => {
    console.log("🔄 Lancement de la vérification quotidienne des emails...");
    
    const today = new Date().toISOString().split('T')[0];   
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; 
    try {
      // --- 1. GESTION DES ARRIVÉES (Check-in) ---
      // On cherche les résas confirmées qui commencent DEMAIN
      const { data: arrivals } = await supabase
        .from('bookings')
        .select('*, apartments(name, arrival_instruction)')
        .eq('status', 'confirmed')
        .or(`arrival_mail_date.eq.${today},and(arrival_mail_date.is.null,start_date.eq.${tomorrowStr})`);
      if (arrivals && arrivals.length > 0) {
        arrivals.forEach(async (booking) => {
          let rawMessage = booking.custom_arrival_message || booking.apartments.arrival_instruction;
          if (rawMessage) {
            // On remplace les variables {{name}} par le vrai nom
            const messagePersonnalise = booking.apartments.arrival_instruction
              .replace('{{name}}', booking.customer_name)
              .replace('{{date}}', new Date(booking.start_date).toLocaleDateString());

            await emailService.sendArrivedEmail(
              booking.customer_email,   
              booking.customer_name,    
              booking.apartments.name, 
              messagePersonnalise
            );
            console.log(`✅ Mail arrivée envoyé à ${booking.customer_name}`);
          }
        });
      }

      // --- 2. GESTION DES DÉPARTS (Check-out) ---
      // On cherche les résas confirmées qui finissent DEMAIN
      const { data: departures } = await supabase
        .from('bookings')
        .select('*, apartments(name, departure_instruction)')
        .eq('status', 'confirmed')
        .or(`departure_mail_date.eq.${today},and(departure_mail_date.is.null,end_date.eq.${tomorrowStr})`);
      if (departures && departures.length > 0) {
        departures.forEach(async (booking) => {
          let rawMessage = booking.custom_departure_message || booking.apartments.departure_instruction;
          if (rawMessage) {
            const messagePersonnalise = booking.apartments.departure_instruction
              .replace('{{name}}', booking.customer_name);

            await emailService.sendAutomaticEmail(
              booking.customer_email,
              `Votre départ demain - ${booking.apartments.name}`,
              messagePersonnalise
            );
            console.log(`✅ Mail départ envoyé à ${booking.customer_name}`);
          }
        });
      }

    } catch (error) {
      console.error("❌ Erreur dans le Cron Job :", error);
    }
  });
};

module.exports = initScheduledJobs;
const { createClient } = require('@supabase/supabase-js');
const { addDays, differenceInCalendarDays, format, addHours } = require('date-fns');

// Initialisation de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.calculateStayPrice = async (apartmentId, defaultPriceCents, startDateString, endDateString, hasParking) => {
  try {
    // 1. Récupérer les prix saisonniers
    const { data: seasonalPrices, error } = await supabase
      .from('seasonal_prices')
      .select('start_date, price')
      .eq('apartment_id', apartmentId);

    if (error) throw error;

    let total = 0;

    // ⚠️ LA CORRECTION EST ICI ⚠️
    // Le frontend envoie souvent une date en UTC (ex: 18/12 à 23h00 pour le 19/12)
    // On ajoute 12h pour être sûr de basculer sur le "lendemain" (le bon jour) avant de formater
    let current = addHours(new Date(startDateString), 12);
    const end = addHours(new Date(endDateString), 12);

    console.log(`🧮 Calcul pour la période du ${format(current, 'yyyy-MM-dd')} au ${format(end, 'yyyy-MM-dd')}`);

    // 2. Boucle semaine par semaine
    while (current < end) {
      // Maintenant que 'current' est bien calé à midi, le format renverra toujours la bonne date (19/12)
      const dateKey = format(current, 'yyyy-MM-dd');
      
      // On cherche la correspondance exacte
      const weeklyPriceFound = seasonalPrices.find(p => {
        // On compare les chaînes de caractères (YYYY-MM-DD)
        return p.start_date.substring(0, 10) === dateKey;
      });

      if (weeklyPriceFound) {
        console.log(`✅ Semaine du ${dateKey} : Prix spécial ${weeklyPriceFound.price}€`);
        total += parseFloat(weeklyPriceFound.price);
      } else {
        console.log(`❌ Semaine du ${dateKey} : Prix défaut ${(defaultPriceCents / 100)}€`);
        total += (defaultPriceCents/100); 
        
      }

      // On saute de 7 jours
      current = addDays(current, 7);
    }

    // 3. Option Parking
    if (hasParking) {
      // Pour le calcul des jours, on reprend les dates originales pour avoir la durée exacte
      const startOriginal = new Date(startDateString);
      const endOriginal = new Date(endDateString);
      
      const days = differenceInCalendarDays(endOriginal, startOriginal);
      const weeks = Math.ceil(days / 7);
      
      console.log(`🚗 Parking : ${weeks} semaines (+${weeks * 80}€)`);
      total += (weeks * 8000);
    }

    return Math.round(total);

  } catch (err) {
    console.error("Erreur calcul prix backend:", err);
    throw err;
  }
};
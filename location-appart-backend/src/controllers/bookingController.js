// src/controllers/bookingController.js
const supabase = require('../config/supabaseClient');
const emailService = require('../services/emailService');
const { generateContractPDF } = require('../utils/pdfGenerator');

// A. Récupérer les dates réservées
exports.getBookedDates = async (req, res) => {
  const { apartmentId } = req.params;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_date, end_date, status')
      .eq('apartment_id', apartmentId)
      .neq('status', 'cancelled'); // On ignore les annulées

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// B. Créer une nouvelle réservation (C'est ici que tout change !)
exports.createBooking = async (req, res) => {
  const { 
    apartment_id, 
    start_date, 
    end_date, 
    has_parking, // 👇 On récupère l'info parking
    customer_name, 
    customer_email, 
    customer_phone, 
    customer_address, 
    customer_dob, 
    message 
  } = req.body;

  try {
    // 1. Récupérer infos de l'appart (pour le nom et le prix par défaut)
    const { data: apartment } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', apartment_id)
      .single();

    if (!apartment) return res.status(404).json({ message: "Appartement introuvable" });

    // 2. Vérifier si les dates sont libres
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('*')
      .eq('apartment_id', apartment_id)
      .neq('status', 'cancelled')
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`);

    if (conflicts && conflicts.length > 0) {
      return res.status(400).json({ message: "Ces dates ne sont plus disponibles." });
    }

    // --- 💰 3. CALCUL DU PRIX INTELLIGENT ---
    let finalPrice = 0;
    
    // On nettoie la date pour chercher dans la BDD (YYYY-MM-DD)
    const searchDate = new Date(start_date).toISOString().split('T')[0];

    // On cherche s'il y a un PRIX SPÉCIAL pour cette semaine précise
    const { data: seasonalData } = await supabase
      .from('seasonal_prices')
      .select('price')
      .eq('apartment_id', apartment_id)
      .eq('start_date', searchDate)
      .single();

    if (seasonalData) {
      console.log(`📅 Prix saisonnier trouvé pour le ${searchDate} : ${seasonalData.price}€`);
      finalPrice = parseFloat(seasonalData.price);
    } else {
      console.log(`ℹ️ Pas de prix spécial pour le ${searchDate}, utilisation du prix par défaut.`);
      // Assure-toi que apartment.price_per_night contient bien ton prix semaine par défaut
      finalPrice = parseFloat(apartment.price_per_night || 0); 
    }

    // On ajoute l'OPTION PARKING (80€)
    if (has_parking === true) {
      console.log("🚗 Option Parking ajoutée (+80€)");
      finalPrice += 80;
    }

    console.log("💰 PRIX TOTAL FINAL :", finalPrice);

    // --- 4. CRÉATION DU PDF ---
    // On passe le vrai prix et l'option parking au générateur PDF
    const pdfPath = await generateContractPDF({
      customer_name,
      apartment_name: apartment.name,
      start_date,
      end_date,
      total_price: finalPrice, // On utilise le prix calculé
      has_parking: has_parking // On l'affiche sur le PDF (si ton PDF le gère)
    });

    // --- 5. INSERTION EN BDD ---
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([{ 
          apartment_id, 
          start_date, 
          end_date, 
          status: 'pending',
          total_price: finalPrice, // ✅ On sauvegarde le bon prix
          has_parking: has_parking, // ✅ On sauvegarde le choix parking
          customer_name, 
          customer_email, 
          customer_phone, 
          customer_address, 
          customer_dob, 
          message 
        }])
      .select()
      .single();

    if (insertError) throw insertError;

    // --- 6. ENVOI DES EMAILS ---
    // Email au client
    await emailService.sendBookingConfirmation(
      customer_email, 
      customer_name, 
      {
        apartment_name: apartment.name,
        start_date,
        end_date,
        total_price: finalPrice // Le client voit le bon prix dans le mail
      }, 
      pdfPath
    );

    // Email à toi (l'admin)
    await emailService.sendAdminNotification({
        apartment_name: apartment.name,
        start_date,
        end_date,
        customer_name,
        total_price: finalPrice,
        has_parking: has_parking ? "OUI" : "NON"
    });

    res.status(201).json({ message: "Réservation créée avec succès !", booking: newBooking });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la réservation." });
  }
};

// ... Les autres fonctions (confirm, updateStatus) restent inchangées ...
// Ajoute-les si elles n'y sont plus, ou garde la fin de ton fichier actuel.
exports.confirmBooking = async (req, res) => { /* ... ton code existant ... */ };
exports.updateBookingStatus = async (req, res) => { /* ... ton code existant ... */ };
// src/controllers/apartmentController.js
const supabase = require('../config/supabaseClient');

exports.getAllApartments = async (req, res) => {
  // On récupère tout (*) de la table 'apartments'
  const { data, error } = await supabase
    .from('apartments')
    .select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

exports.getApartmentBySlug = async (req, res) => {
    const { slug } = req.params;
    
    const { data, error } = await supabase
      .from('apartments')
      .select('*,bookings(*)')
      .eq('slug', slug)
      .single(); // On en veut un seul
  
    if (error) {
      return res.status(404).json({ error: "Appartement non trouvé" });
    }
  
    res.json(data);
  };

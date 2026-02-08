// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./src/config/supabaseClient');
const initScheduledJobs = require('./src/cron/scheduler');
const accountingController = require('./src/controllers/accountingController');
// --- 1. IMPORTS DES ROUTES ---
// On met des try/catch pour voir si l'import échoue
try {
  var apartmentRoutes = require('./src/routes/apartmentRoutes');
  var bookingRoutes = require('./src/routes/bookingRoutes');
} catch (error) {
  console.error("ERREUR D'IMPORT DES ROUTES : Vérifie le nom des fichiers et le module.exports !", error.message);
  process.exit(1); // On arrête proprement pour que tu voies l'erreur
}

const app = express();
// Sécurité : Si .env bug, on prend 5000 par défaut
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- 2. ACTIVATION DES ROUTES ---
app.use('/api/apartments', apartmentRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
  res.send('Helloworld');
});
// Route test Supabase
app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('apartments').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
//Route pour télécherger la compta vers un fichier excel
app.get('/api/accounting/export', accountingController.downloadAccountingExcel);
// --- Route pour le Formulaire de Contact ---
const emailService = require('./src/services/emailService'); // Vérifie que le chemin est bon

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    await emailService.sendContactMessage(name, email, message);
    res.status(200).json({ message: "Message envoyé avec succès !" });
  } catch (error) {
    console.error("Erreur contact:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi." });
  }
});
initScheduledJobs();
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./src/config/supabaseClient');
const initScheduledJobs = require('./src/cron/scheduler');
const accountingController = require('./src/controllers/accountingController');
const emailService = require('./src/services/emailService'); // Je l'ai remonté ici, c'est plus propre
// --- 1. IMPORTS DES ROUTES ---
try {
  var apartmentRoutes = require('./src/routes/apartmentRoutes');
  var bookingRoutes = require('./src/routes/bookingRoutes');
} catch (error) {
  console.error("ERREUR D'IMPORT DES ROUTES : Vérifie le nom des fichiers et le module.exports !", error.message);
  process.exit(1);
}

const app = express();

// Configuration CORS (Important pour que Vercel puisse parler à Render)
const allowedOrigins = [
  'http://localhost:3000',
  'https://location-appart-bp-7t6t.vercel.app', // Ton site Vercel
  'https://mybelleplagne.fr', // ✅ Ajoutez votre domaine
  'https://www.mybelleplagne.fr',     // Ton futur domaine (au cas où)
  'https://location-appart-bp-api.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme Postman ou les applis mobiles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'La politique CORS de ce site ne permet pas l\'accès depuis cette origine.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Autorise les cookies/headers sécurisés
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Autorise ces méthodes
  allowedHeaders: ['Content-Type', 'Authorization'] // Autorise ces headers
}));

app.use(express.json());

// --- 2. ACTIVATION DES ROUTES ---
app.use('/api/apartments', apartmentRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
  res.send('Helloworld - API LocMontagne en ligne !');
});

// Route test Supabase
app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('apartments').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Route pour télécharger la compta vers un fichier excel
app.get('/api/accounting/export', accountingController.downloadAccountingExcel);

// --- Route pour le Formulaire de Contact ---
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



// Lancement des tâches planifiées (Cron)
initScheduledJobs();

// --- DÉMARRAGE DU SERVEUR ---

// Récupère le port donné par Render (10000) OU utilise 5000 en local
const PORT = process.env.PORT || 5000;

// '0.0.0.0' est CRUCIAL pour que Render puisse voir ton site
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

// En haut de ton fichier avec tes autres imports
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialisation de Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 🤖 ROUTE POUR L'ASSISTANT IA (GEMINI)
// ==========================================
// Route pour l'assistant contextuel
app.post('/api/chat', async (req, res) => {
  try {
    const { message, apartmentId } = req.body; // On reçoit l'ID de l'appart en plus

    // 1. ALLER CHERCHER LES INFOS DANS LA BDD
    let apartmentContext = "";
    
    if (apartmentId) {
      // On fait une requête SQL (exemple avec mysql2 ou ton système actuel)
      const [rows] = await db.execute(
        'SELECT name, description, features FROM apartments WHERE id = ?', 
        [apartmentId]
      );
      
      if (rows.length > 0) {
        const appart = rows[0];
        apartmentContext = `
          L'utilisateur pose une question spécifique sur l'appartement suivant :
          - Nom : ${appart.name}
          - Description : ${appart.description}
          - Équipements (Features) : ${appart.features}
        `;
      }
    }


    // 2. LES INFOS GÉNÉRALES DE LA CONCIERGERIE (Statiques ou depuis une autre table) 
    const conciergeContext = `
      Services de conciergerie (valables pour tous les logements) :
      - Draps et serviettes : NON fournis. Location possible via la conciergerie.
      - Ménage : À la charge du locataire.
      - Accueil : Boitié à code pour les clés.
      - Services plus : Réservation de forfaits, location de skis, cours ESF.
      - Parking : possibilité de réservation à voir avec le service de conciergerie.
    `;

    // 3. CONSTRUCTION DU PROMPT FINAL
    const systemPrompt = `
      Tu es l'assistant virtuel de MyBellePlagne. 
      Réponds de manière chaleureuse, précise et courte (max 3 phrases).
      
      ${apartmentContext}
      
      ${conciergeContext}

      Consignes : 
      - Si l'appartement est mentionné, utilise ses détails pour répondre.
      - Si l'utilisateur demande quelque chose qui n'est pas précisé (ex: "y a-t-il un appareil à raclette ?"), 
        réponds que tu ne sais pas mais qu'il peut prendre contact avec le propriétaire via le formulaire de contact présent sur les page d'appartements et d'accueil.
    `;

    // 4. APPEL À GEMINI
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent(message);
    res.json({ reply: result.response.text() });

  } catch (error) {
    console.error("Erreur Chat:", error);
    res.status(500).json({ error: "Erreur technique" });
  }
});
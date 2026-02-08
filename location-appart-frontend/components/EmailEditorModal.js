"use client";
import { useState } from "react";

// Fonction utilitaire pour calculer une date (J-1 par défaut)
const getDefaultDate = (dateStr, daysOffset = -1) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

export default function EmailEditorModal({ booking, onClose, onSave }) {
  // 1. LOGIQUE DE PRÉ-REMPLISSAGE (Le cœur de ta demande)
  // On prend le custom s'il existe, sinon on prend le générique de l'appartement
  const [arrivalMsg, setArrivalMsg] = useState(
    booking.custom_arrival_message || booking.apartments?.arrival_instruction || ""
  );
  
  const [departureMsg, setDepartureMsg] = useState(
    booking.custom_departure_message || booking.apartments?.departure_instruction || ""
  );

  // 2. GESTION DES DATES D'ENVOI
  // Si une date est déjà fixée en BDD, on la prend. Sinon on calcule J-1 par défaut.
  const [arrivalDate, setArrivalDate] = useState(
    booking.arrival_mail_date || getDefaultDate(booking.start_date, -1)
  );

  const [departureDate, setDepartureDate] = useState(
    booking.departure_mail_date || getDefaultDate(booking.end_date, -1)
  );

  const handleSave = () => {
    // On envoie tout au parent pour la sauvegarde
    onSave(booking.id, {
        custom_arrival_message: arrivalMsg,
        custom_departure_message: departureMsg,
        arrival_mail_date: arrivalDate,
        departure_mail_date: departureDate
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Personnaliser les emails
            </h3>
            <p className="text-sm text-gray-500">
              Client : <span className="font-semibold text-blue-600">{booking.customer_name}</span> | Appartement : <span className="font-semibold">{booking.apartments?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Corps du modal */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50">
          
          {/* COLONNE ARRIVÉE */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-green-800 flex items-center gap-2">🛬 Arrivée</h4>
              <input 
                type="date" 
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="border p-1 rounded text-sm text-gray-600 bg-gray-50"
                title="Date d'envoi du mail"
              />
            </div>
            <textarea
              className="w-full h-80 border p-3 rounded focus:ring-2 focus:ring-green-500 text-sm leading-relaxed"
              value={arrivalMsg}
              onChange={(e) => setArrivalMsg(e.target.value)}
              placeholder="Le message est vide..."
            />
             <p className="text-xs text-gray-400 mt-2 italic">Variables : {"{{name}}"}, {"{{date}}"}</p>
          </div>

          {/* COLONNE DÉPART */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-red-800 flex items-center gap-2">🛫 Départ</h4>
              <input 
                type="date" 
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="border p-1 rounded text-sm text-gray-600 bg-gray-50"
                title="Date d'envoi du mail"
              />
            </div>
            <textarea
              className="w-full h-80 border p-3 rounded focus:ring-2 focus:ring-red-500 text-sm leading-relaxed"
              value={departureMsg}
              onChange={(e) => setDepartureMsg(e.target.value)}
              placeholder="Le message est vide..."
            />
            <p className="text-xs text-gray-400 mt-2 italic">Variables : {"{{name}}"}</p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-6 border-t bg-white rounded-b-xl flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            💾 Enregistrer et programmer
          </button>
        </div>
      </div>
    </div>
  );
}
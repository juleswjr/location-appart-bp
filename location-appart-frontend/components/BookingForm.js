"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.min.css";
// Ajout de 'getDay' pour vérifier le jour de la semaine (0-6)
import { addDays, differenceInCalendarDays, format, getDay } from "date-fns"; 
import fr from "date-fns/locale/fr";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BookingForm({ apartment }) {
  
  // --- CONFIGURATION DYNAMIQUE ---
  // Si changeover_day est défini en BDD (0=Dim, 6=Sam), on l'utilise. Sinon Samedi par défaut.
  const CHANGE_DAY = apartment.changeover_day !== undefined ? apartment.changeover_day : 6;
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hasParking, setHasParking] = useState(false);
  
  const [seasonalPrices, setSeasonalPrices] = useState([]); 
  // Ce Set contiendra toutes les dates (ex: "2024-12-19") qui ont un prix en BDD
  const [validSeasonDates, setValidSeasonDates] = useState(new Set());

  const [totalPrice, setTotalPrice] = useState(0); 
  const [isCalculating, setIsCalculating] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    customer_address: "", customer_dob: "", message: ""
  });

  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // --- 1. CHARGEMENT ---
  useEffect(() => {
    async function fetchData() {
      if (!apartment?.id) return;

      try {
        console.log("📥 Chargement des données...");

        // A. CHARGER LES PRIX & CONSTRUIRE LA LISTE BLANCHE
        const { data: prices, error: priceError } = await supabase
          .from('seasonal_prices')
          .select('start_date, price')
          .eq('apartment_id', apartment.id)
          .order('start_date', { ascending: true });

        if (priceError) console.error("❌ Erreur prix:", priceError);
        else {
            setSeasonalPrices(prices || []);
            
            // 🧠 INTELLIGENCE : On crée un Set avec toutes les dates valides
            // On ne garde que la partie YYYY-MM-DD
            const validSet = new Set(prices.map(p => p.start_date.substring(0, 10)));
            setValidSeasonDates(validSet);
        }

        // B. CHARGER LES RÉSERVATIONS (Pour griser les périodes occupées)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const resBooking = await fetch(`${apiUrl}/api/apartments/${apartment.slug}`);
        const dataBooking = await resBooking.json();
        
        if (dataBooking && dataBooking.bookings) {
          let middleDays = [];
          const confirmedBookings = dataBooking.bookings.filter(b => b.status === 'confirmed');
          
          confirmedBookings.forEach(booking => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);
            
            // On bloque uniquement les jours ENTRE le début et la fin
            // Cela permet le "Départ le matin / Arrivée l'après-midi" le même jour
            let current = addDays(start, 1);
            while (current < end) {
              middleDays.push(new Date(current));
              current = addDays(current, 1);
            }
          });
          setFullyBookedDates(middleDays);
        }

      } catch (err) {
        console.error("Erreur chargement global", err);
      }
    }
    fetchData();
  }, [apartment.slug, apartment.id]);


  // --- 2. FILTRE MAGIQUE (Griser les mauvaises dates) ---
  const isDateSelectable = (date) => {
    // A. Est-ce le bon jour de la semaine ? (ex: Samedi)
    if (getDay(date) !== CHANGE_DAY) return false;

    // B. Est-ce que cette date existe dans ma table de prix (saison ouverte) ?
    // On formate la date du calendrier pour voir si elle est dans notre Set "validSeasonDates"
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!validSeasonDates.has(dateKey)) return false;

    return true;
  };

  // Pour la date de FIN, on vérifie juste que c'est le bon jour de rotation
  // (Pas besoin qu'elle soit une date de début de saison, c'est une date de fin)
  const isEndDateSelectable = (date) => {
    if (getDay(date) !== CHANGE_DAY) return false;
    // On pourrait ajouter d'autres logiques ici si besoin
    return true;
  };


  // --- 3. CALCULATRICE ---
  useEffect(() => {
    if (!startDate || !endDate) { setTotalPrice(0); return; }

    setIsCalculating(true);
    const timer = setTimeout(() => {
        let total = 0;
        let current = new Date(startDate); 
        const end = new Date(endDate);

        while (current < end) {
            const dateKey = format(current, 'yyyy-MM-dd');
            // Recherche du prix dans le tableau
            const weeklyPriceFound = seasonalPrices.find(p => p.start_date.substring(0, 10) === dateKey);

            if (weeklyPriceFound) {
                // Prix BDD (supposé en centimes ? sinon enlève le /100)
                // Si ton prix en BDD est 1200 pour 1200€, mets juste parseFloat(weeklyPriceFound.price)
                // Si ton prix en BDD est 120000 pour 1200€, garde la division
                total += parseFloat(weeklyPriceFound.price); 
            } else {
                total += (parseFloat(apartment.price_per_night));
            }
            current = addDays(current, 7);
        }

        if (hasParking) {
            const days = differenceInCalendarDays(endDate, startDate);
            const weeks = Math.ceil(days / 7);
            // 80€ * 100 si on parle en centimes, ou juste 80 si en euros.
            // Adapte selon ta logique BDD. Ici je suppose que tu veux afficher en EUROS à la fin
            total += (weeks * 8000); // Ex: 8000 centimes
        }

        // On divise par 100 ici pour l'affichage Humain (Euros)
        setTotalPrice(Math.round(total) / 100); 
        setIsCalculating(false);

    }, 200);
    return () => clearTimeout(timer);
  }, [startDate, endDate, hasParking, seasonalPrices, apartment.price_per_night]);


  // --- GESTION DU FORMULAIRE ---
  const getDayClass = (date) => {
    const dStr = date.toDateString();
    // On garde l'affichage rouge pour les jours "pleins"
    if (fullyBookedDates.some(d => d.toDateString() === dStr)) return "day-fully-booked";
    return undefined;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert("Veuillez sélectionner vos dates !");
    
    setLoading(true); setStatus(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Formatage simple pour éviter le timezone
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: apartment.id,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          status: "pending",
          has_parking: hasParking,
          total_price: totalPrice * 100, // On renvoie des centimes au backend
          ...formData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");

      setStatus("success");
      setStartDate(null); setEndDate(null); setHasParking(false); setTotalPrice(0);
      setFormData({ customer_name: "", customer_email: "", customer_phone: "", customer_address: "", customer_dob: "", message: "" });

    } catch (error) { alert("Erreur : " + error.message); } finally { setLoading(false); }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center">
        <h3 className="text-2xl font-bold text-green-800 mb-2">Demande envoyée !</h3>
        <p className="text-green-700">Vous recevrez bientôt une confirmation par email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Réserver ce logement</h3>

      {/* INFO ROTATION (Petit texte d'aide) */}
      <p className="text-sm text-gray-500 mb-4 italic">
        📅 Départs et arrivées le <strong>{CHANGE_DAY === 0 ? "Dimanche" : "Samedi"}</strong> uniquement.
      </p>

      {/* DATES */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrivée</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => { setStartDate(date); setEndDate(null); }} // Reset fin si on change le début
            selectsStart
            startDate={startDate}
            endDate={endDate}
            // 👇 C'EST ICI LA MAGIE
            filterDate={isDateSelectable} 
            excludeDates={fullyBookedDates} 
            dayClassName={getDayClass}
            locale={fr}
            dateFormat="dd/MM/yyyy"
            placeholderText="Date d'arrivée"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            onKeyDown={(e) => e.preventDefault()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate ? addDays(startDate, 7) : null} // Minimum 1 semaine
            // 👇 ICI ON FILTRE JUSTE LE JOUR DE SEMAINE
            filterDate={isEndDateSelectable}
            excludeDates={fullyBookedDates}
            dayClassName={getDayClass}
            locale={fr}
            dateFormat="dd/MM/yyyy"
            placeholderText="Date de départ"
            className={`w-full border p-2 rounded focus:ring-2 outline-none cursor-pointer ${!startDate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            disabled={!startDate} // On force à choisir le début d'abord
            onKeyDown={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {/* INFOS CLIENT */}
      <div className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label><input type="text" name="customer_name" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_name} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="customer_email" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_email} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" name="customer_phone" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_phone} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label><input type="date" name="customer_dob" required className="w-full border p-2 rounded text-gray-500" onChange={handleChange} value={formData.customer_dob} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Adresse postale</label><input type="text" name="customer_address" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_address} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea name="message" rows="3" className="w-full border p-2 rounded" onChange={handleChange} value={formData.message}></textarea></div>
      </div>

      {/* OPTION PARKING */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} />
          <div className="flex flex-col"><span className="font-bold text-gray-900">Option Parking</span><span className="text-sm text-gray-600">+80€ / semaine</span></div>
        </label>
      </div>

      {/* AFFICHAGE DU PRIX TOTAL */}
      {totalPrice > 0 && (
        <div className="mt-6 p-4 bg-gray-900 rounded-lg text-white flex justify-between items-center shadow-lg">
          <div><p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total estimé</p><p className="text-2xl font-bold">{totalPrice} €</p></div>
          {isCalculating && <span className="text-xs text-yellow-400 animate-pulse">Calcul...</span>}
        </div>
      )}

      <button type="submit" disabled={loading} className={`w-full mt-4 py-3 rounded-lg font-bold text-white transition-all ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
        {loading ? "Envoi..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
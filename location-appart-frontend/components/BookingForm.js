"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.min.css";
import { addDays, differenceInCalendarDays, format, isSameDay, subDays } from "date-fns"; 
import fr from "date-fns/locale/fr";
import { createClient } from "@supabase/supabase-js";

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BookingForm({ apartment }) {
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hasParking, setHasParking] = useState(false);
  
  const [seasonalPrices, setSeasonalPrices] = useState([]); 
  const [totalPrice, setTotalPrice] = useState(0); 
  const [isCalculating, setIsCalculating] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    customer_address: "", customer_dob: "", message: ""
  });

  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [startBookedDates, setStartBookedDates] = useState([]);
  const [endBookedDates, setEndBookedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // --- 1. CHARGEMENT (MODE DÉTECTIVE) ---
  useEffect(() => {
    async function fetchData() {
      try {
        console.log("🕵️‍♂️ ID de l'appartement actuel :", apartment.id);

        // A. Dates réservées
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const resBooking = await fetch(`${apiUrl}/api/apartments/${apartment.slug}`);
        const dataBooking = await resBooking.json();
        
        if (dataBooking && dataBooking.bookings) {
          let middleDays = []; let startDays = []; let endDays = [];
          const confirmedBookings = dataBooking.bookings.filter(b => b.status === 'confirmed');
          confirmedBookings.forEach(booking => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);
            startDays.push(start); endDays.push(end);
            let current = addDays(start, 1);
            while (current < end) { middleDays.push(new Date(current)); current = addDays(current, 1); }
          });
          setFullyBookedDates(middleDays); setStartBookedDates(startDays); setEndBookedDates(endDays);
        }

        // B. PRIX SAISONNIERS (Le moment de vérité)
        const { data: prices, error } = await supabase
          .from('seasonal_prices')
          .select('start_date, price')
          .eq('apartment_id', apartment.id);

        if (error) {
          console.error("🚨 ERREUR SUPABASE :", error.message);
        } else {
          console.log("📦 CONTENU BRUT REÇU DE SUPABASE :", prices);
          setSeasonalPrices(prices || []); // On assure un tableau vide au pire
        }

      } catch (err) {
        console.error("Erreur globale", err);
      }
    }
    fetchData();
  }, [apartment.slug, apartment.id]);

// ========== NOUVEAU useEffect POUR CHARGER LES PRIX ==========
useEffect(() => {
  const fetchSeasonalPrices = async () => {
    if (!apartment?.id) return;

    console.log('🔄 Chargement des prix saisonniers...');
    
    const { data, error } = await supabase
      .from('seasonal_prices')
      .select('start_date, price')
      .eq('apartment_id', apartment.id)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors du chargement:', error);
      return;
    }

    console.log('✅ Prix chargés:', data);
    setSeasonalPrices(data || []);
  };

  fetchSeasonalPrices();
}, [apartment?.id]); // Se déclenche quand l'apartment change
  // --- 2. CALCULATRICE (MODE DÉTECTIVE) ---
useEffect(() => {
  if (!startDate || !endDate) { setTotalPrice(0); return; }

  setIsCalculating(true);
  
  const calculateTotal = async () => { // ⚠️ IMPORTANT: async ajouté
    console.group('🔍 ========== DEBUG COMPLET SEASONAL PRICES ==========');
    
    // ==================== ÉTAPE 1: VÉRIF APARTMENT ====================
    console.log('📦 1️⃣ APARTMENT REÇU:');
    console.log('   - ID:', apartment.id);
    console.log('   - Type:', typeof apartment.id);
    console.log('   - Longueur:', apartment.id?.length);
    console.log('   - Valeur JSON:', JSON.stringify(apartment.id));
    console.log('   - Prix par défaut:', apartment.price_per_night);
    
    // ==================== ÉTAPE 2: VÉRIF SEASONAL PRICES EN MÉMOIRE ====================
    console.log('\n📊 2️⃣ SEASONAL PRICES EN MÉMOIRE (state):');
    console.log('   - Nombre de lignes:', seasonalPrices.length);
    console.log('   - Contenu complet:', seasonalPrices);
    
    if (seasonalPrices.length > 0) {
      console.log('   - Premier élément:', seasonalPrices[0]);
      console.log('   - Type de start_date:', typeof seasonalPrices[0].start_date);
      console.log('   - Exemple start_date:', seasonalPrices[0].start_date);
    }
    
    // ==================== ÉTAPE 3: REQUÊTE DIRECTE SUPABASE ====================
    console.log('\n🔌 3️⃣ REQUÊTE DIRECTE À SUPABASE:');
    
    const { data: allPrices, error: allError } = await supabase
      .from('seasonal_prices')
      .select('*');
    
    console.log('   - Toutes les lignes en BDD:', allPrices);
    console.log('   - Erreur:', allError);
    
    if (allPrices && allPrices.length > 0) {
      const uniqueApartmentIds = [...new Set(allPrices.map(p => p.apartment_id))];
      console.log('   - apartment_id uniques en BDD:', uniqueApartmentIds);
      console.log('   - Votre apartment.id est-il dans la liste? →', 
        uniqueApartmentIds.includes(apartment.id) ? '✅ OUI' : '❌ NON');
    }
    
    // ==================== ÉTAPE 4: REQUÊTE CIBLÉE ====================
    console.log('\n🎯 4️⃣ REQUÊTE AVEC VOTRE apartment.id:');
    
    const { data: targetedPrices, error: targetedError } = await supabase
      .from('seasonal_prices')
      .select('*')
      .eq('apartment_id', apartment.id);
    
    console.log('   - Résultats pour apartment.id:', targetedPrices);
    console.log('   - Erreur:', targetedError);
    console.log('   - Nombre de résultats:', targetedPrices?.length || 0);
    
    // ==================== ÉTAPE 5: COMPARAISON MANUELLE ====================
    console.log('\n🔬 5️⃣ COMPARAISON MANUELLE DES UUIDs:');
    
    if (allPrices && allPrices.length > 0) {
      allPrices.forEach((price, index) => {
        const match = price.apartment_id === apartment.id;
        const matchStrict = price.apartment_id === apartment.id;
        const matchTrimmed = price.apartment_id?.trim() === apartment.id?.trim();
        
        console.log(`   [${index}] "${price.apartment_id}"`);
        console.log(`       vs "${apartment.id}"`);
        console.log(`       → Égalité stricte (===): ${matchStrict ? '✅' : '❌'}`);
        console.log(`       → Après trim(): ${matchTrimmed ? '✅' : '❌'}`);
        console.log(`       → Longueurs: ${price.apartment_id?.length} vs ${apartment.id?.length}`);
        
        // Comparaison caractère par caractère si proche
        if (price.apartment_id?.length === apartment.id?.length && !matchStrict) {
          for (let i = 0; i < apartment.id.length; i++) {
            if (price.apartment_id[i] !== apartment.id[i]) {
              console.log(`       → Différence à l'index ${i}: "${price.apartment_id[i]}" vs "${apartment.id[i]}"`);
            }
          }
        }
      });
    }
    
    // ==================== ÉTAPE 6: VÉRIF RLS ====================
    console.log('\n🔒 6️⃣ VÉRIFICATION RLS (Row Level Security):');
    
    const { data: publicTest, error: publicError } = await supabase
      .from('seasonal_prices')
      .select('count');
    
    console.log('   - Peut lire sans filtre?', publicTest ? '✅ OUI' : '❌ NON');
    console.log('   - Erreur RLS?', publicError);
    
    // ==================== CALCUL NORMAL (avec logs améliorés) ====================
    console.log('\n💰 7️⃣ CALCUL DU PRIX:');
    
    let total = 0;
    let current = new Date(startDate); 
    const end = new Date(endDate);

    console.log(`   - Période: ${format(current, 'yyyy-MM-dd')} → ${format(end, 'yyyy-MM-dd')}`);
    
    const datesDisponibles = seasonalPrices.map(p => `${p.start_date.substring(0, 10)} (${p.price}€)`);
    console.log('   - Prix saisonniers disponibles:', datesDisponibles);

    while (current < end) {
      const dateKey = format(current, 'yyyy-MM-dd');
      console.log(`\n   🔎 Recherche pour: [${dateKey}]`);

      const weeklyPriceFound = seasonalPrices.find(p => {
        const dbDate = p.start_date.substring(0, 10);
        const matches = dbDate === dateKey;
        console.log(`      - Compare "${dbDate}" === "${dateKey}" → ${matches ? '✅' : '❌'}`);
        return matches;
      });

      if (weeklyPriceFound) {
        console.log(`   ✅ TROUVÉ ! Prix: ${weeklyPriceFound.price}€`);
        total += parseFloat(weeklyPriceFound.price);
      } else {
        const defaultPrice = parseFloat(apartment.price_per_night) / 100;
        console.log(`   ❌ NON TROUVÉ → Défaut: ${defaultPrice}€`);
        total += defaultPrice;
      }
      current = addDays(current, 7);
    }

    if (hasParking) {
      const days = differenceInCalendarDays(endDate, startDate);
      const weeks = Math.ceil(days / 7);
      const parkingCost = weeks * 80;
      console.log(`\n   🅿️ Parking: ${weeks} semaines × 80€ = ${parkingCost}€`);
      total += parkingCost;
    }

    console.log('\n💵 TOTAL FINAL:', Math.round(total), '€');
    console.groupEnd();
    
    setTotalPrice(Math.round(total));
    setIsCalculating(false);
  };

  const timer = setTimeout(calculateTotal, 200);
  return () => clearTimeout(timer);

}, [startDate, endDate, hasParking, seasonalPrices, apartment.price_per_night, apartment.id]);
// ⚠️ J'ai ajouté apartment.id aux dépendances

  // ... (Le reste du code ne change pas pour l'affichage) ...
  const getDayClass = (date) => {
    const dStr = date.toDateString();
    if (fullyBookedDates.some(d => d.toDateString() === dStr)) return "day-fully-booked";
    if (startBookedDates.some(d => d.toDateString() === dStr)) return "day-start-booked";
    if (endBookedDates.some(d => d.toDateString() === dStr)) return "day-end-booked";
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
      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: apartment.id, start_date: startDate.toISOString(), end_date: endDate.toISOString(),
          status: "pending", has_parking: hasParking, total_price: totalPrice, ...formData
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setStatus("success"); setStartDate(null); setEndDate(null); setHasParking(false); setTotalPrice(0);
      setFormData({ customer_name: "", customer_email: "", customer_phone: "", customer_address: "", customer_dob: "", message: "" });
    } catch (error) { alert("Erreur : " + error.message); } finally { setLoading(false); }
  };

  if (status === "success") {
    return ( <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center"><h3 className="text-2xl font-bold text-green-800">Demande envoyée !</h3></div> );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Réserver ce logement</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Arrivée</label><DatePicker selected={startDate} onChange={(date) => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} excludeDates={fullyBookedDates} dayClassName={getDayClass} locale={fr} dateFormat="dd/MM/yyyy" placeholderText="Arrivée" className="w-full border p-2 rounded" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Départ</label><DatePicker selected={endDate} onChange={(date) => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} excludeDates={fullyBookedDates} dayClassName={getDayClass} locale={fr} dateFormat="dd/MM/yyyy" placeholderText="Départ" className="w-full border p-2 rounded" /></div>
      </div>
      
      {/* CHAMPS FORMULAIRE SIMPLIFIÉS POUR LE TEST */}
      <div className="space-y-4">
        <input type="text" name="customer_name" placeholder="Nom" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_name} />
        <input type="email" name="customer_email" placeholder="Email" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_email} />
         <input type="tel" name="customer_phone" placeholder="Téléphone" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_phone} />
         <input type="text" name="customer_address" placeholder="Adresse" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_address} />
         <input type="date" name="customer_dob" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_dob} />
         <textarea name="message" placeholder="Message" className="w-full border p-2 rounded" onChange={handleChange} value={formData.message}></textarea>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-5 h-5" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} />
          <div className="flex flex-col"><span className="font-bold text-gray-900">Option Parking (+80€)</span></div>
        </label>
      </div>

      {totalPrice > 0 && (
        <div className="mt-6 p-4 bg-gray-900 rounded-lg text-white flex justify-between items-center shadow-lg">
          <div><p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total estimé</p><p className="text-2xl font-bold">{totalPrice} €</p></div>
        </div>
      )}

      <button type="submit" disabled={loading} className="w-full mt-4 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700">{loading ? "Envoi..." : "Envoyer ma demande"}</button>
    </form>
  );
}
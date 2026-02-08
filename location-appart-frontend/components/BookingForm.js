// src/components/BookingForm.js
"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.min.css";// 👇 On a besoin de ces outils pour calculer les intervalles
import { eachDayOfInterval, isSameDay, subDays, addDays } from "date-fns"; 
import fr from "date-fns/locale/fr";

export default function BookingForm({ apartment }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    customer_address: "", customer_dob: "", message: ""
  });

  // On sépare les types de dates pour le style
  const [fullyBookedDates, setFullyBookedDates] = useState([]); // Milieu (Rouge)
  const [startBookedDates, setStartBookedDates] = useState([]); // Début (Demi)
  const [endBookedDates, setEndBookedDates] = useState([]);     // Fin (Demi)

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`http://localhost:5000/api/apartments/${apartment.slug}`);
        const data = await res.json();
        
        if (data && data.bookings) {
          let middleDays = [];
          let startDays = [];
          let endDays = [];
          
          // On ne prend que les CONFIRMÉES
          const confirmedBookings = data.bookings.filter(b => b.status === 'confirmed');

          confirmedBookings.forEach(booking => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);

            // 1. Ajouter le jour de début à la liste "Start"
            startDays.push(start);

            // 2. Ajouter le jour de fin à la liste "End"
            endDays.push(end);

            // 3. Calculer les jours du MILIEU (exclus start et end)
            // S'il y a au moins 1 jour entre début et fin
            if (end > addDays(start, 1)) {
              const days = eachDayOfInterval({
                start: addDays(start, 1), // Lendemain du début
                end: subDays(end, 1)      // Veille de la fin
              });
              middleDays = [...middleDays, ...days];
            }
          });
          
          setFullyBookedDates(middleDays);
          setStartBookedDates(startDays);
          setEndBookedDates(endDays);
        }
      } catch (err) {
        console.error("Erreur chargement calendrier", err);
      }
    }
    fetchBookings();
  }, [apartment.slug]);

  // Fonction qui applique les CLASSES CSS selon le type de date
  const getDayClass = (date) => {
    // Est-ce un jour du milieu ? (Rouge total)
    if (fullyBookedDates.some(d => isSameDay(d, date))) {
      return "day-fully-booked";
    }
    // Est-ce un jour de début ? (Vert/Rouge)
    if (startBookedDates.some(d => isSameDay(d, date))) {
      return "day-start-booked";
    }
    // Est-ce un jour de fin ? (Rouge/Vert)
    if (endBookedDates.some(d => isSameDay(d, date))) {
      return "day-end-booked";
    }
    return undefined;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Veuillez sélectionner vos dates !");
      return;
    }
    
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: apartment.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "pending", 
          ...formData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");

      setStatus("success");
      setStartDate(null);
      setEndDate(null);
      setFormData({ customer_name: "", customer_email: "", customer_phone: "", customer_address: "", customer_dob: "", message: "" });

    } catch (error) {
      alert("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">Demande envoyée !</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Réserver ce logement</h3>

      {/* DATES */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrivée</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            // ⚠️ IMPORTANT : On n'exclut QUE les jours du milieu.
            // Les jours "mi-rouge/mi-vert" restent cliquables pour le chassé-croisé.
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
            minDate={startDate}
            excludeDates={fullyBookedDates}
            dayClassName={getDayClass}
            locale={fr}
            dateFormat="dd/MM/yyyy"
            placeholderText="Date de départ"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
             onKeyDown={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {/* LE RESTE DU FORMULAIRE (Inchangé) */}
      <div className="space-y-4">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
           <input type="text" name="customer_name" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_name} />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
           <input type="email" name="customer_email" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_email} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" name="customer_phone" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_phone} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
            <input type="date" name="customer_dob" required className="w-full border p-2 rounded text-gray-500" onChange={handleChange} value={formData.customer_dob} />
          </div>
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Adresse postale</label>
           <input type="text" name="customer_address" required className="w-full border p-2 rounded" onChange={handleChange} value={formData.customer_address} />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
           <textarea name="message" rows="3" className="w-full border p-2 rounded" onChange={handleChange} value={formData.message}></textarea>
        </div>
      </div>

      <button type="submit" disabled={loading} className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-all ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
        {loading ? "Envoi..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.min.css";
import { eachDayOfInterval, isSameDay, subDays, addDays } from "date-fns"; 
import fr from "date-fns/locale/fr";

export default function BookingForm({ apartment }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // 👇 1. NOUVEAU : On gère l'état du parking
  const [hasParking, setHasParking] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    customer_address: "", customer_dob: "", message: ""
  });

  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [startBookedDates, setStartBookedDates] = useState([]);
  const [endBookedDates, setEndBookedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/apartments/${apartment.slug}`);
        const data = await res.json();
        
        if (data && data.bookings) {
          let middleDays = [];
          let startDays = [];
          let endDays = [];
          
          const confirmedBookings = data.bookings.filter(b => b.status === 'confirmed');

          confirmedBookings.forEach(booking => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);
            startDays.push(start);
            endDays.push(end);

            if (end > addDays(start, 1)) {
              const days = eachDayOfInterval({
                start: addDays(start, 1),
                end: subDays(end, 1)
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

  const getDayClass = (date) => {
    if (fullyBookedDates.some(d => isSameDay(d, date))) return "day-fully-booked";
    if (startBookedDates.some(d => isSameDay(d, date))) return "day-start-booked";
    if (endBookedDates.some(d => isSameDay(d, date))) return "day-end-booked";
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: apartment.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "pending",
          
          // 👇 2. NOUVEAU : On envoie l'info au backend
          has_parking: hasParking,
          
          ...formData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");

      setStatus("success");
      setStartDate(null);
      setEndDate(null);
      setHasParking(false); // Reset parking
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
        <p className="text-green-700">Vous recevrez bientôt une confirmation par email.</p>
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

      {/* INFOS CLIENT */}
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

      {/* 👇 3. NOUVEAU : LA CASE À COCHER PARKING */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input 
            type="checkbox" 
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            checked={hasParking}
            onChange={(e) => setHasParking(e.target.checked)}
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">Option Parking privé</span>
            <span className="text-sm text-gray-600">Garage sécurisé en sous-sol (+80€ / semaine)</span>
          </div>
        </label>
      </div>

      <button type="submit" disabled={loading} className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-all ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
        {loading ? "Envoi..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
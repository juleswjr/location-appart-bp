"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import EmailEditorModal from '../../components/EmailEditorModal';
export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);
  // 1. Vérifier si on est connecté
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // Si pas connecté, oust !
      } else {
        fetchBookings();
      }
    };
    checkUser();
  }, [router]);

  // 2. Charger les réservations depuis le backend
  const fetchBookings = async () => {
    // Pour simplifier, on crée une route backend qui renvoie TOUT
    // Mais ici, on va tricher et appeler Supabase directement pour aller vite
    const { data, error } = await supabase
      .from('bookings')
      .select('*, apartments(name)')
      .order('created_at', { ascending: false }); // Les plus récentes en haut
      
    if (data) setBookings(data);
    setLoading(false);
  };

  // 3. Action de validation
  const updateStatus = async (id, newStatus) => {
    if (!confirm(`Es-tu sûr de vouloir passer cette résa en ${newStatus} ?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        alert("Statut mis à jour !");
        fetchBookings(); // On rafraîchit la liste
      }
    } catch (err) {
      alert("Erreur backend");
    }
  };
 const saveCustomEmails = async (id, data) => {
    // data contient : { custom_arrival_message, custom_departure_message, arrival_mail_date, departure_mail_date }
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert("Configuration e-mail sauvegardée avec succès ! ✅");
        setEditingBooking(null); // Ferme le modal
        fetchBookings(); // Rafraîchit la liste
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur technique lors de la sauvegarde.");
    }
  };
  // Fonction pour mettre à jour le paiement
  const handlePaymentUpdate = async (id, newAmount) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paid: newAmount })
      });

      if (res.ok) {
        // On met à jour l'affichage localement sans recharger toute la page
        setBookings(prev => prev.map(b => 
          b.id === id ? { ...b, amount_paid: newAmount } : b
        ));
      }
    } catch (error) {
      console.error("Erreur paiement", error);
    }
  };
  const handleDownloadExcel = () => {
    // On redirige simplement vers l'URL du backend, le navigateur gère le téléchargement tout seul
    window.location.href = 'http://localhost:5000/api/accounting/export';
  };

  if (loading) return <div className="p-10">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="text-red-600 underline"
          >
            Se déconnecter
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          
          {/* BOUTON EXCEL */}
          <button 
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 font-bold transition-transform hover:scale-105"
          >
             Exporter Compta
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 border-b">Statut</th>
                <th className="p-4 border-b">Appartement</th>
                <th className="p-4 border-b">Client</th>
                <th className="p-4 border-b">Dates</th>
                <th className="p-4 font-semibold w-40">Paiement (€)</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
    
                  // 👇 1. ON CRÉE DES VARIABLES PROPRES ICI (DANS LA BOUCLE)
                  const paid = parseFloat(booking.amount_paid || 0);
                  const total = parseFloat(booking.total_price/100 || 0);
                  const isPaid = paid >= total; // Vrai si payé en totalité
                  const reste = total - paid;

                  return (

                    
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="p-4 border-b">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800 border-green-200'  // Vert pour Validé
                            : booking.status === 'rejected' 
                            ? 'bg-red-100 text-red-800 border-red-200'        // Rouge pour Refusé
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200' // Jaune pour En attente
                        }`}>
                        {booking.status === 'confirmed' ? 'VALIDÉ' : 
                        booking.status === 'rejected' ? 'REFUSÉ' : 'EN ATTENTE'}

                    </span>

                  </td>
                  <td className="p-4 border-b font-medium">{booking.apartments?.name}</td>
                  <td className="p-4 border-b">
                    <div>{booking.customer_name}</div>
                    <div className="text-xs text-gray-500">{booking.customer_email}</div>
                  </td>
                  <td className="p-4 border-b text-sm">
                    Du {new Date(booking.start_date).toLocaleDateString()}<br/>
                    Au {new Date(booking.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className={`w-20 border p-1 rounded font-bold text-right focus:ring-2 focus:ring-blue-500 outline-none ${
                            // UTILISE LA VARIABLE isPaid
                            isPaid
                              ? 'text-green-600 border-green-200 bg-green-50' 
                              : 'text-orange-600 border-orange-200 bg-orange-50'
                          }`}
                          // IMPORTANT : Utilise value et onChange pour lier au state en direct si possible, 
                          // mais avec defaultValue + onBlur ça marche aussi.
                          defaultValue={paid} 
                          onBlur={(e) => handlePaymentUpdate(booking.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        />
                        <span className="text-gray-400">€</span>
                      </div>

                      <div className="text-xs text-gray-500">
                        <span className="font-semibold">Sur {total} €</span>
                        
                        {/* AFFICHER LE RESTE S'IL EST SUPÉRIEUR À 1€ (pour éviter les bugs de 0.0001 centimes) */}
                        {reste > 0.1 && (
                          <div className="text-red-500 font-medium mt-1">
                            Reste : {Math.round(reste * 100) / 100} €
                          </div>
                        )}
                        
                        {/* BADGE PAYÉ */}
                        {isPaid && (
                          <div className="text-green-600 font-bold text-[10px] mt-1 flex items-center gap-1 animate-pulse">
                            ✅ Payé
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-b text-right space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                        >
                          Valider
                        </button>
                        <button 
                          onClick={() => updateStatus(booking.id, 'rejected')}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                       <span className="text-gray-400 text-sm italic">Mail envoyé ✅</span>
                    )}
                    <button 
                      onClick={() => setEditingBooking(booking)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm"
                      title="Personnaliser les emails"
                    >
                      ✏️ Emails
                    </button>
                  </td>
                  
                </tr>
              )})}
            </tbody>
          </table>
          

          {bookings.length === 0 && (
            <div className="p-8 text-center text-gray-500">Aucune réservation pour le moment.</div>
          )}
        </div>
      </div>
      {editingBooking && (
        <EmailEditorModal 
          booking={editingBooking} 
          onClose={() => setEditingBooking(null)} 
          onSave={saveCustomEmails}
        />
      )}
    </div>
  );
}
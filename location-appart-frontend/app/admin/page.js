"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import EmailEditorModal from '../../components/EmailEditorModal';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';



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
// 2. Charger les réservations
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        apartments (
          name,
          arrival_instruction,
          departure_instruction
        )
      `) // 👈 On ajoute les colonnes ici !
      .order('created_at', { ascending: false });
      
    if (data) {
      console.log("🔥 DONNÉES REÇUES :", data[0]); 
      setBookings(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
      // 1. Confirmation visuelle
      if (!confirm(`Es-tu sûr de vouloir passer cette résa en ${newStatus} ?`)) return;

      // Utilise la variable d'environnement pour que ça marche en ligne !
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let url = '';
      let method = '';
      let body = {};

      // 2. AIGUILLAGE INTELLIGENT 🧠
      if (newStatus === 'confirmed') {
          // Cas VALIDATION : On appelle la route spéciale "confirm"
          // Note : On n'envoie pas de body 'status' car la route sait déjà quoi faire
          url = `${apiUrl}/api/bookings/${id}/confirm`;
          method = 'POST'; 
      } else {
          // Cas REFUS / ANNULATION : On appelle la route standard de mise à jour
          url = `${apiUrl}/api/bookings/${id}`;
          method = 'PUT';
          body = { status: newStatus };
      }

      try {
        // 3. Appel au serveur
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          // Si la méthode est POST (confirmation), on envoie un body vide ou null, 
          // sinon on envoie le statut
          body: method === 'PUT' ? JSON.stringify(body) : undefined 
        });

        if (res.ok) {
          const data = await res.json();
          alert(newStatus === 'confirmed' ? "Réservation validée et mails envoyés ! ✅" : "Statut mis à jour.");
          fetchBookings(); // On rafraîchit la liste
        } else {
          const err = await res.json();
          alert("Erreur serveur : " + (err.message || "Inconnue"));
        }
      } catch (err) {
        console.error(err);
        alert("Erreur de connexion au backend");
      }
    };

    const handleDownloadExcel = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      window.location.href = `${apiUrl}/api/accounting/export`;
    };
// 4. Sauvegarde des emails personnalisés (DIRECT SUPABASE) 🚀
  const saveCustomEmails = async (id, data) => {
    console.log('📧 Sauvegarde des emails pour:', id, data);
    
    try {
      // 1. Envoi direct à Supabase
      // 'data' contient déjà les bons noms de colonnes (ex: custom_arrival_message, etc.)
      const { error } = await supabase
        .from('bookings')
        .update(data) 
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Emails sauvegardés en BDD');
      alert("Configuration e-mail sauvegardée avec succès ! ✅");

      // 2. Mise à jour de l'affichage local (pour que les données restent si on réouvre le modal)
      setBookings(prev => prev.map(b => 
        b.id === id ? { ...b, ...data } : b
      ));

      // 3. On ferme le modal
      setEditingBooking(null);

    } catch (err) {
      console.error('❌ Erreur:', err.message);
      alert("Erreur technique lors de la sauvegarde.");
    }
  };
  // Fonction pour mettre à jour le paiement (COMME updateStatus)
/*const handlePaymentUpdate = async (id, newAmount) => {
    console.log(`💾 Sauvegarde paiement : ${newAmount}€...`);

    try {
      // ⚠️ J'utilise 'paid_amount'. Si ta colonne s'appelle 'amount_paid', change le nom ci-dessous !
      const { error } = await supabase
        .from('bookings')
        .update({ amount_paid: parseFloat(newAmount) }) 
        .eq('id', id);

      if (error) throw error;

      console.log("✅ Paiement sauvegardé !");
      
      // Mise à jour visuelle immédiate
      setBookings(prev => prev.map(b => 
        b.id === id ? { ...b, paid_amount: parseFloat(newAmount) } : b
      ));

    } catch (error) {
      console.error("❌ Erreur paiement :", error.message);
      alert("Erreur sauvegarde prix !");
    }
  };*/
  // 5. Mise à jour du Paiement (OPTIMISTE)
// 5. Mise à jour du Paiement (OPTIMISTE & INSTANTANÉE) ⚡
  const handlePaymentUpdate = async (id, newAmount) => {
    const amount = parseFloat(newAmount);

    // 1. On met à jour l'affichage TOUT DE SUITE (pour que l'utilisateur voie le résultat)
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, amount_paid: amount } : b
    ));

    try {
      // 2. On sauvegarde en BDD discrètement
      const { error } = await supabase
        .from('bookings')
        .update({ amount_paid: amount }) // Vérifie bien si c'est 'amount_paid' ou 'paid_amount' dans ta BDD
        .eq('id', id);

      if (error) throw error;
      console.log("✅ Sauvegardé en BDD");

    } catch (error) {
      console.error("❌ Erreur sauvegarde :", error.message);
      alert("Oups, la sauvegarde a échoué. La page va se recharger.");
      fetchBookings(); // On remet les vraies données en cas d'erreur
    }
  };

  const handleSendContract = async (id) => {
  if (!confirm("Envoyer le contrat au propriétaire ?")) return;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  try {
    const res = await fetch(`${apiUrl}/api/bookings/${id}/send-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      alert("✅ Contrat envoyé au propriétaire !");
    } else {
      const err = await res.json();
      alert("Erreur : " + (err.message || "Inconnue"));
    }
  } catch (err) {
    console.error(err);
    alert("Erreur de connexion au backend");
  }
};

const handleRatingUpdate = async (id, rating, note) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ owner_rating: rating, owner_note: note })
      .eq('id', id);

    if (error) throw error;

    setBookings(prev => prev.map(b =>
      b.id === id ? { ...b, owner_rating: rating, owner_note: note } : b
    ));
  } catch (err) {
    console.error("❌ Erreur sauvegarde note :", err.message);
    alert("Erreur lors de la sauvegarde.");
  }
};
// Fonction pour cocher/décocher manuellement les emails
  const toggleEmailStatus = async (id, field, currentValue) => {
    try {
      // 1. Mise à jour Backend (Supabase direct ou via API)
      // On inverse la valeur actuelle (!currentValue)
      const { error } = await supabase
        .from('bookings')
        .update({ [field]: !currentValue }) // ex: { sent_arrival_email: true }
        .eq('id', id);

      if (error) throw error;

      // 2. Mise à jour Locale (pour voir la case se cocher instantanément)
      setBookings(prev => prev.map(b => 
        b.id === id ? { ...b, [field]: !currentValue } : b
      ));

    } catch (error) {
      console.error("Erreur update email", error);
      alert("Erreur lors de la mise à jour du statut email");
    }
  };


  const [calendarMonth, setCalendarMonth] = useState({
  'marmotte': new Date(),
  'chamois': new Date(),
  'nid': new Date(),
  'front': new Date(),
});

const APARTMENTS = [
  { key: 'marmotte', name: 'Marmotte',       id: '3cdc88a6-86ae-40f6-b144-5c7198187be0' },
  { key: 'chamois',  name: 'Chamois',         id: '584d3c17-ea04-4513-a7e4-0979b7ce5771' },
  { key: 'nid',      name: 'Nid Douillet',    id: '7fa8798b-f0c2-4c8d-9308-9c5c50e3c7ce' },
  { key: 'front',    name: 'Front de Neige',  id: 'b176983c-9cec-4926-bc71-bff870a75166' },
];

// Retourne true si une date est dans une réservation confirmée pour cet appart
const isBooked = (date, apartmentId) => {
  return bookings.some(b => {
    if (b.apartment_id !== apartmentId) return false;
    if (b.status !== 'confirmed') return false;
    // ✅ Fix UTC : on force midi pour éviter le décalage
    const start = new Date(b.start_date + 'T12:00:00');
    const end   = new Date(b.end_date + 'T12:00:00');
    return date >= start && date < end;
  });
};

const getCalendarDayClass = (date, apartmentId) => {
  if (isBooked(date, apartmentId)) return 'booked-day';
  return '';
};

const StarRating = ({ booking, onSave }) => {
  const [rating, setRating] = useState(booking.owner_rating || 0);
  const [note, setNote] = useState(booking.owner_note || '');
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (rating === 0) return alert("Choisis une note !");
    onSave(booking.id, rating, note);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Bouton affichage */}
      <button
        onClick={() => setOpen(!open)}
        className="text-yellow-500 text-sm font-medium hover:underline"
        title="Noter ce client"
      >
        {booking.owner_rating
          ? `${'⭐'.repeat(booking.owner_rating)} (${booking.owner_rating}/5)`
          : '☆ Noter'}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 z-50 bg-white border rounded-lg shadow-lg p-4 w-64 mt-1">
          <p className="text-sm font-semibold text-gray-700 mb-2">Note client</p>

          {/* Étoiles */}
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl transition-transform hover:scale-110 ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Avis optionnel */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Avis optionnel... (ex: très bon locataire)"
            className="w-full border rounded p-2 text-xs text-gray-600 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />

          {/* Boutons */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="bg-yellow-400 hover:bg-yellow-500 text-white text-xs px-3 py-1 rounded font-bold"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
                <th className="p-4 border-b">Note</th>
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
                    Du {new Date(booking.start_date + 'T12:00:00').toLocaleDateString()}<br/>
                    Au {new Date(booking.end_date + 'T12:00:00').toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          // 👇 L'astuce magique : Si 'paid' change, l'input se rafraîchit forcément
                          key={paid} 
                          
                          className={`w-24 border p-1 rounded font-bold text-right outline-none ${
                            isPaid ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
                          }`}
                          
                          defaultValue={paid} // On utilise defaultValue pour ne pas bloquer la saisie
                          
                          // 1. Sauvegarde quand on clique ailleurs (c'est le déclencheur principal)
                          onBlur={(e) => handlePaymentUpdate(booking.id, e.target.value)}
                          
                          // 2. Sur Entrée, on "lâche" le focus, ce qui déclenche le onBlur du dessus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault(); // Empêche le comportement par défaut
                              e.target.blur();    // Enlève le curseur -> Déclenche le onBlur -> Sauvegarde
                            }
                          }}
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

                        
                        <button onClick={() => handleSendContract(booking.id)}
                          className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 text-sm"
                          >
                          
                          📄 Contrat
                        </button>
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
                       <span className="text-gray-400 text-sm italic">Réservation validée ✅
                       <button onClick={() => handleSendContract(booking.id)}
                          className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 text-sm"
                          >
                          📄 Contrat
                        </button>
                       
                       </span>
                       
                    )}
                    <button 
                      onClick={() => setEditingBooking(booking)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm"
                      title="Personnaliser les emails"
                    >
                      ✏️ Emails
                    </button>
                  </td>
                  <td className="p-4 border-b">
                    <StarRating booking={booking} onSave={handleRatingUpdate} />
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
      {/* CALENDRIERS PAR APPARTEMENT */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Disponibilités par appartement</h2>
        <div className="grid grid-cols-2 gap-6">
          {APARTMENTS.map((apt) => (
            <div key={apt.key} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
               {apt.name}
              </h3>
              <DatePicker
                inline
                locale={fr}
                dayClassName={(date) => getCalendarDayClass(date, apt.id)}
                filterDate={() => true} // Toutes les dates visibles
                onMonthChange={(date) =>
                  setCalendarMonth(prev => ({ ...prev, [apt.key]: date }))
                }
                selected={calendarMonth[apt.key]}
                onChange={() => {}} // Lecture seule, pas de sélection
              />
              {/* Légende */}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Réservé
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span> Disponible
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    
  );
}
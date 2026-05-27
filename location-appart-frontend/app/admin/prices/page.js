"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const APARTMENTS = [
  { key: 'marmotte', name: 'Marmotte',      id: '3cdc88a6-86ae-40f6-b144-5c7198187be0' },
  { key: 'chamois',  name: 'Chamois',        id: '584d3c17-ea04-4513-a7e4-0979b7ce5771' },
  { key: 'nid',      name: 'Nid Douillet',   id: '7fa8798b-f0c2-4c8d-9308-9c5c50e3c7ce' },
  { key: 'front',    name: 'Front de Neige', id: 'b176983c-9cec-4926-bc71-bff870a75166' },
];

export default function AdminPrices() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('marmotte');
  const [prices, setPrices] = useState({}); // { apartmentId: [...rows] }
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState({ start_date: '', price: '' });
  const [saving, setSaving] = useState(false);

  // 1. Auth check
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
      else fetchAllPrices();
    };
    check();
  }, []);

  // 2. Charger tous les prix
  const fetchAllPrices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('seasonal_prices')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }

    // Grouper par apartment_id
    const grouped = {};
    APARTMENTS.forEach(a => { grouped[a.id] = []; });
    data.forEach(row => {
      if (grouped[row.apartment_id]) grouped[row.apartment_id].push(row);
    });

    setPrices(grouped);
    setLoading(false);
  };

  // 3. Modifier un prix inline
  const handlePriceUpdate = async (rowId, apartmentId, newPrice) => {
    const amount = parseFloat(newPrice);
    if (isNaN(amount)) return;

    // Optimiste
    setPrices(prev => ({
      ...prev,
      [apartmentId]: prev[apartmentId].map(r =>
        r.id === rowId ? { ...r, price: amount * 100 } : r
      )
    }));

    const { error } = await supabase
      .from('seasonal_prices')
      .update({ price: amount * 100 }) // stocké en centimes comme tes autres prix
      .eq('id', rowId);

    if (error) {
      console.error(error);
      alert('Erreur sauvegarde');
      fetchAllPrices();
    }
  };

  // 4. Ajouter une semaine
  const handleAdd = async (apartmentId) => {
    if (!newRow.start_date || !newRow.price) return alert('Remplis la date et le prix.');
    setSaving(true);

    const { error } = await supabase
      .from('seasonal_prices')
      .insert([{
        apartment_id: apartmentId,
        start_date: newRow.start_date,
        price: parseFloat(newRow.price) * 100
      }]);

    if (error) { console.error(error); alert('Erreur ajout'); }
    else {
      setNewRow({ start_date: '', price: '' });
      fetchAllPrices();
    }
    setSaving(false);
  };

  // 5. Supprimer une ligne
  const handleDelete = async (rowId, apartmentId) => {
    if (!confirm('Supprimer cette semaine ?')) return;

    setPrices(prev => ({
      ...prev,
      [apartmentId]: prev[apartmentId].filter(r => r.id !== rowId)
    }));

    const { error } = await supabase
      .from('seasonal_prices')
      .delete()
      .eq('id', rowId);

    if (error) { console.error(error); fetchAllPrices(); }
  };

  const activeApt = APARTMENTS.find(a => a.key === activeTab);
  const activeRows = prices[activeApt?.id] || [];

  if (loading) return <div className="p-10">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">💰 Gestion des prix</h1>
            <p className="text-gray-500 text-sm mt-1">Prix stockés en euros, affichés en euros.</p>
          </div>
          <Link
            href="/admin"
            className="text-gray-500 hover:text-gray-800 text-sm underline"
          >
            ← Retour au tableau de bord
          </Link>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {APARTMENTS.map(apt => (
            <button
              key={apt.key}
              onClick={() => {
                setActiveTab(apt.key);
                setNewRow({ start_date: '', price: '' });
              }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeTab === apt.key
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-gray-600 border hover:bg-gray-100'
              }`}
            >
              🏠 {apt.name}
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">Semaine du</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Prix (€)</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-400 italic">
                    Aucun prix configuré pour cet appartement.
                  </td>
                </tr>
              )}
              {activeRows.map(row => (
                <tr key={row.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-700">
                    {new Date(row.start_date + 'T12:00:00').toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        key={row.price}
                        defaultValue={(row.price / 100).toFixed(0)}
                        className="w-24 border rounded p-1 text-right font-bold text-blue-700 bg-blue-50 outline-none focus:ring-2 focus:ring-blue-300"
                        onBlur={(e) => handlePriceUpdate(row.id, activeApt.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      />
                      <span className="text-gray-400 text-sm">€</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(row.id, activeApt.id)}
                      className="text-red-400 hover:text-red-600 text-sm font-medium"
                    >
                      🗑 Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ajouter une semaine */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">➕ Ajouter une semaine</h2>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de début</label>
              <input
                type="date"
                value={newRow.start_date}
                onChange={(e) => setNewRow(prev => ({ ...prev, start_date: e.target.value }))}
                className="border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prix (€)</label>
              <input
                type="number"
                placeholder="ex: 690"
                value={newRow.price}
                onChange={(e) => setNewRow(prev => ({ ...prev, price: e.target.value }))}
                className="border rounded p-2 text-sm w-28 outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              onClick={() => handleAdd(activeApt.id)}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
            >
              {saving ? 'Ajout...' : '✅ Ajouter'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
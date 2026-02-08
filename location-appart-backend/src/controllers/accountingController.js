const supabase = require('../config/supabaseClient');
const ExcelJS = require('exceljs');

exports.downloadAccountingExcel = async (req, res) => {
  try {
    // 1. Récupérer les réservations PAYÉES (amount_paid >= total_price)
    // On récupère aussi le nom de l'appart
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, apartments(name)')
      .not('status', 'eq', 'cancelled') // On ignore les annulés
      .order('start_date', { ascending: true }); // Tri par date par défaut

    if (error) throw error;

    // 2. Filtrer uniquement ceux qui sont TOTALEMENT payés
    // (Rappel : les prix sont en centimes dans la BDD)
    const paidBookings = bookings.filter(b => {
        const paye = parseFloat(b.amount_paid || 0);
        const total = parseFloat(b.total_price/100 || 0);
        return paye >= total;
    });


    // 3. Trier par Nom d'appartement (Javascript sort)
    paidBookings.sort((a, b) => {
      const nameA = a.apartments?.name || "";
      const nameB = b.apartments?.name || "";
      return nameA.localeCompare(nameB);
    });

    // 4. Créer le fichier Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Compta Locations');

    // Définir les Colonnes
    worksheet.columns = [
      { header: 'Appartement', key: 'appart', width: 25 },
      { header: 'Client', key: 'client', width: 20 },
      { header: 'Date Arrivée', key: 'start', width: 15 },
      { header: 'Date Départ', key: 'end', width: 15 },
      { header: 'Total Payé (€)', key: 'price', width: 15, style: { numFmt: '#,##0.00 €' } }
    ];

    // Mettre l'en-tête en Gras
    worksheet.getRow(1).font = { bold: true };

    // 5. Ajouter les lignes
    paidBookings.forEach(booking => {
      worksheet.addRow({
        appart: booking.apartments?.name || "Inconnu",
        client: booking.customer_name,
        start: new Date(booking.start_date).toLocaleDateString(),
        end: new Date(booking.end_date).toLocaleDateString(),
        // On divise par 100 pour remettre en Euros
        price: (booking.amount_paid) 
      });
    });

    // 6. Envoyer le fichier au navigateur
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Compta_Locations.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Erreur Excel:", error);
    res.status(500).send("Erreur lors de la génération de l'Excel");
  }
};
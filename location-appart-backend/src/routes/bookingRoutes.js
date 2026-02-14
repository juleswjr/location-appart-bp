// src/routes/bookingRoutes.js
const express = require('express');     
const router = express.Router();        
const bookingController = require('../controllers/bookingController');
console.log("DEBUG CONTROLLER:", bookingController);
// Récupérer les dates
router.get('/:apartmentId', bookingController.getBookedDates);

// Envoyer une demande
router.post('/', bookingController.createBooking);
router.post('/:id/confirm', bookingController.confirmBooking);

// Confirmer une demande
//router.put('/:id/confirm', bookingController.confirmBooking);
router.put('/:id', bookingController.updateBookingStatus);
router.put('/:id', bookingController.updateBooking);

module.exports = router;

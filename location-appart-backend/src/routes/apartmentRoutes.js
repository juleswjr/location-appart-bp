// src/routes/apartmentRoutes.js
const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartmentController');

// GET /api/apartments
router.get('/', apartmentController.getAllApartments);

// GET /api/apartments/etoile-du-nord
router.get('/:slug', apartmentController.getApartmentBySlug);

module.exports = router;
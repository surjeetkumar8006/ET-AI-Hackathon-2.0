const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const permitController = require('../controllers/permitController');

// Dashboard routes
router.get('/dashboard', dashboardController.getDashboardData);
router.get('/alerts', dashboardController.getAlerts);
router.post('/query-compliance', dashboardController.queryCompliance);

// Permit routes
router.get('/permits', permitController.getPermits);
router.post('/permits', permitController.createPermit);

module.exports = router;

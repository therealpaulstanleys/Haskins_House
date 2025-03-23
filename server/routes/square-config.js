const express = require('express');
const router = express.Router();
const vault = require('../services/vault'); // Your vault service

router.get('/api/square-config', async(req, res) => {
    try {
        // Fetch secrets from vault
        const squareConfig = await vault.getSecrets('square');

        // Only send public credentials to client
        res.json({
            appId: squareConfig.appId,
            locationId: squareConfig.locationId
        });
    } catch (error) {
        console.error('Error fetching Square config:', error);
        res.status(500).json({ error: 'Could not load Square configuration' });
    }
});

module.exports = router;
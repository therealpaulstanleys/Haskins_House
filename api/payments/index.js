const express = require('express');
const router = express.Router();
const { Client } = require('square');

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

router.post('/create-payment', async(req, res) => {
    try {
        const { sourceId, amount, currency = 'USD' } = req.body;

        const payment = await squareClient.paymentsApi.createPayment({
            sourceId,
            amountMoney: {
                amount,
                currency
            },
            idempotencyKey: crypto.randomUUID()
        });

        res.json(payment.result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
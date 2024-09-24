const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.get('/players/email/:email', async (req, res) => {
    const email = req.params.email;
    const url = `https://kaotika-server.fly.dev/players/email/${email}`;
    
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error(`Error getting player data: ${error.message}`);
        res.status(500).json({ error: 'Error getting player data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

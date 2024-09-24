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


const mongoose = require('mongoose');

//mongodb+srv://larrea:3@cluster.t0rfr.mongodb.net/

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://larrea:3@cluster.t0rfr.mongodb.net/');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const kittySchema = new mongoose.Schema({
    name: String
  });

const Kitten = mongoose.model('Kitten', kittySchema);

const silence = new Kitten({ name: 'Silence' });
console.log(silence.name); // 'Silence'
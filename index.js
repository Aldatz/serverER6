import express from 'express'
import axios from 'axios'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Player } from './Schemas/PlayerSchema.js';

const app = express();
const PORT = 3000;


mongoose.connection.on('connected', () => console.log('connected'));
mongoose.connection.on('open', () => console.log('open'));
mongoose.connection.on('disconnected', () => console.log('disconnected'));
mongoose.connection.on('reconnected', () => console.log('reconnected'));
mongoose.connection.on('disconnecting', () => console.log('disconnecting'));
mongoose.connection.on('close', () => console.log('close'));


main().catch(err => console.log(err));

async function main() {

  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
  } catch (error) {
    console.log(error);
  }
}


// const kittens = await Kitten.find();


app.get('/players/email/:email', async (req, res) => {
    const email = req.params.email;
    const url = `https://kaotika-server.fly.dev/players/email/${email}`;
    
    try {
        const response = await axios.get(url);
        res.json(response.data);
        console.log(response.data);
        
        insertPlayer(response.data)

    } catch (error) {
        console.error(`Error getting player data: ${error.message}`);
        res.status(500).json({ error: 'Error getting player data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

async function insertPlayer(playerData) {
  try {
    const data = playerData.data
    // check players email in collections
    const existingPlayer = await Player.findOne({ email: data.email });
    console.log(data.email);
    console.log(existingPlayer);
    
    if (existingPlayer) {
      // player in collection, update  data
      await Player.updateOne({ email: data.email }, data);
      console.log(`Player with email ${data.email} updated successfully.`);
    } else {
      //player is not in collections, add the role and create a new player
      switch (data.email) {
        case process.env.ISTVAN_EMAIL: //istvan
            data.role = 'ISTVAN';             
            break;
        case process.env.VILLAIN_EMAIL: //villano
            data.role = 'VILLAIN';             
            break;
        case process.env.MORTIMER_EMAIL: //mortimer
            data.role = 'MORTIMER';             
            break;
        default:
            data.role = 'ACOLYTE'; //acolyte, for the moment no ikasle.aeg.eus confirmation             
            break;
      }
      const newPlayer = new Player(data);
      await newPlayer.save();
      console.log(`Player with email ${data.email} created successfully.`);
    }
  } catch (error) {
    console.error('Error updating/creating player:', error);
  }
}
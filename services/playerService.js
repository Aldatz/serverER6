// services/playerService.js
import { Player } from '../Schemas/PlayerSchema.js';
import mongoose from '../config/mongooseConfig.js';
import axios from 'axios';

export const mortimerGet = async () => {
  try {
    const excludedEmails = [
      process.env.ISTVAN_EMAIL,
      process.env.VILLAIN_EMAIL,
      process.env.MORTIMER_EMAIL,
    ];

    const players = await Player.find(
      { email: { $nin: excludedEmails } },
      {
        is_active: 1,
        name: 1,
        nickname: 1,
        avatar: 1,
        is_inside_tower: 1,
        disease: 1,
        ethaziumCursed: 1,
      }
    );

    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

export const playersGet = async () => {
  try {
    const excludedEmails = [
      process.env.ISTVAN_EMAIL,
      process.env.VILLAIN_EMAIL,
      process.env.MORTIMER_EMAIL,
    ];

    const players = await Player.find(
      { email: { $nin: excludedEmails } },
      {
        _id: 1,
        is_active: 1,
        name: 1,
        nickname: 1,
        avatar: 1,
        is_inside_tower: 1,
        disease: 1,
        ethaziumCursed: 1,
        email:1,
        isbetrayer:1,
      }
    );

    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

export const getUserIsInsideTower = async (email) => {
  try {
    const isInsideTower = await Player.findOne({ email }).select('is_inside_tower');
    return isInsideTower;
  } catch (error) {
    console.error('Error fetching IsInside:', error);
    throw error;
  }
};

export const applyCurseToPlayer = async (nick, curseName) => {
  const searchCurses = async () => {
    try {
      const url = `https://kaotika-server.fly.dev/diseases`;
      const response = await axios.get(url);

      if (response.data && response.data.data) {
        return response.data.data; // Return the array of diseases
      } else {
        throw new Error('No curses found in API response');
      }
    } catch (error) {
      console.error('Error fetching curses:', error.message);
      throw new Error('Failed to fetch curses');
    }
  };

  try {
    //take player from db
    const player = await Player.findOne({ nickname: nick });
    if (!player) {
      throw new Error('Player not found');
    }

    //fetch diseases from api
    const curses = await searchCurses();

    //find teh curse
    const selectedCurse = curses.find((curse) => curse.name === curseName);
    if (!selectedCurse) {
      throw new Error(`Curse with name "${curseName}" not found`);
    }

    //apply curse
    player.curse = selectedCurse;

    await player.save();

    return {
      success: true,
      message: `Curse "${curseName}" successfully applied to player`,
      player,
    };
  } catch (error) {
    console.error('Error applying curse to player:', error.message);
    throw {
      success: false,
      message: error.message || 'Failed to apply curse',
    };
  }
};

export const getUserIsInside = async (email) => {
  try {
    const isInside = await Player.findOne({ email }).select('is_active');
    return isInside;
  } catch (error) {
    console.error('Error fetching IsInside:', error);
    throw error;
  }
};
export const updateLocation = async (email, location) => {
    try {
      // 1. Buscar al jugador por email
      const player = await Player.findOne({ email });
  
      if (!player) {
        throw new Error('Jugador no encontrado');
      }
      // 2. Actualizar el campo 'location'
      player.location = location;
      // 3. Guardar los cambios en la base de datos
      await player.save();
      return;
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
      throw error;
    }
  };
  export const setBetrayer = async (email, decision) => {
    try {
      // 1. Buscar al jugador por email
      const player = await Player.findOne({ email });
  
      if (!player) {
        throw new Error('Jugador no encontrado');
      }
      // 2. Actualizar el campo 'location'
      player.isbetrayer = decision;
      // 3. Guardar los cambios en la base de datos
      await player.save();
      return;
    } catch (error) {
      console.error('Error al actualizar isbetrayer:', error);
      throw error;
    }
  };

export const updatePlayerByEmail = async (email, updateData) => {
  try {
    const updatedPlayer = await Player.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPlayer) {
      console.log('Player not found');
      return null;
    }

    console.log('Player updated successfully:', updatedPlayer);
    return updatedPlayer;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

export const deleteMapUser = async (nickname, users) => {
  try {
    // 1. Buscar al jugador por email
    const updatedUsers = { ...users };  //clone
    delete updatedUsers[nickname];  // delte the user by their nickname
    return updatedUsers;
  } catch (error) {
    console.error('error deleteing user from the map:', error);
    throw error;
  }
};

export const validateAllArtifacts = async () => {
  try {
    // Actualizar todos los documentos
    const result = await Player.updateMany({}, { ArtifactsValidated: true });
    console.log(`Players updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Error al actualizar los jugadores:', error);
  } 
};

export const AngeloREduced = async () => {
  try {
    // Actualizar todos los documentos
    const result = await Player.updateMany({}, { AngeloReduced: true });
    console.log(`Player updated Angelo Reduced: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Error al actualizar los jugadores:', error);
  } 
};

export const AngeloDelivered = async () => {
  try {
    // Actualizar todos los documentos
    const result = await Player.updateMany({}, { AngeloDelivered: true });
    console.log(`Player updated Angelo Delivered: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Error al actualizar los jugadores:', error);
  } 
};

export const giveAllIngredients = async (email) => {
  try {
    const url = `https://kaotika-server.fly.dev/ingredients`;
    const response = await axios.get(url);

    // 1. Buscar al jugador por email
    const player = await Player.findOne({ email });

    if (!player) {
      throw new Error('Jugador no encontrado');
    }

    // add qty
    const newIngredients = response.data.data.map(ingredient => ({
      ...ingredient,
      qty: 2, // Add default quantity
    }));

    // merge
    player.inventory.ingredients = [
      ...player.inventory.ingredients,
      ...newIngredients,
    ];

    // 3. Guardar los cambios en la base de datos
    await player.save();
    console.log("Ingredients added to", email);
    return;
  } catch (error) {
    console.error('Error al actualizar isbetrayer:', error);
    throw error;
  }
};


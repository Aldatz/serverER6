// services/playerService.js
import { Player } from '../Schemas/PlayerSchema.js';

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
      const updatedPlayer = await Player.findOneAndUpdate(
        { email },                   // Filtro para encontrar al jugador por email
        { $set: { location } },      // Actualizar el campo 'location' con el valor proporcionado
        { new: true, runValidators: true } // Opciones para devolver el documento actualizado y validar
      );
      return updatedPlayer;          // Retornar el jugador actualizado
    } catch (error) {
      console.error('Error updating location:', error);
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
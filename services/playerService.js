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
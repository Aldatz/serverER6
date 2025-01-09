// services/authService.js
import { Player } from '../Schemas/PlayerSchema.js';

export const insertPlayer = async (playerData) => {
  try {
    const data = playerData.data;
    const existingPlayer = await Player.findOne({ email: data.email });

    console.log(existingPlayer);
    
    if (existingPlayer) {
        // Actualiza los campos necesarios sin cambiar el estado de is_active
        await Player.updateOne(
          { email: data.email },
          {
            ...data,
            is_active: existingPlayer.is_active, // Manten el estado existente
            is_inside_tower: existingPlayer.is_inside_tower,
            "inventory.ingredients": existingPlayer.inventory.ingredients, //manten ingredientes
          }
        );
        console.log(`Player with email ${data.email} updated successfully.`);
        return existingPlayer;
    } else {
        data.is_active = false; // Solo para nuevos jugadores
        data.is_inside_tower = false;
    switch (data.email) {
      case process.env.ISTVAN_EMAIL:
        data.role = 'ISTVAN';
        break;
      case process.env.VILLAIN_EMAIL:
        data.role = 'VILLAIN';
        break;
      case process.env.MORTIMER_EMAIL:
        data.role = 'MORTIMER';
        break;
      default:
        data.role = 'ACOLYTE';
        break;
    }
    const newPlayer = new Player(data);
    await newPlayer.save();
    console.log(`Player with email ${data.email} created successfully.`);
    return newPlayer;
  }
} catch (error) {
  console.error('Error updating/creating player:', error);
}
};
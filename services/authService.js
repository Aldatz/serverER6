// services/authService.js
import { Player } from '../Schemas/PlayerSchema.js';

export const insertPlayer = async (playerData) => {
  try {
    const data = playerData.data;
    const existingPlayer = await Player.findOne({ email: data.email });

    if (existingPlayer) {
    
      const updateData = {
        is_active: existingPlayer.is_active,
        is_inside_tower: existingPlayer.is_inside_tower,
        role: existingPlayer.role,
      };
      
      if (data.inventory?.ingredients) {
        updateData["inventory.ingredients"] = Object.values(
          [...existingPlayer.inventory.ingredients, ...data.inventory.ingredients].reduce((acc, ingredient) => {
            acc[ingredient._id] = acc[ingredient._id] || { ...ingredient, qty: 0 };
            acc[ingredient._id].qty += ingredient.qty;
            return acc;
          }, {})
        );
      } else {
        updateData["inventory.ingredients"] = [...existingPlayer.inventory.ingredients];
      }
      
      //add or update the curse if provided
      if (data.curse) {
        updateData.curse = curseToApply;
      } else {
        updateData.curse = existingPlayer.curse; //mantain the curse if not given
      }
      // Perform the update with $set
      await Player.updateOne({ email: data.email }, { $set: updateData });

      console.log(`Player with email ${data.email} updated successfully.`);
      return existingPlayer;
    } else {
      // For new players, set initial values
      data.is_active = false;
      data.is_inside_tower = false;

      // Assign role based on email
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
    throw error; // Rethrow the error to ensure it can be handled upstream
  }
};
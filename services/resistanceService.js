// services/resistanceService.js
import { Player } from '../Schemas/PlayerSchema.js';
import { updateResistance } from '../server.js';

export async function reduceResistance() {
  try {
    // Obtenemos a todos los jugadores (excepto traidores).
    const players = await Player.find({ isbetrayer: { $ne: true } });

    for (const p of players) {
      // 1) Reducir 10%
      p.resistance = p.resistance - 10;

      // 2) Si resistencia < 50 → sube "insanity" en 'attributes'
      if (p.resistance < 50) {
        if (typeof p.attributes.insanity !== 'number') {
          p.attributes.insanity = 0;
        }
        p.attributes.insanity += 1;
      }
      // 3) Guardar
      await p.save();
      // 4) Actualizar en cliente
    }
    updateResistance();
    console.log('Resistance reduced by 10% to all players (non-traitors).');

  } catch (err) {
    console.error('Error reducing resistance:', err);
  }
}
// services/resistanceService.js
import { Player } from '../Schemas/PlayerSchema.js';

/**
 * reduceResistance()
 *  - Disminuye la "resistance" en un 10% (o la lógica que quieras).
 *  - Si baja de 50, incrementa "insanity" (dentro de 'attributes').
 *  - Ignora a los traidores (isBetrayer: true).
 */
export async function reduceResistance() {
  try {
    // Obtenemos a todos los jugadores (excepto traidores).
    const players = await Player.find({ isbetrayer: { $ne: true } });

    for (const p of players) {
      // Si quieres excluir también a malditos por Ethazium, o con disease, ajusta aquí.

      // 1) Reducir 10%
      //    p.ej. p.resistance = p.resistance - 10 sería un -10 fijo,
      //    aquí hacemos multiplicar * 0.9 (10% menos).
      p.resistance = p.resistance * 0.90;

      // 2) Si resistencia < 50 → sube "insanity" en 'attributes'
      if (p.resistance < 50) {
        // Ejemplo: +1 a la locura por cada ciclo que baje de 50
        // Asegúrate de que p.attributes.insanity sea un número.
        if (typeof p.attributes.insanity !== 'number') {
          p.attributes.insanity = 0;
        }
        p.attributes.insanity += 1;
      }

      // 3) Guardar
      await p.save();
    }
    console.log('Resistance reduced by 10% to all players (non-traitors).');
  } catch (err) {
    console.error('Error reducing resistance:', err);
  }
}
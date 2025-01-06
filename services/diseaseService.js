// services/diseaseService.js
import { Player } from '../Schemas/PlayerSchema.js';

export async function randomDisease() {
  try {
    // 1) Obtener todos los jugadores que puedan enfermarse.
    //    Por ejemplo, excluimos a los traidores y/o quienes ya tienen enfermedad, etc.
    const players = await Player.find({
      isbetrayer: { $ne: true },  // Excluye traidores
      // disease: null,          // Opcional, si quieres que solo se enfermen quienes NO tienen enfermedad
    });

    // 2) Lista de enfermedades posibles
    const diseases = ['PUTRID PLAGUE', 'EPIC WEAKNESS', 'MEDULAR APOCALYPSE'];

    // 3) Asignar enfermedad de forma aleatoria (por ejemplo, con 20% de probabilidad)
    for (const player of players) {
      // Generamos un número aleatorio entre 0 y 1
      const chance = Math.random();

      // Ejemplo: si es < 0.2 (20% de probabilidad), se enferma
      if (chance < 0.2) {
        // Escogemos una enfermedad al azar de la lista
        const randomIndex = Math.floor(Math.random() * diseases.length);
        const chosenDisease = diseases[randomIndex];

        // Asignamos la enfermedad
        player.disease = chosenDisease;

        // Guardamos cambios
        await player.save();

        console.log(`Player ${player.nickname} infected with ${chosenDisease}`);
      }
    }

    console.log('Random disease assignment completed.');
  } catch (error) {
    console.error('Error in randomDisease:', error);
  }
}
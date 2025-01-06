// cron/cronJobs.js
import cron from 'node-cron';
import { reduceResistance } from '../services/resistanceService.js';
import { randomDisease } from '../services/diseaseService.js';

export function scheduleCronJobs() {
  // Tarea 1: Cada 30 minutos → Reducir la resistencia en 10%
  // Formato CRON -> '*/30 * * * *' = cada 30 min
  // (Sintaxis: minuto hora diaDelMes mes diaDeLaSemana)
  cron.schedule('*/30 * * * *', async () => { 
    //(si quieres hacer pruebas con cron usar este)
    // cron.schedule('* * * * * *', async () => {
    console.log('[CRON] Reducing Resistance by 10% for all players...');
    await reduceResistance();
    // Cualquier otra lógica
  });

  // Tarea 2: Cada X minutos → Lanzar enfermedad aleatoria
  // Por ejemplo cada 2 horas -> '0 */2 * * *'
  cron.schedule('0 */2 * * *', async () => {
    //(si quieres hacer pruebas con cron usar este)
     //cron.schedule('* * * * * *', async () => {
    console.log('[CRON] Trigger random disease...');
    await randomDisease();
  });
}
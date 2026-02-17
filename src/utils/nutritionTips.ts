import { WorkoutType } from '../models/types';

export interface NutritionTip {
  title: string;
  timing: string;
  details: string[];
  duringRun?: string;
  afterRun?: string;
}

/**
 * Wissenschaftlich fundierte Ernaehrungstipps fuer Long Runs.
 *
 * Quellen:
 * - Jeukendrup (2014): Carbohydrate intake during exercise
 * - Thomas et al. (2016): ACSM Position Stand on Nutrition and Athletic Performance
 * - Pfitzinger "Advanced Marathoning": Kapitel 8 (Fueling the Marathon)
 * - Burke et al. (2011): Carbohydrates for training and competition
 */

export function getNutritionTips(
  workoutType: WorkoutType,
  distanceKm: number,
): NutritionTip | null {
  // Nur fuer Long Runs und MP Long Runs ab 16km
  if (workoutType === 'long' || workoutType === 'long_mp') {
    if (distanceKm >= 30) {
      return getLongRunTips30Plus(workoutType === 'long_mp');
    } else if (distanceKm >= 24) {
      return getLongRunTips24to30(workoutType === 'long_mp');
    } else if (distanceKm >= 16) {
      return getLongRunTips16to24();
    }
  }

  // Fuer kuerzere Workouts keine speziellen Ernaehrungstipps
  return null;
}

function getLongRunTips16to24(): NutritionTip {
  return {
    title: 'Ernaehrung: Long Run (16-24 km)',
    timing: 'Vorabend + Morgen',
    details: [
      'Vorabend: Kohlenhydratreiche Mahlzeit (Pasta, Reis, Kartoffeln)',
      '2-3h vor dem Lauf: 1-2g Kohlenhydrate pro kg Koerpergewicht',
      'Beispiel: Haferflocken mit Banane und Honig, oder Toast mit Marmelade',
      'Ausreichend trinken: 400-600ml in den 2h vor dem Start',
    ],
    duringRun: 'Ab 60 Min: 30-60g Kohlenhydrate pro Stunde (Gel, Iso-Drink oder Banane). Alle 15-20 Min kleine Schlucke Wasser.',
    afterRun: 'Innerhalb 30 Min: Kohlenhydrate + Protein (3:1 Verhaeltnis). Beispiel: Schokomilch, Banane + Joghurt, oder Recovery-Shake.',
  };
}

function getLongRunTips24to30(isMP: boolean): NutritionTip {
  return {
    title: isMP ? 'Ernaehrung: MP Long Run (24-30 km)' : 'Ernaehrung: Long Run (24-30 km)',
    timing: '24h vorher + Morgen',
    details: [
      '24h vorher: Kohlenhydratzufuhr erhoehen auf 7-8g/kg Koerpergewicht',
      'Vorabend: Grosse Portion Pasta/Reis + wenig Ballaststoffe und Fett',
      '2-3h vor dem Lauf: 2g Kohlenhydrate pro kg (z.B. 150g fuer 75kg)',
      'Beispiel-Fruehstueck: Grosses Porridge, Weissbrot mit Honig, Banane, Saft',
      'Kein neues Essen ausprobieren – nur Bewaehrtes verwenden!',
    ],
    duringRun: '60-90g Kohlenhydrate pro Stunde (2-3 Gels oder Mix aus Gel + Iso-Drink). Frueh anfangen (ab Km 5-8), nicht erst wenn du muede wirst! ' +
      (isMP ? 'Vor dem MP-Abschnitt nochmal Gel nehmen.' : ''),
    afterRun: 'Recovery-Fenster nutzen: Innerhalb 30 Min 1-1.2g Kohlenhydrate/kg + 0.3g Protein/kg. Weiter regelmaessig essen fuer 4h.',
  };
}

function getLongRunTips30Plus(isMP: boolean): NutritionTip {
  return {
    title: isMP ? 'Ernaehrung: MP Long Run (30+ km) – Renn-Simulation!' : 'Ernaehrung: Long Run (30+ km) – Renn-Vorbereitung!',
    timing: '48h vorher (Carb Loading!)',
    details: [
      'CARB LOADING: 48h vor dem Lauf Kohlenhydrate auf 8-10g/kg/Tag erhoehen',
      'Das bedeutet bei 75kg: 600-750g Kohlenhydrate pro Tag',
      'Beispiel-Tagesplan: Grosses Porridge + Banane, Pasta-Portion, Reis mit Huhn, Brot, Saft, Trockenobst',
      'Wenig Ballaststoffe, wenig Fett, wenig Protein – Platz fuer Kohlenhydrate!',
      '3h vor dem Lauf: 2-3g Kohlenhydrate/kg (150-225g fuer 75kg)',
      'WICHTIG: Nutze diesen Long Run als Generalprobe fuer die Race-Day-Ernaehrung',
    ],
    duringRun: '60-90g Kohlenhydrate pro Stunde – exakt wie am Race Day! Starte ab Km 5 mit dem ersten Gel. ' +
      'Trinke alle 15 Min. ' +
      (isMP ? 'Vor dem Marathon-Pace-Block: letztes Gel + Wasser. Danach alle 30 Min weiter fuellen.' : '') +
      ' Teste verschiedene Gels/Drinks JETZT – nicht erst am Renntag!',
    afterRun: 'Intensive Recovery: Sofort Kohlenhydrate + Protein (Shake, Schokomilch). ' +
      'Danach alle 2h kohlenhydratreiche Mahlzeiten fuer 6-8h. Viel trinken (Elektrolyte).',
  };
}

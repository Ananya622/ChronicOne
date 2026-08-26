/**
 * conditions-config.js
 * Centralized, extensible configuration for chronic conditions.
 * 
 * IMPORTANT ARCHITECTURE RULE:
 * This single configuration serves as the single source of truth for condition metadata,
 * recommended habits, and relevant biomarkers. No disease-specific HTML pages are used.
 */

const CONDITIONS_CONFIG = {
  diabetes: {
    id: 'diabetes',
    name: 'Diabetes',
    icon: '🩸',
    description: 'Blood glucose regulation, insulin & metabolic balance',
    recommendedHabits: ['medication', 'blood_glucose', 'exercise', 'diet', 'water'],
    relevantBiomarkers: [
      { id: 'fasting_glucose', name: 'Fasting Blood Glucose', unit: 'mg/dL', defaultTarget: '90-130' },
      { id: 'postprandial_glucose', name: 'Post-Meal Glucose', unit: 'mg/dL', defaultTarget: '< 180' }
    ],
    suggestedWidgets: ['glucose_trend', 'carb_tracker', 'daily_adherence']
  },

  hypertension: {
    id: 'hypertension',
    name: 'Hypertension',
    icon: '🫀',
    description: 'Cardiovascular pressure & blood flow stability',
    recommendedHabits: ['medication', 'blood_pressure', 'exercise', 'weight'],
    relevantBiomarkers: [
      { id: 'blood_pressure', name: 'Blood Pressure', unit: 'mmHg', defaultTarget: '< 120/80' },
      { id: 'resting_heart_rate', name: 'Resting Heart Rate', unit: 'bpm', defaultTarget: '60-80' }
    ],
    suggestedWidgets: ['bp_trend', 'sodium_tracker', 'daily_adherence']
  },

  asthma: {
    id: 'asthma',
    name: 'Asthma',
    icon: '🫁',
    description: 'Airway management, peak flow & environmental pacing',
    recommendedHabits: ['medication', 'symptoms', 'exercise', 'sleep'],
    relevantBiomarkers: [
      { id: 'peak_flow', name: 'Peak Flow', unit: 'L/min', defaultTarget: '> 450' },
      { id: 'spo2', name: 'Oxygen Saturation', unit: '%', defaultTarget: '95-100' }
    ],
    suggestedWidgets: ['peak_flow_meter', 'air_quality_radar', 'daily_adherence']
  },

  thyroid: {
    id: 'thyroid',
    name: 'Thyroid condition',
    icon: '🦋',
    description: 'Hormonal regulation, energy levels & metabolic pacing',
    recommendedHabits: ['medication', 'sleep', 'mood', 'weight'],
    relevantBiomarkers: [
      { id: 'body_temperature', name: 'Basal Temperature', unit: '°F', defaultTarget: '97.8-98.6' },
      { id: 'energy_score', name: 'Daily Energy Score', unit: '/10', defaultTarget: '> 7' }
    ],
    suggestedWidgets: ['energy_pacing', 'symptom_log', 'daily_adherence']
  },

  arthritis: {
    id: 'arthritis',
    name: 'Arthritis',
    icon: '🦴',
    description: 'Joint mobility, inflammation control & restorative pacing',
    recommendedHabits: ['medication', 'exercise', 'symptoms', 'diet'],
    relevantBiomarkers: [
      { id: 'pain_level', name: 'Pain Score', unit: '/10', defaultTarget: '< 3' },
      { id: 'mobility_minutes', name: 'Gentle Mobility', unit: 'mins', defaultTarget: '20' }
    ],
    suggestedWidgets: ['flare_up_radar', 'mobility_log', 'daily_adherence']
  }
};

/**
 * Master catalog of all available habit types in the application.
 */
const HABIT_CATALOG = [
  { id: 'medication', name: 'Medication', icon: '💊', category: 'Treatment', description: 'Take prescribed medication on schedule' },
  { id: 'blood_glucose', name: 'Blood Glucose', icon: '🩸', category: 'Biomarker', description: 'Check and record daily blood sugar' },
  { id: 'blood_pressure', name: 'Blood Pressure', icon: '🩺', category: 'Biomarker', description: 'Measure and record morning / evening BP' },
  { id: 'exercise', name: 'Exercise', icon: '🏃', category: 'Activity', description: 'Engage in gentle, prescribed physical movement' },
  { id: 'diet', name: 'Diet', icon: '🥗', category: 'Nutrition', description: 'Follow condition-appropriate nutrition goals' },
  { id: 'water', name: 'Water', icon: '💧', category: 'Hydration', description: 'Maintain target daily hydration' },
  { id: 'sleep', name: 'Sleep', icon: '😴', category: 'Rest', description: 'Achieve restful and restorative sleep' },
  { id: 'weight', name: 'Weight', icon: '⚖️', category: 'Biomarker', description: 'Track baseline body weight trends' },
  { id: 'mood', name: 'Mood', icon: '✨', category: 'Mental Health', description: 'Log emotional well-being and stress levels' },
  { id: 'symptoms', name: 'Symptoms', icon: '📋', category: 'Awareness', description: 'Record daily sensations, fatigue, or flare-ups' }
];

/**
 * Returns a deduplicated array of recommended habit IDs based on selected conditions.
 * @param {string[]} selectedConditionIds - Array of condition IDs (e.g. ['diabetes', 'hypertension'])
 * @returns {string[]} - Array of recommended habit IDs
 */
function getRecommendedHabitsForConditions(selectedConditionIds) {
  if (!selectedConditionIds || !Array.isArray(selectedConditionIds)) {
    return ['medication', 'exercise', 'diet'];
  }

  const recommendedSet = new Set();

  selectedConditionIds.forEach(condId => {
    const config = CONDITIONS_CONFIG[condId];
    if (config && config.recommendedHabits) {
      config.recommendedHabits.forEach(habitId => recommendedSet.add(habitId));
    }
  });

  // Default fallback if "Prefer not to say" or "Other" without specific recommendations
  if (recommendedSet.size === 0) {
    return ['medication', 'exercise', 'diet'];
  }

  return Array.from(recommendedSet);
}

// Export for browser environment
if (typeof window !== 'undefined') {
  window.CONDITIONS_CONFIG = CONDITIONS_CONFIG;
  window.HABIT_CATALOG = HABIT_CATALOG;
  window.getRecommendedHabitsForConditions = getRecommendedHabitsForConditions;
}

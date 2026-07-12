/**
 * Powerup Quiz Types — Fliq
 *
 * Defines the PowerupProfile shape, QUIZ_QUESTIONS constant, and helper types
 * used by the quiz screen, storage layer, and Gemini context injection.
 *
 * Strings are stored as i18n key paths (*Key fields). Consumers resolve them
 * at render time via useT(). IDs remain typed literals — they're semantic
 * tags used by the Gemini context builder, not UI labels.
 */

export interface PowerupProfile {
  texting_style: 'flirty' | 'witty' | 'chill' | 'deep' | null;
  attachment_style: 'secure' | 'anxious' | 'avoidant' | null;
  love_language: 'words_of_affirmation' | 'quality_time' | 'physical_touch' | 'acts_of_service' | 'gifts' | null;
  coaching_preference: 'warm' | 'balanced' | 'direct' | null;
  completed_at: string | null; // ISO timestamp
}

export const QUIZ_QUESTIONS = [
  {
    id: 'texting_style' as const,
    headlineKey: 'powerup.quiz.q1.headline',
    sublineKey:  'powerup.quiz.q1.subline',
    options: [
      { id: 'flirty', icon: 'zap',    labelKey: 'powerup.quiz.q1.options.flirty' },
      { id: 'witty',  icon: 'target', labelKey: 'powerup.quiz.q1.options.witty'  },
      { id: 'chill',  icon: 'anchor', labelKey: 'powerup.quiz.q1.options.chill'  },
      { id: 'deep',   icon: 'eye',    labelKey: 'powerup.quiz.q1.options.deep'   },
    ],
  },
  {
    id: 'attachment_style' as const,
    headlineKey: 'powerup.quiz.q2.headline',
    sublineKey:  'powerup.quiz.q2.subline',
    options: [
      { id: 'secure',   icon: 'shield',       labelKey: 'powerup.quiz.q2.options.secure'   },
      { id: 'anxious',  icon: 'alert-circle', labelKey: 'powerup.quiz.q2.options.anxious'  },
      { id: 'avoidant', icon: 'log-out',      labelKey: 'powerup.quiz.q2.options.avoidant' },
    ],
  },
  {
    id: 'love_language' as const,
    headlineKey: 'powerup.quiz.q3.headline',
    sublineKey:  'powerup.quiz.q3.subline',
    options: [
      { id: 'words_of_affirmation', icon: 'message-circle', labelKey: 'powerup.quiz.q3.options.words_of_affirmation' },
      { id: 'quality_time',         icon: 'clock',          labelKey: 'powerup.quiz.q3.options.quality_time'         },
      { id: 'physical_touch',       icon: 'heart',          labelKey: 'powerup.quiz.q3.options.physical_touch'       },
      { id: 'acts_of_service',      icon: 'tool',           labelKey: 'powerup.quiz.q3.options.acts_of_service'      },
      { id: 'gifts',                icon: 'gift',           labelKey: 'powerup.quiz.q3.options.gifts'                },
    ],
  },
  {
    id: 'coaching_preference' as const,
    headlineKey: 'powerup.quiz.q4.headline',
    sublineKey:  'powerup.quiz.q4.subline',
    options: [
      { id: 'warm',     icon: 'sun',         labelKey: 'powerup.quiz.q4.options.warm'     },
      { id: 'balanced', icon: 'sliders',     labelKey: 'powerup.quiz.q4.options.balanced' },
      { id: 'direct',   icon: 'trending-up', labelKey: 'powerup.quiz.q4.options.direct'   },
    ],
  },
] as const;

export type QuizAnswers = {
  [K in typeof QUIZ_QUESTIONS[number]['id']]?: string | null;
};

export const POINTS_MAPPING: Record<string, number> = {
  'Plástico': 100,
  'Papel': 80,
  'Vidro': 120,
  'Metal': 150,
  'Orgânico': 40,
  'Eletrônico': 250,
  'Não reciclável': 0,
};

export const WASTE_TYPES = [
  'Plástico',
  'Papel',
  'Vidro',
  'Metal',
  'Orgânico',
  'Eletrônico',
  'Não reciclável',
] as const;

export const DEPRECIATION_CONFIG = {
  GRACE_DAYS: 7,
  PHASES: {
    alert:      { minDays: 7,  maxDays: 13, vitalityLossPerDay: 15, coinsLossPct: 0,   pointsLossPct: 0   },
    decline:    { minDays: 14, maxDays: 20, vitalityForceZero: true, coinsLossPct: 0.30, pointsLossPct: 0.20 },
    collapse:   { minDays: 21, maxDays: 27, vitalityForceZero: true, coinsLossPct: 0.40, pointsLossPct: 0.30 },
    extinction: { minDays: 28, maxDays: Infinity, vitalityForceZero: true, coinsLossPct: 0.50, pointsLossPct: 0.50 },
  },
  LEGEND_IMMUNITY_DAYS: 30,
  // Itens removidos por fase (ordem de dependência invertida)
  COLLAPSE_ITEMS: [
    'monstro_lago', 'lixeiras', 'criancas', 'mae_human', 'placas_solares', 'casa',
    'barco_2', 'barco_1',
    'borboletas_4', 'borboletas_3', 'borboletas_2', 'borboletas',
    'passaro_3', 'passaro_2', 'passaro_1',
    'peixe_3', 'peixe_2', 'peixe_1',
    'cachorro', 'gato'
  ],
  EXTINCTION_ITEMS: [
    'arvore_3', 'arvore_2', 'arvore_1',
    'filtro_ar', 'limpar_rio', 'reparar_grama'
  ]
} as const;

export const ARTICLE_POINTS = 30;
export const QUIZ_POINTS = { easy: 30, medium: 45, hard: 60 } as const;
export const QUIZ_ERROR_PENALTY = 2;

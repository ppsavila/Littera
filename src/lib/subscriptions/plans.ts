export type Plan = 'free' | 'plus' | 'premium'

export interface PlanFeatures {
  aiAnalysis: boolean       // AI review/comparison on final grade
  studentInsights: boolean  // AI analysis across student's essays (Premium)
  whatsapp: boolean         // Send results via WhatsApp (Premium)
}

export interface PlanConfig {
  id: Plan
  name: string
  price: number              // BRL monthly
  dailyCorrections: number   // -1 = unlimited
  features: PlanFeatures
  badge?: {
    label: string
    color: string
    bg: string
  }
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Grátis',
    price: 0,
    dailyCorrections: 2,
    features: {
      aiAnalysis: false,
      studentInsights: false,
      whatsapp: false,
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 9.90,
    dailyCorrections: 10,
    features: {
      aiAnalysis: true,
      studentInsights: false,
      whatsapp: false,
    },
    badge: {
      label: 'Plus',
      color: '#7c3aed',
      bg: '#ede9fe',
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.90,
    dailyCorrections: -1,
    features: {
      aiAnalysis: true,
      studentInsights: true,
      whatsapp: true,
    },
    badge: {
      label: 'Premium',
      color: '#b45309',
      bg: '#fef3c7',
    },
  },
}

export function isUnlimited(plan: Plan): boolean {
  return PLANS[plan].dailyCorrections === -1
}

export function canAccess(plan: Plan, feature: keyof PlanFeatures): boolean {
  return PLANS[plan].features[feature]
}

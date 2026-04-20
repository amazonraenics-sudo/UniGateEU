export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  credits: number
  role: 'user' | 'admin'
  onboarding_completed: boolean
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  nationality: string | null
  degree_level: string | null
  field_of_study: string | null
  gpa: number | null
  language_score: string | null
  language_score_value: number | null
  target_countries: string[]
  budget_range: string | null
  start_date: string | null
  work_experience: number | null
  research_experience: boolean
  created_at: string
  updated_at: string
}

export interface University {
  id: string
  name: string
  country: string
  city: string
  ranking: number | null
  tuition_min: number | null
  tuition_max: number | null
  tuition_currency: string
  acceptance_rate: number | null
  programs: string[]
  language_requirements: Record<string, number>
  deadline_fall: string | null
  deadline_spring: string | null
  website: string | null
  description: string | null
  logo_url: string | null
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  university_id: string
  university?: University
  program: string
  status: 'researching' | 'preparing' | 'submitted' | 'accepted' | 'rejected' | 'waitlisted'
  deadline: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  name: string
  type: 'transcript' | 'recommendation' | 'sop' | 'cv' | 'language_test' | 'other'
  file_url: string | null
  file_size: number | null
  ai_analysis: string | null
  status: 'pending' | 'analyzing' | 'analyzed' | 'approved'
  created_at: string
  updated_at: string
}

export interface SOP {
  id: string
  user_id: string
  university_id: string | null
  university?: University
  program: string
  content: string
  critique: string | null
  score: number | null
  version: number
  created_at: string
  updated_at: string
}

export interface Scholarship {
  id: string
  name: string
  provider: string
  country: string
  amount: number | null
  currency: string
  deadline: string | null
  eligibility: string[]
  fields: string[]
  link: string | null
  description: string | null
  created_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  feature: string | null
  description: string
  stripe_payment_id: string | null
  created_at: string
}

export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  priceId: string
  popular?: boolean
}

export const CREDIT_COSTS = {
  university_match: 5,
  sop_generation: 10,
  sop_critique: 5,
  document_analysis: 8,
  scholarship_match: 5,
  interview_prep: 10,
  financial_aid: 3,
  visa_checklist: 3,
  document_checklist: 2,
} as const

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 20,
    price: 9,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
  },
  {
    id: 'standard',
    name: 'Standard',
    credits: 75,
    price: 29,
    priceId: process.env.STRIPE_STANDARD_PRICE_ID || '',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 200,
    price: 69,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  {
    id: 'elite',
    name: 'Elite',
    credits: 500,
    price: 149,
    priceId: process.env.STRIPE_ELITE_PRICE_ID || '',
  },
]

export const EUROPEAN_COUNTRIES = [
  'Germany',
  'France',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Switzerland',
  'Austria',
  'Ireland',
  'Belgium',
]

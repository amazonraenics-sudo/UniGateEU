'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Loader2, GraduationCap, Globe, DollarSign, Calendar } from 'lucide-react'

const COUNTRIES = ['Germany', 'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Austria', 'Ireland', 'Belgium']
const DEGREE_LEVELS = ["Bachelor's", "Master's", 'PhD', 'MBA']
const FIELDS = [
  'Computer Science',
  'Data Science',
  'Artificial Intelligence & Machine Learning',
  'Software Engineering',
  'Information Technology',
  'Cybersecurity',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biomedical Engineering',
  'Aerospace Engineering',
  'Environmental Engineering',
  'Industrial Engineering',
  'Medicine (MBBS/MD)',
  'Pharmacy',
  'Nursing',
  'Public Health',
  'Dentistry',
  'Biotechnology',
  'Business Administration (MBA)',
  'Finance & Banking',
  'Economics',
  'Accounting',
  'Marketing & Communications',
  'Entrepreneurship',
  'Supply Chain & Logistics',
  'Law (LLB/LLM)',
  'International Relations',
  'Political Science',
  'Public Policy & Administration',
  'Psychology',
  'Sociology',
  'Social Work',
  'Architecture',
  'Urban Planning',
  'Interior Design',
  'Biology & Life Sciences',
  'Chemistry',
  'Physics',
  'Mathematics & Statistics',
  'Environmental Science',
  'Agriculture & Food Science',
  'Veterinary Medicine',
  'Education & Teaching',
  'Linguistics & Literature',
  'History & Philosophy',
  'Fine Arts & Design',
  'Media & Film Studies',
  'Music & Performing Arts',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fieldSelectValue, setFieldSelectValue] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [form, setForm] = useState({
    nationality: '',
    degree_level: '',
    field_of_study: '',
    gpa: '',
    language_score: '',
    language_score_value: '',
    target_countries: [] as string[],
    budget_range: '',
    start_date: '',
    work_experience: '',
  })

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  const toggleCountry = (country: string) => {
    setForm(prev => ({
      ...prev,
      target_countries: prev.target_countries.includes(country)
        ? prev.target_countries.filter(c => c !== country)
        : [...prev.target_countries, country],
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      nationality: form.nationality,
      degree_level: form.degree_level,
      field_of_study: form.field_of_study,
      gpa: form.gpa ? parseFloat(form.gpa) : null,
      language_score: form.language_score || null,
      language_score_value: form.language_score_value ? parseFloat(form.language_score_value) : null,
      target_countries: form.target_countries,
      budget_range: form.budget_range || null,
      start_date: form.start_date || null,
      work_experience: form.work_experience ? parseInt(form.work_experience) : null,
      updated_at: new Date().toISOString(),
    })

    await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)

    if (error) {
      toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Profile saved!', description: 'Welcome to UniGateEU. You have 10 free credits to start.' })
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const steps = [
    { label: 'Background', icon: GraduationCap },
    { label: 'Preferences', icon: Globe },
    { label: 'Budget', icon: DollarSign },
    { label: 'Timeline', icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1E3A5F]">Setup Your Profile</h1>
          <p className="text-muted-foreground mt-2">Help us personalize your admissions journey</p>
        </div>

        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  i + 1 <= step ? 'bg-[#1E3A5F] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-sm hidden sm:block ${i + 1 <= step ? 'text-[#1E3A5F] font-medium' : 'text-gray-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 w-8 mx-2 ${i + 1 < step ? 'bg-[#1E3A5F]' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>
        <Progress value={(step / 4) * 100} className="h-2" />

        <Card>
          <CardHeader>
            <CardTitle>Step {step} of 4: {steps[step - 1].label}</CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about your academic background'}
              {step === 2 && 'Which countries interest you?'}
              {step === 3 && 'What is your budget range?'}
              {step === 4 && 'When do you plan to start?'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input placeholder="e.g. American" value={form.nationality} onChange={e => update('nationality', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree Level</Label>
                    <Select value={form.degree_level} onValueChange={v => update('degree_level', v)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{DEGREE_LEVELS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Select
                    value={fieldSelectValue}
                    onValueChange={v => {
                      setFieldSelectValue(v)
                      if (v !== '__other__') update('field_of_study', v)
                      else update('field_of_study', '')
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                    <SelectContent>
                      {FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      <SelectItem value="__other__">Other (please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldSelectValue === '__other__' && (
                    <Input
                      placeholder="Type your field of study..."
                      value={form.field_of_study}
                      onChange={e => update('field_of_study', e.target.value)}
                      autoFocus
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GPA (out of 4.0)</Label>
                    <Input type="number" step="0.01" min="0" max="4" placeholder="3.5" value={form.gpa} onChange={e => update('gpa', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Experience (years)</Label>
                    <Input type="number" min="0" placeholder="0" value={form.work_experience} onChange={e => update('work_experience', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Target Countries (select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {COUNTRIES.map(country => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => toggleCountry(country)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                          form.target_countries.includes(country)
                            ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#2E86C1]'
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language Test</Label>
                    <Select value={form.language_score} onValueChange={v => update('language_score', v)}>
                      <SelectTrigger><SelectValue placeholder="Select test..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IELTS">IELTS</SelectItem>
                        <SelectItem value="TOEFL">TOEFL</SelectItem>
                        <SelectItem value="Duolingo">Duolingo</SelectItem>
                        <SelectItem value="None">None yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Score</Label>
                    <Input type="number" step="0.5" placeholder="7.5" value={form.language_score_value} onChange={e => update('language_score_value', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label>Annual Budget Range (USD)</Label>
                <Select value={form.budget_range} onValueChange={v => update('budget_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select budget..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_10k">Under $10,000</SelectItem>
                    <SelectItem value="10k_20k">$10,000 – $20,000</SelectItem>
                    <SelectItem value="20k_30k">$20,000 – $30,000</SelectItem>
                    <SelectItem value="30k_50k">$30,000 – $50,000</SelectItem>
                    <SelectItem value="over_50k">Over $50,000</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-4">This includes tuition and living expenses. Many European universities have low or zero tuition fees.</p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Intended Start Date</Label>
                  <Select value={form.start_date} onValueChange={v => update('start_date', v)}>
                    <SelectTrigger><SelectValue placeholder="Select intake..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall_2025">Fall 2025</SelectItem>
                      <SelectItem value="spring_2026">Spring 2026</SelectItem>
                      <SelectItem value="fall_2026">Fall 2026</SelectItem>
                      <SelectItem value="spring_2027">Spring 2027</SelectItem>
                      <SelectItem value="fall_2027">Fall 2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800">You&apos;re almost done!</p>
                  <p className="text-sm text-blue-600 mt-1">After completing setup, you&apos;ll get <strong>10 free credits</strong> to start exploring universities and generating your SOP.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
                Back
              </Button>
              {step < 4 ? (
                <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1]" onClick={() => setStep(s => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1]" onClick={handleSubmit} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

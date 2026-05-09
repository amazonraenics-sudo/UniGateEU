'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Loader2, Copy, RotateCcw, MessageSquare } from 'lucide-react'
import { EUROPEAN_COUNTRIES } from '@/types'
import { createClient } from '@/lib/supabase/client'

const DEGREE_LEVELS = ["Bachelor's", "Master's", 'PhD', 'MBA']

function getDocType(degreeLevel: string) {
  return degreeLevel === "Bachelor's" ? 'Personal Statement' : 'Statement of Purpose'
}

export default function StatementPage() {
  const [university, setUniversity] = useState('')
  const [program, setProgram] = useState('')
  const [country, setCountry] = useState('')
  const [degreeLevel, setDegreeLevel] = useState('')
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState('')
  const [generated, setGenerated] = useState('')
  const [critique, setCritique] = useState('')
  const [loading, setLoading] = useState(false)
  const [critiquing, setCritiquing] = useState(false)
  const [customSop, setCustomSop] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('degree_level').eq('user_id', user.id).single().then(({ data }) => {
        if (data?.degree_level) setDegreeLevel(data.degree_level)
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const docType = degreeLevel ? getDocType(degreeLevel) : 'Statement'

  const handleGenerate = async () => {
    if (!program) { toast({ title: 'Please enter a program', variant: 'destructive' }); return }
    setLoading(true)
    setGenerated('')
    try {
      const res = await fetch('/api/ai/sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university, program, country, background, goals, degreeLevel, action: 'generate' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed')
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setGenerated(text)
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const handleCritique = async () => {
    const sopToReview = customSop || generated
    if (!sopToReview) { toast({ title: `Please generate or paste a ${docType} first`, variant: 'destructive' }); return }
    setCritiquing(true)
    setCritique('')
    try {
      const res = await fetch('/api/ai/sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sop: sopToReview, degreeLevel, action: 'critique' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed')
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setCritique(text)
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setCritiquing(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Statement</h1>
        <p className="text-muted-foreground">Generate and improve your {docType} with AI</p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generate {docType} (10 cr)</TabsTrigger>
          <TabsTrigger value="critique">Critique {docType} (5 cr)</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{docType} Details</CardTitle>
              <CardDescription>Provide information to generate a tailored statement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Degree Level</Label>
                <Select value={degreeLevel} onValueChange={setDegreeLevel}>
                  <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                  <SelectContent>
                    {DEGREE_LEVELS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {degreeLevel && (
                  <p className="text-xs text-muted-foreground">
                    Generating a <strong>{docType}</strong> for {degreeLevel} applicants.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University (optional)</Label>
                  <Input placeholder="e.g. TU Munich" value={university} onChange={e => setUniversity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Program *</Label>
                  <Input placeholder="e.g. MSc Computer Science" value={program} onChange={e => setProgram(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
                  <SelectContent>
                    {EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic & Professional Background</Label>
                <Textarea
                  placeholder="Describe your degree, GPA, work experience, research, skills..."
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Goals & Motivation</Label>
                <Textarea
                  placeholder="Why this program? What are your career goals? Why Europe?"
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2"
                onClick={handleGenerate}
                disabled={loading || !program}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Generating...' : `Generate ${docType}`}
              </Button>
            </CardContent>
          </Card>

          {generated && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated {docType}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(generated)}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setGenerated('')}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
                  {generated}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="critique" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Critique Your {docType}</CardTitle>
              <CardDescription>Paste your statement below or use the generated one above</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`Paste your ${docType.toLowerCase()} here...`}
                value={customSop || generated}
                onChange={e => setCustomSop(e.target.value)}
                rows={12}
              />
              <Button
                className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2"
                onClick={handleCritique}
                disabled={critiquing}
              >
                {critiquing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {critiquing ? 'Analyzing...' : 'Get AI Critique'}
              </Button>
            </CardContent>
          </Card>

          {critique && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">AI Critique & Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed text-blue-900">
                  {critique}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

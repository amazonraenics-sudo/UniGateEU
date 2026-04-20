'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Award, DollarSign, Calendar, ExternalLink } from 'lucide-react'
import { EUROPEAN_COUNTRIES } from '@/types'

const DEGREE_LEVELS = ['Bachelor', 'Master', 'PhD', 'MBA']
const FIELDS = ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law', 'Arts', 'Sciences', 'Other']

export default function ScholarshipsPage() {
  const [country, setCountry] = useState('all')
  const [degree, setDegree] = useState('all')
  const [field, setField] = useState('all')
  const [results, setResults] = useState<any[]>([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleMatch = async () => {
    setLoading(true)
    setSummary('')
    try {
      const res = await fetch('/api/ai/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: country === 'all' ? undefined : country,
          degree_level: degree === 'all' ? undefined : degree,
          field: field === 'all' ? undefined : field,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResults(data.scholarships || [])
      setSummary(data.summary || '')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Scholarships</h1>
        <p className="text-muted-foreground">AI-matched scholarships across Europe</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Degree" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Degrees</SelectItem>
                {DEGREE_LEVELS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Field" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleMatch} disabled={loading} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2 shrink-0">
              <Sparkles className="h-4 w-4" /> AI Match (5 cr)
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-blue-800 mb-1">AI Summary</p>
            <p className="text-sm text-blue-700">{summary}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((s: any, i: number) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <CardDescription>{s.provider} · {s.country}</CardDescription>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 shrink-0">
                    <Award className="h-3 w-3 mr-1" />
                    Scholarship
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{s.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {s.amount && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {s.currency} {s.amount?.toLocaleString()}
                    </span>
                  )}
                  {s.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Deadline: {s.deadline}
                    </span>
                  )}
                </div>
                {s.eligibility && s.eligibility.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Eligibility:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {s.eligibility.slice(0, 3).map((e: string, j: number) => (
                        <li key={j}>• {e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s.link && (
                  <a href={s.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#2E86C1] hover:underline">
                    Apply Now <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Use AI Match to discover scholarships tailored to your profile</p>
        </div>
      )}
    </div>
  )
}

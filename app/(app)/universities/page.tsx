'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Search, Sparkles, MapPin, Trophy, DollarSign } from 'lucide-react'
import { EUROPEAN_COUNTRIES } from '@/types'

const FIELDS = ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law', 'Arts', 'Sciences', 'Other']

export default function UniversitiesPage() {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('all')
  const [field, setField] = useState('all')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const { toast } = useToast()

  const handleAIMatch = async () => {
    setLoading(true)
    setAiSummary('')
    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: country === 'all' ? undefined : country, field: field === 'all' ? undefined : field, query }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResults(data.universities || [])
      setAiSummary(data.summary || '')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Find Universities</h1>
        <p className="text-muted-foreground">AI-powered matching across 10 European countries</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. top AI programs with low tuition..."
                className="pl-9"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAIMatch()}
              />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Field" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleAIMatch} disabled={loading} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2">
              <Sparkles className="h-4 w-4" />
              AI Match (5 cr)
            </Button>
          </div>
        </CardContent>
      </Card>

      {aiSummary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-800 font-medium mb-1">AI Analysis</p>
            <p className="text-sm text-blue-700">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </CardContent></Card>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((uni: any, i: number) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{uni.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {uni.city}, {uni.country}
                    </CardDescription>
                  </div>
                  {uni.match_score && (
                    <Badge className="bg-green-100 text-green-700 shrink-0">
                      {uni.match_score}% match
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{uni.description || uni.reason}</p>
                <div className="flex flex-wrap gap-2">
                  {uni.ranking && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Trophy className="h-3 w-3" /> Rank #{uni.ranking}
                    </div>
                  )}
                  {uni.tuition_min !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      {uni.tuition_min === 0 ? 'Free tuition' : `€${uni.tuition_min?.toLocaleString()}/yr`}
                    </div>
                  )}
                </div>
                {uni.programs && (
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(uni.programs) ? uni.programs : []).slice(0, 3).map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                )}
                {uni.website && (
                  <a href={uni.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#2E86C1] hover:underline">
                    Visit website →
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Find your perfect European university</p>
          <p className="text-sm text-muted-foreground mt-2">Use the AI Match button to get personalized recommendations</p>
        </div>
      )}
    </div>
  )
}

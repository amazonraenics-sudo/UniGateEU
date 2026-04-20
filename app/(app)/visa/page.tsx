'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Globe, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { EUROPEAN_COUNTRIES } from '@/types'

export default function VisaPage() {
  const [country, setCountry] = useState('')
  const [nationality, setNationality] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFetch = async () => {
    if (!country) { toast({ title: 'Please select a country', variant: 'destructive' }); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/visa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, nationality }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Visa Guide</h1>
        <p className="text-muted-foreground">Country-specific student visa requirements</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select destination country..." /></SelectTrigger>
              <SelectContent>
                {EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex-1">
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Your nationality (optional)"
                value={nationality}
                onChange={e => setNationality(e.target.value)}
              />
            </div>
            <Button onClick={handleFetch} disabled={loading || !country} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2 shrink-0">
              <Sparkles className="h-4 w-4" /> Get Guide (3 cr)
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card><CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </CardContent></Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#1E3A5F]" />
                <CardTitle>Student Visa Guide — {result.country}</CardTitle>
              </div>
              <CardDescription>{result.visa_type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.overview && (
                <p className="text-sm text-muted-foreground">{result.overview}</p>
              )}
            </CardContent>
          </Card>

          {result.requirements && (
            <Card>
              <CardHeader><CardTitle className="text-base">Required Documents</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.process && (
            <Card>
              <CardHeader><CardTitle className="text-base">Application Process</CardTitle></CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {result.process.map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#1E3A5F] text-white text-xs shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {result.tips && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader><CardTitle className="text-base text-blue-800 flex items-center gap-2"><Info className="h-4 w-4" /> Important Tips</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.tips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.timeline && (
            <Card>
              <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result.timeline}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!loading && !result && (
        <div className="text-center py-16">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a country to get your personalized visa guide</p>
        </div>
      )}
    </div>
  )
}

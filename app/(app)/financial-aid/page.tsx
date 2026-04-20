'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Calculator, DollarSign, TrendingDown } from 'lucide-react'
import { EUROPEAN_COUNTRIES } from '@/types'

export default function FinancialAidPage() {
  const [country, setCountry] = useState('')
  const [budget, setBudget] = useState('')
  const [degree, setDegree] = useState('')
  const [savingsUSD, setSavingsUSD] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCalculate = async () => {
    if (!country || !budget) {
      toast({ title: 'Please fill country and budget', variant: 'destructive' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/financial-aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, budget, degree_level: degree, savings_usd: savingsUSD }),
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
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Financial Aid Calculator</h1>
        <p className="text-muted-foreground">Estimate costs and find financial support options</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Calculator</CardTitle>
          <CardDescription>3 credits — get a personalized financial breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Destination Country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
                <SelectContent>{EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Degree Level</Label>
              <Select value={degree} onValueChange={setDegree}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bachelor">Bachelor</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Annual Budget (USD) *</Label>
              <Input type="number" placeholder="e.g. 15000" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Total Savings (USD)</Label>
              <Input type="number" placeholder="e.g. 30000" value={savingsUSD} onChange={e => setSavingsUSD(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCalculate} disabled={loading || !country || !budget} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2">
            <Calculator className="h-4 w-4" />
            {loading ? 'Calculating...' : 'Calculate (3 cr)'}
          </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" /> Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.breakdown && Object.entries(result.breakdown).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium">{typeof val === 'number' ? `€${val.toLocaleString()}` : val}</span>
                  </div>
                ))}
                {result.total_annual && (
                  <div className="flex items-center justify-between border-t pt-2 mt-2">
                    <span className="font-medium">Total Annual</span>
                    <span className="font-bold text-lg">€{result.total_annual.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {result.assessment && (
              <Card className={result.feasible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-4 pb-4">
                  <p className={`text-sm font-medium ${result.feasible ? 'text-green-800' : 'text-red-800'}`}>
                    {result.feasible ? '✓ Budget is feasible' : '⚠ Budget may be insufficient'}
                  </p>
                  <p className={`text-sm mt-1 ${result.feasible ? 'text-green-700' : 'text-red-700'}`}>
                    {result.assessment}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {result.savings_tips && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-blue-500" /> Money-Saving Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.savings_tips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-blue-500 shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.funding_options && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Funding Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.funding_options.map((opt: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />
                        {opt}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {!loading && !result && (
        <div className="text-center py-16">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Enter your details to get a personalized financial breakdown</p>
        </div>
      )}
    </div>
  )
}

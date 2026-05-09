'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { EUROPEAN_COUNTRIES } from '@/types'

interface ChecklistItem {
  name: string
  required: boolean
  notes: string
  checked: boolean
}

export default function DocumentChecklistPage() {
  const [program, setProgram] = useState('')
  const [university, setUniversity] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!program) { toast({ title: 'Enter a program', variant: 'destructive' }); return }
    setLoading(true)
    setChecklist([])
    try {
      const res = await fetch('/api/ai/document-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university, program, country }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate checklist')
      setChecklist((data.checklist || []).map((item: Omit<ChecklistItem, 'checked'>) => ({ ...item, checked: false })))
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const toggleItem = (i: number) => {
    setChecklist(prev => prev.map((item, idx) => idx === i ? { ...item, checked: !item.checked } : item))
  }

  const required = checklist.filter(i => i.required)
  const optional = checklist.filter(i => !i.required)
  const checkedCount = checklist.filter(i => i.checked).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Document Checklist</h1>
        <p className="text-muted-foreground">AI-generated application document checklist — track what you need</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Checklist</CardTitle>
          <CardDescription>2 credits — tailored to your program and destination</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Program / Degree *</Label>
              <Input placeholder="e.g. MSc Computer Science" value={program} onChange={e => setProgram(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>University (optional)</Label>
              <Input placeholder="e.g. TU Delft" value={university} onChange={e => setUniversity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Country (optional)</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Any country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any country</SelectItem>
                  {EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading || !program} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? 'Generating...' : 'Generate Checklist (2 cr)'}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </CardContent>
        </Card>
      )}

      {checklist.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{checkedCount} of {checklist.length} items checked off</p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                {checkedCount} done
              </Badge>
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                {checklist.length - checkedCount} remaining
              </Badge>
            </div>
          </div>

          {required.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" /> Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {required.map((item, i) => {
                  const globalIdx = checklist.findIndex(c => c === item)
                  return (
                    <button
                      key={i}
                      onClick={() => toggleItem(globalIdx)}
                      className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                        item.checked ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {item.checked
                        ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        : <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.name}
                        </p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 text-red-600 border-red-200">Required</Badge>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {optional.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Optional Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optional.map((item, i) => {
                  const globalIdx = checklist.findIndex(c => c === item)
                  return (
                    <button
                      key={i}
                      onClick={() => toggleItem(globalIdx)}
                      className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                        item.checked ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {item.checked
                        ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        : <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.name}
                        </p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">Optional</Badge>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && checklist.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Enter your program details to generate a personalized document checklist</p>
        </div>
      )}
    </div>
  )
}

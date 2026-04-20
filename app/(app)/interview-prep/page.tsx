'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Mic, ChevronRight, Send, Star } from 'lucide-react'

export default function InterviewPrepPage() {
  const [program, setProgram] = useState('')
  const [university, setUniversity] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQ, setSelectedQ] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const { toast } = useToast()

  const handleGetQuestions = async () => {
    if (!program) { toast({ title: 'Enter a program', variant: 'destructive' }); return }
    setLoading(true)
    setQuestions([])
    setSelectedQ(null)
    setFeedback('')
    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program, university }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setQuestions(data.questions || [])
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const handleEvaluate = async () => {
    if (!selectedQ || !answer) { toast({ title: 'Select a question and write your answer', variant: 'destructive' }); return }
    setEvaluating(true)
    setFeedback('')
    try {
      const res = await fetch('/api/ai/evaluate-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: selectedQ, answer, program }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setFeedback(data.feedback)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setEvaluating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Interview Prep</h1>
        <p className="text-muted-foreground">AI-powered mock interviews with personalized feedback</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Interview Questions</CardTitle>
          <CardDescription>10 credits — tailored to your program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Program *</Label>
              <Input placeholder="e.g. MSc Computer Science" value={program} onChange={e => setProgram(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>University (optional)</Label>
              <Input placeholder="e.g. TU Delft" value={university} onChange={e => setUniversity(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleGetQuestions} disabled={loading || !program} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? 'Generating...' : 'Get Questions (10 cr)'}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <Card><CardContent className="pt-6 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent></Card>
      )}

      {questions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="h-4 w-4" /> Interview Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedQ(q); setAnswer(''); setFeedback('') }}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-colors flex items-start gap-2 ${
                      selectedQ === q ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Badge variant="outline" className={`shrink-0 ${selectedQ === q ? 'border-white text-white' : ''}`}>Q{i + 1}</Badge>
                    <span className="flex-1">{q}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedQ ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your Answer</CardTitle>
                    <CardDescription className="text-sm">{selectedQ}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Type your answer here..."
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      rows={8}
                    />
                    <Button onClick={handleEvaluate} disabled={evaluating || !answer} className="gap-2">
                      <Send className="h-4 w-4" />
                      {evaluating ? 'Evaluating...' : 'Get AI Feedback'}
                    </Button>
                  </CardContent>
                </Card>

                {feedback && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-base text-green-800 flex items-center gap-2">
                        <Star className="h-4 w-4" /> AI Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-green-800 whitespace-pre-wrap">{feedback}</div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Mic className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Select a question to practice your answer</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="text-center py-16">
          <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Generate personalized interview questions for your program</p>
        </div>
      )}
    </div>
  )
}

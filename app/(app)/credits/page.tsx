'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Zap, CheckCircle2, Coins } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { CREDIT_COSTS } from '@/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PACKS = [
  { id: 'starter', name: 'Starter', credits: 20, price: 9, priceId: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'price_1THkODRsnieV0MaAR0LIbHqm' : '' },
  { id: 'standard', name: 'Standard', credits: 75, price: 29, popular: true, priceId: 'price_1THkQJRsnieV0MaAfCBtgnWq' },
  { id: 'pro', name: 'Pro', credits: 200, price: 69, priceId: 'price_1THkS6RsnieV0MaAAh36U7og' },
  { id: 'elite', name: 'Elite', credits: 500, price: 149, priceId: 'price_1THkTlRsnieV0MaANba7gH0S' },
]

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleBuy = async (priceId: string, packId: string) => {
    setLoading(packId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')

      const stripe = await stripePromise
      if (stripe && data.sessionId) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(null)
  }

  const creditCostEntries = Object.entries(CREDIT_COSTS)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Buy Credits</h1>
        <p className="text-muted-foreground">One-time purchase — no subscriptions, no recurring fees</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PACKS.map(pack => (
          <Card
            key={pack.id}
            className={`relative ${pack.popular ? 'border-[#2E86C1] shadow-lg' : ''}`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#2E86C1] text-white">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pt-6">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Coins className={`h-6 w-6 ${pack.popular ? 'text-[#2E86C1]' : 'text-yellow-500'}`} />
              </div>
              <CardTitle className="text-xl">{pack.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">${pack.price}</span>
                <span className="text-muted-foreground text-sm"> one-time</span>
              </div>
              <CardDescription className="text-lg font-semibold text-[#1E3A5F] mt-1">
                {pack.credits} Credits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                ${(pack.price / pack.credits).toFixed(2)} per credit
              </div>
              <Button
                className={`w-full gap-2 ${pack.popular ? 'bg-[#2E86C1] hover:bg-[#1E3A5F]' : 'bg-[#1E3A5F] hover:bg-[#2E86C1]'}`}
                onClick={() => handleBuy(pack.priceId, pack.id)}
                disabled={loading === pack.id}
              >
                {loading === pack.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Zap className="h-4 w-4" />
                }
                {loading === pack.id ? 'Processing...' : 'Buy Now'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Costs by Feature</CardTitle>
          <CardDescription>See how many credits each AI feature costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {creditCostEntries.map(([feature, cost]) => (
              <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm capitalize">{feature.replace(/_/g, ' ')}</span>
                </div>
                <Badge variant="outline" className="font-medium">
                  {cost} credits
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E3A5F] text-white border-0">
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-lg font-semibold mb-2">New users get 10 free credits</p>
          <p className="text-blue-200 text-sm">Enough to run 2 university matches or document checklists</p>
        </CardContent>
      </Card>
    </div>
  )
}

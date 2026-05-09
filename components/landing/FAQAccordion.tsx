'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Who is UniGateEU for?',
    a: "UniGateEU is built for international students who want to study in Europe — whether you're applying for a Bachelor's, Master's, or PhD program. If you're navigating university applications, visas, scholarships, or just figuring out where to start, this platform was made for you.",
  },
  {
    q: 'Is it really free to get started?',
    a: 'Yes. Every new account gets 10 free credits with no credit card required. That\'s enough to explore university matches, generate a document checklist, or get visa requirements for your target country.',
  },
  {
    q: 'Which European countries does UniGateEU cover?',
    a: 'We cover all major European study destinations including Germany, France, the Netherlands, Spain, Italy, Sweden, Norway, Denmark, Poland, and more — including both EU and non-EU countries.',
  },
  {
    q: 'How does the university matching work?',
    a: 'You fill in your profile — field of study, budget, preferred countries, and academic background. Our matching tool then finds universities that fit your specific situation and explains why each one is a good match.',
  },
  {
    q: 'Can UniGateEU help with undergraduate applications?',
    a: "Yes. Whether you're applying for a Bachelor's, Master's, or PhD, the tools work for all degree levels. The Statement generator adapts to your level — Personal Statement for undergrads, Statement of Purpose for postgrads.",
  },
  {
    q: 'What are credits and how do I get more?',
    a: 'Credits are used each time you run a tool. Different tools cost different amounts (visa guide costs 3 credits, SOP generation costs 10). You can buy credit packs starting from $9, or earn free credits when you refer a friend (coming soon).',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Yes. Your data is stored securely and never shared with universities or third parties without your consent. We use it only to personalise your experience on the platform.',
  },
  {
    q: 'Can I use UniGateEU on my phone?',
    a: 'Absolutely. UniGateEU is fully responsive and works on any device — phone, tablet, or desktop.',
  },
  {
    q: 'What if I run out of credits?',
    a: 'You can top up anytime from the Credits page. Packs start at $9 for 20 credits. If a tool fails for any reason, your credits are automatically refunded.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Your 10 free signup credits are your trial — no time limit, no credit card needed. Use them however you like to explore the platform.',
  },
]

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i))

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-white/50 text-lg">Everything you need to know before you start.</p>
        </div>

        <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className={`transition-colors ${isOpen ? 'bg-white/[0.06]' : 'bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-base leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#2E86C1] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

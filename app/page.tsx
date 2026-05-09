import Link from 'next/link'
import {
  University, FileText, Award, Globe, Mic, Calculator,
  CheckCircle2, Zap, ArrowRight, Coins, Sparkles, Star,
  User, Search, PenLine, Banknote, ClipboardList, Send,
} from 'lucide-react'

const FEATURES = [
  {
    icon: University,
    title: 'University Match',
    desc: 'Find your best-fit European universities across 10 countries based on your GPA, budget, and goals.',
    cost: '5 credits',
    color: 'bg-blue-500',
  },
  {
    icon: FileText,
    title: 'SOP Generator',
    desc: 'Craft a compelling, personalised Statement of Purpose — then get expert feedback to perfect it.',
    cost: '10 credits',
    color: 'bg-purple-500',
  },
  {
    icon: Award,
    title: 'Scholarship Finder',
    desc: 'Discover DAAD, Erasmus+, and dozens of country-specific scholarships matched to your profile.',
    cost: '5 credits',
    color: 'bg-yellow-500',
  },
  {
    icon: Globe,
    title: 'Visa Guide',
    desc: 'Get a step-by-step student visa breakdown for any European country, personalised to your nationality.',
    cost: '3 credits',
    color: 'bg-green-500',
  },
  {
    icon: Mic,
    title: 'Interview Prep',
    desc: 'Practice with realistic interview questions and get scored, detailed feedback on every answer.',
    cost: '10 credits',
    color: 'bg-red-500',
  },
  {
    icon: Calculator,
    title: 'Financial Aid',
    desc: 'Calculate your full cost of study — tuition, housing, living expenses — and find funding to cover it.',
    cost: '3 credits',
    color: 'bg-orange-500',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Create your profile',
    desc: 'Tell us your academic background, target countries, budget, and goals. Takes under 2 minutes.',
  },
  {
    number: '02',
    title: 'Use our tools',
    desc: 'Run university matches, generate your SOP, find scholarships, and prep for interviews — all in one place.',
  },
  {
    number: '03',
    title: 'Apply with confidence',
    desc: 'Track your applications, organise your documents, and submit knowing every part of your application is strong.',
  },
]

const JOURNEY = [
  {
    icon: User,
    color: 'bg-blue-500',
    label: 'Step 1',
    title: 'Maria sets up her profile',
    story: 'Maria, 22, from Nigeria, just finished her BSc in Computer Science with a 3.7 GPA. She opens UniGateEU, answers a few questions about her background, preferred countries, and a €12,000/year budget.',
    outcome: 'Profile created in 90 seconds.',
  },
  {
    icon: Search,
    color: 'bg-purple-500',
    label: 'Step 2',
    title: 'She gets matched with 8 universities',
    story: 'Based on her profile, she receives a ranked list of 8 universities — TU Delft, KTH Stockholm, TU Munich, and five more — each with a match score, tuition breakdown, and application deadline.',
    outcome: '8 universities, ranked by fit.',
  },
  {
    icon: PenLine,
    color: 'bg-yellow-500',
    label: 'Step 3',
    title: 'Her SOP is ready in minutes',
    story: 'Maria enters her target program and university. Within seconds she has a full first draft — personalised to TU Delft\'s MSc Computer Science program. She runs the critique tool and gets three specific improvements.',
    outcome: 'Draft + feedback in under 3 minutes.',
  },
  {
    icon: Banknote,
    color: 'bg-green-500',
    label: 'Step 4',
    title: 'She discovers 3 scholarships she qualifies for',
    story: 'The scholarship finder surfaces the Orange Tulip Scholarship (Netherlands), DAAD Development Scholarship, and the Holland Scholarship — all open to Nigerian students in STEM with her GPA.',
    outcome: 'Up to €15,000 in potential funding.',
  },
  {
    icon: Globe,
    color: 'bg-red-500',
    label: 'Step 5',
    title: 'Visa requirements, sorted',
    story: 'Maria picks Germany as her top choice and gets a tailored checklist — blocked account requirement (€11,208), health insurance, appointment booking timeline, and tips specific to Nigerian applicants.',
    outcome: 'Clear visa roadmap, no guesswork.',
  },
  {
    icon: Send,
    color: 'bg-orange-500',
    label: 'Step 6',
    title: 'She submits with confidence',
    story: 'Two months later, Maria\'s applications are in. She used the document checklist to make sure nothing was missing, and the interview prep tool to practice for TU Delft\'s admission interview.',
    outcome: 'Applications submitted. Offer received.',
  },
]

const PACKS = [
  { name: 'Starter', credits: 20, price: 9, desc: 'Try every feature' },
  { name: 'Standard', credits: 75, price: 29, desc: 'Most popular', popular: true },
  { name: 'Pro', credits: 200, price: 69, desc: 'Serious applicants' },
  { name: 'Elite', credits: 500, price: 149, desc: 'Full application season' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1923] text-white">

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="border-b border-white/10 sticky top-0 z-50 bg-[#0f1923]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2E86C1] flex items-center justify-center">
              <University className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">UniGateEU</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-[#2E86C1] hover:bg-[#1E3A5F] transition-colors px-4 py-2 rounded-lg font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#2E86C1]/20 blur-3xl" />
          <div className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1E3A5F]/30 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">10 free credits on signup — no card required</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Your Smart Gateway<br className="hidden sm:block" />
            <span className="text-[#2E86C1]"> to European Universities</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/60 leading-relaxed mb-10">
            UniGateEU helps international students find universities, craft their SOP, discover scholarships,
            and navigate visas — everything in one place, built around your profile.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#2E86C1] hover:bg-[#1a6fa8] transition-all px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-[#2E86C1]/25 hover:shadow-[#2E86C1]/40 hover:scale-105"
            >
              <Zap className="h-5 w-5" />
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 transition-all px-8 py-4 rounded-xl font-semibold text-lg"
            >
              Sign In
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4 text-white/40 text-sm">
            {['Germany', 'Netherlands', 'France', 'Sweden', 'Switzerland', 'Ireland'].map(c => (
              <span key={c} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2E86C1]" /> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to get accepted</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Six tools covering every stage of your European university application.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all hover:-translate-y-1"
                >
                  <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs bg-white/10 border border-white/10 rounded-full px-3 py-1 text-white/60">
                    <Coins className="h-3 w-3" /> {f.cost}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-white/50 text-lg">From profile to acceptance in three steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-[#2E86C1]/50 to-transparent" />
            {STEPS.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1E3A5F] border border-[#2E86C1]/30 mb-6 mx-auto">
                  <span className="text-2xl font-black text-[#2E86C1]">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENT JOURNEY ─────────────────────────────── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">See how it works</h2>
            <p className="text-white/50 text-lg">Follow Maria&apos;s journey from first search to submitted application.</p>
          </div>

          {/* Student intro card */}
          <div className="flex items-center gap-4 bg-[#1E3A5F]/60 border border-[#2E86C1]/30 rounded-2xl p-5 mb-12">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2E86C1] to-purple-600 flex items-center justify-center shrink-0 text-2xl font-black">
              M
            </div>
            <div>
              <p className="font-semibold text-lg">Maria, 22 — Nigeria</p>
              <p className="text-white/50 text-sm">BSc Computer Science · GPA 3.7 · Budget €12,000/yr · Target: Germany &amp; Netherlands</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#2E86C1]/60 via-[#2E86C1]/30 to-transparent" />

            <div className="space-y-8">
              {JOURNEY.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="relative flex gap-6">
                    {/* Icon node on the line */}
                    <div className={`relative z-10 w-12 h-12 ${item.color} rounded-xl flex items-center justify-center shrink-0 shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all hover:-translate-y-0.5 mb-2">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-[#2E86C1] bg-[#2E86C1]/10 border border-[#2E86C1]/20 rounded-full px-2.5 py-0.5">
                          {item.label}
                        </span>
                        <h3 className="font-semibold text-base">{item.title}</h3>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed mb-3">{item.story}</p>
                      <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {item.outcome}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#2E86C1] hover:bg-[#1a6fa8] transition-all px-7 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-[#2E86C1]/25 hover:scale-105"
            >
              <Zap className="h-4 w-4" />
              Start your journey — it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple credit pricing</h2>
            <p className="text-white/50 text-lg">Buy once, use anytime. No subscriptions, no recurring fees.</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-12">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium text-sm">Start free with 10 credits — no credit card required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PACKS.map(pack => (
              <div
                key={pack.name}
                className={`relative rounded-2xl p-6 border transition-all hover:-translate-y-1 ${
                  pack.popular
                    ? 'bg-[#2E86C1] border-[#2E86C1] shadow-xl shadow-[#2E86C1]/25'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-[#0f1923] text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <p className={`text-sm font-medium mb-1 ${pack.popular ? 'text-white/80' : 'text-white/50'}`}>{pack.desc}</p>
                  <p className="text-2xl font-bold">{pack.name}</p>
                </div>
                <div className="mb-5">
                  <span className="text-4xl font-extrabold">${pack.price}</span>
                  <span className={`text-sm ml-1 ${pack.popular ? 'text-white/70' : 'text-white/40'}`}>one-time</span>
                </div>
                <div className={`flex items-center gap-2 mb-5 p-3 rounded-xl ${pack.popular ? 'bg-white/20' : 'bg-white/5'}`}>
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="font-semibold">{pack.credits} credits</span>
                </div>
                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-xl font-medium text-sm transition-all ${
                    pack.popular
                      ? 'bg-white text-[#2E86C1] hover:bg-white/90'
                      : 'bg-white/10 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-white/30 text-sm mt-8">
            ${(9 / 20).toFixed(2)}–${(149 / 500).toFixed(2)} per credit · Secure payments via Stripe
          </p>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-br from-[#1E3A5F] to-[#0f1923]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#2E86C1]" />
            <span className="text-white/70 text-sm font-medium">Built for students, by people who care</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to start your European journey?</h2>
          <p className="text-white/50 text-lg mb-8">Join students applying to universities across Europe. Your first 10 credits are free.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#2E86C1] hover:bg-[#1a6fa8] transition-all px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-[#2E86C1]/25 hover:scale-105"
          >
            <Zap className="h-5 w-5" />
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2E86C1] flex items-center justify-center">
              <University className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold">UniGateEU</span>
            <span className="text-white/30 text-sm ml-1">· EU Admissions Platform</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <Link href="/register" className="hover:text-white transition-colors">Features</Link>
          </div>

          <p className="text-white/30 text-sm flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#2E86C1]" />
            Built for students, by people who care
          </p>
        </div>
      </footer>

    </div>
  )
}

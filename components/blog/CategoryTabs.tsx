'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['All', 'Tips & Guides', 'University Spotlights', 'Visa & Immigration', 'Scholarships', 'Student Life']

export default function CategoryTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('category') || 'All'

  const select = (cat: string) => {
    const params = new URLSearchParams()
    if (cat !== 'All') params.set('category', cat)
    router.push(`/blog${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => select(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === cat
              ? 'bg-[#1E3A5F] text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2E86C1] hover:text-[#2E86C1]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

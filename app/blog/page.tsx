import { Suspense } from 'react'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { University, ArrowRight, Calendar, User } from 'lucide-react'
import CategoryTabs from '@/components/blog/CategoryTabs'

const CATEGORY_COLORS: Record<string, string> = {
  'Tips & Guides':        'bg-blue-100 text-blue-700',
  'University Spotlights':'bg-purple-100 text-purple-700',
  'Visa & Immigration':   'bg-green-100 text-green-700',
  'Scholarships':         'bg-yellow-100 text-yellow-800',
  'Student Life':         'bg-orange-100 text-orange-700',
  'General':              'bg-gray-100 text-gray-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function BlogGrid({ category }: { category?: string }) {
  const supabase = createServiceClient()
  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, author, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data: posts } = await query

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">No posts in this category yet.</p>
        <p className="text-sm mt-2">Check back soon.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
        >
          <div className="p-6 flex flex-col flex-1">
            <div className="mb-3">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS['General']}`}>
                {post.category}
              </span>
            </div>
            <h2 className="font-bold text-gray-900 text-lg leading-snug mb-3 group-hover:text-[#2E86C1] transition-colors line-clamp-2">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">{post.excerpt}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-4 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />{post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{formatDate(post.created_at)}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#2E86C1] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: { category?: string } }) {
  const category = searchParams?.category

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2E86C1] flex items-center justify-center">
              <University className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-[#1E3A5F]">UniGateEU</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-[#1E3A5F] px-3 py-1.5">Sign In</Link>
            <Link href="/register" className="text-sm bg-[#1E3A5F] hover:bg-[#2E86C1] text-white transition-colors px-4 py-2 rounded-lg font-medium">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-[#1E3A5F] text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">UniGateEU Blog</h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">
            Guides, tips, and insights to help international students navigate the European university application process.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Suspense>
            <CategoryTabs />
          </Suspense>
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        }>
          <BlogGrid category={category} />
        </Suspense>
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-gray-100 py-12 mt-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[#1E3A5F] mb-3">Ready to start your European application?</h2>
          <p className="text-gray-500 mb-6">10 free credits on signup. No credit card required.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#2E86C1] text-white transition-colors px-6 py-3 rounded-xl font-semibold"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

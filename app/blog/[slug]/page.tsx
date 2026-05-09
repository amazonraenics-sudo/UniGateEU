import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, User, Clock, University, ArrowRight } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  'Tips & Guides':        'bg-blue-100 text-blue-700',
  'University Spotlights':'bg-purple-100 text-purple-700',
  'Visa & Immigration':   'bg-green-100 text-green-700',
  'Scholarships':         'bg-yellow-100 text-yellow-800',
  'Student Life':         'bg-orange-100 text-orange-700',
  'General':              'bg-gray-100 text-gray-700',
}

function readTime(content: string) {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-4" />

    // Bold headings: **text**
    const boldPattern = /\*\*(.+?)\*\*/g
    const parts: React.ReactNode[] = []
    let last = 0
    let match

    if (boldPattern.test(line)) {
      boldPattern.lastIndex = 0
      while ((match = boldPattern.exec(line)) !== null) {
        if (match.index > last) parts.push(line.slice(last, match.index))
        parts.push(<strong key={match.index} className="font-bold text-gray-900">{match[1]}</strong>)
        last = match.index + match[0].length
      }
      if (last < line.length) parts.push(line.slice(last))
      const isHeading = line.trimStart().startsWith('**') && line.trimEnd().endsWith('**')
      return isHeading
        ? <h2 key={i} className="text-xl font-bold text-[#1E3A5F] mt-8 mb-3">{parts}</h2>
        : <p key={i} className="text-gray-700 leading-relaxed mb-2">{parts}</p>
    }

    // Bullet points
    if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
      return (
        <li key={i} className="text-gray-700 leading-relaxed ml-4 list-disc mb-1">
          {line.replace(/^[\s\-•]+/, '')}
        </li>
      )
    }

    return <p key={i} className="text-gray-700 leading-relaxed mb-4">{line}</p>
  })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = createServiceClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  const minutes = readTime(post.content)

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

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#2E86C1] hover:text-[#1E3A5F] mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <header className="mb-10">
          <div className="mb-4">
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS['General']}`}>
              {post.category}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A5F] leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 pb-8 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {formatDate(post.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {minutes} min read
            </span>
          </div>

          {post.excerpt && (
            <p className="text-gray-500 text-lg leading-relaxed mt-6 italic border-l-4 border-[#2E86C1] pl-4">
              {post.excerpt}
            </p>
          )}
        </header>

        <div className="prose-container text-base">
          {renderContent(post.content)}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-[#1E3A5F] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to start your European application?</h2>
          <p className="text-blue-200 mb-6 text-sm">
            UniGateEU gives you university matching, SOP generation, scholarship search, and visa guides — all in one place. Start with 10 free credits.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#2E86C1] hover:bg-white hover:text-[#1E3A5F] text-white transition-colors px-6 py-3 rounded-xl font-semibold"
          >
            Start Your Application <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  )
}

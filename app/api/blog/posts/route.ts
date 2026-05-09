import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const adminView = searchParams.get('admin') === 'true'

  if (adminView) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ posts: data })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, author, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data })
}

export async function POST(request: Request) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, slug, excerpt, content, category, author, published } = body
  if (!title || !slug || !content) {
    return NextResponse.json({ error: 'title, slug, and content are required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({ title, slug, excerpt, content, category, author, published: published ?? false })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

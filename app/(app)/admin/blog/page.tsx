'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react'

const CATEGORIES = ['Tips & Guides', 'University Spotlights', 'Visa & Immigration', 'Scholarships', 'Student Life', 'General']

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  author: string
  published: boolean
  created_at: string
}

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '',
  category: 'Tips & Guides', author: 'UniGateEU Team', published: false,
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [aiTopic, setAiTopic] = useState('')
  const [aiCategory, setAiCategory] = useState('Tips & Guides')
  const [aiAudience, setAiAudience] = useState('')
  const [generating, setGenerating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/blog/posts?admin=true')
    const data = await res.json()
    setPosts(data.posts || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const update = (key: string, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }))

  const openNew = () => {
    setForm(emptyForm)
    setEditingId(null)
    setDialogOpen(true)
  }

  const openEdit = (post: Post) => {
    setForm({
      title: post.title, slug: post.slug, excerpt: post.excerpt || '',
      content: post.content, category: post.category, author: post.author,
      published: post.published,
    })
    setEditingId(post.id)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.content) {
      toast({ title: 'Title, slug, and content are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const url = editingId ? `/api/blog/posts/${editingId}` : '/api/blog/posts'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    } else {
      toast({ title: editingId ? 'Post updated' : 'Post created' })
      setDialogOpen(false)
      fetchPosts()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    setDeleting(id)
    const res = await fetch(`/api/blog/posts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Post deleted' })
      setPosts(prev => prev.filter(p => p.id !== id))
    } else {
      toast({ title: 'Error deleting post', variant: 'destructive' })
    }
    setDeleting(null)
    setDeleteConfirm(null)
  }

  const handleGenerate = async () => {
    if (!aiTopic) { toast({ title: 'Enter a topic', variant: 'destructive' }); return }
    setGenerating(true)
    const res = await fetch('/api/ai/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: aiTopic, category: aiCategory, target_audience: aiAudience }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    } else {
      setForm({
        title: data.title || aiTopic,
        slug: data.suggested_slug || slugify(aiTopic),
        excerpt: data.excerpt || '',
        content: data.content || '',
        category: aiCategory,
        author: 'UniGateEU Team',
        published: false,
      })
      setEditingId(null)
      setAiDialogOpen(false)
      setDialogOpen(true)
      toast({ title: 'Post generated — review and publish' })
    }
    setGenerating(false)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Blog Posts</h1>
          <p className="text-muted-foreground">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setAiDialogOpen(true)}>
            <Sparkles className="h-4 w-4 text-purple-500" /> Generate with AI
          </Button>
          <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86C1]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No posts yet. Create your first post!</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{post.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{post.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {post.published
                      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1"><Eye className="h-3 w-3" />Published</Badge>
                      : <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 gap-1"><EyeOff className="h-3 w-3" />Draft</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(post.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(post)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className={deleteConfirm === post.id ? 'border-red-400 text-red-600 hover:bg-red-50' : ''}
                      >
                        {deleting === post.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={e => {
                    update('title', e.target.value)
                    if (!editingId) update('slug', slugify(e.target.value))
                  }}
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="url-friendly-slug" />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={form.author} onChange={e => update('author', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.published ? 'published' : 'draft'} onValueChange={v => update('published', v === 'published')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt} onChange={e => update('excerpt', e.target.value)} placeholder="Short summary shown on blog cards..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Content * (use **bold text** for headings)</Label>
              <Textarea value={form.content} onChange={e => update('content', e.target.value)} placeholder="Full post content..." rows={16} className="font-mono text-xs" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1]" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI generation dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" /> Generate Post with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Enter a topic and Claude will write a full 800–1,200 word blog post. Costs 5 credits.</p>
            <div className="space-y-2">
              <Label>Topic / Title *</Label>
              <Input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. How to apply to Dutch universities without IELTS" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={aiCategory} onValueChange={setAiCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Audience (optional)</Label>
              <Input value={aiAudience} onChange={e => setAiAudience(e.target.value)} placeholder="e.g. African students applying for Masters in Europe" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Cancel</Button>
              <Button className="bg-purple-600 hover:bg-purple-700 gap-2" onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? 'Generating...' : 'Generate Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

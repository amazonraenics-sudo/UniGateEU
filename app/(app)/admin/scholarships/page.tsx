'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EUROPEAN_COUNTRIES } from '@/types'

const EMPTY = {
  name: '', provider: '', country: 'Germany', amount: '',
  currency: 'EUR', deadline: '', description: '', link: '',
  eligibility: '', fields: '',
}

export default function AdminScholarshipsPage() {
  const [scholarships, setScholarships] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }
    const { data } = await supabase.from('scholarships').select('*').order('name')
    setScholarships(data || [])
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const field = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (s: any) => {
    setEditing(s)
    setForm({
      name: s.name, provider: s.provider, country: s.country,
      amount: s.amount?.toString() || '', currency: s.currency || 'EUR',
      deadline: s.deadline || '', description: s.description || '',
      link: s.link || '',
      eligibility: s.eligibility?.join(', ') || '',
      fields: s.fields?.join(', ') || '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.provider) { toast({ title: 'Name and provider are required', variant: 'destructive' }); return }
    setSaving(true)
    const payload = {
      name: form.name, provider: form.provider, country: form.country,
      amount: form.amount ? parseInt(form.amount) : null,
      currency: form.currency,
      deadline: form.deadline || null,
      description: form.description || null,
      link: form.link || null,
      eligibility: form.eligibility ? form.eligibility.split(',').map(s => s.trim()).filter(Boolean) : [],
      fields: form.fields ? form.fields.split(',').map(s => s.trim()).filter(Boolean) : [],
    }
    const { error } = editing
      ? await supabase.from('scholarships').update(payload).eq('id', editing.id)
      : await supabase.from('scholarships').insert(payload)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: editing ? 'Scholarship updated!' : 'Scholarship added!' })
      setOpen(false)
      fetchData()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('scholarships').delete().eq('id', id)
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }) }
    else { toast({ title: 'Scholarship deleted' }); fetchData() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Scholarships</h1>
          <p className="text-muted-foreground">{scholarships.length} scholarships in database</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2">
          <Plus className="h-4 w-4" /> Add Scholarship
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Scholarships</CardTitle></CardHeader>
        <CardContent>
          {scholarships.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No scholarships yet. Add the first one above.</p>
          ) : (
            <div className="space-y-3">
              {scholarships.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.provider}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline">{s.country}</Badge>
                    {s.amount && <span className="text-sm font-medium">€{s.amount.toLocaleString()}</span>}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(s.id, s.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Scholarship' : 'Add Scholarship'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Scholarship Name *</Label>
              <Input placeholder="e.g. DAAD Scholarship" value={form.name} onChange={field('name')} />
            </div>
            <div className="space-y-2">
              <Label>Provider / Organization *</Label>
              <Input placeholder="e.g. DAAD" value={form.provider} onChange={field('provider')} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={form.country} onValueChange={v => setForm(p => ({ ...p, country: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe">Europe (all)</SelectItem>
                  {EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (EUR)</Label>
              <Input type="number" placeholder="e.g. 15000" value={form.amount} onChange={field('amount')} />
            </div>
            <div className="space-y-2">
              <Label>Application Deadline</Label>
              <Input placeholder="e.g. March 15, 2026" value={form.deadline} onChange={field('deadline')} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Eligibility (comma-separated)</Label>
              <Input placeholder="e.g. International students, GPA 3.5+" value={form.eligibility} onChange={field('eligibility')} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Fields of Study (comma-separated)</Label>
              <Input placeholder="e.g. Computer Science, Engineering" value={form.fields} onChange={field('fields')} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Website / Application Link</Label>
              <Input type="url" placeholder="https://scholarship.org" value={form.link} onChange={field('link')} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="Brief description..." value={form.description} onChange={field('description')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1]" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Scholarship'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EUROPEAN_COUNTRIES } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMPTY = {
  name: '', country: 'Germany', city: '', ranking: '', tuition_min: '0',
  tuition_max: '', acceptance_rate: '', website: '', description: '',
  programs: '', deadline_fall: '', deadline_spring: '',
}

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }
    const { data } = await supabase.from('universities').select('*').order('name')
    setUniversities(data || [])
  }

  useEffect(() => { fetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const field = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (u: any) => {
    setEditing(u)
    setForm({
      name: u.name, country: u.country, city: u.city,
      ranking: u.ranking?.toString() || '',
      tuition_min: u.tuition_min?.toString() || '0',
      tuition_max: u.tuition_max?.toString() || '',
      acceptance_rate: u.acceptance_rate?.toString() || '',
      website: u.website || '', description: u.description || '',
      programs: u.programs?.join(', ') || '',
      deadline_fall: u.deadline_fall || '', deadline_spring: u.deadline_spring || '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.city) { toast({ title: 'Name and city are required', variant: 'destructive' }); return }
    setSaving(true)
    const payload = {
      name: form.name, country: form.country, city: form.city,
      ranking: form.ranking ? parseInt(form.ranking) : null,
      tuition_min: parseInt(form.tuition_min) || 0,
      tuition_max: form.tuition_max ? parseInt(form.tuition_max) : null,
      tuition_currency: 'EUR',
      acceptance_rate: form.acceptance_rate ? parseFloat(form.acceptance_rate) : null,
      website: form.website || null, description: form.description || null,
      programs: form.programs ? form.programs.split(',').map(p => p.trim()).filter(Boolean) : [],
      deadline_fall: form.deadline_fall || null, deadline_spring: form.deadline_spring || null,
    }
    const { error } = editing
      ? await supabase.from('universities').update(payload).eq('id', editing.id)
      : await supabase.from('universities').insert(payload)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: editing ? 'University updated!' : 'University added!' })
      setOpen(false)
      fetch()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('universities').delete().eq('id', id)
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }) }
    else { toast({ title: 'University deleted' }); fetch() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Universities</h1>
          <p className="text-muted-foreground">{universities.length} universities in database</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2">
          <Plus className="h-4 w-4" /> Add University
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Universities</CardTitle></CardHeader>
        <CardContent>
          {universities.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No universities yet. Add the first one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Country</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Ranking</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Tuition</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {universities.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{u.name}</td>
                      <td className="py-3"><Badge variant="outline">{u.country}</Badge></td>
                      <td className="py-3">{u.ranking ? `#${u.ranking}` : '—'}</td>
                      <td className="py-3">
                        {u.tuition_min === 0 ? 'Free' : u.tuition_min ? `€${u.tuition_min.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(u.id, u.name)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit University' : 'Add University'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Name *</Label>
              <Input placeholder="e.g. TU Delft" value={form.name} onChange={field('name')} />
            </div>
            <div className="space-y-2">
              <Label>Country *</Label>
              <Select value={form.country} onValueChange={v => setForm(p => ({ ...p, country: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EUROPEAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input placeholder="e.g. Delft" value={form.city} onChange={field('city')} />
            </div>
            <div className="space-y-2">
              <Label>World Ranking</Label>
              <Input type="number" placeholder="e.g. 57" value={form.ranking} onChange={field('ranking')} />
            </div>
            <div className="space-y-2">
              <Label>Acceptance Rate (%)</Label>
              <Input type="number" placeholder="e.g. 35" value={form.acceptance_rate} onChange={field('acceptance_rate')} />
            </div>
            <div className="space-y-2">
              <Label>Tuition Min (EUR/yr)</Label>
              <Input type="number" placeholder="0 for free" value={form.tuition_min} onChange={field('tuition_min')} />
            </div>
            <div className="space-y-2">
              <Label>Tuition Max (EUR/yr)</Label>
              <Input type="number" placeholder="e.g. 15000" value={form.tuition_max} onChange={field('tuition_max')} />
            </div>
            <div className="space-y-2">
              <Label>Fall Deadline</Label>
              <Input placeholder="e.g. January 15" value={form.deadline_fall} onChange={field('deadline_fall')} />
            </div>
            <div className="space-y-2">
              <Label>Spring Deadline</Label>
              <Input placeholder="e.g. October 1" value={form.deadline_spring} onChange={field('deadline_spring')} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Programs (comma-separated)</Label>
              <Input placeholder="e.g. MSc Computer Science, MSc Data Science" value={form.programs} onChange={field('programs')} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Website</Label>
              <Input type="url" placeholder="https://university.edu" value={form.website} onChange={field('website')} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="Brief description..." value={form.description} onChange={field('description')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1]" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add University'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, MapPin, Calendar, Trash2 } from 'lucide-react'

const STATUSES = ['researching', 'preparing', 'submitted', 'accepted', 'rejected', 'waitlisted']
const STATUS_COLORS: Record<string, string> = {
  researching: 'bg-gray-100 text-gray-700',
  preparing: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  waitlisted: 'bg-orange-100 text-orange-700',
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ university_name: '', country: '', program: '', status: 'researching', deadline: '', notes: '' })
  const { toast } = useToast()
  const supabase = createClient()

  const fetchApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('applications').select('*, university:universities(name, country, city)').eq('user_id', user.id).order('created_at', { ascending: false })
    setApplications(data || [])
  }

  useEffect(() => { fetchApplications() }, [])

  const handleAdd = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('applications').insert({
      user_id: user.id,
      program: form.program,
      status: form.status,
      deadline: form.deadline || null,
      notes: form.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Application added!' })
      setOpen(false)
      setForm({ university_name: '', country: '', program: '', status: 'researching', deadline: '', notes: '' })
      fetchApplications()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('applications').delete().eq('id', id)
    fetchApplications()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchApplications()
  }

  const grouped = STATUSES.reduce((acc, status) => {
    acc[status] = applications.filter(a => a.status === status)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Applications</h1>
          <p className="text-muted-foreground">Track your university applications</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1] gap-2">
              <Plus className="h-4 w-4" /> Add Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Program / Degree</Label>
                <Input placeholder="e.g. MSc Computer Science" value={form.program} onChange={e => setForm(p => ({ ...p, program: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Any notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <Button className="w-full bg-[#1E3A5F]" onClick={handleAdd} disabled={loading || !form.program}>
                Add Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">No applications yet. Add your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STATUSES.filter(s => grouped[s].length > 0).map(status => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={STATUS_COLORS[status]}>{status}</Badge>
                <span className="text-sm text-muted-foreground">{grouped[status].length}</span>
              </div>
              <div className="space-y-3">
                {grouped[status].map(app => (
                  <Card key={app.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{app.program}</p>
                          {app.university && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{app.university.name}
                            </p>
                          )}
                          {app.deadline && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />{new Date(app.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button onClick={() => handleDelete(app.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Select value={app.status} onValueChange={v => handleStatusChange(app.id, v)}>
                        <SelectTrigger className="mt-3 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

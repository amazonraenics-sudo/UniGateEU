'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [credits, setCredits] = useState('')
  const [role, setRole] = useState('user')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }
    const res = await fetch('/api/admin/users')
    if (res.ok) { const data = await res.json(); setUsers(data.users || []) }
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (u: any) => {
    setEditing(u)
    setCredits(u.credits?.toString() || '0')
    setRole(u.role || 'user')
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editing.id, credits: parseInt(credits), role }),
    })
    if (res.ok) {
      toast({ title: 'User updated!' })
      setOpen(false)
      fetchData()
    } else {
      const data = await res.json()
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Users</h1>
        <p className="text-muted-foreground">{users.length} registered users</p>
      </div>

      <Card>
        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Credits</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Joined</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Edit</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{u.full_name || '—'}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3 font-medium">{u.credits ?? 0}</td>
                    <td className="py-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>{u.role}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User — {editing?.full_name || editing?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-muted-foreground">
              {editing?.email}
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" min="0" value={credits} onChange={e => setCredits(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#1E3A5F] hover:bg-[#2E86C1]" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

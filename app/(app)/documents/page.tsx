'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, Sparkles, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const DOC_TYPES = ['transcript', 'recommendation', 'sop', 'cv', 'language_test', 'other']

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-gray-400" />,
  analyzing: <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />,
  analyzed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  approved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [docType, setDocType] = useState('transcript')
  const { toast } = useToast()
  const supabase = createClient()

  const fetchDocs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setDocuments(data || [])
  }

  useEffect(() => { fetchDocs() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const filePath = `${user.id}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' })
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath)

    const { error } = await supabase.from('documents').insert({
      user_id: user.id,
      name: file.name,
      type: docType,
      file_url: publicUrl,
      file_size: file.size,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      toast({ title: 'Error saving document', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Document uploaded!' })
      fetchDocs()
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleAnalyze = async (docId: string, docName: string, fileUrl: string) => {
    setAnalyzing(docId)
    try {
      const res = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, documentName: docName, fileUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      toast({ title: 'Analysis complete!' })
      fetchDocs()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setAnalyzing(null)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('documents').delete().eq('id', id)
    fetchDocs()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Documents</h1>
        <p className="text-muted-foreground">Upload and analyze your application documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Supports PDF, DOC, DOCX files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
            <label className="flex-1">
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleUpload} disabled={uploading} />
              <Button variant="outline" className="w-full gap-2" disabled={uploading} asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map(doc => (
          <Card key={doc.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    {statusIcon[doc.status]}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{doc.type.replace('_', ' ')} · {doc.status}</p>
                  {doc.file_size && (
                    <p className="text-xs text-muted-foreground">{(doc.file_size / 1024).toFixed(0)} KB</p>
                  )}

                  {doc.ai_analysis && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-800 mb-1">AI Analysis</p>
                      <p className="text-xs text-green-700 line-clamp-3">{doc.ai_analysis}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {doc.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => handleAnalyze(doc.id, doc.name, doc.file_url)}
                        disabled={analyzing === doc.id}
                      >
                        <Sparkles className="h-3 w-3" />
                        {analyzing === doc.id ? 'Analyzing...' : 'Analyze (8 cr)'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No documents yet. Upload your first document above.</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Schema = {
  params?: any
  requestSchema?: any
  requestExample?: any
  responses?: any
  errors?: any
}

interface SchemaEditorProps {
  initial: Schema
  generated?: Schema | null
  onGenerate?: () => Promise<Schema | null>
  onSave: (data: Schema) => Promise<void>
}

export function SchemaEditor({ initial, generated, onGenerate, onSave }: SchemaEditorProps) {
  const [requestStr, setRequestStr] = useState<string>('')
  const [responsesStr, setResponsesStr] = useState<string>('')
  const [errorsStr, setErrorsStr] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [gen, setGen] = useState<Schema | null>(generated || null)
  const [tab, setTab] = useState<'request' | 'responses' | 'errors'>('request')

  useEffect(() => {
    setRequestStr(JSON.stringify({ params: initial?.params || {}, body: initial?.requestExample || null }, null, 2))
    setResponsesStr(JSON.stringify(initial?.responses || {}, null, 2))
    setErrorsStr(JSON.stringify(initial?.errors || [], null, 2))
  }, [initial])

  useEffect(() => {
    if (generated) setGen(generated)
  }, [generated])

  const isValidJson = (str: string) => {
    try { JSON.parse(str); return true } catch { return false }
  }

  const canSave = isValidJson(requestStr) && isValidJson(responsesStr) && isValidJson(errorsStr)

  const handleMergeFromGenerated = () => {
    if (!gen) return
    try {
      if (gen.requestExample || gen.params) {
        const current = JSON.parse(requestStr)
        const merged = { ...current, ...(gen.requestExample ? { body: gen.requestExample } : {}), ...(gen.params ? { params: gen.params } : {}) }
        setRequestStr(JSON.stringify(merged, null, 2))
      }
      if (gen.responses) setResponsesStr(JSON.stringify(gen.responses, null, 2))
      if (gen.errors) setErrorsStr(JSON.stringify(gen.errors, null, 2))
    } catch {}
  }

  const handleGenerate = async () => {
    if (!onGenerate) return
    const result = await onGenerate()
    if (result) setGen(result)
  }

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const req = JSON.parse(requestStr)
      const resps = JSON.parse(responsesStr)
      const errs = JSON.parse(errorsStr)
      await onSave({
        params: req?.params,
        requestExample: req?.body,
        responses: resps,
        errors: errs
      })
    } finally {
      setSaving(false)
    }
  }

  const diffBadge = (current: any, edited: string) => {
    try {
      const editedObj = JSON.parse(edited)
      const curStr = JSON.stringify(current ?? null)
      const editStr = JSON.stringify(editedObj ?? null)
      return curStr === editStr ? null : <span className="ml-2 text-[10px] px-1 rounded bg-yellow-200 text-yellow-900">changed</span>
    } catch { return <span className="ml-2 text-[10px] px-1 rounded bg-red-200 text-red-900">invalid</span> }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={!onGenerate}>Generate</Button>
          <Button variant="outline" size="sm" onClick={handleMergeFromGenerated} disabled={!gen}>Merge from Generated</Button>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!canSave || saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="request">Request {diffBadge({ params: initial?.params, body: initial?.requestExample }, requestStr)}</TabsTrigger>
          <TabsTrigger value="responses">Responses {diffBadge(initial?.responses, responsesStr)}</TabsTrigger>
          <TabsTrigger value="errors">Errors {diffBadge(initial?.errors, errorsStr)}</TabsTrigger>
        </TabsList>
        <TabsContent value="request" className="space-y-2">
          <div className="text-xs text-muted-foreground">Edit object with keys: params, body</div>
          <Textarea value={requestStr} onChange={(e) => setRequestStr(e.target.value)} className="h-56 font-mono" />
        </TabsContent>
        <TabsContent value="responses">
          <Textarea value={responsesStr} onChange={(e) => setResponsesStr(e.target.value)} className="h-56 font-mono" />
        </TabsContent>
        <TabsContent value="errors">
          <Textarea value={errorsStr} onChange={(e) => setErrorsStr(e.target.value)} className="h-56 font-mono" />
        </TabsContent>
      </Tabs>
      {gen && (
        <div className="text-xs text-muted-foreground">Generated preview available. Use "Merge from Generated" to apply.</div>
      )}
    </div>
  )
}



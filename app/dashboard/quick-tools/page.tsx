'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check } from 'lucide-react'

export default function QuickToolsPage() {
  const [jsonInput, setJsonInput] = useState('')
  const [jsonOutput, setJsonOutput] = useState('')
  const [base64Input, setBase64Input] = useState('')
  const [base64Output, setBase64Output] = useState('')
  const [uuidOutput, setUuidOutput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonOutput(JSON.stringify(parsed, null, 2))
    } catch (error) {
      setJsonOutput('Invalid JSON')
    }
  }

  const encodeBase64 = () => {
    try {
      const encoded = btoa(base64Input)
      setBase64Output(encoded)
    } catch (error) {
      setBase64Output('Encoding error')
    }
  }

  const decodeBase64 = () => {
    try {
      const decoded = atob(base64Input)
      setBase64Output(decoded)
    } catch (error) {
      setBase64Output('Decoding error')
    }
  }

  const generateUUID = () => {
    const uuid = crypto.randomUUID()
    setUuidOutput(uuid)
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Quick Tools</h1>
        <p className="text-sm text-muted-foreground">Essential utilities</p>
      </div>

      <Tabs defaultValue="json" className="space-y-6">
        <TabsList className="bg-transparent border-b border-border/40 rounded-none h-auto p-0 w-full justify-start gap-6">
          <TabsTrigger 
            value="json"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            JSON Formatter
          </TabsTrigger>
          <TabsTrigger 
            value="base64"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            Base64
          </TabsTrigger>
          <TabsTrigger 
            value="uuid"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            UUID
          </TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Input
              </div>
              <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
                <Textarea
                  placeholder='{"key":"value","array":[1,2,3]}'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={15}
                  className="font-mono text-sm bg-background/50"
                />
                <Button onClick={formatJSON} size="sm" className="w-full">
                  Format JSON
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Output
              </div>
              <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
                <Textarea
                  value={jsonOutput}
                  readOnly
                  rows={15}
                  className="font-mono text-sm bg-background/50"
                  placeholder="Formatted JSON will appear here..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(jsonOutput, 'json')}
                  disabled={!jsonOutput}
                  className="w-full"
                >
                  {copied === 'json' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="base64" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Input
              </div>
              <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
                <Textarea
                  placeholder="Enter text to encode or base64 to decode"
                  value={base64Input}
                  onChange={(e) => setBase64Input(e.target.value)}
                  rows={12}
                  className="font-mono text-sm bg-background/50"
                />
                <div className="flex gap-2">
                  <Button onClick={encodeBase64} size="sm" className="flex-1">
                    Encode
                  </Button>
                  <Button onClick={decodeBase64} size="sm" variant="outline" className="flex-1 bg-transparent">
                    Decode
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Output
              </div>
              <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
                <Textarea
                  value={base64Output}
                  readOnly
                  rows={12}
                  className="font-mono text-sm bg-background/50"
                  placeholder="Result will appear here..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(base64Output, 'base64')}
                  disabled={!base64Output}
                  className="w-full"
                >
                  {copied === 'base64' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="uuid" className="mt-0">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
              <Button onClick={generateUUID} size="sm" className="w-full">
                Generate UUID
              </Button>
              {uuidOutput && (
                <div className="rounded-lg border border-border/40 bg-background/50 p-4">
                  <code className="text-sm font-mono">{uuidOutput}</code>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(uuidOutput, 'uuid')}
                disabled={!uuidOutput}
                className="w-full"
              >
                {copied === 'uuid' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" /> Copy UUID
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

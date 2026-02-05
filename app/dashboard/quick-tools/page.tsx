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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quick Tools</h1>
        <p className="text-muted-foreground">Essential utilities for everyday development</p>
      </div>

      <Tabs defaultValue="json">
        <TabsList>
          <TabsTrigger value="json">JSON Formatter</TabsTrigger>
          <TabsTrigger value="base64">Base64 Encoder/Decoder</TabsTrigger>
          <TabsTrigger value="uuid">UUID Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="json">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Input JSON</CardTitle>
                <CardDescription>Paste your JSON here</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder='{"key":"value","array":[1,2,3]}'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
                <Button onClick={formatJSON} className="w-full">
                  Format JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formatted Output</CardTitle>
                <CardDescription>Beautified JSON</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={jsonOutput}
                  readOnly
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Formatted JSON will appear here..."
                />
                <Button
                  variant="outline"
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="base64">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Input</CardTitle>
                <CardDescription>Text to encode/decode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter text to encode or base64 to decode"
                  value={base64Input}
                  onChange={(e) => setBase64Input(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={encodeBase64} className="flex-1">
                    Encode
                  </Button>
                  <Button onClick={decodeBase64} variant="outline" className="flex-1 bg-transparent">
                    Decode
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>Result</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={base64Output}
                  readOnly
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Result will appear here..."
                />
                <Button
                  variant="outline"
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uuid">
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle>UUID Generator</CardTitle>
              <CardDescription>Generate a random UUID v4</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateUUID} className="w-full">
                Generate UUID
              </Button>
              {uuidOutput && (
                <div className="rounded-lg border bg-muted p-4">
                  <code className="text-sm font-mono">{uuidOutput}</code>
                </div>
              )}
              <Button
                variant="outline"
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

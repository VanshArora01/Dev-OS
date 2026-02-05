'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send } from 'lucide-react'

export default function APITesterPage() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState('')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    setLoading(true)
    try {
      const headersObj: Record<string, string> = {}
      if (headers) {
        headers.split('\n').forEach((line) => {
          const [key, value] = line.split(':').map((s) => s.trim())
          if (key && value) headersObj[key] = value
        })
      }

      const options: RequestInit = {
        method,
        headers: headersObj,
      }

      if (method !== 'GET' && method !== 'HEAD' && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const data = await res.text()
      
      setResponse(
        JSON.stringify(
          {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body: data,
          },
          null,
          2
        )
      )
    } catch (error: any) {
      setResponse(JSON.stringify({ error: error.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Tester</h1>
        <p className="text-muted-foreground">Test and debug your API endpoints</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
            <CardDescription>Configure your API request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="w-32">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
            </div>

            <Tabs defaultValue="headers">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
              </TabsList>
              <TabsContent value="headers" className="space-y-2">
                <Label>Headers (key: value per line)</Label>
                <Textarea
                  placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  rows={8}
                />
              </TabsContent>
              <TabsContent value="body" className="space-y-2">
                <Label>Request Body</Label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                />
              </TabsContent>
            </Tabs>

            <Button onClick={handleSend} disabled={!url || loading} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>API response will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={response}
              readOnly
              placeholder="Send a request to see the response..."
              rows={20}
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

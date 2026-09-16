import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Key, Copy, Check, Terminal, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function APIAccess() {
  const [copied, setCopied] = useState(false);
  const apiKey = "climx_live_51Pq3H2J9kL0v7X4m8n2qWp5";

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-8 max-w-[1200px] mx-auto">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
          <Code2 className="w-8 h-8" />
          Developer Portal
        </h1>
        <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Build custom resilience tools with our robust API</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <Key className="w-4 h-4" /> Your Secret Key
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] font-bold uppercase tracking-widest">Production</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative flex items-center bg-black rounded-xl border border-white/10 p-4 font-mono text-sm overflow-hidden">
                  <span className="flex-1 text-white pr-10 truncate">{apiKey}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    className="absolute right-2 text-white/40 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-white/30 italic flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Never share this key in client-side code. Use environment variables.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Quickstart Guide
              </CardTitle>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-8 font-mono text-xs text-white/80 overflow-x-auto leading-relaxed">
                <code>{`# 1. Authenticate your request
curl -X POST https://api.climx.ai/v1/evaluate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "coordinates": [[lng, lat], [lng, lat], [lng, lat], [lng, lat]],
    "hazard": "flood",
    "year": 2050,
    "infra": "power_grid"
  }'

# 2. Response: 202 Accepted (Polling URL returned)
{
  "request_id": "eval_4fG92...",
  "status_url": "/v1/results/eval_4fG92..."
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="glass-panel-strong p-8 rounded-3xl space-y-6 border-white/10">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Core Endpoints</h3>
            <div className="space-y-4">
              <EndpointItem method="GET" path="/v1/projects" desc="List all your infra projects" />
              <EndpointItem method="POST" path="/v1/evaluate" desc="Trigger AI risk simulation" />
              <EndpointItem method="GET" path="/v1/reports" desc="Fetch generated PDF assets" />
            </div>
            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px]">
              Full Documentation <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>

          <div className="bg-white p-8 rounded-3xl space-y-3">
            <p className="text-[10px] font-black text-black uppercase tracking-widest opacity-40">Dev Usage</p>
            <p className="text-2xl font-black text-black tracking-tighter">842 / <span className="opacity-20">5,000</span></p>
            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div className="h-full bg-black w-[16%]" />
            </div>
            <p className="text-[9px] text-black/50 font-bold uppercase">Requests resetting in 12 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EndpointItem({ method, path, desc }: { method: string, path: string, desc: string }) {
  return (
    <div className="space-y-1 group cursor-pointer">
      <div className="flex items-center gap-2">
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
          }`}>
          {method}
        </span>
        <code className="text-[10px] text-white/60 font-mono group-hover:text-white transition-colors">{path}</code>
      </div>
      <p className="text-[10px] text-white/20 font-medium ml-1">{desc}</p>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`px-2 py-0.5 rounded-full ${className}`}>{children}</span>;
}

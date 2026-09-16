import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Play, Terminal, Box } from "lucide-react";

export default function ApiTester() {
    const [method, setMethod] = useState("GET");
    const [url, setUrl] = useState("http://localhost:5000/api/");
    const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
    const [body, setBody] = useState("");
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        setLoading(true);
        setResponse(null);
        try {
            const parsedHeaders = JSON.parse(headers);
            const options: RequestInit = {
                method,
                headers: parsedHeaders,
            };

            if (method !== "GET" && method !== "DELETE" && body) {
                options.body = body;
            }

            const res = await fetch(url, options);
            const data = await res.json();
            setResponse({
                status: res.status,
                statusText: res.statusText,
                data,
            });
        } catch (error: any) {
            setResponse({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 pb-16">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">API Tester</h1>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em]">
                    Debug & Test Internal Services
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-8 rounded-[2rem] border border-slate-200/70 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 space-y-6 shadow-sm shadow-slate-100 dark:shadow-none"
                >
                    <div className="flex gap-4">
                        <div className="w-32">
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 h-11 rounded-xl text-xs font-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
                                    <SelectItem value="GET" className="text-xs font-bold">GET</SelectItem>
                                    <SelectItem value="POST" className="text-xs font-bold">POST</SelectItem>
                                    <SelectItem value="PUT" className="text-xs font-bold">PUT</SelectItem>
                                    <SelectItem value="DELETE" className="text-xs font-bold">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 h-11 rounded-xl flex-1 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Headers (JSON)</label>
                        <Textarea
                            value={headers}
                            onChange={(e) => setHeaders(e.target.value)}
                            className="bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-mono text-[11px] min-h-[100px] rounded-xl dark:text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Payload Body</label>
                        <Textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder='{ "key": "value" }'
                            className="bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-mono text-[11px] min-h-[150px] rounded-xl dark:text-white shadow-inner"
                        />
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full h-12 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 dark:shadow-none"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        {loading ? "Transmitting..." : "Send Request"}
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col rounded-[2rem] border border-slate-200/70 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 overflow-hidden shadow-sm shadow-slate-100 dark:shadow-none"
                >
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200/40 dark:border-zinc-800 flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">Response Console</span>
                    </div>
                    <div className="flex-1 p-6 font-mono text-[11px] overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {response ? (
                            <pre className="text-indigo-600 dark:text-indigo-400 whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 italic">
                                <Box size={40} className="text-slate-400" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Idle state. Waiting for transmission.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

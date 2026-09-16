import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { API_BASE_URL } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createProject, initializeProject, getInitializationStatus, fetchWithAuth } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Box, FileText, Loader2, Sparkles, Zap, Check, Edit3, X } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    type: z.enum(["personal", "freelance", "company"]),
    description: z.string().optional(),
    deadline: z.string().optional(),
});

interface ProjectCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (projectId?: string) => void;
}

const INIT_STAGE_LABELS: Record<string, string> = {
    reading_prd: "Reading PRD",
    understanding_requirements: "Understanding requirements",
    building_project_plan: "Building project plan",
    creating_milestones: "Creating milestones",
    creating_tasks: "Creating tasks",
    extracting_tech_stack: "Extracting technology stack",
    extracting_deadlines: "Extracting deadlines",
    building_project_brief: "Building project brief",
    prd_indexing: "Indexing PRD knowledge",
    complete: "Project ready",
    failed: "Initialization failed",
};

export default function ProjectCreationModal({
    isOpen,
    onClose,
    onSuccess,
}: ProjectCreationModalProps) {
    const [loading, setLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [initSteps, setInitSteps] = useState<{ stage: string; label: string; status: string }[]>([]);
    const [initError, setInitError] = useState<string | null>(null);
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "personal",
            description: "",
            deadline: "",
        },
    });

    const [pasting, setPasting] = useState(false);
    const [rawText, setRawText] = useState("");
    const [prdFilename, setPrdFilename] = useState("");

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const toastId = toast.loading("Extracting PRD transcription...");

        try {
            const formData = new FormData();
            formData.append("prd", file);

            const response = await fetchWithAuth(
                `${API_BASE_URL}/projects/extract-prd`,
                { method: "POST", body: formData }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Extraction failed.");
            }

            const result = await response.json();
            setRawText(result.text);
            setPrdFilename(result.filename || file.name);
            setPasting(true);
            toast.success("Transcription complete. Review content below.", { id: toastId });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Transcription failed.";
            toast.error(message, { id: toastId });
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleTextInjection = () => {
        if (!rawText.trim()) return;
        if (!form.getValues("name") || form.getValues("name").length < 2) {
            const derived = prdFilename
                ? prdFilename.replace(/\.(pdf|docx|txt|md)$/i, "").replace(/[-_]/g, " ")
                : "New Project";
            form.setValue("name", derived.slice(0, 60) || "New Project");
        }
        setReviewMode(true);
        setPasting(false);
        toast.success("PRD ready for neural initialization.");
    };

    const pollInitialization = (projectId: string, clerkId: string) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const status = await getInitializationStatus(projectId, clerkId);
                const init = status.initialization;

                if (init?.steps) {
                    setInitSteps(init.steps);
                } else if (init?.stage) {
                    setInitSteps([
                        {
                            stage: init.stage,
                            label: INIT_STAGE_LABELS[init.stage] || init.stageLabel || init.stage,
                            status: "in_progress",
                        },
                    ]);
                }

                if (init?.status === "complete") {
                    stopPolling();
                    setInitializing(false);
                    toast.success("Project initialized — dashboard populated from PRD.");
                    onSuccess(projectId);
                    onClose();
                    handleReset();
                } else if (init?.status === "failed") {
                    stopPolling();
                    setInitializing(false);
                    setInitError(init.error || "Initialization failed");
                    toast.error(init.error || "Initialization failed. You can retry.");
                }
            } catch (err) {
                console.error("Poll error:", err);
            }
        }, 1500);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) {
            toast.error("Authentication required.");
            return;
        }

        setLoading(true);
        try {
            const hasPrd = rawText.trim().length >= 50;

            if (hasPrd) {
                // Create minimal project, then run PRD initialization pipeline
                const projectData = {
                    ...values,
                    clerkId: user.id,
                    status: "active" as const,
                    priority: "medium" as const,
                    description: values.description || "Initializing from PRD...",
                };

                const created = await createProject(projectData);

                setInitializing(true);
                setInitError(null);
                setInitSteps([
                    { stage: "reading_prd", label: "Reading PRD", status: "in_progress" },
                ]);

                await initializeProject(created._id, user.id, { text: rawText });

                pollInitialization(created._id, user.id);
            } else {
                // Manual project creation without PRD
                const projectData = {
                    ...values,
                    clerkId: user.id,
                    status: "active" as const,
                    priority: "medium" as const,
                    nextPlannedStep: "Define project scope and requirements.",
                };

                const created = await createProject(projectData);
                toast.success("Workspace cluster provisioned successfully.");
                onSuccess(created._id);
                onClose();
                handleReset();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Initialization failed.";
            toast.error(message);
            console.error(error);
            setInitializing(false);
        } finally {
            setLoading(false);
        }
    }

    const handleReset = () => {
        stopPolling();
        form.reset();
        setRawText("");
        setPrdFilename("");
        setReviewMode(false);
        setInitializing(false);
        setInitSteps([]);
        setInitError(null);
        setPasting(false);
    };

    const showProgress = initializing;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => { if (!val && !initializing) { handleReset(); onClose(); } }}>
            <DialogContent className="sm:max-w-[650px] bg-zinc-950 border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500" />

                <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    {showProgress ? <Loader2 size={20} className="animate-spin" /> : reviewMode ? <Sparkles size={20} /> : <Box size={20} />}
                                </div>
                                <div className="space-y-1 text-left">
                                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                                        {showProgress ? "Initializing..." : reviewMode ? "Neural Review." : "Initialize Node."}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                                        {showProgress ? "Building project from PRD" : reviewMode ? "Verify before transmission" : "Provisioning workspace cluster"}
                                    </DialogDescription>
                                </div>
                            </div>

                            {!reviewMode && !showProgress && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".pdf,.txt,.docx,.md"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setPasting(!pasting)}
                                        className={`h-10 px-4 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${pasting ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/10" : ""}`}
                                    >
                                        <Edit3 size={12} />
                                        {pasting ? "Cancel Paste" : "Paste Context"}
                                    </Button>
                                    {!pasting && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isParsing}
                                            className="h-10 px-4 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                        >
                                            {isParsing ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <FileText className="w-3 h-3 text-indigo-400" />
                                            )}
                                            {isParsing ? "Analyzing..." : "Inject PRD"}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {showProgress && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10"
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                Initialization Pipeline
                            </p>
                            <div className="space-y-3">
                                {initSteps.length > 0 ? (
                                    initSteps.map((step) => (
                                        <div key={step.stage} className="flex items-center gap-3">
                                            {step.status === "completed" ? (
                                                <Check size={14} className="text-emerald-400" />
                                            ) : step.status === "in_progress" ? (
                                                <Loader2 size={14} className="animate-spin text-indigo-400" />
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                                            )}
                                            <span className={`text-xs font-bold ${step.status === "completed" ? "text-white/50" : step.status === "in_progress" ? "text-white" : "text-white/30"}`}>
                                                {step.label || INIT_STAGE_LABELS[step.stage] || step.stage}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Loader2 size={14} className="animate-spin text-indigo-400" />
                                        <span className="text-xs font-bold text-white">Starting initialization...</span>
                                    </div>
                                )}
                            </div>
                            {initError && (
                                <div className="flex items-center gap-2 text-rose-400 text-xs">
                                    <X size={14} />
                                    {initError}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {!showProgress && !reviewMode && pasting && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10"
                        >
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 ml-2 italic">
                                {prdFilename ? `PRD: ${prdFilename}` : "Manual Data Stream"}
                            </label>
                            <Textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="Paste your PRD here... DevOS will extract requirements, milestones, tasks, tech stack, and deadlines."
                                className="bg-zinc-950/50 border-white/5 min-h-[150px] rounded-2xl p-4 text-xs font-medium leading-relaxed resize-none focus:border-indigo-500/50"
                            />
                            <Button
                                onClick={handleTextInjection}
                                disabled={isParsing || rawText.trim().length < 50}
                                className="w-full h-12 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20"
                            >
                                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Prepare for Initialization"}
                            </Button>
                        </motion.div>
                    )}

                    {!showProgress && reviewMode ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 rounded-3xl bg-white/3 border border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 italic">PRD Loaded</h4>
                                <p className="text-sm text-white/70">
                                    {rawText.length.toLocaleString()} characters ready for neural analysis.
                                    {prdFilename && ` Source: ${prdFilename}`}
                                </p>
                                <p className="text-xs text-white/40 italic">
                                    DevOS will extract requirements, phases, tasks, tech stack, deadlines, and build the project brief — all traceable to PRD sections.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-white/3 border border-white/5 space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 italic">Project Name</h4>
                                    <Input
                                        value={form.watch("name")}
                                        onChange={(e) => form.setValue("name", e.target.value)}
                                        placeholder="Project name (optional override)"
                                        className="bg-transparent border-white/10 text-lg font-bold"
                                    />
                                </div>
                                <div className="p-6 rounded-3xl bg-white/3 border border-white/5 space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 italic">Schema Type</h4>
                                    <Select onValueChange={(v) => form.setValue("type", v as "personal" | "freelance" | "company")} value={form.watch("type")}>
                                        <SelectTrigger className="bg-transparent border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10">
                                            <SelectItem value="personal">Personal</SelectItem>
                                            <SelectItem value="freelance">Freelance</SelectItem>
                                            <SelectItem value="company">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button
                                    onClick={() => setReviewMode(false)}
                                    variant="outline"
                                    className="flex-1 h-16 rounded-3xl border-white/5 text-[10px] font-black uppercase tracking-widest group"
                                >
                                    <Edit3 size={16} className="mr-3 group-hover:rotate-12 transition-transform" /> Edit PRD
                                </Button>
                                <Button
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={loading || form.watch("name").length < 2}
                                    className="flex-[1.5] h-16 rounded-3xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={18} className="mr-3" /> Initialize from PRD</>}
                                </Button>
                            </div>
                        </div>
                    ) : !showProgress ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2 italic">Node Identifier</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Project Alpha"
                                                        {...field}
                                                        className="h-12 bg-white/3 border-white/5 rounded-2xl px-6 font-bold text-sm focus:border-indigo-500/50 transition-all placeholder:text-white/10"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2 italic">Schema Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 bg-white/3 border-white/5 rounded-2xl px-6 font-bold text-sm">
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-zinc-950 border-white/10 rounded-2xl overflow-hidden">
                                                        <SelectItem value="personal" className="text-xs font-black uppercase tracking-widest py-3">Personal</SelectItem>
                                                        <SelectItem value="freelance" className="text-xs font-black uppercase tracking-widest py-3">Freelance</SelectItem>
                                                        <SelectItem value="company" className="text-xs font-black uppercase tracking-widest py-3">Enterprise</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2 italic">Objective Context</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Define the primary vector for this project..."
                                                    {...field}
                                                    className="bg-white/3 border-white/5 min-h-[100px] rounded-3xl p-6 font-medium text-sm leading-relaxed resize-none focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-white/10"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading || isParsing}
                                        className="w-full bg-white text-black h-16 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Zap size={16} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
                                                {rawText.trim().length >= 50 ? "Initialize from PRD" : "Initialize Transmission"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    ) : null}
                </div>

                <div className="px-10 py-6 bg-white/2 border-t border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 text-center">Neural Engine Analysis Active</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

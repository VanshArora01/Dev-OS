import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { AlertCircle, Plus } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { StatusPill } from "@/components/ui/status-pill";
import { motionPage } from "@/lib/motion";
import {
    getProjectById, getSessions, updateProject, createSession, getProjectSummary, deleteProject
} from "@/lib/api";
import { Project, Session, ProjectSummary } from "@/lib/types";
import { toast } from "sonner";
import { AIPanel } from "@/components/AIPanel";
import { AIFloatingChat } from "@/components/AIFloatingChat";
import SessionReviewModal from "../components/SessionReviewModal";
import { parseProjectTab } from "@/components/project/tabConfig";
import { ProjectOverviewTab } from "@/components/project/ProjectOverviewTab";
import { ProjectSessionsTab } from "@/components/project/ProjectSessionsTab";
import { ProjectBriefTab } from "@/components/project/ProjectBriefTab";
import { ProjectDecisionsTab } from "@/components/project/ProjectDecisionsTab";
import { ProjectKanbanTab } from "@/components/project/ProjectKanbanTab";
import { ProjectStackTab } from "@/components/project/ProjectStackTab";
import { ProjectRemindersTab } from "@/components/project/ProjectRemindersTab";
import { GithubWorkspace } from "@/components/github/GithubWorkspace";

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useUser();

    const [project, setProject] = useState<Project | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [summary, setSummary] = useState<ProjectSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const activeTab = parseProjectTab(searchParams.get("tab"));
    const setActiveTab = (tab: string) => {
        const next = new URLSearchParams(searchParams);
        next.set("tab", tab);
        setSearchParams(next);
    };
    const [showSessionReview, setShowSessionReview] = useState(false);

    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [logForm, setLogForm] = useState({
        summary: "",
        problems: "",
        decisions: "",
        nextStep: "",
        durationMinutes: 0
    });

    const [newDecision, setNewDecision] = useState({ title: "", reasoning: "", tag: "Technical" });
    const [newReference, setNewReference] = useState({ label: "", url: "", type: "Doc" });
    const [newTech, setNewTech] = useState("");
    const [newMilestone, setNewMilestone] = useState({ title: "", description: "", dueDate: "" });
    const [newReminder, setNewReminder] = useState({ date: "", message: "" });
    const [newDeliverable, setNewDeliverable] = useState("");

    const [editStates, setEditStates] = useState({ client: false, technical: false, constraints: false });
    const [newReq, setNewReq] = useState("");

    const [columns, setColumns] = useState<any>({
        todo: { title: 'To Do', items: [] },
        inProgress: { title: 'In Progress', items: [] },
        done: { title: 'Completed', items: [] }
    });

    useEffect(() => {
        if (project?.planning?.milestones) {
            const milestones = project.planning.milestones;
            setColumns({
                todo: { title: 'To Do', items: milestones.filter((m: any) => m.status === 'pending') },
                inProgress: { title: 'In Progress', items: milestones.filter((m: any) => m.status === 'in-progress') },
                done: { title: 'Completed', items: milestones.filter((m: any) => m.status === 'completed') }
            });
        }
    }, [project]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [removed] = sourceItems.splice(source.index, 1);

            const statusMap: any = { todo: 'pending', inProgress: 'in-progress', done: 'completed' };
            if (removed) {
                removed.status = statusMap[destination.droppableId];
            }

            destItems.splice(destination.index, 0, removed);
            const newState = {
                ...columns,
                [source.droppableId]: { ...sourceColumn, items: sourceItems },
                [destination.droppableId]: { ...destColumn, items: destItems }
            };
            setColumns(newState);

            const allItems = [
                ...newState.todo.items,
                ...newState.inProgress.items,
                ...newState.done.items
            ];
            handleUpdateProjectFlat({ planning: { milestones: allItems } });
        } else {
            const column = columns[source.droppableId];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);
            setColumns({ ...columns, [source.droppableId]: { ...column, items: copiedItems } });
        }
    };

    const fetchData = async () => {
        if (!id || !user) return;
        setLoading(true);
        try {
            const [projData, sessionData, summaryData] = await Promise.all([
                getProjectById(id, user.id),
                getSessions(id, user.id),
                getProjectSummary(id, user.id)
            ]);
            setProject(projData);
            setSessions(sessionData);
            setSummary(summaryData);

            if (projData.nextPlannedStep && !logForm.nextStep) {
                setLogForm(prev => ({ ...prev, nextStep: projData.nextPlannedStep }));
            }
        } catch (error: any) {
            console.error("Failed to fetch project data", error);
            toast.error(error?.message || "Failed to load project details");
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        if (isTimerRunning) return;
        setIsTimerRunning(true);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimerSeconds(s => s + 1);
        }, 1000);

        if ('electronAPI' in window) {
            (window as any).electronAPI.setActiveProject({
                id: project?._id,
                name: project?.name,
                clerkId: user?.id
            });
            (window as any).electronAPI.startSession();
        }

        toast.success("Focus Protocol Initiated.");
    };

    const stopTimer = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsTimerRunning(false);
        setTimerSeconds(0);

        if ('electronAPI' in window) {
            const result = await (window as any).electronAPI.endSession();
            if (result && result.images) {
                localStorage.setItem("pendingSession", JSON.stringify(result));
                setShowSessionReview(true);
            }
        }

        toast.info("Session archived. Reviewing telemetry...");
    };

    useEffect(() => {
        fetchData();

        if ((window as any).electronAPI) {
            (window as any).electronAPI.onSessionStarted(() => {
                if (!isTimerRunning) setIsTimerRunning(true);
            });

            (window as any).electronAPI.onSessionEnded(() => {
                setIsTimerRunning(false);
            });

            (window as any).electronAPI.onEndSession((data: any) => {
                if (data) {
                    setIsTimerRunning(false);
                    localStorage.setItem("pendingSession", JSON.stringify(data));
                    setShowSessionReview(true);
                }
            });
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id, user]);

    useEffect(() => {
        const pending = localStorage.getItem("pendingSession");
        if (pending) {
            setShowSessionReview(true);
        }
    }, []);

    const handleSessionSave = async (sessionData: any) => {
        if (!project || !user) throw new Error("You must be signed in to save a session");
        try {
            await createSession({
                ...sessionData,
                projectId: project._id,
                clerkId: user.id,
            });
            fetchData();
            setShowSessionReview(false);
            toast.success("Session saved successfully");
            setActiveTab('sessions');
        } catch (err: any) {
            const message = err?.message || "Failed to save session";
            toast.error(message);
            throw err;
        }
    };

    const handleUpdateProjectFlat = async (
        update: Partial<Project>,
        options?: { silent?: boolean; throwOnError?: boolean }
    ) => {
        if (!project || !user) return;
        setIsSaving(true);
        try {
            const result = await updateProject(project._id, { ...update, clerkId: user.id });
            setProject(result);
            if (!options?.silent) toast.success("Workspace synced");
            return result;
        } catch (err: any) {
            toast.error(err?.message || "Cloud sync failed");
            if (options?.throwOnError) throw err;
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveLog = async () => {
        if (!project || !user || !logForm.summary || !logForm.nextStep) {
            toast.error("Summary and Next Step are required");
            return;
        }
        setIsSaving(true);
        try {
            await createSession({
                projectId: project._id,
                clerkId: user.id,
                ...logForm
            });
            await updateProject(project._id, {
                nextPlannedStep: logForm.nextStep,
                clerkId: user.id
            });
            toast.success("Session logged. Focus restored.");
            setLogForm({ summary: "", problems: "", decisions: "", nextStep: "", durationMinutes: 0 });
            setActiveTab('sessions');
            fetchData();
        } catch (error: any) {
            toast.error(error?.message || "Failed to save session");
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project || !user || !window.confirm("Archive this workspace? This cannot be undone.")) return;
        try {
            await deleteProject(project._id, user.id);
            toast.success("Project archived");
            navigate("/");
        } catch (err) {
            toast.error("Archive failed");
        }
    };

    const handleAddDecision = () => {
        if (!project || !newDecision.title) return;
        const updated = [
            { ...newDecision, date: new Date().toISOString() },
            ...(project.decisions || [])
        ];
        handleUpdateProjectFlat({ decisions: updated }, { silent: true });
        setNewDecision({ title: "", reasoning: "", tag: "Technical" });
        toast.success("Decision logged.");
    };

    const handleAddReference = () => {
        if (!project || !newReference.url) return;
        const updated = [...(project.resources || []), { ...newReference }];
        handleUpdateProjectFlat({ resources: updated });
        setNewReference({ label: "", url: "", type: "Doc" });
        toast.success("Reference added.");
    };

    const handleAddTech = (tech: string) => {
        if (!project || !tech) return;
        const updated = [...(project.techStack || []), tech];
        handleUpdateProjectFlat({ techStack: updated });
        setNewTech("");
    };

    const handleAddMilestone = () => {
        if (!project || !newMilestone.title) return;
        const updated = [...(project.planning?.milestones || []), { ...newMilestone, status: 'pending' as const }];
        handleUpdateProjectFlat({ planning: { ...project.planning, milestones: updated } });
        setNewMilestone({ title: "", description: "", dueDate: "" });
        toast.success("Milestone added.");
    };

    const handleAddReminder = () => {
        if (!project || !newReminder.message) return;
        const updated = [...(project.reminders || []), { ...newReminder, sent: false }];
        handleUpdateProjectFlat({ reminders: updated });
        setNewReminder({ date: "", message: "" });
        toast.success("Reminder set.");
    };

    const handleAddDeliverable = () => {
        if (!project || !newDeliverable) return;
        const updated = [...(project.requirements?.deliverablesChecklist || []), { item: newDeliverable, done: false }];
        handleUpdateProjectFlat({ requirements: { ...project.requirements, deliverablesChecklist: updated } });
        setNewDeliverable("");
    };

    const toggleDeliverable = (idx: number) => {
        if (!project) return;
        const checklist = [...(project.requirements?.deliverablesChecklist || [])];
        checklist[idx].done = !checklist[idx].done;
        handleUpdateProjectFlat({ requirements: { ...project.requirements, deliverablesChecklist: checklist } });
    };

    const milestonesDone = project?.planning?.milestones?.filter(m => m.status === 'completed').length || 0;
    const totalMilestones = project?.planning?.milestones?.length || 0;
    const daysUntilDeadline = project?.deadline
        ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-20">
                <p className="text-sm text-slate-400">Loading project…</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Project not found</h2>
                    <Button onClick={() => navigate("/")} className="btn-primary">Back to overview</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`px-5 lg:px-6 ${activeTab === 'ai' ? 'h-full overflow-hidden py-3 space-y-2' : 'pb-16 py-4 space-y-5'}`}>
            {activeTab !== 'ai' && (
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-3 flex-wrap">
                        <h1 className="page-title leading-none">
                            <motion.span layoutId={`project-name-${project._id}`} className="inline-block">
                                {project.name}
                            </motion.span>
                        </h1>
                        <StatusPill value={project.status} />
                        <StatusPill value={project.type} />
                        {project.priority && <StatusPill value={project.priority} />}
                    </div>
                    {activeTab !== "sessions" && (
                    <Button
                        onClick={() => {
                            setLogForm({
                                summary: "",
                                problems: "",
                                decisions: "",
                                nextStep: project?.nextPlannedStep || "",
                                durationMinutes: 30
                            });
                            setShowSessionReview(true);
                        }}
                        className="btn-primary h-9"
                    >
                        <Plus size={12} className="mr-2" />
                        Log session
                    </Button>
                    )}
                </div>
            )}

            <main className={`flex-1 overflow-hidden flex flex-col ${activeTab === 'ai' || activeTab === 'github' ? 'w-full h-full' : 'w-full'}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={motionPage}
                        className={`flex-1 flex flex-col min-h-0 ${activeTab === 'ai' || activeTab === 'github' ? 'w-full overflow-hidden' : ''}`}
                    >
                        {activeTab === 'ai' && <AIPanel projectId={project._id} />}
                        {activeTab === 'github' && <GithubWorkspace projectId={project._id} />}
                        {activeTab === 'today' && (
                            <ProjectOverviewTab
                                project={project}
                                sessions={sessions}
                                summary={summary}
                                isTimerRunning={isTimerRunning}
                                startTimer={startTimer}
                                stopTimer={stopTimer}
                                setActiveTab={setActiveTab}
                                toggleDeliverable={toggleDeliverable}
                                daysUntilDeadline={daysUntilDeadline}
                                milestonesDone={milestonesDone}
                                totalMilestones={totalMilestones}
                                timerSeconds={timerSeconds}
                            />
                        )}
                        {activeTab === 'sessions' && (
                            <ProjectSessionsTab
                                project={project}
                                sessions={sessions}
                                setLogForm={setLogForm}
                                setShowSessionReview={setShowSessionReview}
                            />
                        )}
                        {activeTab === 'brief' && (
                            <ProjectBriefTab
                                project={project}
                                newDeliverable={newDeliverable}
                                setNewDeliverable={setNewDeliverable}
                                handleUpdateProjectFlat={handleUpdateProjectFlat}
                                handleAddDeliverable={handleAddDeliverable}
                            />
                        )}
                        {activeTab === 'decisions' && (
                            <ProjectDecisionsTab
                                project={project}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                newDecision={newDecision}
                                setNewDecision={setNewDecision}
                                handleAddDecision={handleAddDecision}
                                handleUpdateProjectFlat={handleUpdateProjectFlat}
                            />
                        )}
                        {activeTab === 'kanban' && (
                            <ProjectKanbanTab
                                project={project}
                                columns={columns}
                                onDragEnd={onDragEnd}
                                handleUpdateProjectFlat={handleUpdateProjectFlat}
                            />
                        )}
                        {activeTab === 'stack' && (
                            <ProjectStackTab
                                project={project}
                                handleUpdateProjectFlat={handleUpdateProjectFlat}
                            />
                        )}
                        {activeTab === 'reminders' && (
                            <ProjectRemindersTab
                                project={project}
                                newReminder={newReminder}
                                setNewReminder={setNewReminder}
                                handleAddReminder={handleAddReminder}
                                handleUpdateProjectFlat={handleUpdateProjectFlat}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {activeTab !== 'ai' && activeTab !== 'github' && <AIFloatingChat projectId={project._id} />}

            {showSessionReview && (
                <SessionReviewModal
                    projectId={project._id}
                    projectContext={{
                        name: project.name,
                        type: project.type,
                        description: project.description || "",
                        lastNextStep: sessions[0]?.nextStep || ""
                    }}
                    onSave={handleSessionSave}
                    onClose={() => {
                        localStorage.removeItem("pendingSession");
                        setShowSessionReview(false);
                    }}
                />
            )}
        </div>
    );
}

import { Folder } from "lucide-react";
import type { Project } from "@/lib/types";
import { useState, useEffect } from "react";
import { getProjects, deleteProject } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/ProjectCard";
import { BentoCard } from "@/components/ui/bento-card";

interface ProjectsGridProps {
    limit?: number;
    typeFilter?: "all" | Project["type"];
    statusFilter?: "all" | Project["status"];
}

export default function ProjectsGrid({ limit, typeFilter = "all", statusFilter = "all" }: ProjectsGridProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    const fetchProjects = async () => {
        if (user?.id) {
            setLoading(true);
            try {
                const data = await getProjects(user.id);
                const list = Array.isArray(data) ? data : [];
                const sorted = list.sort((a, b) => {
                    const aTime = a.lastWorkedAt ? new Date(a.lastWorkedAt).getTime() : 0;
                    const bTime = b.lastWorkedAt ? new Date(b.lastWorkedAt).getTime() : 0;
                    return bTime - aTime;
                });
                setProjects(sorted);
            } catch (error: any) {
                toast.error(error?.message || "Failed to load projects");
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user?.id]);

    const handleDelete = async (id: string) => {
        if (!user || !window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteProject(id, user.id);
            toast.success("Project deleted");
            fetchProjects();
        } catch (err) {
            toast.error("Failed to delete project");
        }
    };

    const filtered = projects.filter((p) => {
        if (typeFilter !== "all" && p.type !== typeFilter) return false;
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        return true;
    });
    const visible = typeof limit === "number" ? filtered.slice(0, limit) : filtered;

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-[180px] rounded-2xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
                ))}
            </div>
        );
    }

    if (visible.length === 0) {
        return (
            <BentoCard className="text-center py-12 col-span-12">
                <Folder className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No projects match these filters.</p>
            </BentoCard>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((project) => (
                <ProjectCard key={project._id} project={project} onDelete={() => handleDelete(project._id)} />
            ))}
        </div>
    );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileBarChart, Download, Sparkles, Loader2, Calendar, MapPin, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { getProjects, getReportDownloadUrl } from "@/lib/api";
import { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function Reports() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      getProjects()
        .then((data) => {
          // Show projects that have a kimiReport or are generating
          const relevant = data.filter(
            (p) =>
              p.kimiReport ||
              p.reportStatus === "generating" ||
              p.reportStatus === "completed" ||
              (p.aiRecommendations && p.aiRecommendations.length > 0)
          );
          setProjects(relevant);
        })
        .finally(() => setLoading(false));
    };

    fetchData();
    // Poll for updates every 10 seconds to catch generating reports
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FileBarChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">AI Strategy Reports</h1>
            <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Climate Resilience Infrastructure Analysis</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full bg-white/5 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <Sparkles className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-lg font-bold text-white">No Reports Generated</h3>
          <p className="text-sm text-white/40 mb-6">Start an evaluation to see AI strategies here.</p>
          <Button onClick={() => navigate("/evaluate")} variant="outline" className="border-white/10 text-white hover:bg-white/10">
            Go to Evaluate
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project, idx) => (
            <ReportCard key={project._id || project.id} project={project} index={idx} onNavigate={() => navigate(`/project/${project._id || project.id}/reports`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ project, index, onNavigate }: { project: Project; index: number; onNavigate: () => void }) {
  const projectId = project._id || project.id || '';
  const downloadUrl = getReportDownloadUrl(projectId);
  const status = project.reportStatus || (project.kimiReport ? 'completed' : 'idle');
  const city = project.location?.city || 'N/A';
  const createdDate = project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group relative"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500 blur-xl" />

      <Card className="relative bg-[#0A0A0B]/80 border-white/10 backdrop-blur-3xl rounded-3xl overflow-hidden hover:border-white/20 transition-all">
        <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-xl font-black text-white tracking-tight">{project.name || project.title || 'Untitled'}</CardTitle>
              <StatusBadge status={status} />
              {project.riskLevel && (
                <Badge className={`font-black uppercase text-[9px] tracking-widest ${project.riskLevel === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  project.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                  {project.riskLevel} Risk
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-white/30 font-bold uppercase tracking-widest">
              {project.infraType && (
                <span className="flex items-center gap-1">{project.infraType}</span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {city}
              </span>
              {project.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {project.year}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {createdDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={onNavigate}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10 font-black tracking-widest uppercase text-[10px] h-10 px-5 rounded-xl"
            >
              View <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </CardHeader>

        {/* Report Preview Snippet */}
        {project.kimiReport && (
          <CardContent className="px-6 pb-6">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Report Preview</p>
              <p className="text-xs text-white/50 font-mono leading-relaxed line-clamp-3">
                {project.kimiReport.substring(0, 300)}...
              </p>
            </div>
          </CardContent>
        )}

        {/* Generating State */}
        {status === 'generating' && (
          <CardContent className="px-6 pb-6">
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
              <div>
                <p className="text-xs text-blue-400 font-bold">AI Analysis in Progress</p>
                <p className="text-[10px] text-blue-400/50 uppercase tracking-widest">Kimi K2.5 is analyzing spatial data and generating your report...</p>
              </div>
            </div>
          </CardContent>
        )}

        {/* AI Recommendations Summary */}
        {project.aiRecommendations && project.aiRecommendations.length > 0 && !project.kimiReport && (
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {project.aiRecommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-black text-white/40">{i + 1}</div>
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-widest">Strategy</h4>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 font-black uppercase text-[9px] tracking-widest gap-1">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </Badge>
      );
    case 'generating':
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black uppercase text-[9px] tracking-widest gap-1 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" /> Generating
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-black uppercase text-[9px] tracking-widest gap-1">
          <AlertCircle className="w-3 h-3" /> Failed
        </Badge>
      );
    default:
      return (
        <Badge className="bg-white/5 text-white/30 border-white/10 font-black uppercase text-[9px] tracking-widest">
          Pending
        </Badge>
      );
  }
}

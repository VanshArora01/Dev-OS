import { AIPanel } from "@/components/AIPanel";

export default function Assistant() {
  return (
    <div className="h-full min-h-0 px-5 lg:px-6 py-4 flex flex-col">
      <div className="mb-3 shrink-0">
        <p className="eyebrow mb-1">Assistant</p>
        <h1 className="page-title">Workspace Neural</h1>
        <p className="text-sm text-slate-500 mt-1">
          Portfolio-level questions across every project — persistent conversations live here.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AIPanel surface="workspace" className="h-full min-h-0" />
      </div>
    </div>
  );
}

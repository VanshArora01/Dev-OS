function formatDate(d = new Date()) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function extractProjectContext(project = {}, extras = {}) {
    const bp = project.blueprint || {};
    const planning = project.planning || {};
    const milestones = planning.milestones || [];
    const phases = planning.phases || bp.phases || [];

    const techDetails = (project.techStackDetails || []).filter((t) => t?.name);
    const techFlat = (project.techStack || []).filter(Boolean);

    const requirements = (bp.requirements || []).map((r) => ({
        id: r.id || r.requirementId || '',
        title: r.title || r.name || '',
        priority: r.priority || 'medium',
        status: r.status || 'specified',
        source: r.source || 'PRD'
    }));

    const completed = milestones.filter((m) => m.status === 'completed');
    const inProgress = milestones.filter((m) => m.status === 'in-progress');
    const pending = milestones.filter((m) => m.status === 'pending');

    const deadlines = [
        ...(project.unresolvedDeadlines || []).map((d) => ({
            title: d.title,
            date: d.date,
            source: d.source || 'PRD'
        })),
        ...(bp.deadlines || []).map((d) => ({
            title: d.title,
            date: d.date,
            source: d.source || 'PRD'
        }))
    ];

    if (project.deadline) {
        deadlines.unshift({
            title: 'Project deadline',
            date: new Date(project.deadline).toISOString().split('T')[0],
            source: 'Project'
        });
    }

    const githubRepos = (project.githubRepositories || []).map((r) => r.fullName || r.name).filter(Boolean);

    return {
        projectName: project.name || 'Project',
        description: project.description || '',
        status: project.status || 'active',
        priority: project.priority || '',
        currentPhase: project.currentPhase || bp.currentPhase || '',
        nextPlannedStep: project.nextPlannedStep || '',
        lastSessionSummary: project.lastSessionSummary || extras.lastSessionSummary || '',
        recentSessions: extras.recentSessions || [],
        techDetails,
        techFlat,
        blueprintTech: (bp.techStack || []).map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean),
        milestones,
        completed,
        inProgress,
        pending,
        phases,
        requirements,
        deadlines,
        decisions: (project.decisions || []).slice(0, 12),
        reminders: (project.reminders || []).filter((r) => !r.sent),
        blueprintObjective: bp.project?.objective || '',
        blueprintScope: bp.project?.scope || '',
        blueprintTargetUsers: bp.project?.targetUsers || '',
        blueprintProblem: bp.project?.problem || bp.project?.objective || '',
        githubRepos,
        prdIndexed: project.prdIndexing?.status === 'indexed',
        prdFilename: project.prdSource?.filename || '',
        generatedDate: formatDate()
    };
}

module.exports = { extractProjectContext, formatDate };

const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    type: {
        type: String,
        enum: ['personal', 'freelance', 'company'],
        default: 'personal'
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed'],
        default: 'active'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    owner: {
        id: String,
        name: String,
        email: String
    },
    stakeholders: [{
        name: String,
        role: String,
        email: String
    }],
    deadline: Date,
    client: {
        name: String,
        contact: String,
        billingRate: Number,
        invoiceTerms: String
    },
    // Freelance Specific
    paymentAmount: Number,
    deliverables: [String],

    // Company Specific
    teamMembers: [{
        name: String,
        email: String
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },

    // Structured Tabs
    requirements: {
        clientRequirements: String,
        technicalRequirements: String,
        constraints: String,
        deliverablesChecklist: [{
            item: String,
            done: { type: Boolean, default: false },
            description: String,
            source: String
        }]
    },
    reference: {
        uiReferences: [String], // Image URLs
        githubRepos: [String],
        figmaLinks: [String],
        styleNotes: String
    },
    currentPhase: String,
    planning: {
        phases: [{
            id: String,
            name: String,
            description: String,
            order: Number,
            objectives: [String],
            dependencies: [String]
        }],
        milestones: [{
            title: String,
            description: String,
            dueDate: Date,
            status: {
                type: String,
                enum: ['pending', 'in-progress', 'completed'],
                default: 'pending'
            },
            phase: String,
            phaseId: String,
            priority: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium'
            },
            dependencies: [String],
            requirementIds: [String],
            source: String,
            order: Number
        }]
    },
    reminders: [{
        date: Date,
        message: String,
        sent: { type: Boolean, default: false },
        source: String,
        confidence: String
    }],
    unresolvedDeadlines: [{
        title: String,
        date: String,
        description: String,
        source: String,
        confidence: String
    }],
    initialization: {
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'complete', 'failed'],
            default: 'not_started'
        },
        stage: String,
        stageLabel: String,
        steps: [{
            stage: String,
            label: String,
            status: String
        }],
        startedAt: Date,
        completedAt: Date,
        failedAt: Date,
        error: String,
        validationWarnings: [String],
        taskCount: Number,
        phaseCount: Number,
        reminderCount: Number,
        techCount: Number,
        updatedAt: Date
    },
    blueprint: mongoose.Schema.Types.Mixed,
    prdSource: {
        filename: String,
        charCount: Number,
        extractedAt: Date,
        preview: String,
        fullText: String,
        contentHash: String
    },
    prdIndexing: {
        status: {
            type: String,
            enum: ['pending', 'indexed', 'failed', 'deleted'],
            default: 'pending'
        },
        chunkCount: Number,
        vectorDimension: Number,
        sourceDocumentId: String,
        collection: String,
        error: String,
        indexedAt: Date
    },

    repoUrl: String,
    ciUrl: String,
    docsUrl: String,
    githubRepositories: [{
        repositoryId: String,
        owner: String,
        name: String,
        fullName: String,
        description: String,
        private: Boolean,
        defaultBranch: String,
        htmlUrl: String,
        language: String,
        connectedAt: Date
    }],
    resources: [{
        label: String,
        url: String
    }],
    lastWorkedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastSessionSummary: String,
    nextPlannedStep: {
        type: String,
        default: ""
    },
    totalMinutesWorked: {
        type: Number,
        default: 0
    },
    decisions: [{
        title: String,
        reasoning: String,
        date: { type: Date, default: Date.now },
        tag: { type: String, default: 'Technical' }
    }],
    techStack: [String],
    techStackDetails: [{
        name: String,
        category: String,
        source: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);

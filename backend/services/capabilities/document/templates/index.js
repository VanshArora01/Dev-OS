const TEMPLATES = {
    'project-report': {
        name: 'project-report',
        documentType: 'Project Report',
        subtitle: 'Project Status & Progress',
        sections: [
            'Executive Summary',
            'Current Stage',
            'Implemented Capabilities',
            'Architecture',
            'Technical Stack',
            'Current Limitations',
            'Next Steps',
            'Sources'
        ]
    },
    'executive-summary': {
        name: 'executive-summary',
        documentType: 'Executive Summary',
        subtitle: 'Overview & Key Findings',
        sections: [
            'Overview',
            'Key Findings',
            'Current Status',
            'Risks',
            'Recommendations',
            'Sources'
        ]
    },
    'technical-report': {
        name: 'technical-report',
        documentType: 'Technical Report',
        subtitle: 'Architecture & Implementation',
        sections: [
            'Abstract',
            'Objectives',
            'Architecture',
            'Methodology',
            'Implementation',
            'Results',
            'Limitations',
            'Future Work',
            'References'
        ]
    },
    'professional-report': {
        name: 'professional-report',
        documentType: 'Professional Report',
        subtitle: 'Structured Analysis',
        sections: [
            'Executive Summary',
            'Background',
            'Analysis',
            'Findings',
            'Recommendations',
            'Sources'
        ]
    }
};

function getTemplate(name) {
    return TEMPLATES[name] || TEMPLATES['professional-report'];
}

function listTemplates() {
    return Object.keys(TEMPLATES);
}

module.exports = { getTemplate, listTemplates, TEMPLATES };

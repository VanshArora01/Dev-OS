const { ARTIFACT_TYPES } = require('./artifactTypes');

const ARTIFACT_TYPE_ENUM = Object.values(ARTIFACT_TYPES);

function getSimpleDocumentTools() {
    return [
        {
            type: 'function',
            function: {
                name: 'generate_docx',
                description: 'Generate a structured DOCX artifact from project data. Use artifact_type to select layout (tech_stack, project_report, status_update, etc.). Do NOT pass prose paragraphs — the system builds structured tables and sections from project context. After success, use the exact artifact_id from the result for email/upload.',
                parameters: {
                    type: 'object',
                    properties: {
                        artifact_type: {
                            type: 'string',
                            enum: ARTIFACT_TYPE_ENUM,
                            description: 'Document type: tech_stack (technology tables), project_report, status_update, project_summary, requirements, standup, meeting_summary, generic'
                        },
                        title: { type: 'string', description: 'Optional title override (defaults to project name)' },
                        output_name: { type: 'string', description: 'Filename e.g. ClientFlow_Tech_Stack.docx' },
                        content: {
                            type: 'string',
                            description: 'Optional supplemental notes for generic documents only'
                        }
                    },
                    required: ['artifact_type', 'output_name']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'generate_pdf',
                description: 'Generate a structured PDF artifact from project data. Same artifact_type options as generate_docx. Use exact artifact_id from result for email/upload.',
                parameters: {
                    type: 'object',
                    properties: {
                        artifact_type: {
                            type: 'string',
                            enum: ARTIFACT_TYPE_ENUM,
                            description: 'Document type: tech_stack, project_report, status_update, project_summary, requirements, standup, meeting_summary, generic'
                        },
                        title: { type: 'string', description: 'Optional title override' },
                        output_name: { type: 'string', description: 'Filename e.g. ClientFlow_Tech_Stack.pdf' },
                        content: {
                            type: 'string',
                            description: 'Optional supplemental notes for generic documents only'
                        }
                    },
                    required: ['artifact_type', 'output_name']
                }
            }
        }
    ];
}

const STRUCTURED_DOCUMENT_SCHEMA = {
    type: 'object',
    description: 'Structured document (legacy). Prefer artifact_type parameter.',
    properties: {
        metadata: { type: 'object', properties: { title: { type: 'string' } } },
        sections: { type: 'array', items: { type: 'object' } }
    }
};

function getDocumentTools() {
    return getSimpleDocumentTools();
}

module.exports = { getDocumentTools, getSimpleDocumentTools, STRUCTURED_DOCUMENT_SCHEMA, ARTIFACT_TYPE_ENUM };

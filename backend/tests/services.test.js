const { resolveAgentCapabilities, detectsEmailAction, detectsGithubAction } = require('../services/agentIntentRouter');
const { normalizeToolName, TOOL_ALIASES } = require('../services/toolCatalog');
const { parseFailedToolGeneration, recoverToolCallFromError } = require('../services/groqToolRecovery');

describe('Backend Core Services Unit Tests', () => {
    describe('Agent Intent Router Service', () => {
        it('should correctly classify knowledge retrieval intent', async () => {
            const result = await resolveAgentCapabilities(null, 'What tech stack are we using?', {
                githubConnected: true,
                githubContext: null
            });
            expect(result.capabilities).toContain('knowledge');
        });

        it('should detect email action triggers in prompts', () => {
            expect(detectsEmailAction('email the tech stack to test@example.com')).toBe(true);
            expect(detectsEmailAction('summarize the commits')).toBe(false);
        });

        it('should detect GitHub action triggers in prompts', () => {
            expect(detectsGithubAction('what commits changed recently?')).toBe(true);
            expect(detectsGithubAction('create a document')).toBe(false);
        });
    });

    describe('Tool Catalog & Aliasing Service', () => {
        it('should normalize aliased tool names', () => {
            const allowed = ['send_document_email', 'generate_docx'];
            expect(normalizeToolName('send_email', allowed)).toEqual('send_document_email');
            expect(TOOL_ALIASES.send_email).toEqual('send_document_email');
        });

        it('should return null for unauthorized/unlisted tools', () => {
            expect(normalizeToolName('unauthorized_tool', ['generate_docx'])).toBeNull();
        });
    });

    describe('Groq Tool Recovery Service', () => {
        it('should parse malformed LLM tool call generations', () => {
            const malformed = '<function=send_document_email,{"recipient_email":"test@example.com"}>';
            const parsed = parseFailedToolGeneration(malformed);

            expect(parsed).not.toBeNull();
            expect(parsed.toolName).toEqual('send_document_email');
            expect(parsed.toolArgs.recipient_email).toEqual('test@example.com');
        });

        it('should recover tool calls from raw Groq 400 error payloads', () => {
            const allowed = ['send_document_email', 'generate_docx'];
            const errorPayload = {
                error: {
                    code: 'tool_use_failed',
                    failed_generation: '<function=send_document_email,{"recipient_email":"test@example.com"}>'
                }
            };

            const recovered = recoverToolCallFromError(errorPayload, allowed);
            expect(recovered).not.toBeNull();
            expect(recovered.toolName).toEqual('send_document_email');
        });
    });
});

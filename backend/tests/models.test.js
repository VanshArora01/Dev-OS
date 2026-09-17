const mongoose = require('mongoose');
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');
const UserIntegration = require('../models/UserIntegration');
const Message = require('../models/Message');

describe('Mongoose Models Schema Validation Tests', () => {
    describe('Project Model', () => {
        it('should validate a valid project model payload', () => {
            const project = new Project({
                name: 'DevOS Engine Core',
                clerkId: 'user-123',
                type: 'company',
                description: 'TypeScript orchestration runtime for LLM workflows.',
                status: 'active'
            });

            const err = project.validateSync();
            expect(err).toBeUndefined();
        });

        it('should fail validation when name or clerkId is missing', () => {
            const project = new Project({
                type: 'company'
            });

            const err = project.validateSync();
            expect(err).toBeDefined();
            expect(err.errors.name).toBeDefined();
            expect(err.errors.clerkId).toBeDefined();
        });
    });

    describe('Conversation Model', () => {
        it('should validate a valid conversation model payload', () => {
            const conversation = new Conversation({
                clerkId: 'user-123',
                title: 'Architecture Review Session',
                surface: 'workspace'
            });

            const err = conversation.validateSync();
            expect(err).toBeUndefined();
        });

        it('should fail validation when clerkId or title is missing', () => {
            const conversation = new Conversation({});
            const err = conversation.validateSync();

            expect(err).toBeDefined();
            expect(err.errors.clerkId).toBeDefined();
            expect(err.errors.title).toBeDefined();
        });
    });

    describe('UserIntegration Model', () => {
        it('should validate Google Drive and GitHub integration tokens schema', () => {
            const integration = new UserIntegration({
                clerkId: 'user-123',
                provider: 'github',
                accessToken: 'encrypted_token_hex_string',
                scope: 'repo,user'
            });

            const err = integration.validateSync();
            expect(err).toBeUndefined();
        });
    });
});

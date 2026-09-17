const request = require('supertest');
const express = require('express');

// Mock services and database calls
jest.mock('../models/Project', () => {
    return {
        find: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([
                { _id: 'proj-1', name: 'DevOS Core', clerkId: 'user-123', status: 'active' }
            ])
        }),
        findById: jest.fn().mockImplementation((id) => {
            if (id === 'proj-1') {
                return Promise.resolve({ _id: 'proj-1', name: 'DevOS Core', clerkId: 'user-123' });
            }
            return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: 'proj-new', ...data })),
        findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: 'proj-1', name: 'Updated Project' }),
        findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'proj-1' })
    };
});

jest.mock('../models/Conversation', () => ({
    find: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
            { _id: 'conv-1', title: 'Context Query', messageCount: 2 }
        ])
    }),
    create: jest.fn().mockResolvedValue({ _id: 'conv-new', title: 'New Conversation' })
}));

jest.mock('../services/neuralAgent', () => ({
    handleNeuralChat: jest.fn().mockResolvedValue({
        reply: 'Neural Agent executed successfully.',
        action_taken: 'searched_knowledge',
        sources: [{ title: 'README.md', path: 'README.md' }]
    })
}));

const projectRoutes = require('../routes/projectRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);

describe('Backend REST Routes Integration Tests', () => {
    describe('GET /api/projects', () => {
        it('should return list of projects (happy path)', async () => {
            const res = await request(app).get('/api/projects?clerkId=user-123');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0].name).toEqual('DevOS Core');
        });
    });

    describe('GET /api/projects/:id', () => {
        it('should return project details when found (happy path)', async () => {
            const res = await request(app).get('/api/projects/proj-1');
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toEqual('DevOS Core');
        });

        it('should return 404 error when project does not exist (error path)', async () => {
            const res = await request(app).get('/api/projects/non-existent-id');
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /api/projects', () => {
        it('should create new project with valid payload (happy path)', async () => {
            const res = await request(app)
                .post('/api/projects')
                .send({ name: 'New Project', clerkId: 'user-123', type: 'company' });

            expect(res.statusCode).toEqual(201);
            expect(res.body.name).toEqual('New Project');
        });

        it('should return 400 when missing required fields (error path)', async () => {
            const res = await request(app)
                .post('/api/projects')
                .send({ description: 'Missing name and clerkId' });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });
    });
});

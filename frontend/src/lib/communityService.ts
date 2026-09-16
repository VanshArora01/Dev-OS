import { API_BASE_URL as ROOT_API_URL } from './api';
console.log('[CommunityService] Using Base URL:', ROOT_API_URL);
const API_BASE_URL = `${ROOT_API_URL}/community`;

export const communityService = {
    async getProfile(clerkId: string) {
        const response = await fetch(`${API_BASE_URL}/profile/${clerkId}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    async updateProfile(profileData: any) {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return response.json();
    },

    async getAllThoughts() {
        const response = await fetch(`${API_BASE_URL}/thoughts`);
        if (!response.ok) throw new Error('Failed to fetch thoughts');
        return response.json();
    },

    async createThought(thoughtData: any) {
        const response = await fetch(`${API_BASE_URL}/thoughts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(thoughtData)
        });
        if (!response.ok) throw new Error('Failed to create thought');
        return response.json();
    },

    async getComments(thoughtId: string) {
        const response = await fetch(`${API_BASE_URL}/comments/${thoughtId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        return response.json();
    },

    async createComment(commentData: any) {
        const response = await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData)
        });
        if (!response.ok) throw new Error('Failed to create comment');
        return response.json();
    }
};

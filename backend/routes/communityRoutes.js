const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

// Profile routes
router.get('/profile/:clerkId', communityController.getUserProfile);
router.post('/profile', communityController.updateUserProfile);

// Thought routes
router.get('/thoughts', communityController.getAllThoughts);
router.post('/thoughts', communityController.createThought);

// Comment routes
router.get('/comments/:thoughtId', communityController.getCommentsByThought);
router.post('/comments', communityController.createComment);

module.exports = router;

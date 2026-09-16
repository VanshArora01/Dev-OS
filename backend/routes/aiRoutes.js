const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/conversations', aiController.listConversations);
router.post('/conversations', aiController.createConversation);
router.get('/conversations/:id', aiController.getConversation);
router.patch('/conversations/:id', aiController.updateConversation);
router.delete('/conversations/:id', aiController.deleteConversation);
router.get('/conversations/:id/messages', aiController.getMessages);
router.post('/conversations/:id/messages', aiController.sendMessage);

router.post('/chat', aiController.chat);
router.post('/approve-action', aiController.approveAction);
router.post('/reject-action', aiController.rejectAction);
router.get('/artifacts/:artifactId/download', aiController.downloadArtifact);

module.exports = router;

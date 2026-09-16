const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const githubController = require('../controllers/githubController');
const { requireClerkUser } = require('../utils/auth');

router.get('/google/callback', integrationController.googleCallback);
router.get('/google/status', requireClerkUser, integrationController.getGoogleStatus);
router.get('/google/connect-url', requireClerkUser, integrationController.getConnectUrl);
router.post('/google/disconnect', requireClerkUser, integrationController.disconnectGoogle);
router.get('/google/files', requireClerkUser, integrationController.listGoogleFiles);
router.get('/google/files/:id', requireClerkUser, integrationController.getGoogleFile);

router.get('/github/callback', githubController.githubCallback);
router.get('/github/status', requireClerkUser, githubController.getStatus);
router.get('/github/connect-url', requireClerkUser, githubController.getConnectUrl);
router.post('/github/disconnect', requireClerkUser, githubController.disconnectGithub);
router.get('/github/repositories', requireClerkUser, githubController.listRepositories);
router.get('/github/repositories/:owner/:repo', requireClerkUser, githubController.getRepository);
router.get('/github/repositories/:owner/:repo/tree', requireClerkUser, githubController.listTree);
router.get('/github/repositories/:owner/:repo/file', requireClerkUser, githubController.getFile);
router.get('/github/repositories/:owner/:repo/commits', requireClerkUser, githubController.listCommits);
router.get('/github/repositories/:owner/:repo/commits/:sha', requireClerkUser, githubController.getCommit);
router.get('/github/repositories/:owner/:repo/pulls', requireClerkUser, githubController.listPulls);
router.get('/github/repositories/:owner/:repo/pulls/:number', requireClerkUser, githubController.getPull);
router.get('/github/repositories/:owner/:repo/branches', requireClerkUser, githubController.listBranches);
router.get('/github/repositories/:owner/:repo/issues', requireClerkUser, githubController.listIssues);
router.get('/github/repositories/:owner/:repo/search', requireClerkUser, githubController.searchCode);
router.get('/github/repositories/:owner/:repo/relationships', requireClerkUser, githubController.getRelationships);
router.post('/github/repositories/:owner/:repo/refresh', requireClerkUser, githubController.refreshRepository);
router.post('/github/repositories/:owner/:repo/index', requireClerkUser, githubController.indexRepository);
router.get('/github/repositories/:owner/:repo/index', requireClerkUser, githubController.getIndexStatus);

router.get('/github/projects/:projectId/repositories', requireClerkUser, githubController.listProjectRepositories);
router.post('/github/projects/:projectId/repositories', requireClerkUser, githubController.connectProjectRepository);
router.delete('/github/projects/:projectId/repositories/:owner/:repo', requireClerkUser, githubController.disconnectProjectRepository);

module.exports = router;

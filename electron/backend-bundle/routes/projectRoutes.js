const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const projectInitController = require('../controllers/projectInitializationController');
const { checkLimit } = require('../middleware/limitMiddleware');
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.get('/', projectController.getProjects);
router.post('/', checkLimit('projects'), projectController.createProject);
router.post('/parse-prd', upload.single('prd'), projectController.parsePRD);
router.post('/extract-prd', upload.single('prd'), projectInitController.extractPRDText);
router.get('/:id/initialization-status', projectInitController.getInitializationStatus);
router.post('/:id/initialize', upload.single('prd'), projectInitController.initializeProject);
router.post('/:id/reindex-prd', projectInitController.reindexPrd);
router.get('/:id', projectController.getProjectById);
router.get('/:id/summary', projectController.getProjectSummary);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/resource', projectController.addResource);
router.delete('/:id/resource/:rid', projectController.deleteResource);

module.exports = router;

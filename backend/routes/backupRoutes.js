const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { exportDatabase, restoreDatabase } = require('../services/backupService');

const upload = multer({ dest: 'uploads/' });

// @route   GET /api/backup/export
// @desc    Download complete offline database backup
router.get('/export', async (req, res) => {
  try {
    const backup = await exportDatabase();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `probilling-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Backup export failed: ' + err.message });
  }
});

// @route   POST /api/backup/restore
// @desc    Restore database from uploaded backup JSON file
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  try {
    let backupData;

    if (req.file) {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      backupData = JSON.parse(fileContent);
      // Clean up uploaded temp file
      fs.unlinkSync(req.file.path);
    } else if (req.body && req.body.collections) {
      backupData = req.body;
    } else {
      return res.status(400).json({ success: false, message: 'No backup file provided.' });
    }

    const counts = await restoreDatabase(backupData);
    res.status(200).json({
      success: true,
      message: 'Database restored successfully!',
      restoredCounts: counts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Restore failed: ' + err.message });
  }
});

module.exports = router;

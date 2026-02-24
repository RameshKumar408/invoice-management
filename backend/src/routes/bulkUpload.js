const express = require('express');
const router = express.Router();
const multer = require('multer');
const { bulkSaleUpload } = require('../controllers/bulkSaleController');
const { authenticate, checkBusinessAccess } = require('../middleware/auth');

// Store file in memory buffer (no disk writes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.xlsx?$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xls, .xlsx) are allowed'));
        }
    }
});

router.use(authenticate);
router.use(checkBusinessAccess);

router.post('/sale', upload.single('file'), bulkSaleUpload);

module.exports = router;

// ============================================
// Middleware de Subida de Archivos (Multer)
// ============================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../lib/logger');

const VOUCHER_DIR = path.join(__dirname, '..', 'uploads', 'vouchers');

// Crear directorio si no existe
if (!fs.existsSync(VOUCHER_DIR)) {
  fs.mkdirSync(VOUCHER_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_VOUCHER_SIZE = 5 * 1024 * 1024; // 5MB

const voucherStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VOUCHER_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `voucher-${unique}${ext}`);
  },
});

const voucherFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb({ status: 400, message: 'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP' });
};

const uploadVoucher = multer({
  storage: voucherStorage,
  limits: { fileSize: MAX_VOUCHER_SIZE },
  fileFilter: voucherFileFilter,
});

module.exports = { uploadVoucher, VOUCHER_DIR };

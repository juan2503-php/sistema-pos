// ============================================
// Controlador de Pagos (Hardened)
// ============================================
const paymentService = require('../services/paymentService');
const fs = require('fs');
const path = require('path');
const { VOUCHER_DIR } = require('../middleware/upload');

const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      if (process.env.IMGBB_API_KEY) {
        // Subir a ImgBB (Producción / Vercel)
        const base64Image = req.file.buffer.toString('base64');
        const params = new URLSearchParams();
        params.append('image', base64Image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
          method: 'POST',
          body: params,
        });

        const result = await response.json();
        if (result.success) {
          data.voucherUrl = result.data.url; // URL absoluta de ImgBB
        } else {
          return res.status(500).json({ error: 'Error al subir la imagen al servidor externo' });
        }
      } else {
        // Guardar localmente (Desarrollo)
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `voucher-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filepath = path.join(VOUCHER_DIR, filename);
        fs.writeFileSync(filepath, req.file.buffer);
        data.voucherUrl = `/uploads/vouchers/${filename}`;
      }
    }
    const payment = await paymentService.create(data);
    res.status(201).json(payment);
  } catch (error) {
    // Traducir errores de Multer a respuestas operacionales
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'La imagen del comprobante supera el límite de 5MB' });
    }
    next(error);
  }
};

const getByOrder = async (req, res, next) => {
  try {
    const payments = await paymentService.getByOrder(req.params.orderId);
    res.json(payments);
  } catch (error) { next(error); }
};

const getAll = async (req, res, next) => {
  try {
    const payments = await paymentService.getAll(req.query);
    res.json(payments);
  } catch (error) { next(error); }
};

module.exports = { create, getByOrder, getAll };

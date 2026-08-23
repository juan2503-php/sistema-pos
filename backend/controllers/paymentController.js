// ============================================
// Controlador de Pagos (Hardened)
// ============================================
const paymentService = require('../services/paymentService');

const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.voucherUrl = `/uploads/vouchers/${req.file.filename}`;
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

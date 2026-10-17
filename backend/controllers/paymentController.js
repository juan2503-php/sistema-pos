const paymentService = require('../services/paymentService');

const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      // Guardar directamente en la base de datos como Data URI (Base64)
      const mime = req.file.mimetype || 'image/webp';
      data.voucherUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
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

// ============================================
// Validadores de Input con express-validator
// ============================================
const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para procesar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth ──
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 1 }).trim().withMessage('La contraseña es requerida'),
  handleValidationErrors,
];

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('role').optional().isIn(['ADMIN', 'WAITER']).withMessage('Rol inválido'),
  handleValidationErrors,
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().isString().withMessage('Refresh token requerido'),
  handleValidationErrors,
];

// ── Parámetro ID ──
const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  handleValidationErrors,
];

// ── Orders ──
const createOrderValidation = [
  body('tableId').isInt({ min: 1 }).withMessage('ID de mesa inválido'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('ID de producto inválido'),
  body('items.*.quantity').isInt({ min: 1, max: 999 }).withMessage('Cantidad debe ser entre 1 y 999'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notas máximo 500 caracteres'),
  handleValidationErrors,
];

const updateOrderValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de orden inválido'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('ID de producto inválido'),
  body('items.*.quantity').isInt({ min: 1, max: 999 }).withMessage('Cantidad debe ser entre 1 y 999'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notas máximo 500 caracteres'),
  handleValidationErrors,
];

const updateOrderStatusValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de orden inválido'),
  body('status').isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Estado de orden inválido'),
  handleValidationErrors,
];

// ── Payments ──
const createPaymentValidation = [
  body('orderId').isInt({ min: 1 }).withMessage('ID de orden inválido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('method').optional().isIn(['CASH', 'CARD', 'TRANSFER']).withMessage('Método de pago inválido'),
  handleValidationErrors,
];

// ── Products ──
const createProductValidation = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Nombre de producto requerido (máx 200 chars)'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Descripción máximo 500 caracteres'),
  body('price').isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock debe ser >= 0'),
  body('minStock').optional().isInt({ min: 0 }).withMessage('Stock mínimo debe ser >= 0'),
  body('categoryId').isInt({ min: 1 }).withMessage('Categoría requerida'),
  body('image').optional().isString().trim(),
  handleValidationErrors,
];

const updateProductValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de producto inválido'),
  body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Nombre de producto inválido'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Descripción máximo 500 caracteres'),
  body('price').optional().isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock debe ser >= 0'),
  body('minStock').optional().isInt({ min: 0 }).withMessage('Stock mínimo debe ser >= 0'),
  body('categoryId').optional().isInt({ min: 1 }).withMessage('Categoría inválida'),
  body('image').optional().isString().trim(),
  body('active').optional().isBoolean().withMessage('Active debe ser boolean'),
  handleValidationErrors,
];

// ── Categories ──
const createCategoryValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Nombre de categoría requerido'),
  body('icon').optional().isString().trim(),
  handleValidationErrors,
];

const updateCategoryValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Nombre de categoría inválido'),
  body('icon').optional().isString().trim(),
  body('active').optional().isBoolean().withMessage('Active debe ser boolean'),
  handleValidationErrors,
];

// ── Tables ──
const createTableValidation = [
  body('number').isInt({ min: 1 }).withMessage('Número de mesa inválido'),
  body('capacity').optional().isInt({ min: 1, max: 50 }).withMessage('Capacidad debe ser entre 1 y 50'),
  handleValidationErrors,
];

const updateTableValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('number').optional().isInt({ min: 1 }).withMessage('Número de mesa inválido'),
  body('capacity').optional().isInt({ min: 1, max: 50 }).withMessage('Capacidad debe ser entre 1 y 50'),
  body('status').optional().isIn(['FREE', 'OCCUPIED', 'ATTENDED', 'PAID']).withMessage('Estado de mesa inválido'),
  handleValidationErrors,
];

const updateTableStatusValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('status').isIn(['FREE', 'OCCUPIED', 'ATTENDED', 'PAID']).withMessage('Estado de mesa inválido'),
  handleValidationErrors,
];

// ── Users ──
const updateUserValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nombre inválido'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').optional().isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
  body('active').optional().isBoolean().withMessage('Active debe ser boolean'),
  handleValidationErrors,
];

// ── Inventory ──
const addStockValidation = [
  body('productId').isInt({ min: 1 }).withMessage('ID de producto inválido'),
  body('quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Razón máximo 200 caracteres'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  idParamValidation,
  createOrderValidation,
  updateOrderValidation,
  updateOrderStatusValidation,
  createPaymentValidation,
  createProductValidation,
  updateProductValidation,
  createCategoryValidation,
  updateCategoryValidation,
  createTableValidation,
  updateTableValidation,
  updateTableStatusValidation,
  updateUserValidation,
  addStockValidation,
};

// @desc    Request validation middleware
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      msg: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      msg: 'Validation failed',
      errors
    });
  }

  next();
};

const validateHistory = (req, res, next) => {
  const { fileName, xAxis, yAxis, chartType } = req.body;
  const errors = [];

  if (!fileName || fileName.trim().length === 0) {
    errors.push('File name is required');
  }

  if (!xAxis || xAxis.trim().length === 0) {
    errors.push('X-axis is required');
  }

  if (!yAxis || yAxis.trim().length === 0) {
    errors.push('Y-axis is required');
  }

  const validChartTypes = ['bar', 'line', 'pie', '3d-surface'];
  if (!chartType || !validChartTypes.includes(chartType)) {
    errors.push('Valid chart type is required (bar, line, pie, 3d-surface)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      msg: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateHistory
};
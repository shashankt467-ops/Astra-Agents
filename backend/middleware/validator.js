import { body, validationResult } from 'express-validator';

/**
 * Validator middleware checking for express-validation errors.
 */
export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

/**
 * Text analysis validation rules.
 */
export const validateTextAnalysis = [
  body('text')
    .trim()
    .notEmpty().withMessage('Text content is required for analysis.')
    .isLength({ max: 10000 }).withMessage('Text content exceeds maximum limit of 10000 characters.'),
  checkValidationResult
];

/**
 * URL analysis validation rules.
 */
export const validateUrlAnalysis = [
  body('url')
    .trim()
    .notEmpty().withMessage('URL is required.')
    .custom((value) => {
      // Allow urls with or without http protocol
      let urlStr = value;
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'http://' + urlStr;
      }
      try {
        new URL(urlStr);
        return true;
      } catch (err) {
        throw new Error('Please enter a valid URL path.');
      }
    }),
  checkValidationResult
];

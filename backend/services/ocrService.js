import Tesseract from 'tesseract.js';

/**
 * Extracts text from an image file using Tesseract OCR.
 * @param {string} filePath - Absolute path to the image file.
 * @returns {Promise<string>} - Extracted text content.
 */
export const performOCR = async (filePath) => {
  try {
    const result = await Tesseract.recognize(filePath, 'eng');
    return result.data.text || '';
  } catch (error) {
    console.error('OCR Service Error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

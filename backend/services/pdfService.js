import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * Extracts text and URLs from a PDF file.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<{text: string, urls: string[]}>}
 */
export const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parsedData = await pdf(dataBuffer);
    const text = parsedData.text || '';

    // Regular expression to extract URLs (http/https protocols)
    const urlRegex = /https?:\/\/[^\s"'<>\(\)\[\]]+/gi;
    const urls = text.match(urlRegex) || [];
    
    // Clean and deduplicate URLs
    const uniqueUrls = [...new Set(urls.map(url => url.trim().replace(/[.,;:!]$/, '')))];

    return {
      text,
      urls: uniqueUrls
    };
  } catch (error) {
    console.error('PDF Service Error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

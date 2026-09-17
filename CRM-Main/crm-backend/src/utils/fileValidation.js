const path = require('path');

/**
 * Checks if a file is an SVG file based on its name and MIME type.
 * @param {Object} file - Multer file object
 * @returns {boolean} - True if the file is an SVG
 */
const isSvg = (file) => {
  if (!file) return false;
  const originalName = (file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();
  
  return (
    originalName.endsWith('.svg') || 
    mimeType.includes('svg') || 
    mimeType === 'image/svg+xml'
  );
};

/**
 * Returns a fileFilter function that wraps an existing fileFilter logic
 * but adds a global, strict check against SVG files.
 * @param {Function} [existingFilter] - Existing file filter function
 * @returns {Function} - The wrapped fileFilter function
 */
const makeFileFilter = (existingFilter) => {
  return (req, file, cb) => {
    if (isSvg(file)) {
      return cb(new Error('SVG files are not allowed for upload!'), false);
    }
    if (existingFilter) {
      return existingFilter(req, file, cb);
    }
    cb(null, true);
  };
};

module.exports = {
  isSvg,
  makeFileFilter
};

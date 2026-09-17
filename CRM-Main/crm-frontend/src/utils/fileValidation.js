import { toast } from "sonner";

/**
 * Checks if a file is an SVG file.
 * Returns true if the file is an SVG, false otherwise.
 * Optionally triggers a toast warning/error.
 * 
 * @param {File} file - The file to validate
 * @param {boolean} [showToast=true] - Whether to show a toast message
 * @returns {boolean} - True if it's invalid (is SVG), false if it's valid (not SVG)
 */
export const isSvgFile = (file, showToast = true) => {
  if (!file) return false;

  const fileName = file.name || '';
  const fileType = file.type || '';

  const hasSvgExtension = fileName.toLowerCase().endsWith('.svg');
  const hasSvgMimeType = fileType.toLowerCase() === 'image/svg+xml' || fileType.toLowerCase().includes('svg');

  if (hasSvgExtension || hasSvgMimeType) {
    if (showToast) {
      toast.error("SVG files are not allowed for upload!");
    }
    return true;
  }

  return false;
};

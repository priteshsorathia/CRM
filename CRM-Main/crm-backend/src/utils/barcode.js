/**
 * Generates a unique barcode for products based on custom format
 * Format: [Name Initials] + [Product ID] + [Full Timestamp] + [Random 4 digits]
 * Example: SP1017135000000001234
 */
const generateBarcode = (name = 'GV', id = '') => {
    // 1. Get Initials from name (e.g., "Sample Product" -> "SP")
    const words = name.trim().split(/\s+/);
    let letters = "";
    
    if (words.length >= 2) {
        // Take first letter of the first two words
        letters = (words[0][0] + words[1][0]).toUpperCase();
    } else {
        // Take first two letters of the single word
        letters = (words[0].substring(0, 2) || 'GV').toUpperCase();
    }
    
    // 2. Full timestamp (current milliseconds)
    const timestamp = Date.now().toString();
    
    // 3. Random 4-digit number
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Combined result
    return `${letters}${id}${timestamp}${random}`;
};

module.exports = {
    generateBarcode
};

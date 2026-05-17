/**
 * Calculates the performance completion score based on UoM rules.
 * @param {number} actual 
 * @param {number} target 
 * @param {string} uom - Enum: ['Numeric', '%', 'Timeline', 'Zero-based']
 * @param {boolean} higherIsBetter - Defaults to true for Numeric/%
 * @returns {number} Score percentage (0-100+)
 */
const calculateScore = (actual, target, uom, higherIsBetter = true) => {
    switch (uom) {
        case 'Numeric':
        case '%':
            if (target === 0) return 0; // Prevent division by zero
            return higherIsBetter 
                ? (actual / target) * 100 
                : (target / actual) * 100;
        
        case 'Timeline':
            // Binary comparative logic: Assuming 1 = met timeline, 0 = missed
            return actual >= target ? 100 : 0;
            
        case 'Zero-based':
            // e.g., Safety Incidents. If Actual == 0 then 100%, else 0%.
            return actual === 0 ? 100 : 0;
            
        default:
            return 0;
    }
};

module.exports = { calculateScore };

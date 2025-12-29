export const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];

        // Validate body
        if (schema.body) {
            const bodyErrors = validateFields(req.body, schema.body, 'body');
            errors.push(...bodyErrors);
        }

        // Validate query
        if (schema.query) {
            const queryErrors = validateFields(req.query, schema.query, 'query');
            errors.push(...queryErrors);
        }

        // Validate params
        if (schema.params) {
            const paramErrors = validateFields(req.params, schema.params, 'params');
            errors.push(...paramErrors);
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                details: errors
            });
        }

        next();
    };
};

function validateFields(data, rules, location) {
    const errors = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];

        // Required check
        if (fieldRules.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field,
                location,
                message: `${field} is required`
            });
            continue;
        }

        // Skip further validation if field is not present and not required
        if (value === undefined || value === null) continue;

        // Type check
        if (fieldRules.type) {
            const isValid = checkType(value, fieldRules.type);
            if (!isValid) {
                errors.push({
                    field,
                    location,
                    message: `${field} must be of type ${fieldRules.type}`
                });
            }
        }

        // Email format
        if (fieldRules.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push({
                    field,
                    location,
                    message: `${field} must be a valid email address`
                });
            }
        }

        // Min length
        if (fieldRules.minLength && value.length < fieldRules.minLength) {
            errors.push({
                field,
                location,
                message: `${field} must be at least ${fieldRules.minLength} characters`
            });
        }

        // Max length
        if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
            errors.push({
                field,
                location,
                message: `${field} must be at most ${fieldRules.maxLength} characters`
            });
        }

        // Min value (for numbers)
        if (fieldRules.min !== undefined && value < fieldRules.min) {
            errors.push({
                field,
                location,
                message: `${field} must be at least ${fieldRules.min}`
            });
        }

        // Pattern
        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
            errors.push({
                field,
                location,
                message: fieldRules.patternMessage || `${field} has invalid format`
            });
        }

        // Enum
        if (fieldRules.enum && !fieldRules.enum.includes(value)) {
            errors.push({
                field,
                location,
                message: `${field} must be one of: ${fieldRules.enum.join(', ')}`
            });
        }
    }

    return errors;
}

function checkType(value, type) {
    switch (type) {
        case 'string':
        case 'email':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'array':
            return Array.isArray(value);
        case 'object':
            return typeof value === 'object' && !Array.isArray(value) && value !== null;
        case 'uuid':
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(value);
        default:
            return true;
    }
}

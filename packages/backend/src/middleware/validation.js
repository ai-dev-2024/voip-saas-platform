/**
 * Request validation middleware using a simple schema validation approach
 * Could be replaced with Zod/Joi for more complex validation needs
 */

/**
 * Validation rules
 */
const rules = {
    required: (value) => value !== undefined && value !== null && value !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (min) => (value) => typeof value === 'string' && value.length >= min,
    maxLength: (max) => (value) => typeof value === 'string' && value.length <= max,
    phone: (value) => /^\+?[1-9]\d{1,14}$/.test(value), // E.164 format
    uuid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    numeric: (value) => !isNaN(parseFloat(value)) && isFinite(value),
    alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),
    in: (values) => (value) => values.includes(value),
    min: (minVal) => (value) => parseFloat(value) >= minVal,
    max: (maxVal) => (value) => parseFloat(value) <= maxVal,
    isArray: (value) => Array.isArray(value),
    isObject: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
};

/**
 * Common validation schemas
 */
export const schemas = {
    // Auth schemas
    register: {
        body: {
            email: [rules.required, rules.email],
            password: [rules.required, rules.minLength(8), rules.maxLength(100)],
            firstName: [rules.required, rules.minLength(1), rules.maxLength(100)],
            lastName: [rules.required, rules.minLength(1), rules.maxLength(100)]
        }
    },

    login: {
        body: {
            email: [rules.required, rules.email],
            password: [rules.required]
        }
    },

    refreshToken: {
        body: {
            refreshToken: [rules.required]
        }
    },

    changePassword: {
        body: {
            currentPassword: [rules.required],
            newPassword: [rules.required, rules.minLength(8), rules.maxLength(100)]
        }
    },

    updateProfile: {
        body: {
            firstName: [rules.minLength(1), rules.maxLength(100)],
            lastName: [rules.minLength(1), rules.maxLength(100)],
            phoneNumber: [rules.phone],
            timezone: [rules.maxLength(50)]
        }
    },

    // Numbers schemas
    searchNumbers: {
        query: {
            countryCode: [rules.alphanumeric, rules.maxLength(3)],
            areaCode: [rules.alphanumeric],
            type: [rules.in(['local', 'toll_free', 'mobile'])],
            limit: [rules.numeric, rules.min(1), rules.max(50)]
        }
    },

    purchaseNumber: {
        body: {
            phoneNumber: [rules.required, rules.phone]
        }
    },

    // Wallet schemas
    topUp: {
        body: {
            amount: [rules.required, rules.numeric, rules.min(5), rules.max(1000)]
        }
    },

    // Calls schemas
    initiateCall: {
        body: {
            from: [rules.required, rules.phone],
            to: [rules.required, rules.phone]
        }
    },

    // Contacts schemas
    createContact: {
        body: {
            name: [rules.required, rules.minLength(1), rules.maxLength(255)],
            phoneNumber: [rules.phone],
            email: [rules.email]
        }
    },

    updateContact: {
        params: {
            id: [rules.required, rules.uuid]
        },
        body: {
            name: [rules.minLength(1), rules.maxLength(255)],
            phoneNumber: [rules.phone],
            email: [rules.email]
        }
    },

    // UUID params
    uuidParam: {
        params: {
            id: [rules.required, rules.uuid]
        }
    }
};

/**
 * Validate a value against an array of rules
 */
function validateValue(value, validationRules, fieldName) {
    const errors = [];

    for (const rule of validationRules) {
        // Skip validation for optional fields that are undefined/null/empty
        if (!rules.required(value) && rule !== rules.required) {
            continue;
        }

        // Skip required check if value is optional
        if (rule === rules.required && !rules.required(value)) {
            errors.push(`${fieldName} is required`);
            break; // Don't check other rules if required fails
        }

        if (typeof rule === 'function') {
            const result = rule(value);
            if (result === false) {
                errors.push(`${fieldName} is invalid`);
            }
        }
    }

    return errors;
}

/**
 * Validate request against schema
 */
function validateRequest(req, schema) {
    const errors = [];

    // Validate each section (body, params, query)
    for (const [section, fields] of Object.entries(schema)) {
        const data = req[section] || {};

        for (const [field, validationRules] of Object.entries(fields)) {
            const value = data[field];
            const fieldErrors = validateValue(value, validationRules, field);
            errors.push(...fieldErrors);
        }
    }

    return errors;
}

/**
 * Validation middleware factory
 */
export function validate(schema) {
    return (req, res, next) => {
        const errors = validateRequest(req, schema);

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        next();
    };
}

/**
 * Sanitize request body by removing unknown fields
 */
export function sanitize(allowedFields) {
    return (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            const sanitized = {};
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    sanitized[field] = req.body[field];
                }
            }
            req.body = sanitized;
        }
        next();
    };
}

/**
 * Trim string fields in request body
 */
export function trimStrings(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                req.body[key] = value.trim();
            }
        }
    }
    next();
}

export default { validate, sanitize, trimStrings, schemas };

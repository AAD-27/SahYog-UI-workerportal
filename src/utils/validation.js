/**
 * Centralized validation utilities for all screens
 * Handles both field-level and form-level validation
 */

// Pattern definitions
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const passportPattern = /^[A-Z][0-9]{7}$/;

/**
 * Validate individual fields based on field type and value
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {object} options - Additional validation options (min, max length, etc.)
 * @returns {string|undefined} - Error message or undefined if valid
 */
export const validateField = (field, value, options = {}) => {
  const nameFields = ['firstName', 'middleName', 'lastName'];
  if (nameFields.includes(field) && options.maxLength == null) {
    options = { ...options, maxLength: 50 };
  }

  // Required field check
  if (options.required && !String(value).trim()) {
    return options.requiredMsg || `${options.label || field} is required.`;
  }

  // Specific field type validations
  switch (field) {
    case 'mobileNumber':
      return validateMobileNumber(value, options);
    case 'aadharNumber':
      return validateAadhar(value, options);
    case 'panNumber':
      return validatePan(value, options);
    case 'passportNumber':
      return validatePassport(value, options);
    case 'emailAddress':
      return validateEmail(value, options);
    case 'applicationDate':
      return validateApplicationDate(value, options);
    case 'dob':
      return validateDOB(value, options);
    case 'pinCode':
      return validatePinCode(value, options);
    case 'firstName':
    case 'middleName':
    case 'lastName':
      return validateTextField(value, options);
    default:
      return validateTextField(value, options);
  }
};

/**
 * Validate mobile number (10 digits)
 */
export const validateMobileNumber = (value, options = {}) => {
  if (!value.trim()) {
    return options.requiredMsg || 'Mobile number is required.';
  }
  if (value.length < 10) {
    return 'Mobile number must be 10 digits.';
  }
  if (!/^\d{10}$/.test(value)) {
    return 'Mobile number must contain only digits.';
  }
  return undefined;
};

/**
 * Validate Aadhaar number (12 digits)
 */
export const validateAadhar = (value, options = {}) => {
  if (!value.trim()) {
    return options.requiredMsg || 'Aadhaar number is required.';
  }
  if (!/^[0-9]*$/.test(value)) {
    return 'Aadhaar must be strictly numeric.';
  }
  if (value.length !== 12) {
    return 'Aadhaar must be exactly 12 digits.';
  }
  return undefined;
};

/**
 * Validate PAN number (10 characters: XXXXX0000X)
 */
export const validatePan = (value, options = {}) => {
  if (!value.trim()) {
    return undefined; // PAN is optional
  }
  if (value.length > 10) {
    return 'PAN number must not exceed 10 characters.';
  }
  if (!panPattern.test(value.trim())) {
    return 'Enter a valid PAN number in XXXXX0000X format (for example, ABCDE1111Q).';
  }
  return undefined;
};

/**
 * Validate Passport number (8 characters: X0000000)
 */
export const validatePassport = (value, options = {}) => {
  if (!value.trim()) {
    return undefined; // Passport is optional
  }
  if (!passportPattern.test(value.trim())) {
    return 'Enter a valid passport number in X0000000 format (one letter followed by seven digits).';
  }
  return undefined;
};

/**
 * Validate email address
 */
export const validateEmail = (value, options = {}) => {
  if (!value.trim()) {
    if (options.required) {
      return options.requiredMsg || 'Email address is required.';
    }
    return undefined; // Email is optional unless marked required
  }
  if (!emailPattern.test(value.trim())) {
    return 'Enter a valid email address.';
  }
  return undefined;
};

/**
 * Validate application date
 */
export const validateApplicationDate = (value, options = {}) => {
  if (!value.trim()) {
    return 'Application date is required.';
  }
  const today = new Date().toISOString().slice(0, 10);
  if (value > today) {
    return 'Application date cannot be in the future.';
  }
  return undefined;
};

/**
 * Validate date of birth
 */
export const validateDOB = (value, options = {}) => {
  if (!value.trim()) {
    return 'Date of birth is required.';
  }
  const today = new Date().toISOString().slice(0, 10);
  if (value > today) {
    return 'Date of birth cannot be in the future.';
  }
  return undefined;
};

/**
 * Validate PIN code
 */
export const validatePinCode = (value, options = {}) => {
  if (!value.trim()) {
    return 'PIN code is required.';
  }
  if (!/^\d{6}$/.test(value)) {
    return 'PIN code must be 6 digits.';
  }
  return undefined;
};

/**
 * Generic text field validation
 */
export const validateTextField = (value, options = {}) => {
  if (options.required && !value.trim()) {
    return options.requiredMsg || `This field is required.`;
  }
  if (options.minLength && value.trim().length < options.minLength) {
    return `Minimum ${options.minLength} characters required.`;
  }
  if (options.maxLength && value.trim().length > options.maxLength) {
    return `Maximum ${options.maxLength} characters allowed.`;
  }
  return undefined;
};

/**
 * Input filter: Allow only numeric characters
 * Used in onChange handlers to prevent non-numeric input
 */
export const filterNumericInput = (value) => {
  return value.replace(/\D/g, '');
};

/**
 * Input filter: Allow only alphanumeric characters
 */
export const filterAlphanumericInput = (value) => {
  return value.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Input filter: Allow only alphabets and spaces
 */
export const filterAlphabeticInput = (value) => {
  return value.replace(/[^a-zA-Z\s]/g, '');
};

/**
 * Create onChange handler for numeric fields
 * @param {function} setValue - setState function to update the field
 * @param {function} setError - setState function to update errors
 * @param {string} fieldName - Name of the field
 * @param {number} maxLength - Maximum length for the input
 * @returns {function} - onChange handler
 */
export const createNumericFieldHandler = (setValue, setError, fieldName, maxLength) => {
  return (event) => {
    const rawValue = event.target.value;
    const numericValue = filterNumericInput(rawValue).slice(0, maxLength);
    setValue(numericValue);
    if (setError) {
      setError(validateField(fieldName, numericValue));
    }
  };
};

/**
 * Create onChange handler for text fields
 * @param {function} setValue - setState function to update the field
 * @param {function} setError - setState function to update errors
 * @param {string} fieldName - Name of the field
 * @param {object} options - Validation options
 * @returns {function} - onChange handler
 */
export const createTextFieldHandler = (setValue, setError, fieldName, options = {}) => {
  return (event) => {
    const value = event.target.value;
    setValue(value);
    if (setError) {
      setError(validateField(fieldName, value, options));
    }
  };
};

/**
 * Validate entire form
 * @param {object} formData - Form data object
 * @param {object} fieldsConfig - Configuration for fields to validate
 * @returns {object} - Errors object
 */
export const validateForm = (formData, fieldsConfig) => {
  const errors = {};
  
  Object.entries(fieldsConfig).forEach(([fieldName, config]) => {
    const value = formData[fieldName];
    const error = validateField(fieldName, value, config);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

export default {
  validateField,
  validateMobileNumber,
  validateAadhar,
  validatePan,
  validatePassport,
  validateEmail,
  validateApplicationDate,
  validateDOB,
  validatePinCode,
  validateTextField,
  filterNumericInput,
  filterAlphanumericInput,
  filterAlphabeticInput,
  createNumericFieldHandler,
  createTextFieldHandler,
  validateForm,
  emailPattern,
  panPattern,
  passportPattern
};

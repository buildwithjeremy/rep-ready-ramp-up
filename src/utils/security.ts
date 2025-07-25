import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitizes text input by escaping HTML characters
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validates and formats phone numbers
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; formatted: string } => {
  if (!phone) return { isValid: false, formatted: '' };
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 or 11 digits)
  if (digits.length === 10) {
    const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return { isValid: true, formatted };
  } else if (digits.length === 11 && digits[0] === '1') {
    const formatted = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return { isValid: true, formatted };
  }
  
  return { isValid: false, formatted: phone };
};

/**
 * Validates email addresses with comprehensive pattern matching
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Password strength validation
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-5
  feedback: string[];
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password) {
    return { isValid: false, score: 0, feedback: ['Password is required'] };
  }
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  // Number check
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  // Common patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123456|abcdef|qwerty|password/i, // Common sequences
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    feedback.push('Password contains common patterns. Please use a more unique password');
    score = Math.max(0, score - 1);
  }
  
  const isValid = score >= 4 && feedback.length === 0;
  
  return { isValid, score, feedback };
};

/**
 * Generate a secure temporary password
 */
export const generateSecurePassword = (length: number = 12): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required category
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Rate limiting utility for client-side protection
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(private maxAttempts: number = 5, private windowMs: number = 15 * 60 * 1000) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create attempts array for this key
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
    
    // Update the attempts array
    this.attempts.set(key, recentAttempts);
    
    return recentAttempts.length < this.maxAttempts;
  }
  
  recordAttempt(key: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }
  
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }
}
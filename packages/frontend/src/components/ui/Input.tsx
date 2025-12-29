import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    size = 'md',
    type = 'text',
    className = '',
    id,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className={`input-wrapper ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <div className={`input-container input-${size} ${error ? 'input-error' : ''} ${leftIcon ? 'has-left-icon' : ''} ${rightIcon || isPassword ? 'has-right-icon' : ''}`}>
                {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
                <input
                    ref={ref}
                    id={inputId}
                    type={inputType}
                    className="input-field"
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="input-icon-right input-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
                {!isPassword && rightIcon && (
                    <span className="input-icon-right">{rightIcon}</span>
                )}
            </div>
            {error && <span className="input-error-message">{error}</span>}
            {hint && !error && <span className="input-hint">{hint}</span>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;

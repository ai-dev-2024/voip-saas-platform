import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react';
import { Button, Input, Card, CardContent, useToast } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import './Auth.css';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const register = useAuthStore((state) => state.register);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const getPasswordStrength = (password: string): { score: number; label: string } => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        const labels = ['Weak', 'Fair', 'Good', 'Strong'];
        return { score, label: labels[score - 1] || 'Too short' };
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        try {
            await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
            });
            success('Account created!', 'Welcome to VoIP. Start making calls now!');
            navigate('/dashboard');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            error('Registration failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="auth-gradient" />
                <div className="auth-pattern" />
            </div>

            <div className="auth-container">
                <div className="auth-logo">
                    <Phone className="auth-logo-icon" size={48} />
                    <h1 className="auth-logo-text">VoIP</h1>
                </div>

                <Card variant="glass" padding="lg" className="auth-card">
                    <CardContent>
                        <div className="auth-header">
                            <h2 className="auth-title">Create Account</h2>
                            <p className="auth-subtitle">
                                Start making international calls at the best rates
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-row">
                                <Input
                                    label="First Name"
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="John"
                                    leftIcon={<User size={18} />}
                                    error={errors.firstName}
                                    autoComplete="given-name"
                                />
                                <Input
                                    label="Last Name"
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    leftIcon={<User size={18} />}
                                    error={errors.lastName}
                                    autoComplete="family-name"
                                />
                            </div>

                            <Input
                                label="Email Address"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                leftIcon={<Mail size={18} />}
                                error={errors.email}
                                autoComplete="email"
                            />

                            <div className="password-field">
                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    leftIcon={<Lock size={18} />}
                                    error={errors.password}
                                    autoComplete="new-password"
                                />
                                {formData.password && (
                                    <div className="password-strength">
                                        <div className="password-strength-bar">
                                            <div
                                                className={`password-strength-fill strength-${passwordStrength.score}`}
                                                style={{ width: `${passwordStrength.score * 25}%` }}
                                            />
                                        </div>
                                        <span className={`password-strength-label strength-${passwordStrength.score}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Input
                                label="Confirm Password"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                leftIcon={<Lock size={18} />}
                                rightIcon={formData.confirmPassword && formData.password === formData.confirmPassword ? <Check size={18} className="text-success" /> : undefined}
                                error={errors.confirmPassword}
                                autoComplete="new-password"
                            />

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                isLoading={isLoading}
                                rightIcon={<ArrowRight size={18} />}
                            >
                                Create Account
                            </Button>
                        </form>

                        <div className="auth-footer">
                            <span className="auth-footer-text">
                                Already have an account?{' '}
                            </span>
                            <Link to="/login" className="auth-link">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="auth-terms">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" className="auth-link">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="auth-link">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
};

export default Register;

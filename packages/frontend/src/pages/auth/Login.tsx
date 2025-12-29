import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { Button, Input, Card, CardContent, useToast } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import './Auth.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        try {
            await login(formData);
            success('Welcome back!', 'You have been logged in successfully');
            navigate('/dashboard');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            error('Login failed', message);
        } finally {
            setIsLoading(false);
        }
    };

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
                            <h2 className="auth-title">Welcome Back</h2>
                            <p className="auth-subtitle">
                                Sign in to continue making calls worldwide
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
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
                                size="lg"
                            />

                            <Input
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                leftIcon={<Lock size={18} />}
                                error={errors.password}
                                autoComplete="current-password"
                                size="lg"
                            />

                            <div className="auth-forgot">
                                <Link to="/forgot-password" className="auth-link">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                isLoading={isLoading}
                                rightIcon={<ArrowRight size={18} />}
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="auth-footer">
                            <span className="auth-footer-text">
                                Don't have an account?{' '}
                            </span>
                            <Link to="/register" className="auth-link">
                                Create account
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="auth-terms">
                    By signing in, you agree to our{' '}
                    <a href="/terms" className="auth-link">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="auth-link">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
};

export default Login;

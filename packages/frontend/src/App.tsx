import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/components/ui';

// Layout
import Layout from '@/components/layout/Layout';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// App pages (lazy loaded in future)
import Dashboard from '@/pages/Dashboard';
import Numbers from '@/pages/Numbers';
import Wallet from '@/pages/Wallet';
import Calls from '@/pages/Calls';
import Settings from '@/pages/Settings';

// Loading component
const LoadingScreen = () => (
    <div className="loading-screen">
        <div className="loading-spinner" />
    </div>
);

// Protected route wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public route wrapper (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function App() {
    const checkAuth = useAuthStore((state) => state.checkAuth);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <ToastProvider>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Layout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="numbers" element={<Numbers />} />
                    <Route path="wallet" element={<Wallet />} />
                    <Route path="calls" element={<Calls />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ToastProvider>
    );
}

export default App;

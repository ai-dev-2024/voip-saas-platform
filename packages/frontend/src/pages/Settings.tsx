import React from 'react';
import { User, Bell, Shield, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const Settings: React.FC = () => {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account preferences</p>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={20} />
                                Profile Information
                            </div>
                        </CardTitle>
                        <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="First Name" defaultValue={user?.firstName} />
                                <Input label="Last Name" defaultValue={user?.lastName} />
                            </div>
                            <Input label="Email" type="email" defaultValue={user?.email} />
                            <Input label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" />
                            <Button>Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Shield size={20} />
                                Security
                            </div>
                        </CardTitle>
                        <CardDescription>Manage your password and security settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary">Change Password</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell size={20} />
                                Notifications
                            </div>
                        </CardTitle>
                        <CardDescription>Configure how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                            Notification settings coming soon
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;

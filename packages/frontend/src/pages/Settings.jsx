import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Lock, Save, Loader } from 'lucide-react';
import api from '../services/api';
import './Settings.css';

export default function Settings() {
    const { user, fetchProfile } = useAuthStore();

    const [profile, setProfile] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phoneNumber: user?.phoneNumber || ''
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [message, setMessage] = useState(null);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await api.patch('/auth/profile', profile);
            await fetchProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (passwords.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        setIsChangingPassword(true);
        setMessage(null);

        try {
            await api.post('/auth/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setMessage({ type: 'success', text: 'Password changed successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="settings-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Manage your account settings</p>
            </div>

            {message && (
                <div className={`message message-${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Settings */}
            <div className="card settings-section">
                <div className="section-header">
                    <User size={20} />
                    <h3>Profile Information</h3>
                </div>

                <form onSubmit={handleProfileUpdate}>
                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">First Name</label>
                            <input
                                type="text"
                                className="input"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Last Name</label>
                            <input
                                type="text"
                                className="input"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={user?.email || ''}
                            disabled
                        />
                        <span className="input-hint">Email cannot be changed</span>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Phone Number</label>
                        <input
                            type="tel"
                            className="input"
                            placeholder="+1234567890"
                            value={profile.phoneNumber}
                            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </form>
            </div>

            {/* Password Settings */}
            <div className="card settings-section">
                <div className="section-header">
                    <Lock size={20} />
                    <h3>Change Password</h3>
                </div>

                <form onSubmit={handlePasswordChange}>
                    <div className="input-group">
                        <label className="input-label">Current Password</label>
                        <input
                            type="password"
                            className="input"
                            value={passwords.currentPassword}
                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">New Password</label>
                            <input
                                type="password"
                                className="input"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Confirm Password</label>
                            <input
                                type="password"
                                className="input"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-secondary" disabled={isChangingPassword}>
                        {isChangingPassword ? <Loader className="animate-spin" size={18} /> : <Lock size={18} />}
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
}

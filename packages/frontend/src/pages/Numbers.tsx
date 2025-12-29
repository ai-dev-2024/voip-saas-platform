import React, { useState, useEffect } from 'react';
import { Phone, Search, Globe, Plus, Trash2, MapPin, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Modal, useToast } from '@/components/ui';
import api from '@/services/api';
import './Numbers.css';

interface AvailableNumber {
    phoneNumber: string;
    region?: string;
    type: string;
    monthlyRate: number;
    setupRate: number;
    features: string[];
}

interface UserNumber {
    id: string;
    phoneNumber: string;
    countryCode: string;
    region?: string;
    type: string;
    monthlyCost: number;
    status: string;
    purchasedAt: string;
}

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'JP', name: 'Japan' },
];

const Numbers: React.FC = () => {
    const { success, error } = useToast();

    // State
    const [userNumbers, setUserNumbers] = useState<UserNumber[]>([]);
    const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null);
    const [numberToRelease, setNumberToRelease] = useState<UserNumber | null>(null);

    // Search filters
    const [countryCode, setCountryCode] = useState('US');
    const [areaCode, setAreaCode] = useState('');
    const [numberType, setNumberType] = useState<'local' | 'toll_free'>('local');

    // Load user's numbers on mount
    useEffect(() => {
        loadUserNumbers();
    }, []);

    const loadUserNumbers = async () => {
        try {
            const response = await api.get('/numbers');
            setUserNumbers(response.data.numbers);
        } catch (err) {
            error('Failed to load numbers', 'Please try again');
        }
    };

    const searchNumbers = async () => {
        setIsSearching(true);
        try {
            const params = new URLSearchParams({
                countryCode,
                type: numberType,
                limit: '20'
            });
            if (areaCode) params.append('areaCode', areaCode);

            const response = await api.get(`/numbers/search?${params}`);
            setAvailableNumbers(response.data.numbers);

            if (response.data.numbers.length === 0) {
                error('No numbers found', 'Try different search criteria');
            }
        } catch (err) {
            error('Search failed', 'Please try again');
        } finally {
            setIsSearching(false);
        }
    };

    const purchaseNumber = async () => {
        if (!selectedNumber) return;

        setIsLoading(true);
        try {
            await api.post('/numbers/purchase', {
                phoneNumber: selectedNumber.phoneNumber
            });

            success('Number purchased!', `${selectedNumber.phoneNumber} is now yours`);
            setSelectedNumber(null);
            setAvailableNumbers([]);
            loadUserNumbers();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Purchase failed';
            error('Purchase failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    const releaseNumber = async () => {
        if (!numberToRelease) return;

        setIsLoading(true);
        try {
            await api.delete(`/numbers/${numberToRelease.id}`);
            success('Number released', `${numberToRelease.phoneNumber} has been released`);
            setNumberToRelease(null);
            loadUserNumbers();
        } catch (err) {
            error('Release failed', 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhoneNumber = (phone: string) => {
        if (phone.startsWith('+1') && phone.length === 12) {
            return `${phone.slice(0, 2)} (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
        }
        return phone;
    };

    return (
        <div className="numbers-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Phone Numbers</h1>
                    <p className="page-subtitle">Purchase and manage virtual phone numbers from 140+ countries</p>
                </div>
            </header>

            {/* Search Panel */}
            <Card className="search-panel">
                <CardHeader>
                    <CardTitle>
                        <Search size={20} />
                        Search Available Numbers
                    </CardTitle>
                    <CardDescription>Find the perfect number for your business</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="search-form">
                        <div className="search-field">
                            <label>Country</label>
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="search-select"
                            >
                                {COUNTRIES.map(country => (
                                    <option key={country.code} value={country.code}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="search-field">
                            <label>Area Code</label>
                            <Input
                                placeholder="e.g., 212"
                                value={areaCode}
                                onChange={(e) => setAreaCode(e.target.value)}
                                leftIcon={<MapPin size={16} />}
                            />
                        </div>

                        <div className="search-field">
                            <label>Number Type</label>
                            <div className="type-toggle">
                                <button
                                    className={`type-btn ${numberType === 'local' ? 'active' : ''}`}
                                    onClick={() => setNumberType('local')}
                                >
                                    Local
                                </button>
                                <button
                                    className={`type-btn ${numberType === 'toll_free' ? 'active' : ''}`}
                                    onClick={() => setNumberType('toll_free')}
                                >
                                    Toll-Free
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={searchNumbers}
                            isLoading={isSearching}
                            leftIcon={<Search size={18} />}
                        >
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Available Numbers */}
            {availableNumbers.length > 0 && (
                <Card className="results-panel">
                    <CardHeader>
                        <CardTitle>Available Numbers</CardTitle>
                        <CardDescription>{availableNumbers.length} numbers found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="numbers-grid">
                            {availableNumbers.map((num) => (
                                <div
                                    key={num.phoneNumber}
                                    className="number-card available"
                                    onClick={() => setSelectedNumber(num)}
                                >
                                    <div className="number-phone">
                                        {formatPhoneNumber(num.phoneNumber)}
                                    </div>
                                    <div className="number-meta">
                                        {num.region && <span>{num.region}</span>}
                                        <span className="number-type">{num.type}</span>
                                    </div>
                                    <div className="number-price">
                                        ${num.monthlyRate.toFixed(2)}/mo
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* User's Numbers */}
            <Card className="my-numbers">
                <CardHeader>
                    <CardTitle>
                        <Phone size={20} />
                        Your Numbers
                    </CardTitle>
                    <CardDescription>Manage your active phone numbers</CardDescription>
                </CardHeader>
                <CardContent>
                    {userNumbers.length === 0 ? (
                        <div className="empty-state">
                            <Phone size={48} className="empty-icon" />
                            <p>No numbers yet</p>
                            <span>Search and purchase your first number above</span>
                        </div>
                    ) : (
                        <div className="numbers-list">
                            {userNumbers.map((num) => (
                                <div key={num.id} className="number-row">
                                    <div className="number-info">
                                        <div className="number-phone">
                                            {formatPhoneNumber(num.phoneNumber)}
                                        </div>
                                        <div className="number-meta">
                                            <span className="number-status">
                                                <CheckCircle size={14} />
                                                Active
                                            </span>
                                            <span>${num.monthlyCost.toFixed(2)}/mo</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setNumberToRelease(num)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Purchase Modal */}
            <Modal
                isOpen={!!selectedNumber}
                onClose={() => setSelectedNumber(null)}
                title="Confirm Purchase"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setSelectedNumber(null)}>
                            Cancel
                        </Button>
                        <Button onClick={purchaseNumber} isLoading={isLoading}>
                            Purchase Number
                        </Button>
                    </>
                }
            >
                {selectedNumber && (
                    <div className="purchase-confirm">
                        <div className="confirm-number">
                            {formatPhoneNumber(selectedNumber.phoneNumber)}
                        </div>
                        <div className="confirm-details">
                            <div className="confirm-row">
                                <span>Monthly Cost</span>
                                <span>${selectedNumber.monthlyRate.toFixed(2)}/mo</span>
                            </div>
                            <div className="confirm-row">
                                <span>Setup Fee</span>
                                <span>${selectedNumber.setupRate.toFixed(2)}</span>
                            </div>
                            <div className="confirm-row total">
                                <span>Due Today</span>
                                <span>${(selectedNumber.setupRate + selectedNumber.monthlyRate).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Release Modal */}
            <Modal
                isOpen={!!numberToRelease}
                onClose={() => setNumberToRelease(null)}
                title="Release Number"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setNumberToRelease(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={releaseNumber} isLoading={isLoading}>
                            Release Number
                        </Button>
                    </>
                }
            >
                {numberToRelease && (
                    <div className="release-confirm">
                        <p>Are you sure you want to release this number?</p>
                        <div className="confirm-number">
                            {formatPhoneNumber(numberToRelease.phoneNumber)}
                        </div>
                        <p className="release-warning">
                            This action cannot be undone. You may not be able to get this number back.
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Numbers;

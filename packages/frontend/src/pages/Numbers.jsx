import { useState, useEffect } from 'react';
import { Phone, Search, MapPin, Plus, Trash2, Loader } from 'lucide-react';
import api from '../services/api';
import './Numbers.css';

export default function Numbers() {
    const [userNumbers, setUserNumbers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(null);

    const [searchParams, setSearchParams] = useState({
        countryCode: 'US',
        areaCode: '',
        type: 'local'
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchUserNumbers();
    }, []);

    const fetchUserNumbers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/numbers');
            setUserNumbers(response.data.numbers || []);
        } catch (err) {
            setError('Failed to load your numbers');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        setError(null);

        try {
            const response = await api.get('/numbers/search', { params: searchParams });
            setSearchResults(response.data.numbers || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handlePurchase = async (phoneNumber) => {
        setIsPurchasing(phoneNumber);
        setError(null);

        try {
            await api.post('/numbers/purchase', { phoneNumber });
            setSuccess(`Successfully purchased ${phoneNumber}`);
            setSearchResults(prev => prev.filter(n => n.phoneNumber !== phoneNumber));
            fetchUserNumbers();
        } catch (err) {
            setError(err.response?.data?.message || 'Purchase failed');
        } finally {
            setIsPurchasing(null);
        }
    };

    const handleRelease = async (id, phoneNumber) => {
        if (!confirm(`Are you sure you want to release ${phoneNumber}?`)) return;

        try {
            await api.delete(`/numbers/${id}`);
            setSuccess(`Released ${phoneNumber}`);
            fetchUserNumbers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to release number');
        }
    };

    return (
        <div className="numbers-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Phone Numbers</h1>
                <p className="page-subtitle">Purchase and manage your DID numbers</p>
            </div>

            {/* Messages */}
            {error && <div className="message message-error">{error}</div>}
            {success && <div className="message message-success">{success}</div>}

            {/* Search Section */}
            <div className="card search-card">
                <h3 className="card-title">Search Available Numbers</h3>

                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-fields">
                        <div className="input-group">
                            <label className="input-label">Country</label>
                            <select
                                className="input"
                                value={searchParams.countryCode}
                                onChange={(e) => setSearchParams({ ...searchParams, countryCode: e.target.value })}
                            >
                                <option value="US">United States</option>
                                <option value="CA">Canada</option>
                                <option value="GB">United Kingdom</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Area Code</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. 212"
                                value={searchParams.areaCode}
                                onChange={(e) => setSearchParams({ ...searchParams, areaCode: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Type</label>
                            <select
                                className="input"
                                value={searchParams.type}
                                onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                            >
                                <option value="local">Local</option>
                                <option value="toll_free">Toll Free</option>
                                <option value="mobile">Mobile</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isSearching}>
                        {isSearching ? <Loader className="animate-spin" size={18} /> : <Search size={18} />}
                        Search
                    </button>
                </form>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="card">
                    <h3 className="card-title">Available Numbers</h3>
                    <div className="numbers-grid">
                        {searchResults.map((num) => (
                            <div key={num.phoneNumber} className="number-card available">
                                <div className="number-info">
                                    <div className="phone-number">{num.phoneNumber}</div>
                                    <div className="number-meta">
                                        <span><MapPin size={14} /> {num.region || 'Unknown'}</span>
                                        <span className="number-type">{num.type}</span>
                                    </div>
                                </div>
                                <div className="number-price">
                                    <span className="price">${num.monthlyRate?.toFixed(2) || '1.00'}/mo</span>
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handlePurchase(num.phoneNumber)}
                                        disabled={isPurchasing === num.phoneNumber}
                                    >
                                        {isPurchasing === num.phoneNumber ? (
                                            <Loader className="animate-spin" size={16} />
                                        ) : (
                                            <><Plus size={16} /> Buy</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User's Numbers */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">My Numbers</h3>
                    <span className="badge badge-info">{userNumbers.length} active</span>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <Loader className="animate-spin" size={32} />
                    </div>
                ) : userNumbers.length > 0 ? (
                    <div className="numbers-list">
                        {userNumbers.map((num) => (
                            <div key={num.id} className="number-item">
                                <div className="number-icon">
                                    <Phone size={20} />
                                </div>
                                <div className="number-details">
                                    <div className="phone-number">{num.phoneNumber}</div>
                                    <div className="number-meta">
                                        <span className="badge badge-success">Active</span>
                                        <span>${num.monthlyCost?.toFixed(2) || '1.00'}/mo</span>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm text-danger"
                                    onClick={() => handleRelease(num.id, num.phoneNumber)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Phone size={48} />
                        <h4>No numbers yet</h4>
                        <p>Search and purchase your first DID number above</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// User types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatarUrl?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    timezone: string;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    firstName: string;
    lastName: string;
}

// Wallet types
export interface Wallet {
    balance: number;
    currency: string;
}

export interface Transaction {
    id: string;
    walletId: string;
    amount: number;
    type: 'credit' | 'debit' | 'refund';
    category: string;
    description: string;
    balanceAfter: number;
    createdAt: string;
}

// DID Number types
export interface DIDNumber {
    id: string;
    phoneNumber: string;
    countryCode: string;
    region?: string;
    type: 'local' | 'toll_free' | 'mobile';
    monthlyCost: number;
    status: 'active' | 'suspended' | 'released';
    features: DIDFeatures;
    purchasedAt: string;
}

export interface DIDFeatures {
    smsEnabled: boolean;
    mmsEnabled: boolean;
    voiceEnabled: boolean;
    forwardTo?: string;
}

export interface AvailableNumber {
    phoneNumber: string;
    region?: string;
    type: string;
    monthlyRate: number;
    setupRate: number;
    features: string[];
}

// Call types
export type CallState = 'idle' | 'connecting' | 'ringing' | 'active' | 'ended';
export type CallDirection = 'inbound' | 'outbound';

export interface Call {
    id: string;
    callId: string;
    fromNumber: string;
    toNumber: string;
    direction: CallDirection;
    status: string;
    durationSeconds: number;
    cost: number;
    recordingUrl?: string;
    startedAt: string;
    endedAt?: string;
}

export interface CallStoreState {
    callState: CallState;
    currentCall: Call | null;
    dialNumber: string;
    isMuted: boolean;
    isOnHold: boolean;
    isVideoEnabled: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}

// Contact types
export interface Contact {
    id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    avatarUrl?: string;
    isFavorite: boolean;
    notes?: string;
    createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// WebRTC types
export interface WebRTCCredentials {
    token: string;
    sipUsername: string;
}

// UI Component types
export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

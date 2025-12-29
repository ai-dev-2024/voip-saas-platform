import { create } from 'zustand';
import api from '../services/api';

export const useCallStore = create((set, get) => ({
    // WebRTC state
    client: null,
    call: null,
    callState: 'idle', // idle, connecting, ringing, active, ended
    isMuted: false,
    isOnHold: false,

    // Dialer
    dialNumber: '',
    selectedFromNumber: null,

    // CDR
    callHistory: [],
    callStats: null,
    pagination: null,

    isLoading: false,
    error: null,

    // Token management
    webrtcToken: null,

    setClient: (client) => set({ client }),

    setCall: (call) => set({ call }),

    setCallState: (state) => set({ callState: state }),

    setDialNumber: (number) => set({ dialNumber: number }),

    setSelectedFromNumber: (number) => set({ selectedFromNumber: number }),

    toggleMute: () => {
        const { call, isMuted } = get();
        if (call) {
            if (isMuted) {
                call.unmute();
            } else {
                call.mute();
            }
            set({ isMuted: !isMuted });
        }
    },

    toggleHold: () => {
        const { call, isOnHold } = get();
        if (call) {
            if (isOnHold) {
                call.unhold();
            } else {
                call.hold();
            }
            set({ isOnHold: !isOnHold });
        }
    },

    hangup: () => {
        const { call } = get();
        if (call) {
            call.hangup();
        }
        set({ call: null, callState: 'idle', isMuted: false, isOnHold: false });
    },

    fetchWebRTCToken: async () => {
        try {
            const response = await api.get('/calls/token');
            set({ webrtcToken: response.data });
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to get WebRTC token' });
            return null;
        }
    },

    fetchCallHistory: async (params = {}) => {
        set({ isLoading: true });
        try {
            const response = await api.get('/calls/history', { params });
            set({
                callHistory: response.data.records,
                pagination: response.data.pagination,
                error: null
            });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to fetch call history' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchCallStats: async (period = '30d') => {
        try {
            const response = await api.get('/calls/stats', { params: { period } });
            set({ callStats: response.data });
        } catch (error) {
            console.error('Failed to fetch call stats:', error);
        }
    },

    resetCallState: () => {
        set({
            call: null,
            callState: 'idle',
            isMuted: false,
            isOnHold: false,
            dialNumber: ''
        });
    }
}));

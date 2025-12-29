import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

export default function DashboardScreen() {
    const user = useAuthStore((state) => state.user);

    const stats = [
        { icon: 'call', label: 'Active Numbers', value: '0', color: '#00AFF0' },
        { icon: 'globe', label: 'Countries', value: '140+', color: '#6264A7' },
        { icon: 'time', label: 'Minutes', value: '0', color: '#0AA30A' },
        { icon: 'wallet', label: 'Balance', value: '$0.00', color: '#F0883E' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Welcome */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.name}>{user?.firstName || 'User'}!</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    {stats.map((stat) => (
                        <View key={stat.label} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionCard}>
                            <Ionicons name="call-outline" size={24} color="#00AFF0" />
                            <Text style={styles.actionLabel}>Get Number</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard}>
                            <Ionicons name="wallet-outline" size={24} color="#00AFF0" />
                            <Text style={styles.actionLabel}>Add Funds</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Calls */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Calls</Text>
                    <View style={styles.emptyState}>
                        <Ionicons name="call-outline" size={48} color="#30363D" />
                        <Text style={styles.emptyText}>No recent calls</Text>
                        <Text style={styles.emptySubtext}>Your call history will appear here</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1117',
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: '#8B949E',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#E6EDF3',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#161B22',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E6EDF3',
    },
    statLabel: {
        fontSize: 14,
        color: '#8B949E',
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#E6EDF3',
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#161B22',
        borderRadius: 12,
        padding: 16,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#E6EDF3',
    },
    emptyState: {
        backgroundColor: '#161B22',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#E6EDF3',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#8B949E',
        marginTop: 4,
    },
});

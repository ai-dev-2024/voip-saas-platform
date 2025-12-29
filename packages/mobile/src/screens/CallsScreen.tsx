import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CallsScreen() {
    const calls: any[] = []; // Will be populated from API

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                {calls.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="call-outline" size={64} color="#30363D" />
                        <Text style={styles.emptyText}>No calls yet</Text>
                        <Text style={styles.emptySubtext}>Your call history will appear here</Text>
                    </View>
                ) : (
                    calls.map((call) => (
                        <TouchableOpacity key={call.id} style={styles.callRow}>
                            <View style={[styles.callIcon, call.direction === 'inbound' ? styles.inbound : styles.outbound]}>
                                <Ionicons
                                    name={call.direction === 'inbound' ? 'call-incoming' : 'call-outgoing'}
                                    size={20}
                                    color={call.direction === 'inbound' ? '#0AA30A' : '#6264A7'}
                                />
                            </View>
                            <View style={styles.callInfo}>
                                <Text style={styles.callNumber}>{call.number}</Text>
                                <Text style={styles.callMeta}>{call.time}</Text>
                            </View>
                            <Text style={styles.callDuration}>{call.duration}</Text>
                        </TouchableOpacity>
                    ))
                )}
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
        flexGrow: 1,
        padding: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#E6EDF3',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#8B949E',
        marginTop: 8,
    },
    callRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161B22',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    callIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    inbound: {
        backgroundColor: 'rgba(10, 163, 10, 0.2)',
    },
    outbound: {
        backgroundColor: 'rgba(98, 100, 167, 0.2)',
    },
    callInfo: {
        flex: 1,
    },
    callNumber: {
        fontSize: 16,
        fontWeight: '500',
        color: '#E6EDF3',
    },
    callMeta: {
        fontSize: 14,
        color: '#8B949E',
        marginTop: 4,
    },
    callDuration: {
        fontSize: 14,
        color: '#8B949E',
    },
});

import { Text, View, useThemeColor } from '@/components/Themed';
import { useAssignMoney, useCategories, useTransactions } from '@/hooks/budgetHooks';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

export default function CategoryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const { data: categories } = useCategories();
    const { data: allTransactions } = useTransactions();
    const assignMoney = useAssignMoney();

    const tintColor = useThemeColor({}, 'tint');
    const surfaceColor = useThemeColor({}, 'surface');
    const mutedColor = useThemeColor({}, 'muted');
    const dangerColor = useThemeColor({}, 'danger');

    // 1. Find this specific envelope
    const envelope = useMemo(() => {
        return categories?.flatMap(g => g.envelopes).find(e => e.id === Number(id));
    }, [categories, id]);

    // 2. Filter transactions for this envelope only
    const history = useMemo(() => {
        return allTransactions?.filter(t => t.categoryId === Number(id)) || [];
    }, [allTransactions, id]);

    const handleReleaseToRTA = () => {
        if (!envelope || envelope.available <= 0) return;

        Alert.alert(
            "Move to Ready to Assign?",
            `This will take the full $${envelope.available.toLocaleString()} out of this envelope and put it back into your main budget pool.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Move Money",
                    style: "default",
                    onPress: () => {
                        assignMoney.mutate({
                            categoryId: envelope.id,
                            amount: -envelope.available
                        }, {
                            onSuccess: () => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                        });
                    }
                }
            ]
        );
    };

    if (!envelope) return <View style={styles.container}><Text>Loading...</Text></View>;

    return (
        <View style={styles.container}>
            {/* Header / Hero Section */}
            <View style={[styles.hero, { backgroundColor: surfaceColor }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color={tintColor} />
                </TouchableOpacity>

                <Text style={[styles.label, { color: mutedColor }]}>{envelope.name} Available</Text>
                <Text style={styles.balance}>${envelope.available.toLocaleString()}</Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: tintColor }]}
                        onPress={handleReleaseToRTA}
                    >
                        <Ionicons name="arrow-up-circle-outline" size={20} color={tintColor} />
                        <Text style={[styles.actionBtnText, { color: tintColor }]}>Move to RTA</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { borderColor: mutedColor }]}>
                        <Ionicons name="create-outline" size={20} color={mutedColor} />
                        <Text style={[styles.actionBtnText, { color: mutedColor }]}>Edit Goal</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* History Section */}
            <View style={styles.historySection}>
                <Text style={[styles.sectionTitle, { color: mutedColor }]}>Envelope Activity</Text>
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.txRow}>
                            <View style={styles.txInfo}>
                                <Text style={styles.txPayee}>{item.payee}</Text>
                                <Text style={[styles.txDate, { color: mutedColor }]}>
                                    {new Date(item.date).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={[styles.txAmount, { color: item.amount < 0 ? dangerColor : tintColor }]}>
                                {item.amount < 0 ? '-' : '+'}${Math.abs(item.amount).toFixed(2)}
                            </Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={[styles.empty, { color: mutedColor }]}>No transactions for this envelope yet.</Text>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: {
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    backBtn: { position: 'absolute', top: 55, left: 20 },
    label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    balance: { fontSize: 48, fontWeight: '800', marginVertical: 10 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8
    },
    actionBtnText: { fontWeight: '700', fontSize: 14 },
    historySection: { flex: 1, padding: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 1 },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)'
    },
    txInfo: { flex: 1 },
    txPayee: { fontSize: 16, fontWeight: '600' },
    txDate: { fontSize: 12, marginTop: 2 },
    txAmount: { fontSize: 16, fontWeight: '700' },
    empty: { textAlign: 'center', marginTop: 40, fontSize: 14 }
});
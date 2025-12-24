import { Text, useThemeColor, View } from '@/components/Themed';
import { useAccounts, useAddTransaction, useTransactions } from '@/hooks/budgetHooks';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function AccountDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [isReconcileVisible, setIsReconcileVisible] = useState(false);
    const [reconcileValue, setReconcileValue] = useState('');

    const { data: accounts } = useAccounts();
    const { data: allTransactions } = useTransactions();
    const addTx = useAddTransaction();

    const tintColor = useThemeColor({}, 'tint');
    const surfaceColor = useThemeColor({}, 'surface');
    const mutedColor = useThemeColor({}, 'muted');
    const dangerColor = useThemeColor({}, 'danger');
    const successColor = useThemeColor({}, 'success');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const backgroundColor = useThemeColor({}, 'background');

    // 1. Find this specific account
    const account = useMemo(() => {
        return accounts?.find(a => a.id === Number(id));
    }, [accounts, id]);

    // 2. Filter transactions involving this account
    const history = useMemo(() => {
        return allTransactions?.filter(t => t.accountId === Number(id)) || [];
    }, [allTransactions, id]);

    const createAdjustment = (diff: number) => {
        addTx.mutate({
            accountId: Number(id),
            categoryId: null,
            amount: diff,
            transferId: null,
            type: diff > 0 ? 'income' : 'expense',
            payee: "Balance Adjustment",
            date: new Date(),
        }, {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Account balance adjusted to match your bank.");
            }
        });
    };

    if (!account) return <View style={styles.container}><Text>Account not found</Text></View>;

    return (
        <View style={styles.container}>
            {/* Header / Hero Section */}
            <View style={[styles.hero, { backgroundColor: surfaceColor }]}>

                <Text style={[styles.label, { color: mutedColor }]}>{account.name} Balance</Text>
                <Text style={[styles.balance, { color: account.balance < 0 ? dangerColor : tintColor }]}>
                    ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{account.type.toUpperCase()}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.reconcileBtn, { borderColor: tintColor }]}
                    onPress={() => setIsReconcileVisible(true)}
                >
                    <Ionicons name="checkmark-done-circle-outline" size={16} color={tintColor} />
                    <Text style={[styles.reconcileText, { color: tintColor }]}>RECONCILE</Text>
                </TouchableOpacity>
            </View>

            {/* History Section */}
            <View style={styles.historySection}>
                <Text style={[styles.sectionTitle, { color: mutedColor }]}>Recent Activity</Text>
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isNegative = item.amount < 0;

                        return (
                            <View style={styles.txRow}>
                                <View style={[styles.iconCircle, { backgroundColor: isNegative ? 'rgba(255,82,82,0.1)' : 'rgba(76,175,80,0.1)' }]}>
                                    <Ionicons
                                        name={item.type === 'transfer' ? 'swap-horizontal' : (isNegative ? 'arrow-down' : 'arrow-up')}
                                        size={20}
                                        color={isNegative ? dangerColor : successColor}
                                    />
                                </View>

                                <View style={styles.txInfo}>
                                    <Text style={styles.txPayee} numberOfLines={1}>{item.payee}</Text>
                                    <Text style={[styles.txDate, { color: mutedColor }]}>
                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        {item.type === 'transfer' && " • Transfer"}
                                    </Text>
                                </View>

                                <Text style={[styles.txAmount, { color: isNegative ? dangerColor : successColor }]}>
                                    {isNegative ? '-' : '+'}${Math.abs(item.amount).toFixed(2)}
                                </Text>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={mutedColor} style={{ opacity: 0.5 }} />
                            <Text style={[styles.empty, { color: mutedColor }]}>No transactions found for this account.</Text>
                        </View>
                    }
                />
            </View>

            <Modal
                visible={isReconcileVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsReconcileVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
                        <Text style={styles.modalTitle}>Reconcile Account</Text>
                        <Text style={[styles.modalSub, { color: mutedColor }]}>
                            Current app balance: ${account?.balance.toFixed(2)}
                        </Text>

                        <TextInput
                            style={[styles.modalInput, { color: textColor, borderColor: borderColor }]}
                            placeholder="Enter actual balance"
                            placeholderTextColor={mutedColor}
                            keyboardType="decimal-pad"
                            autoFocus
                            value={reconcileValue}
                            onChangeText={setReconcileValue}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => setIsReconcileVisible(false)}
                            >
                                <Text style={{ color: mutedColor }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: tintColor, borderRadius: 8 }]}
                                onPress={() => {
                                    const val = parseFloat(reconcileValue);
                                    if (isNaN(val)) return;
                                    createAdjustment(val - account.balance);
                                    setIsReconcileVisible(false);
                                    setReconcileValue('');
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: {
        padding: 24,
        paddingTop: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        zIndex: 10,
    },
    backBtn: { position: 'absolute', top: 55, left: 20 },
    label: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    balance: { fontSize: 42, fontWeight: '800', marginVertical: 8 },
    badge: {
        backgroundColor: 'rgba(150,150,150,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4
    },
    badgeText: { fontSize: 10, fontWeight: '800', opacity: 0.6 },
    historySection: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 15, marginLeft: 5 },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)'
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    txInfo: { flex: 1 },
    txPayee: { fontSize: 16, fontWeight: '600' },
    txDate: { fontSize: 12, marginTop: 2 },
    txAmount: { fontSize: 16, fontWeight: '700' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    empty: { textAlign: 'center', marginTop: 10, fontSize: 14 },
    reconcileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        marginTop: 15,
        backgroundColor: 'transparent',
    },
    reconcileText: {
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        padding: 24,
        borderRadius: 20,
        elevation: 5,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    modalSub: { fontSize: 14, marginBottom: 20 },
    modalInput: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        fontSize: 18,
        marginBottom: 20
    },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20 },
});
import AddAccountModal from '@/components/modals/AddAccountModal';
import { useThemeColor } from '@/components/Themed';
import { useAccounts } from '@/hooks/budgetHooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccountsScreen() {
    const router = useRouter();
    const { data: accounts, isLoading } = useAccounts();
    const [isModalVisible, setModalVisible] = useState(false);

    const tintColor = useThemeColor({}, 'tint');
    const surfaceColor = useThemeColor({}, 'surface');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    // Calculate total across all accounts
    const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;
    // Inside your AccountDetailScreen...


    const renderAccountItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => { router.push({ pathname: `/accounts/[id]`, params: { id: item.id } }); }}>
            <View style={[styles.accountCard, { backgroundColor: surfaceColor }]}>
                <View style={styles.accountIcon}>
                    <Ionicons
                        name={item.type === 'Savings' ? 'leaf-outline' : 'card-outline'}
                        size={24}
                        color={tintColor}
                    />
                </View>
                <View style={styles.accountDetails}>
                    <Text style={[styles.accountName, { color: textColor }]}>{item.name}</Text>
                    <Text style={[styles.accountType, { color: mutedColor }]}>{item.type}</Text>
                </View>
                <Text style={[styles.accountBalance, { color: textColor }]}>
                    ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.label, { color: mutedColor }]}>Total Liquidity</Text>
                <Text style={[styles.totalAmount, { color: textColor }]}>
                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
            </View>

            <FlatList
                data={accounts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAccountItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={{ color: mutedColor }}>No accounts added yet.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: tintColor }]}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <AddAccountModal isVisible={isModalVisible} onClose={() => setModalVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)',
    },
    label: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    totalAmount: { fontSize: 36, fontWeight: '800', marginTop: 8 },
    listContent: { padding: 20, paddingBottom: 100 },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    accountIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(150,150,150,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    accountDetails: { flex: 1 },
    accountName: { fontSize: 17, fontWeight: '700' },
    accountType: { fontSize: 13, marginTop: 2 },
    accountBalance: { fontSize: 17, fontWeight: '800' },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    emptyState: { alignItems: 'center', marginTop: 40 },
    reconcileBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 8,
    }
});
import { Text, View, useThemeColor } from '@/components/Themed';
import { useDeleteTransaction, useTransactions } from '@/hooks/budgetHooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export default function TransactionsScreen() {
    const router = useRouter();
    const { data: transactions } = useTransactions();
    const deleteTx = useDeleteTransaction();
    const [searchQuery, setSearchQuery] = useState('');

    const backgroundColor = useThemeColor({}, 'background');
    const surfaceColor = useThemeColor({}, 'surface');
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({}, 'muted');
    const dangerColor = useThemeColor({}, 'danger');
    const successColor = useThemeColor({}, 'success');
    const borderColor = useThemeColor({}, 'border');

    const handleDelete = (id: number) => {
        Alert.alert("Delete Transaction", "Are you sure? This will refund the money to your envelope and account.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteTx.mutate(id)
            }
        ]);
    };

    const sections = useMemo(() => {
        if (!transactions) return [];
        const filtered = transactions.filter(t =>
            t.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        const groups = filtered.reduce((acc, transaction) => {
            const date = new Date(transaction.date).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(transaction);
            return acc;
        }, {} as Record<string, any[]>);
        return Object.keys(groups).map(date => ({ title: date, data: groups[date] }));
    }, [transactions, searchQuery]);

    // The red action button that appears behind the row
    const renderRightActions = (id: number) => (
        <TouchableOpacity
            style={[styles.deleteAction, { backgroundColor: dangerColor }]}
            onPress={() => handleDelete(id)}
        >
            <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
    );

    const renderItem = ({ item }: { item: any }) => (
        <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <View style={[styles.txItem, { backgroundColor: backgroundColor, borderBottomColor: borderColor }]}>
                <View style={[styles.txIcon, { backgroundColor: borderColor + '40' }]}>
                    <Ionicons
                        name={item.amount < 0 ? "cart-outline" : "cash-outline"}
                        size={20}
                        color={item.amount < 0 ? dangerColor : successColor}
                    />
                </View>
                <TouchableOpacity
                    onPress={() => {
                        if (item.type === 'transfer') {
                            Alert.alert(
                                "Transfer Detected",
                                "To maintain account integrity, transfers cannot be edited directly. Would you like to delete it and start over?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Delete Transfer", style: "destructive", onPress: () => handleDelete(item.id) }
                                ]
                            );
                        } else {
                            router.push({
                                pathname: "/modals/new-transaction",
                                params: { editingId: item.id }
                            })
                        }
                    }}
                    style={styles.txDetails}>
                    <View style={styles.txDetails}>
                        <Text style={[styles.payeeText, { color: textColor }]} numberOfLines={1}>{item.payee}</Text>
                        <Text style={[styles.subText, { color: mutedColor }]}>
                            {item.categoryName || 'No Envelope'} • {item.accountName}
                        </Text>
                    </View>
                </TouchableOpacity>
                <Text style={[styles.amountText, { color: item.amount < 0 ? dangerColor : successColor }]}>
                    {item.amount < 0 ? '-' : '+'}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
            </View>
        </Swipeable>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor }]}>
                <View style={[styles.searchContainer, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
                    <Ionicons name="search" size={18} color={mutedColor} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search activity..."
                        placeholderTextColor={mutedColor}
                        style={[styles.searchInput, { color: textColor }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={[styles.sectionHeader, { backgroundColor }]}>
                            <Text style={[styles.sectionTitle, { color: mutedColor }]}>{title}</Text>
                        </View>
                    )}
                    stickySectionHeadersEnabled={true}
                    contentContainerStyle={styles.listPadding}
                />
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, height: 40 },
    listPadding: { paddingBottom: 100 },
    sectionHeader: { paddingHorizontal: 20, paddingVertical: 12 },
    sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
    txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
    txIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    txDetails: { flex: 1 },
    payeeText: { fontSize: 16, fontWeight: '600' },
    subText: { fontSize: 13, marginTop: 2 },
    amountText: { fontSize: 15, fontWeight: '700' },
    deleteAction: { width: 80, justifyContent: 'center', alignItems: 'center', height: '100%' },
});
import { Text, View, useThemeColor } from '@/components/Themed';
import { useAccounts, useAddTransaction, useCategories, useTransactions, useUpdateTransaction } from '@/hooks/budgetHooks';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

// Define the type to include 'transfer'
type TxType = 'expense' | 'income' | 'transfer';

export default function TransactionModal() {
    const router = useRouter();
    const { editingId } = useLocalSearchParams();
    const isEditing = !!editingId;
    const { data: allTransactions } = useTransactions();
    const editingTx = allTransactions?.find(t => t.id === Number(editingId));

    const [amount, setAmount] = useState('');
    const [payee, setPayee] = useState('');
    const [selectedType, setSelectedType] = useState<TxType>('expense');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [toAccountId, setToAccountId] = useState<number | null>(null); // For Transfers
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const { data: accounts } = useAccounts();
    const { data: groupedCategories } = useCategories();
    const addTx = useAddTransaction();
    const updateTx = useUpdateTransaction();

    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const mutedColor = useThemeColor({}, 'muted');
    const dangerColor = useThemeColor({}, 'danger');
    const successColor = useThemeColor({}, 'success');
    const borderColor = useThemeColor({}, 'border');

    useEffect(() => {
        if (isEditing && editingTx) {
            setAmount(Math.abs(editingTx.amount).toString());
            setPayee(editingTx.payee);
            setSelectedType(editingTx.type as TxType);
            setSelectedAccountId(editingTx.accountId);
            setSelectedCategoryId(editingTx.categoryId);
        }
    }, [editingTx]);

    const handleSave = async () => {
        if (!amount || !selectedAccountId) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Required Fields", "Please enter an amount and select an account.");
            return;
        }

        const numAmount = parseFloat(amount);
        const finalAmount = selectedType === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);
        if (isEditing) {
            if (selectedType === 'expense' && !selectedCategoryId) {
                Alert.alert("Select Envelope", "Please select an envelope for this expense.");
                return;
            }
            updateTx.mutate({
                id: Number(editingId),
                updates: {
                    accountId: selectedAccountId,
                    categoryId: selectedType === 'income' ? null : selectedCategoryId,
                    amount: finalAmount,
                    type: selectedType,
                    payee: payee || (selectedType === 'expense' ? 'General Expense' : 'General Income'),
                    date: editingTx?.date || new Date()
                }
            }, { onSuccess: finishSave });
        }
        else {
            if (selectedType === 'transfer') {
                if (!toAccountId || selectedAccountId === toAccountId) {
                    Alert.alert("Invalid Transfer", "Please select two different accounts for the transfer.");
                    return;
                }

                // Create the Outflow side
                addTx.mutate({
                    accountId: selectedAccountId,
                    amount: -Math.abs(numAmount),
                    type: 'transfer',
                    transferId: null,
                    payee: `Transfer to ${accounts?.find(a => a.id === toAccountId)?.name}`,
                    date: new Date(),
                    categoryId: null, // Transfers never have envelopes
                }, {
                    onSuccess: () => {
                        // Create the Inflow side
                        addTx.mutate({
                            accountId: toAccountId,
                            amount: Math.abs(numAmount),
                            type: 'transfer',
                            transferId: null,
                            payee: `Transfer from ${accounts?.find(a => a.id === selectedAccountId)?.name}`,
                            date: new Date(),
                            categoryId: null,
                        }, {
                            onSuccess: finishSave
                        });
                    }
                });
            } else {
                // Logic for Expenses & Income
                if (selectedType === 'expense' && !selectedCategoryId) {
                    Alert.alert("Select Envelope", "Please select an envelope for this expense.");
                    return;
                }
                addTx.mutate({
                    accountId: selectedAccountId,
                    categoryId: selectedType === 'income' ? null : selectedCategoryId, // Null for income
                    amount: finalAmount,
                    type: selectedType,
                    transferId: null,
                    payee: payee || (selectedType === 'expense' ? 'General Expense' : 'General Income'),
                    date: new Date(),
                }, {
                    onSuccess: finishSave
                });
            }
        };
    }

    const finishSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAmount('');
        setPayee('');
        setSelectedAccountId(null);
        setToAccountId(null);
        setSelectedCategoryId(null);
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* Type Toggle */}
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.typeBtn, selectedType === 'expense' && { backgroundColor: dangerColor }]}
                    onPress={() => setSelectedType('expense')}
                >
                    <Text style={styles.typeText}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.typeBtn, selectedType === 'income' && { backgroundColor: successColor }]}
                    onPress={() => setSelectedType('income')}
                >
                    <Text style={styles.typeText}>Income</Text>
                </TouchableOpacity>
                {!isEditing && (
                    <TouchableOpacity
                        style={[styles.typeBtn, selectedType === 'transfer' && { backgroundColor: tintColor }]}
                        onPress={() => setSelectedType('transfer')}
                    >
                        <Text style={styles.typeText}>Transfer</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.amountWrapper}>
                    <Text style={[styles.currency, { color: selectedType === 'expense' ? dangerColor : successColor }]}>$</Text>
                    <TextInput
                        style={[styles.mainInput, { color: textColor }]}
                        placeholder="0.00"
                        placeholderTextColor={mutedColor}
                        keyboardType="decimal-pad"
                        autoFocus
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                {selectedType !== 'transfer' && (
                    <TextInput
                        style={[styles.payeeInput, { color: textColor, borderBottomColor: borderColor }]}
                        placeholder={selectedType === 'expense' ? "Where did you spend this?" : "Source of income?"}
                        placeholderTextColor={mutedColor}
                        value={payee}
                        onChangeText={setPayee}
                    />
                )}

                {/* Account Selection */}
                <Text style={styles.sectionLabel}>
                    {selectedType === 'transfer' ? 'From Account' : 'Select Account'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {accounts?.map(acc => (
                        <TouchableOpacity
                            key={acc.id}
                            onPress={() => setSelectedAccountId(acc.id)}
                            style={[
                                styles.chip,
                                { borderColor: borderColor },
                                selectedAccountId === acc.id && { backgroundColor: tintColor, borderColor: tintColor }
                            ]}
                        >
                            <Text style={[styles.chipText, selectedAccountId === acc.id && { color: '#fff' }]}>{acc.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Destination Account Selection - Only for Transfers */}
                {selectedType === 'transfer' && !isEditing && (
                    <>
                        <Text style={styles.sectionLabel}>To Account</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {accounts?.map(acc => (
                                <TouchableOpacity
                                    key={`to-${acc.id}`}
                                    onPress={() => setToAccountId(acc.id)}
                                    style={[
                                        styles.chip,
                                        { borderColor: borderColor },
                                        toAccountId === acc.id && { backgroundColor: successColor, borderColor: successColor }
                                    ]}
                                >
                                    <Text style={[styles.chipText, toAccountId === acc.id && { color: '#fff' }]}>{acc.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* Envelope Selection - Only visible for Expenses */}
                {selectedType === 'expense' && (
                    <>
                        <Text style={styles.sectionLabel}>Select Envelope</Text>
                        <View style={styles.categoryGrid}>
                            {groupedCategories?.flatMap(g => g.envelopes).map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => {
                                        setSelectedCategoryId(cat.id);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    style={[
                                        styles.categoryChip,
                                        { borderColor: borderColor },
                                        selectedCategoryId === cat.id && { backgroundColor: tintColor, borderColor: tintColor }
                                    ]}
                                >
                                    <Text style={[styles.catText, { color: textColor }, selectedCategoryId === cat.id && { color: '#fff' }]}>
                                        {cat.name}
                                    </Text>
                                    <Text style={[styles.catSubText, { color: mutedColor }, selectedCategoryId === cat.id && { color: 'rgba(255,255,255,0.8)' }]}>
                                        ${cat.available}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tintColor }]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>
                        {isEditing ? 'Update Transaction' : (selectedType === 'transfer' ? 'Confirm Transfer' : 'Log Transaction')}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    toggleRow: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 20, backgroundColor: 'rgba(150,150,150,0.1)' },
    typeBtn: { flex: 1, padding: 12, alignItems: 'center' },
    typeText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    amountWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 15 },
    currency: { fontSize: 40, fontWeight: '800', marginRight: 5 },
    mainInput: { fontSize: 56, fontWeight: '800', minWidth: 150 },
    payeeInput: { borderBottomWidth: 1, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
    sectionLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 15, opacity: 0.5, marginBottom: 10 },
    chipScroll: { flexDirection: 'row', marginBottom: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, marginRight: 8, backgroundColor: 'transparent' },
    chipText: { fontWeight: '700', fontSize: 13 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    categoryChip: { padding: 12, borderRadius: 16, borderWidth: 1, minWidth: '48%', flexGrow: 1 },
    catText: { fontSize: 14, fontWeight: '700' },
    catSubText: { fontSize: 11, marginTop: 2 },
    saveButton: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
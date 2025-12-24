import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useThemeColor } from '@/components/Themed';
import { useAssignMoney, useBudgetSummary, useCategories } from '@/hooks/budgetHooks';

const DistributeFundsModal = ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) => {
    const [amount, setAmount] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const { data: summary } = useBudgetSummary();
    const { data: groupedCategories } = useCategories();
    const assignMoney = useAssignMoney();

    const tintColor = useThemeColor({}, 'tint');
    const surfaceColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const handleConfirm = () => {
        if (!selectedId || !amount) return;

        assignMoney.mutate({
            categoryId: selectedId,
            amount: parseFloat(amount)
        }, {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setAmount('');
                setSelectedId(null);
                onClose();
            }
        });
    };

    return (
        <Modal visible={isVisible} transparent animationType="none">
            <Pressable style={styles.overlay} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        entering={SlideInDown}
                        exiting={SlideOutDown}
                        style={[styles.content, { backgroundColor: surfaceColor }]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={{ backgroundColor: 'transparent' }}>
                                <Text style={[styles.title, { color: textColor }]}>Assign Money</Text>
                                <Text style={{ color: mutedColor }}>
                                    ${summary?.readyToAssign.toLocaleString()} available to assign
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={28} color={mutedColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Fixed Input Section */}
                        <View style={styles.inputSection}>
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

                        <Text style={[styles.label, { color: textColor }]}>To Which Envelope?</Text>

                        {/* Flexible List Section */}
                        <View style={styles.listContainer}>
                            <ScrollView
                                style={styles.selector}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                {groupedCategories?.flatMap(g => g.envelopes).map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setSelectedId(cat.id)}
                                        style={[
                                            styles.catRow,
                                            { borderColor: borderColor },
                                            selectedId === cat.id && { backgroundColor: tintColor + '15', borderColor: tintColor }
                                        ]}
                                    >
                                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                            <Text style={[styles.catName, { color: textColor }]}>{cat.name}</Text>
                                            <Text style={{ color: mutedColor, fontSize: 12 }}>
                                                ${cat.available} current
                                            </Text>
                                        </View>
                                        {selectedId === cat.id && (
                                            <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Fixed Button Section */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[
                                    styles.btn,
                                    { backgroundColor: tintColor },
                                    (!selectedId || !amount) && { opacity: 0.5 }
                                ]}
                                onPress={handleConfirm}
                                disabled={!selectedId || !amount}
                            >
                                <Text style={styles.btnText}>Confirm Assignment</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    keyboardView: {
        width: '100%',
        justifyContent: 'flex-end'
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24, // Added padding for iOS home bar
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '75%', // Fixed height percentage to ensure predictability
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'transparent'
    },
    title: { fontSize: 22, fontWeight: '800' },
    inputSection: {
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainInput: {
        fontSize: 48,
        fontWeight: '800',
        textAlign: 'center',
        width: '100%',
        marginVertical: 10
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        opacity: 0.6,
        marginBottom: 10
    },
    listContainer: {
        flex: 1, // This is the secret—it takes all remaining space
        marginBottom: 15,
        backgroundColor: 'transparent'
    },
    selector: { flex: 1 },
    catRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: 'transparent'
    },
    catName: { fontWeight: '700', fontSize: 16 },
    footer: {
        backgroundColor: 'transparent',
    },
    btn: {
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});

export default DistributeFundsModal;
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Text, View, useThemeColor } from '@/components/Themed';
import { useAssignMoney } from '@/hooks/budgetHooks';

interface AssignMoneyModalProps {
    isVisible: boolean;
    onClose: () => void;
    category: { id: number; name: string; available: number } | null;
}

export default function AssignMoneyModal({ isVisible, onClose, category }: AssignMoneyModalProps) {
    const [amount, setAmount] = useState('');
    const assignMoney = useAssignMoney();

    // Theme colors
    const surfaceColor = useThemeColor({}, 'surface');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const mutedColor = useThemeColor({}, 'muted');

    const handleAssign = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        assignMoney.mutate(
            { categoryId: category!.id, amount: numAmount },
            {
                onSuccess: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setAmount('');
                    onClose();
                },
            }
        );
    };

    if (!category) return null;

    return (
        <Modal visible={isVisible} transparent animationType="none">
            <Pressable style={styles.overlay} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        entering={SlideInDown.springify().damping(15)}
                        exiting={SlideOutDown}
                        style={[styles.modalContent, { backgroundColor: surfaceColor }]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={{ backgroundColor: 'transparent' }}>
                                <Text style={styles.modalTitle}>Assign Money</Text>
                                <Text style={{ color: mutedColor }}>To {category.name}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                {/* <X color={mutedColor} size={24} /> */}x
                            </TouchableOpacity>
                        </View>

                        {/* Input Section */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencyPrefix}>$</Text>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                placeholder="0.00"
                                placeholderTextColor={mutedColor}
                                keyboardType="decimal-pad"
                                autoFocus
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>

                        <Text style={styles.currentBalance}>
                            Currently available: ${category.available.toLocaleString()}
                        </Text>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: tintColor }]}
                            onPress={handleAssign}
                            disabled={assignMoney.isPending}
                        >
                            <Text style={styles.submitButtonText}>
                                {assignMoney.isPending ? 'Assigning...' : 'Add to Envelope'}
                            </Text>
                        </TouchableOpacity>
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
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'transparent',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    closeButton: {
        padding: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        marginBottom: 10,
    },
    currencyPrefix: {
        fontSize: 48,
        fontWeight: '800',
        marginRight: 10,
    },
    input: {
        fontSize: 48,
        fontWeight: '800',
        minWidth: 150,
        textAlign: 'left',
    },
    currentBalance: {
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 30,
        opacity: 0.6,
    },
    submitButton: {
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
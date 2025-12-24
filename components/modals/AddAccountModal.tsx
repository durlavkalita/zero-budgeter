import { Ionicons } from '@expo/vector-icons';
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
import { db } from '@/db/client';
import { accounts } from '@/db/schema';
import { useQueryClient } from '@tanstack/react-query';

interface AddAccountModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const AddAccountModal = ({ isVisible, onClose }: AddAccountModalProps) => {
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState('Checking'); // Default type

    const queryClient = useQueryClient();

    // Theme Colors
    const surfaceColor = useThemeColor({}, 'surface');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const mutedColor = useThemeColor({}, 'muted');
    const borderColor = useThemeColor({}, 'border');

    const handleCreate = async () => {
        if (!name || !balance) return;

        try {
            await db.insert(accounts).values({
                name,
                type,
                balance: parseFloat(balance),
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['budget-summary'] });

            setName('');
            setBalance('');
            onClose();
        } catch (error) {
            console.error("Failed to create account", error);
        }
    };

    return (
        <Modal visible={isVisible} transparent animationType="none">
            <Pressable style={styles.overlay} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        entering={SlideInDown.springify()}
                        exiting={SlideOutDown}
                        style={[styles.modalContent, { backgroundColor: surfaceColor }]}
                    >
                        <View style={styles.header}>
                            <Text style={styles.title}>Add New Account</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={textColor} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: borderColor }]}
                            placeholder="e.g. Main Checking or Cash"
                            placeholderTextColor={mutedColor}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Starting Balance</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: borderColor }]}
                            placeholder="0.00"
                            placeholderTextColor={mutedColor}
                            keyboardType="decimal-pad"
                            value={balance}
                            onChangeText={setBalance}
                        />

                        <View style={styles.typeRow}>
                            {['Checking', 'Savings', 'Cash'].map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() => {
                                        setType(item);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    style={[
                                        styles.typeChip,
                                        { borderColor: borderColor },
                                        type === item && { backgroundColor: tintColor, borderColor: tintColor }
                                    ]}
                                >
                                    <Text style={[type === item && { color: '#fff' }]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: tintColor }]}
                            onPress={handleCreate}
                        >
                            <Text style={styles.submitText}>Create Account</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    keyboardView: { width: '100%' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'transparent' },
    title: { fontSize: 20, fontWeight: '800' },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, opacity: 0.6 },
    input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 30, backgroundColor: 'transparent' },
    typeChip: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    submitButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AddAccountModal;
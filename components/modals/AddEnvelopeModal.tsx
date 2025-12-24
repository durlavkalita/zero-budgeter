import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Text, View, useThemeColor } from '@/components/Themed';
import { db } from '../../db/client';
import { categories, categoryGroups } from '../../db/schema';

const PRESET_GROUPS = ['Monthly Bills', 'Daily Spending', 'Savings Goals', 'Subscriptions', 'Debts'];

const AddEnvelopeModal = ({ isVisible, onClose }: { isVisible: boolean, onClose: () => void }) => {
    const [name, setName] = useState('');
    const [groupName, setGroupName] = useState('Monthly Bills');

    const queryClient = useQueryClient();
    const surfaceColor = useThemeColor({}, 'surface');
    const tintColor = useThemeColor({}, 'tint');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({}, 'muted');

    const handleCreate = async () => {
        if (!name) return;

        try {
            let group = await db.select().from(categoryGroups).where(eq(categoryGroups.name, groupName)).get();

            let groupId;
            if (!group) {
                const groupResult = await db.insert(categoryGroups).values({ name: groupName }).returning();
                groupId = groupResult[0].id;
            } else {
                groupId = group.id;
            }

            await db.insert(categories).values({
                name,
                groupId,
                budgeted: 0,
                available: 0,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setName('');
            onClose();
        } catch (e) {
            console.error("Error creating envelope:", e);
        }
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
                        {/* Header Section */}
                        <View style={styles.header}>
                            <View style={{ backgroundColor: 'transparent' }}>
                                <Text style={[styles.title, { color: textColor }]}>New Envelope</Text>
                                <Text style={{ color: mutedColor }}>Organize your spending goals</Text>
                            </View>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={28} color={mutedColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Group Selection Section */}
                        <Text style={[styles.label, { color: textColor }]}>Group / Type</Text>
                        <View style={styles.chipWrapper}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chipContainer}
                            >
                                {PRESET_GROUPS.map((group) => (
                                    <TouchableOpacity
                                        key={group}
                                        onPress={() => {
                                            setGroupName(group);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                        style={[
                                            styles.chip,
                                            { borderColor: borderColor },
                                            groupName === group && { backgroundColor: tintColor, borderColor: tintColor }
                                        ]}
                                    >
                                        <Text style={[styles.chipText, { color: textColor }, groupName === group && { color: '#fff' }]}>
                                            {group}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Input Section */}
                        <Text style={[styles.label, { color: textColor }]}>Envelope Name</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderBottomColor: borderColor }]}
                            placeholder="e.g. Groceries"
                            placeholderTextColor={mutedColor}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />

                        {/* Action Section */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: tintColor }, !name && { opacity: 0.5 }]}
                                onPress={handleCreate}
                                disabled={!name}
                            >
                                <Text style={styles.btnText}>Create Envelope</Text>
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
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        backgroundColor: 'transparent'
    },
    title: { fontSize: 22, fontWeight: '800' },
    label: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 12,
        opacity: 0.6
    },
    chipWrapper: {
        marginBottom: 25,
        marginHorizontal: -24,
        backgroundColor: 'transparent'
    },
    chipContainer: { paddingHorizontal: 24, gap: 8 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    chipText: { fontSize: 14, fontWeight: '600' },
    input: {
        borderBottomWidth: 2,
        paddingVertical: 12,
        fontSize: 20,
        marginBottom: 30,
        fontWeight: '600'
    },
    footer: {
        backgroundColor: 'transparent'
    },
    btn: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});

export default AddEnvelopeModal;
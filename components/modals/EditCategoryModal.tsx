import { Text, useThemeColor } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

export default function EditCategoryModal({ isVisible, onClose, category, onSave }: any) {
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');

    const surfaceColor = useThemeColor({}, 'surface');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const mutedColor = useThemeColor({}, 'muted');
    const borderColor = useThemeColor({}, 'border');

    useEffect(() => {
        if (category) {
            setName(category.name);
            setTarget(category.targetAmount?.toString() || '');
        }
    }, [category]);

    return (
        <Modal visible={isVisible} transparent animationType="none">
            <Pressable style={styles.overlay} onPress={onClose}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
                    <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.content, { backgroundColor: surfaceColor }]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Edit Envelope</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={28} color={mutedColor} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Envelope Name</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderBottomColor: borderColor }]}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Monthly Target Amount (Optional)</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderBottomColor: borderColor }]}
                            value={target}
                            onChangeText={setTarget}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={mutedColor}
                        />

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: tintColor }]}
                            onPress={() => onSave({ name, targetAmount: parseFloat(target) || 0 })}
                        >
                            <Text style={styles.btnText}>Save Changes</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    content: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '800' },
    label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginTop: 15, opacity: 0.6 },
    input: { borderBottomWidth: 1, paddingVertical: 12, fontSize: 18, marginBottom: 10 },
    btn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
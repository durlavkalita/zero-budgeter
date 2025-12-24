import AddAccountModal from '@/components/modals/AddAccountModal';
import AddEnvelopeModal from '@/components/modals/AddEnvelopeModal';
import DistributeFundsModal from '@/components/modals/DistributeFundsModal';
import { useThemeColor } from '@/components/Themed';
import { useAccounts, useBudgetSummary, useCategories } from '@/hooks/budgetHooks';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

export default function Index() {
    const router = useRouter()
    const { data: accounts } = useAccounts();
    const { data: summary } = useBudgetSummary();
    const { data: groupedCategories } = useCategories();

    const [isAccountModalVisible, setAccountModalVisible] = useState(false);
    const [isEnvelopeModalVisible, setEnvelopeModalVisible] = useState(false);
    const [isDistributedFundsModalVisible, setDistributedFundsModalVisible] = useState(false);

    // Pick semantic colors using your hook
    const successColor = useThemeColor({}, 'success');
    const dangerColor = useThemeColor({}, 'danger');
    const surfaceColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');
    const tintColor = useThemeColor({}, 'tint');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const isOverdrawn = (summary?.readyToAssign ?? 0) < 0;

    if (!accounts || accounts?.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.onboardingContent}>
                    <Ionicons name="wallet-outline" size={80} color={tintColor} />
                    <Text style={[styles.onboardingTitle, { color: textColor }]}>Welcome to Zero-Budgeter</Text>
                    <Text style={[styles.onboardingSub, { color: textColor }]}>
                        Every dollar needs a job. Let's start by adding the money you have on hand.
                    </Text>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: tintColor }]}
                        onPress={() => setAccountModalVisible(true)}
                    >
                        <Text style={styles.btnText}>Add My First Account</Text>
                    </TouchableOpacity>
                </View>
                <AddAccountModal
                    isVisible={isAccountModalVisible}
                    onClose={() => setAccountModalVisible(false)}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* 1. HERO SECTION: Ready to Assign */}
            <Animated.View
                entering={FadeInUp.delay(200)}
                style={[styles.heroCard, { backgroundColor: isOverdrawn ? dangerColor : successColor }]}
            >
                <Text style={styles.heroLabel}>Ready to Assign</Text>
                <Text style={styles.heroAmount}>
                    ${summary?.readyToAssign?.toLocaleString() ?? '0.00'}
                </Text>
                <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setDistributedFundsModalVisible(true);
                    }}
                >
                    <Text style={styles.assignButtonText}>Distribute Funds</Text>
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 2. STATS ROW */}
                <View style={styles.statsRow}>
                    <StatCard label="Net Worth" value={`$${summary?.totalBalance.toLocaleString()}`} icon={<AntDesign name="wallet" size={16} color="#10b981" />} />
                    <StatCard label="Budgeted" value={`$${summary?.totalBudgeted.toLocaleString()}`} icon={<AntDesign name="pie-chart" size={16} color="#8b5cf6" />} />
                </View>

                {/* 3. ENVELOPES (CATEGORIES) */}
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: "#0f172a" }}>
                    <Text style={styles.sectionHeader}>Envelopes</Text>
                    <TouchableOpacity
                        style={[styles.addFirstBtn, { borderColor: tintColor }]}
                        onPress={() => setEnvelopeModalVisible(true)}
                    >
                        <AntDesign name='plus' color="white" size={18} />
                    </TouchableOpacity>
                </View>
                {groupedCategories && groupedCategories.length > 0
                    ? (groupedCategories?.map((group, index) =>
                    (
                        <Animated.View
                            key={group.id}
                            entering={FadeInDown.delay(index * 100)}
                            layout={Layout.springify()}
                        >
                            <Text style={styles.groupTitle}>{group.name}</Text>
                            {group.envelopes.map((category) => {
                                const isOverspent = category.available < 0;
                                let progress = 0;
                                if (isOverspent) {
                                    progress = 100;
                                } else if (category.budgeted > 0) {
                                    progress = Math.min(Math.max(((category.budgeted - category.available) / category.budgeted) * 100, 0), 100);
                                }
                                const barColor = category.available < 0 ? dangerColor : successColor;

                                return (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[styles.envelopeCard, { backgroundColor: surfaceColor }]}
                                        onPress={() => router.push({ pathname: `/category/[id]`, params: { id: category.id } })}
                                    >
                                        <View style={styles.envelopeHeader}>
                                            <Text style={styles.envelopeName}>{category.name}</Text>
                                            <Text style={styles.envelopeAmount}>${category.available.toLocaleString()}</Text>
                                        </View>

                                        {/* Progress Visual */}
                                        <View style={[styles.progressTrack, { backgroundColor: borderColor + '40' }]}>
                                            <View
                                                style={[
                                                    styles.progressBar,
                                                    {
                                                        backgroundColor: barColor,
                                                        width: `${progress}%`
                                                    }
                                                ]}
                                            />
                                        </View>

                                        <View style={styles.envelopeFooter}>
                                            <Text style={[styles.footerText, { color: mutedColor }]}>
                                                ${category.available} left of ${category.budgeted}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </Animated.View>
                    )
                    ))
                    : (
                        <Animated.View entering={FadeInDown} style={styles.emptyEnvelopesContainer}>
                            <Ionicons name="mail-open-outline" size={48} color={tintColor} />
                            <Text style={[styles.emptyTitle, { color: textColor }]}>Create your first envelope</Text>
                            <Text style={[styles.emptySub, { color: textColor }]}>
                                You have money in your accounts! Now, create envelopes (like Rent, Groceries, or Savings) to give those dollars a job.
                            </Text>
                            <TouchableOpacity
                                style={[styles.addFirstBtn, { borderColor: tintColor }]}
                                onPress={() => setEnvelopeModalVisible(true)}
                            >
                                <Text style={{ color: tintColor, fontWeight: '700' }}>+ Create Envelope</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/modals/new-transaction') }}
            >
                <AntDesign name='plus' color="white" size={28} />
            </TouchableOpacity>
            <AddEnvelopeModal
                isVisible={isEnvelopeModalVisible}
                onClose={() => setEnvelopeModalVisible(false)}
            />
            <DistributeFundsModal isVisible={isDistributedFundsModalVisible} onClose={() => setDistributedFundsModalVisible(false)} />
        </View>
    );
};

const StatCard = ({ label, value, icon }: any) => (
    <View style={styles.statCard}>
        <View style={styles.statIcon}>{icon}</View>
        <View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        paddingTop: 40,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    heroCard: {
        backgroundColor: '#10b981',
        margin: 20,
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    heroCardOverdrawn: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroAmount: {
        color: 'white',
        fontSize: 42,
        fontWeight: '800',
        marginVertical: 8,
    },
    assignButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    assignButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIcon: {
        backgroundColor: '#334155',
        padding: 8,
        borderRadius: 10,
    },
    statLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '600',
    },
    statValue: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    sectionHeader: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    groupTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 16,
        marginBottom: 12,
    },
    envelopeRow: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    envelopeInfo: {
        flex: 1,
    },
    envelopeName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    envelopeAvailable: {
        color: '#94a3b8',
        fontSize: 13,
        marginTop: 2,
    },
    progressContainer: {
        width: 60,
        height: 6,
        backgroundColor: '#334155',
        borderRadius: 3,
        marginHorizontal: 15,
        overflow: 'hidden',
    },
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 30,
        backgroundColor: '#6366f1',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
    },
    onboardingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'transparent',
    },
    onboardingTitle: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
    onboardingSub: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.7,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    primaryBtn: {
        width: '100%',
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    emptyEnvelopesContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 24,
        borderColor: '#ccc',
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySub: {
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 20,
    },
    addFirstBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
    }, envelopeCard: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 2,
    },
    envelopeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: 'transparent', // Ensures sub-views don't cover card background
    },
    envelopeAmount: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden', // Ensures the inner bar doesn't bleed past rounded corners
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    envelopeFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        backgroundColor: 'transparent',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.8,
    },
});
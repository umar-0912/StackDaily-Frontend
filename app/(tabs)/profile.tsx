import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Button,
  Avatar,
  Surface,
  Portal,
  Modal,
  TextInput,
  HelperText,
  Dialog,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import { useAuth } from '../../src/hooks/useAuth';
import { useProfile, useUpdateProfile, useSubscriptionInfo } from '../../src/hooks/useProfile';
import { useSubscribe, useCancelSubscription } from '../../src/hooks/usePayments';
import { useProgress } from '../../src/hooks/useProgress';
import { QUERY_KEYS } from '../../src/utils/constants';
import { LoadingScreen, ErrorScreen, StreakBadge, TopicChip } from '../../src/components';
import { SubscriptionPlan, SubscriptionStatus } from '../../src/types';

const editProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

function getStreakMessage(count: number, maxStreak: number): string {
  if (count === 0 && maxStreak > 0) {
    return `Start a new streak! Your best was ${maxStreak} days.`;
  }
  if (count === 0) {
    return 'Start your streak today!';
  }
  if (count >= maxStreak && count > 1) {
    return `${count} day streak! New personal best!`;
  }
  return `${count} day streak! Keep it up!`;
}

function getLastActiveText(lastActiveDate: string | null): string {
  if (!lastActiveDate) return 'No activity yet';
  const date = new Date(lastActiveDate);
  return `Last active: ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const { data: subscriptionInfo } = useSubscriptionInfo();
  const { data: progressData } = useProgress();
  const subscribeMutation = useSubscribe();
  const cancelSubscriptionMutation = useCancelSubscription();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [cancelSubDialogVisible, setCancelSubDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const displayUser = profile ?? user;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || profile.username,
        email: profile.email,
      });
    }
  }, [profile, reset]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscription }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const openEditModal = useCallback(() => {
    reset({
      name: displayUser?.name || displayUser?.username || '',
      email: displayUser?.email ?? '',
    });
    setEditModalVisible(true);
  }, [displayUser, reset]);

  const closeEditModal = useCallback(() => {
    setEditModalVisible(false);
  }, []);

  const onSubmitEdit = useCallback(
    async (data: EditProfileFormData) => {
      try {
        await updateProfileMutation.mutateAsync(data);
        setEditModalVisible(false);
        showSnackbar('Profile updated successfully');
      } catch {
        showSnackbar('Failed to update profile. Please try again.');
      }
    },
    [updateProfileMutation, showSnackbar],
  );

  const handleLogout = useCallback(async () => {
    setLogoutDialogVisible(false);
    await logout();
  }, [logout]);

  const handleNavigateToTopics = useCallback(() => {
    router.push('/(tabs)/topics');
  }, [router]);

  const displayName = displayUser?.name || displayUser?.username || '';
  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  if (isLoading && !user) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (isError && !user) {
    return (
      <ErrorScreen
        message="We couldn't load your profile. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <Surface style={[styles.profileCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Avatar.Text
            size={80}
            label={initials}
            style={{ backgroundColor: theme.colors.primary, marginBottom: 16 }}
          />
          <Text variant="headlineSmall" style={styles.username}>
            {displayName || 'Unknown User'}
          </Text>
          <Text variant="bodyMedium" style={[styles.email, { color: theme.colors.onSurfaceVariant }]}>
            {displayUser?.email ?? ''}
          </Text>
          <Button
            mode="outlined"
            onPress={openEditModal}
            icon="pencil"
            style={styles.editButton}
            compact
          >
            Edit Profile
          </Button>
        </Surface>

        {/* Streak Section */}
        <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Your Streak
          </Text>
          <StreakBadge
            count={displayUser?.streak.count ?? 0}
            maxStreak={displayUser?.streak.maxStreak ?? 0}
            size="large"
          />
          <Text
            variant="bodyMedium"
            style={[styles.streakMessage, { color: theme.colors.primary }]}
          >
            {getStreakMessage(displayUser?.streak.count ?? 0, displayUser?.streak.maxStreak ?? 0)}
          </Text>
          <Text variant="bodySmall" style={[styles.lastActive, { color: theme.colors.onSurfaceVariant }]}>
            {getLastActiveText(displayUser?.streak.lastActiveDate ?? null)}
          </Text>
        </Surface>

        {/* Learning Progress Section */}
        {progressData && progressData.length > 0 ? (
          <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Learning Progress
            </Text>
            {progressData.map((p) => {
              const progressPercent = p.percentComplete / 100;
              return (
                <View key={p._id} style={styles.progressItem}>
                  <View style={styles.progressItemHeader}>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      {p.topic.name}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {p.questionsAnswered}/{p.totalQuestions}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progressPercent}
                    color={
                      p.status === 'completed' ? '#4CAF50' : theme.colors.primary
                    }
                    style={styles.profileProgressBar}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {p.status === 'completed'
                      ? 'Completed'
                      : p.status === 'in_progress'
                        ? `In Progress - ${p.percentComplete}%`
                        : 'Not Started'}
                  </Text>
                </View>
              );
            })}
          </Surface>
        ) : null}

        {/* Subscription Section */}
        <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Subscription
          </Text>

          <View style={styles.planBadgeRow}>
            <View
              style={[
                styles.planBadge,
                {
                  backgroundColor:
                    subscriptionInfo?.plan === SubscriptionPlan.PRO
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  subscriptionInfo?.plan === SubscriptionPlan.PRO
                    ? 'crown'
                    : 'account-outline'
                }
                size={18}
                color={
                  subscriptionInfo?.plan === SubscriptionPlan.PRO
                    ? '#fff'
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text
                variant="labelLarge"
                style={{
                  color:
                    subscriptionInfo?.plan === SubscriptionPlan.PRO
                      ? '#fff'
                      : theme.colors.onSurfaceVariant,
                  marginLeft: 6,
                }}
              >
                {subscriptionInfo?.plan === SubscriptionPlan.PRO
                  ? 'Pro Plan'
                  : 'Free Plan'}
              </Text>
            </View>
          </View>

          {subscriptionInfo?.plan === SubscriptionPlan.PRO ? (
            <View style={styles.planDetails}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Unlimited topics
                {subscriptionInfo.daysRemaining !== null
                  ? ` \u00B7 ${subscriptionInfo.daysRemaining} days remaining`
                  : ''}
              </Text>
              {subscriptionInfo.status === SubscriptionStatus.CANCELLED && (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.error, marginTop: 4 }}
                >
                  Cancellation pending. Access continues until period ends.
                </Text>
              )}
              {subscriptionInfo.status === SubscriptionStatus.ACTIVE && (
                <Button
                  mode="outlined"
                  onPress={() => setCancelSubDialogVisible(true)}
                  style={[
                    styles.cancelSubButton,
                    { borderColor: theme.colors.error },
                  ]}
                  textColor={theme.colors.error}
                  compact
                  icon="close-circle-outline"
                  loading={cancelSubscriptionMutation.isPending}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  Cancel Subscription
                </Button>
              )}
            </View>
          ) : (
            <View style={styles.planDetails}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Up to {subscriptionInfo?.maxTopics ?? 3} topics
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 4,
                }}
              >
                Upgrade to Pro for unlimited topics at just Rs.30/month
              </Text>
              <Button
                mode="contained"
                onPress={() => subscribeMutation.mutate()}
                style={styles.upgradeButton}
                icon="crown"
                loading={subscribeMutation.isPending}
                disabled={subscribeMutation.isPending}
              >
                Upgrade to Pro
              </Button>
            </View>
          )}
        </Surface>

        {/* Subscribed Topics */}
        <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Subscribed Topics
            </Text>
            <Button
              mode="text"
              compact
              onPress={handleNavigateToTopics}
              icon="arrow-right"
              contentStyle={styles.manageButtonContent}
            >
              Manage
            </Button>
          </View>
          {displayUser?.subscribedTopics &&
          displayUser.subscribedTopics.length > 0 ? (
            <View style={styles.topicsRow}>
              {displayUser.subscribedTopics.map((topic) => (
                <TopicChip key={topic._id} topic={topic} selected />
              ))}
            </View>
          ) : (
            <View style={styles.noTopicsContainer}>
              <MaterialCommunityIcons
                name="book-plus-outline"
                size={32}
                color={theme.colors.outline}
              />
              <Text
                variant="bodyMedium"
                style={[styles.noTopicsText, { color: theme.colors.outline }]}
              >
                No topics subscribed yet
              </Text>
              <Button
                mode="contained"
                onPress={handleNavigateToTopics}
                style={styles.browseTopicsButton}
                compact
              >
                Browse Topics
              </Button>
            </View>
          )}
        </Surface>

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={() => setLogoutDialogVisible(true)}
          style={[styles.logoutButton, { borderColor: theme.colors.error }]}
          icon="logout"
          textColor={theme.colors.error}
        >
          Sign Out
        </Button>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={closeEditModal}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Edit Profile
            </Text>

            {updateProfileMutation.isError ? (
              <Surface style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]} elevation={0}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error}
                />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  Failed to update profile. Please try again.
                </Text>
              </Surface>
            ) : null}

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    autoCapitalize="words"
                    autoCorrect={false}
                    error={!!errors.name}
                    left={<TextInput.Icon icon="account-outline" />}
                    style={[styles.input, { backgroundColor: theme.colors.surface }]}
                  />
                  {errors.name ? (
                    <HelperText type="error" visible={!!errors.name}>
                      {errors.name.message}
                    </HelperText>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={!!errors.email}
                    left={<TextInput.Icon icon="email-outline" />}
                    style={[styles.input, { backgroundColor: theme.colors.surface }]}
                  />
                  {errors.email ? (
                    <HelperText type="error" visible={!!errors.email}>
                      {errors.email.message}
                    </HelperText>
                  ) : null}
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <Button
                mode="text"
                onPress={closeEditModal}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmitEdit)}
                loading={updateProfileMutation.isPending}
                disabled={updateProfileMutation.isPending}
              >
                Save Changes
              </Button>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Icon icon="logout" />
          <Dialog.Title style={styles.dialogTitle}>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to sign out? You will need to log in again
              to access your account.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={handleLogout}
              textColor={theme.colors.error}
            >
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Cancel Subscription Dialog */}
      <Portal>
        <Dialog
          visible={cancelSubDialogVisible}
          onDismiss={() => setCancelSubDialogVisible(false)}
        >
          <Dialog.Icon icon="alert-circle-outline" />
          <Dialog.Title style={styles.dialogTitle}>
            Cancel Subscription
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to cancel your Pro subscription? You will
              retain access until the end of your current billing period, then
              your plan will revert to Free.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelSubDialogVisible(false)}>
              Keep Pro
            </Button>
            <Button
              onPress={async () => {
                setCancelSubDialogVisible(false);
                try {
                  await cancelSubscriptionMutation.mutateAsync();
                  showSnackbar('Subscription cancellation initiated');
                } catch {
                  showSnackbar(
                    'Failed to cancel subscription. Please try again.',
                  );
                }
              }}
              textColor={theme.colors.error}
            >
              Cancel Subscription
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar for feedback messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    marginBottom: 16,
  },
  editButton: {
    borderRadius: 20,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  manageButtonContent: {
    flexDirection: 'row-reverse',
  },
  progressItem: {
    marginBottom: 12,
  },
  progressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileProgressBar: {
    height: 4,
    borderRadius: 2,
  },
  streakMessage: {
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  lastActive: {
    textAlign: 'center',
    marginTop: 4,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noTopicsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  noTopicsText: {
    textAlign: 'center',
  },
  browseTopicsButton: {
    marginTop: 8,
    borderRadius: 20,
  },
  planBadgeRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  planDetails: {
    alignItems: 'center',
  },
  upgradeButton: {
    marginTop: 12,
    borderRadius: 20,
  },
  cancelSubButton: {
    marginTop: 12,
    borderRadius: 20,
  },
  logoutButton: {
    marginTop: 8,
  },
  // Modal styles
  modalContainer: {
    margin: 24,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 4,
  },
  input: {},
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    marginRight: 8,
  },
  dialogTitle: {
    textAlign: 'center',
  },
});

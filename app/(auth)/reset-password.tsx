import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../../src/api/auth';

const resetSchema = z.object({
  otp: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', newPassword: '' },
  });

  const passwordValue = watch('newPassword');

  const passwordChecks = {
    length: (passwordValue?.length ?? 0) >= 8,
    uppercase: /[A-Z]/.test(passwordValue ?? ''),
    lowercase: /[a-z]/.test(passwordValue ?? ''),
    number: /[0-9]/.test(passwordValue ?? ''),
  };

  // Redirect to forgot-password if no email param (e.g. direct navigation)
  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const onSubmit = async (data: ResetFormData) => {
    if (!email) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      redirectTimerRef.current = setTimeout(
        () => router.replace('/(auth)/login'),
        2000,
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Reset failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!email || resendCooldown > 0) return;
    setError(null);
    try {
      await authApi.resendOtp({ email, type: 'password_reset' });
      setSuccess('A new code has been sent to your email.');
      setResendCooldown(60);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Failed to resend code. Please try again.';
      setError(msg);
    }
  }, [email, resendCooldown]);

  const renderPasswordHint = (label: string, met: boolean) => (
    <View style={styles.hintRow} key={label}>
      <MaterialCommunityIcons
        name={met ? 'check-circle' : 'circle-outline'}
        size={16}
        color={met ? '#4CAF50' : '#999'}
      />
      <Text
        style={[styles.hintText, met && styles.hintTextMet]}
        variant="bodySmall"
      >
        {label}
      </Text>
    </View>
  );

  // Don't render form while redirecting due to missing email
  if (!email) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
            />
            <Text variant="headlineLarge" style={styles.title}>
              Reset Password
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Enter the code sent to
            </Text>
            <Text variant="bodyLarge" style={styles.emailText}>
              {email}
            </Text>
          </View>

          <Surface style={styles.formCard} elevation={2}>
            {error ? (
              <Surface style={styles.errorBanner} elevation={0}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#B00020"
                />
                <Text style={styles.errorText}>{error}</Text>
              </Surface>
            ) : null}

            {success ? (
              <Surface style={styles.successBanner} elevation={0}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={styles.successText}>{success}</Text>
              </Surface>
            ) : null}

            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Reset Code"
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 6))}
                    onBlur={onBlur}
                    mode="outlined"
                    keyboardType="number-pad"
                    maxLength={6}
                    error={!!errors.otp}
                    left={<TextInput.Icon icon="shield-key-outline" />}
                    style={[styles.input, styles.otpInput]}
                  />
                  {errors.otp ? (
                    <HelperText type="error" visible={!!errors.otp}>
                      {errors.otp.message}
                    </HelperText>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="New Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    secureTextEntry={secureTextEntry}
                    error={!!errors.newPassword}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                      <TextInput.Icon
                        icon={secureTextEntry ? 'eye-off' : 'eye'}
                        onPress={() => setSecureTextEntry(!secureTextEntry)}
                      />
                    }
                    style={styles.input}
                  />
                  <View style={styles.hintsContainer}>
                    {renderPasswordHint('At least 8 characters', passwordChecks.length)}
                    {renderPasswordHint('One uppercase letter', passwordChecks.uppercase)}
                    {renderPasswordHint('One lowercase letter', passwordChecks.lowercase)}
                    {renderPasswordHint('One number', passwordChecks.number)}
                  </View>
                </View>
              )}
            />

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting || !!success}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>

            <Button
              mode="text"
              onPress={handleResend}
              disabled={resendCooldown > 0}
              style={styles.resendButton}
            >
              {resendCooldown > 0
                ? `Resend Code (${resendCooldown}s)`
                : 'Resend Code'}
            </Button>
          </Surface>

          <View style={styles.footer}>
            <Button
              mode="text"
              onPress={() => router.replace('/(auth)/login')}
              compact
            >
              Back to Login
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  title: {
    fontWeight: '700',
    color: '#6200EE',
    marginTop: 12,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  emailText: {
    color: '#6200EE',
    fontWeight: '600',
    marginTop: 2,
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#B00020',
    fontSize: 14,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  hintsContainer: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
    gap: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    color: '#999',
  },
  hintTextMet: {
    color: '#4CAF50',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
});

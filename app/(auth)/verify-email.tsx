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
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { authApi } from '../../src/api/auth';

const verifySchema = z.object({
  otp: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const pendingEmail = useAuthStore((s) => s.pendingVerificationEmail);
  const setVerified = useAuthStore((s) => s.setVerified);
  const logout = useAuthStore((s) => s.logout);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: '' },
  });

  // Redirect to login if no pending email (e.g. direct navigation)
  useEffect(() => {
    if (!pendingEmail) {
      router.replace('/(auth)/login');
    }
  }, [pendingEmail, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Clean up success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const onSubmit = async (data: VerifyFormData) => {
    if (!pendingEmail) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.verifyEmail({ email: pendingEmail, otp: data.otp });
      setSuccess('Email verified! Redirecting...');
      setVerified();
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!pendingEmail || resendCooldown > 0) return;
    setError(null);
    try {
      await authApi.resendOtp({
        email: pendingEmail,
        type: 'email_verification',
      });
      setSuccess('A new code has been sent to your email.');
      setResendCooldown(60);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Failed to resend code. Please try again.';
      setError(msg);
    }
  }, [pendingEmail, resendCooldown]);

  const handleBackToLogin = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Don't render form while redirecting due to missing email
  if (!pendingEmail) return null;

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
              Verify Your Email
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              We sent a 6-digit code to
            </Text>
            <Text variant="bodyLarge" style={styles.emailText}>
              {pendingEmail}
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
                    label="Verification Code"
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

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
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
            <Button mode="text" onPress={handleBackToLogin} compact>
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

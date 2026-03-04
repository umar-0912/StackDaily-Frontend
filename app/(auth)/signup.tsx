import { useState } from 'react';
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
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';

const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9]+$/,
      'Username can only contain letters and numbers',
    ),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isSubmitting, error, clearError } = useAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const passwordValue = watch('password');

  const passwordChecks = {
    length: (passwordValue?.length ?? 0) >= 8,
    uppercase: /[A-Z]/.test(passwordValue ?? ''),
    lowercase: /[a-z]/.test(passwordValue ?? ''),
    number: /[0-9]/.test(passwordValue ?? ''),
  };

  const onSubmit = async (data: SignupFormData) => {
    clearError();
    try {
      await signup({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      router.replace('/(tabs)/feed');
    } catch {
      // Error is handled by the auth store and displayed below
    }
  };

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
              Join StackDaily
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Start your learning journey today
            </Text>
          </View>

          <Surface style={styles.formCard} elevation={2}>
            <Text variant="titleLarge" style={styles.formTitle}>
              Create Account
            </Text>

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

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Username"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={!!errors.username}
                    left={<TextInput.Icon icon="account-outline" />}
                    style={styles.input}
                  />
                  {errors.username ? (
                    <HelperText type="error" visible={!!errors.username}>
                      {errors.username.message}
                    </HelperText>
                  ) : (
                    <HelperText type="info" visible>
                      3-30 characters, letters and numbers only
                    </HelperText>
                  )}
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
                    style={styles.input}
                  />
                  {errors.email ? (
                    <HelperText type="error" visible={!!errors.email}>
                      {errors.email.message}
                    </HelperText>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    secureTextEntry={secureTextEntry}
                    error={!!errors.password}
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
                    {renderPasswordHint(
                      'One uppercase letter',
                      passwordChecks.uppercase,
                    )}
                    {renderPasswordHint(
                      'One lowercase letter',
                      passwordChecks.lowercase,
                    )}
                    {renderPasswordHint('One number', passwordChecks.number)}
                  </View>
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
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Surface>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Button mode="text" compact>
                Sign In
              </Button>
            </Link>
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
    marginBottom: 24,
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
  formCard: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
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
  inputWrapper: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
});

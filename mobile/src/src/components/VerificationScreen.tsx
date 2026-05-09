import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import { AnimatedButton, LoadingSpinner } from './';

type VerificationMethod = 'email' | 'messenger' | 'whatsapp' | 'google';

interface VerificationScreenProps {
  email: string;
  onVerificationComplete: (method: VerificationMethod, code?: string) => void;
  onBack: () => void;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({
  email,
  onVerificationComplete,
  onBack,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  React.useEffect(() => {
    if (isCodeSent && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isCodeSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMethodSelect = async (method: VerificationMethod) => {
    setSelectedMethod(method);
    setIsLoading(true);

    try {
      if (method === 'google') {
        // Google Sign-In implementation
        onVerificationComplete('google');
      } else {
        // Send verification code for other methods
        await sendVerificationCode(method);
        setIsCodeSent(true);
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      Alert.alert('Error', 'No se pudo enviar el código de verificación');
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (method: VerificationMethod) => {
    // Simulate API call to send verification code
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Sending verification code via ${method} to ${email}`);
        resolve(true);
      }, 1500);
    });
  };

  const handleCodeVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa un código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (verificationCode === '123456') { // Demo code
        onVerificationComplete(selectedMethod!, verificationCode);
      } else {
        Alert.alert('Error', 'Código inválido. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'No se pudo verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (selectedMethod) {
      setTimeLeft(60);
      await sendVerificationCode(selectedMethod);
      Alert.alert('Éxito', 'Código reenviado');
    }
  };

  const getMethodIcon = (method: VerificationMethod) => {
    switch (method) {
      case 'email':
        return 'email';
      case 'messenger':
        return 'chat';
      case 'whatsapp':
        return 'whatsapp';
      case 'google':
        return 'google';
      default:
        return 'help';
    }
  };

  const getMethodTitle = (method: VerificationMethod) => {
    switch (method) {
      case 'email':
        return 'Email';
      case 'messenger':
        return 'Messenger';
      case 'whatsapp':
        return 'WhatsApp';
      case 'google':
        return 'Google';
      default:
        return 'Desconocido';
    }
  };

  const getMethodDescription = (method: VerificationMethod) => {
    switch (method) {
      case 'email':
        return 'Recibirás un código en tu correo electrónico';
      case 'messenger':
        return 'Recibirás un código por Facebook Messenger';
      case 'whatsapp':
        return 'Recibirás un código por WhatsApp';
      case 'google':
        return 'Inicia sesión con tu cuenta de Google';
      default:
        return '';
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Procesando..." overlay />;
  }

  if (selectedMethod && selectedMethod !== 'google' && isCodeSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#64748b" />
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <MaterialIcons name={getMethodIcon(selectedMethod)} size={48} color="#3b82f6" />
            </View>
            
            <Text style={styles.title}>Verificar tu identidad</Text>
            <Text style={styles.subtitle}>
              Enviamos un código a {email}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.instruction}>
              Ingresa el código de 6 dígitos que recibiste por {getMethodTitle(selectedMethod)}
            </Text>

            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            <AnimatedButton
              title="Verificar Código"
              onPress={handleCodeVerification}
              variant="primary"
              size="large"
              fullWidth
              style={styles.verifyButton}
              disabled={verificationCode.length !== 6}
            />

            <View style={styles.resendContainer}>
              {timeLeft > 0 ? (
                <Text style={styles.timerText}>
                  Reenviar código en {formatTime(timeLeft)}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={styles.resendLink}>Reenviar código</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>¿No recibiste el código?</Text>
            <TouchableOpacity onPress={() => setSelectedMethod(null)} style={styles.changeMethodLink}>
              <Text style={styles.changeMethodText}>Probar otro método</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#64748b" />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <MaterialIcons name="verified-user" size={64} color="#3b82f6" />
          </View>
          
          <Text style={styles.title}>Verifica tu identidad</Text>
          <Text style={styles.subtitle}>
            Elige un método para verificar que eres tú
          </Text>
        </View>

        <View style={styles.methodsContainer}>
          <Text style={styles.methodsTitle}>Métodos de verificación</Text>
          
          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => handleMethodSelect('email')}
            disabled={isLoading}
          >
            <View style={styles.methodHeader}>
              <MaterialIcons name="email" size={32} color="#3b82f6" />
              <Text style={styles.methodTitle}>Email</Text>
            </View>
            <Text style={styles.methodDescription}>
              Recibirás un código en tu correo electrónico
            </Text>
            <View style={styles.methodFooter}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.methodFooterText}>Rápido y seguro</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => handleMethodSelect('messenger')}
            disabled={isLoading}
          >
            <View style={styles.methodHeader}>
              <MaterialIcons name="chat" size={32} color="#0084ff" />
              <Text style={styles.methodTitle}>Messenger</Text>
            </View>
            <Text style={styles.methodDescription}>
              Recibirás un código por Facebook Messenger
            </Text>
            <View style={styles.methodFooter}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.methodFooterText}>Notificación instantánea</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => handleMethodSelect('whatsapp')}
            disabled={isLoading}
          >
            <View style={styles.methodHeader}>
              <MaterialIcons name="whatsapp" size={32} color="#25d366" />
              <Text style={styles.methodTitle}>WhatsApp</Text>
            </View>
            <Text style={styles.methodDescription}>
              Recibirás un código por WhatsApp
            </Text>
            <View style={styles.methodFooter}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.methodFooterText}>Popular y confiable</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, styles.googleCard]}
            onPress={() => handleMethodSelect('google')}
            disabled={isLoading}
          >
            <View style={styles.methodHeader}>
              <MaterialIcons name="google" size={32} color="#4285f4" />
              <Text style={styles.methodTitle}>Google</Text>
            </View>
            <Text style={styles.methodDescription}>
              Inicia sesión con tu cuenta de Google
            </Text>
            <View style={styles.methodFooter}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.methodFooterText}>Sin contraseñas</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al continuar, aceptas nuestras{' '}
            <Text style={styles.footerLink}>Políticas de Privacidad</Text> y{' '}
            <Text style={styles.footerLink}>Términos de Servicio</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  methodsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  googleCard: {
    borderColor: '#4285f4',
    borderWidth: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  methodDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  methodFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodFooterText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  instruction: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  codeInputContainer: {
    marginBottom: 32,
  },
  codeInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
  },
  verifyButton: {
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#64748b',
  },
  resendLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  changeMethodLink: {
    paddingVertical: 8,
  },
  changeMethodText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default VerificationScreen;

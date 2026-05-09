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
import { useAuth } from '../../contexts';
import { AnimatedButton, LoadingSpinner, CameraCapture, VerificationScreen } from '../../components';

interface EnhancedRegisterScreenProps {
  navigation: any;
}

const EnhancedRegisterScreen: React.FC<EnhancedRegisterScreenProps> = ({ navigation }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    acceptTerms: false,
    acceptMarketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'messenger' | 'whatsapp' | 'google' | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return false;
    }
    if (formData.name.trim().length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu teléfono');
      return false;
    }
    if (formData.phone.trim().length < 8) {
      Alert.alert('Error', 'El teléfono debe tener al menos 8 dígitos');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu ubicación');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!selfieImage) {
      Alert.alert('Error', 'Por favor toma una selfie para verificar tu identidad');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.acceptTerms) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 1:
        if (validateStep1()) setCurrentStep(2);
        break;
      case 2:
        if (validateStep2()) setCurrentStep(3);
        break;
      case 3:
        if (validateStep3()) setCurrentStep(4);
        break;
      case 4:
        if (validateStep4()) setCurrentStep(5);
        break;
      default:
        break;
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelfieCapture = (imageUri: string) => {
    setSelfieImage(imageUri);
  };

  const handleVerificationComplete = (method: any, code?: string) => {
    setVerificationMethod(method);
    if (code) {
      setVerificationCode(code);
    }
    setCurrentStep(6);
  };

  const handleRegister = async () => {
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        location: formData.location.trim(),
        acceptTerms: formData.acceptTerms,
        acceptMarketing: formData.acceptMarketing,
        selfieImage,
        verificationMethod,
        verificationCode,
      });
      // Navigation will be handled by AuthProvider
    } catch (error) {
      // Error is already handled by AuthProvider
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Datos Básicos', icon: 'person' },
      { number: 2, title: 'Seguridad', icon: 'lock' },
      { number: 3, title: 'Verificación', icon: 'camera-alt' },
      { number: 4, title: 'Términos', icon: 'description' },
      { number: 5, title: 'Confirmar', icon: 'verified-user' },
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.number} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              currentStep === step.number && styles.activeStep,
              currentStep > step.number && styles.completedStep
            ]}>
              {currentStep > step.number ? (
                <MaterialIcons name="check" size={16} color="#ffffff" />
              ) : (
                <MaterialIcons name={step.icon} size={16} color={currentStep === step.number ? "#3b82f6" : "#94a3b8"} />
              )}
            </View>
            <Text style={[
              styles.stepText,
              currentStep === step.number && styles.activeStepText,
              currentStep > step.number && styles.completedStepText
            ]}>
              {step.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Información Personal</Text>
      <Text style={styles.stepSubtitle}>Cuéntanos sobre ti</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="person" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor="#94a3b8"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#94a3b8"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="phone" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          placeholderTextColor="#94a3b8"
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="location-on" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Ciudad o ubicación"
          placeholderTextColor="#94a3b8"
          value={formData.location}
          onChangeText={(value) => handleInputChange('location', value)}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Configura tu contraseña</Text>
      <Text style={styles.stepSubtitle}>Crea una contraseña segura</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { paddingRight: 50 }]}
          placeholder="Contraseña"
          placeholderTextColor="#94a3b8"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          <MaterialIcons
            name={showPassword ? "visibility-off" : "visibility"}
            size={20}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { paddingRight: 50 }]}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#94a3b8"
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={isLoading}
        >
          <MaterialIcons
            name={showConfirmPassword ? "visibility-off" : "visibility"}
            size={20}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Requisitos de contraseña:</Text>
        <View style={styles.requirementItem}>
          <MaterialIcons name={formData.password.length >= 6 ? "check-circle" : "radio-button-unchecked"} size={16} color={formData.password.length >= 6 ? "#10b981" : "#94a3b8"} />
          <Text style={styles.requirementText}>Al menos 6 caracteres</Text>
        </View>
        <View style={styles.requirementItem}>
          <MaterialIcons name={formData.password === formData.confirmPassword && formData.password.length > 0 ? "check-circle" : "radio-button-unchecked"} size={16} color={formData.password === formData.confirmPassword && formData.password.length > 0 ? "#10b981" : "#94a3b8"} />
          <Text style={styles.requirementText}>Las contraseñas coinciden</Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verificación de Identidad</Text>
      <Text style={styles.stepSubtitle}>Toma una selfie para verificarte</Text>
      
      <CameraCapture
        onImageCapture={handleSelfieCapture}
        title="Toma una selfie clara"
        subtitle="Tu rostro debe ser claramente visible"
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Términos y Condiciones</Text>
      <Text style={styles.stepSubtitle}>Acepta los términos para continuar</Text>

      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleInputChange('acceptTerms', !formData.acceptTerms)}
          disabled={isLoading}
        >
          <MaterialIcons
            name={formData.acceptTerms ? "check-box" : "check-box-outline-blank"}
            size={20}
            color={formData.acceptTerms ? "#3b82f6" : "#64748b"}
          />
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Text style={styles.termsLink} onPress={() => Alert.alert('Términos y Condiciones', 'Aquí se mostrarán los términos y condiciones')}>
              Términos y Condiciones
            </Text>{' '}
            y la{' '}
            <Text style={styles.termsLink} onPress={() => Alert.alert('Política de Privacidad', 'Aquí se mostrará la política de privacidad')}>
              Política de Privacidad
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleInputChange('acceptMarketing', !formData.acceptMarketing)}
          disabled={isLoading}
        >
          <MaterialIcons
            name={formData.acceptMarketing ? "check-box" : "check-box-outline-blank"}
            size={20}
            color={formData.acceptMarketing ? "#3b82f6" : "#64748b"}
          />
          <Text style={styles.termsText}>
            Quiero recibir ofertas y promociones por email
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumen del registro:</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Nombre:</Text>
          <Text style={styles.summaryValue}>{formData.name}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Email:</Text>
          <Text style={styles.summaryValue}>{formData.email}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Teléfono:</Text>
          <Text style={styles.summaryValue}>{formData.phone}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ubicación:</Text>
          <Text style={styles.summaryValue}>{formData.location}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Selfie:</Text>
          <Text style={styles.summaryValue}>{selfieImage ? 'Capturada' : 'Pendiente'}</Text>
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <VerificationScreen
        email={formData.email}
        onVerificationComplete={handleVerificationComplete}
        onBack={handlePreviousStep}
      />
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <View style={styles.successContainer}>
        <MaterialIcons name="verified-user" size={64} color="#10b981" />
        <Text style={styles.successTitle}>¡Registro completado!</Text>
        <Text style={styles.successMessage}>
          Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a todos los servicios de MiProfesional.
        </Text>
        
        <AnimatedButton
          title="Ir al Inicio"
          onPress={handleRegister}
          variant="primary"
          size="large"
          fullWidth
          style={styles.successButton}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return renderStep1();
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Procesando registro..." overlay />;
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#64748b" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <MaterialIcons name="build" size={48} color="#3b82f6" />
            <Text style={styles.appName}>MiProfesional</Text>
          </View>
        </View>

        {/* Step Indicator */}
        {currentStep <= 5 && renderStepIndicator()}

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        {currentStep <= 4 && (
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <AnimatedButton
                title="Anterior"
                onPress={handlePreviousStep}
                variant="outline"
                size="large"
                style={styles.navButton}
                disabled={isLoading}
              />
            )}
            
            <AnimatedButton
              title={currentStep === 4 ? "Verificar Identidad" : "Siguiente"}
              onPress={handleNextStep}
              variant="primary"
              size="large"
              style={[styles.navButton, currentStep === 1 && styles.fullWidthButton]}
              disabled={isLoading}
            />
          </View>
        )}

        {/* Footer */}
        {currentStep <= 4 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al registrarte, aceptas recibir comunicaciones de MiProfesional sobre tus servicios y actualizaciones.
            </Text>
          </View>
        )}
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
    marginVertical: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 30,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  activeStep: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  completedStep: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stepText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  activeStepText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  completedStepText: {
    color: '#10b981',
    fontWeight: '600',
  },
  stepContent: {
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
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 16,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  passwordRequirements: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successButton: {
    marginBottom: 24,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  navButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
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
});

export default EnhancedRegisterScreen;

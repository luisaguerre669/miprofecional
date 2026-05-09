import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { launchCameraAsync, launchImageLibraryAsync } from 'expo-image-picker';
import * as Location from 'expo-location';

interface VerificationMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiresSelfie: boolean;
  requiresCode: boolean;
  requiresLicense?: boolean;
}

interface IdentityVerificationScreenProps {
  onVerificationComplete?: () => void;
  userType?: 'client' | 'professional';
}

const IdentityVerificationScreen: React.FC<IdentityVerificationScreenProps> = ({
  onVerificationComplete,
  userType = 'professional'
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [verificationData, setVerificationData] = useState<any>({});
  const [selfieImage, setSelfieImage] = useState<string>('');
  const [licenseImage, setLicenseImage] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const verificationMethods: VerificationMethod[] = [
    {
      id: 'selfie',
      name: 'Selfie',
      icon: 'camera',
      description: 'Toma una foto de tu rostro para verificar tu identidad',
      requiresSelfie: true,
      requiresCode: false,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'logo-whatsapp',
      description: 'Recibe un código de verificación por WhatsApp',
      requiresSelfie: userType === 'professional',
      requiresCode: true,
    },
    {
      id: 'messenger',
      name: 'Messenger',
      icon: 'logo-facebook-messenger',
      description: 'Recibe un código de verificación por Messenger',
      requiresSelfie: userType === 'professional',
      requiresCode: true,
    },
    {
      id: 'email',
      name: 'Email',
      icon: 'mail',
      description: 'Recibe un código de verificación por email',
      requiresSelfie: userType === 'professional',
      requiresCode: true,
    },
    {
      id: 'google',
      name: 'Google',
      icon: 'logo-google',
      description: 'Verifica tu identidad con tu cuenta de Google',
      requiresSelfie: false,
      requiresCode: false,
    },
  ];

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Error', 'Se requieren permisos de cámara para la verificación');
        }
      } catch (err) {
        console.warn(err);
      }
    }

    // Solicitar permisos de ubicación
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
    }
  };

  const handleMethodSelection = (method: VerificationMethod) => {
    setSelectedMethod(method.id);
    
    if (method.id === 'google') {
      handleGoogleVerification();
    } else if (method.requiresSelfie) {
      setShowCameraModal(true);
    } else if (method.requiresCode) {
      handleCodeVerification(method.id);
    }
  };

  const handleCameraCapture = async (useLibrary: boolean = false) => {
    try {
      setIsLoading(true);
      
      let result;
      if (useLibrary) {
        result = await launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelfieImage(imageUri);
        setShowCameraModal(false);
        
        if (selectedMethod === 'selfie') {
          await uploadSelfie(imageUri);
        } else {
          // Para otros métodos que también requieren selfie
          setCurrentStep(2);
        }
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'No se pudo capturar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLicenseCapture = async (useLibrary: boolean = false) => {
    try {
      setIsLoading(true);
      
      let result;
      if (useLibrary) {
        result = await launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.9,
        });
      } else {
        result = await launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.9,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setLicenseImage(imageUri);
        await uploadLicense(imageUri);
      }
    } catch (error) {
      console.error('Error capturing license:', error);
      Alert.alert('Error', 'No se pudo capturar la imagen de la matrícula');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadSelfie = async (imageUri: string) => {
    try {
      setIsLoading(true);
      
      // Simular upload - en producción esto llamaría a la API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Éxito', 'Selfie subida correctamente');
      
      if (selectedMethod === 'selfie') {
        setVerificationStatus('verified');
        onVerificationComplete?.();
      } else {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error uploading selfie:', error);
      Alert.alert('Error', 'No se pudo subir la selfie');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLicense = async (imageUri: string) => {
    try {
      setIsLoading(true);
      
      // Simular upload - en producción esto llamaría a la API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Éxito', 'Matrícula subida correctamente');
      setCurrentStep(4);
    } catch (error) {
      console.error('Error uploading license:', error);
      Alert.alert('Error', 'No se pudo subir la matrícula');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerification = (method: string) => {
    setShowCodeModal(true);
    
    // Simular envío de código
    Alert.alert(
      'Código Enviado',
      `Se ha enviado un código de 6 dígitos a tu ${method === 'whatsapp' ? 'WhatsApp' : method === 'messenger' ? 'Messenger' : 'email'}`
    );
  };

  const handleCodeSubmit = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos');
      return;
    }

    try {
      setIsLoading(true);
      
      // Simular verificación - en producción esto llamaría a la API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (verificationCode === '123456') { // Código de prueba
        setVerificationStatus('verified');
        setShowCodeModal(false);
        Alert.alert('Éxito', 'Verificación completada exitosamente');
        onVerificationComplete?.();
      } else {
        Alert.alert('Error', 'Código incorrecto. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'No se pudo verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleVerification = async () => {
    try {
      setIsLoading(true);
      
      // Simular verificación con Google - en producción usaría Google Sign-In
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationStatus('verified');
      Alert.alert('Éxito', 'Verificación con Google completada');
      onVerificationComplete?.();
    } catch (error) {
      console.error('Error with Google verification:', error);
      Alert.alert('Error', 'No se pudo completar la verificación con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerificationMethods = () => (
    <View style={styles.methodsContainer}>
      <Text style={styles.sectionTitle}>Selecciona un método de verificación</Text>
      <Text style={styles.sectionSubtitle}>
        {userType === 'professional' 
          ? 'Como profesional, debes verificar tu identidad para ofrecer servicios'
          : 'Verifica tu identidad para mayor seguridad'
        }
      </Text>
      
      {verificationMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={styles.methodCard}
          onPress={() => handleMethodSelection(method)}
        >
          <View style={styles.methodHeader}>
            <Ionicons name={method.icon as any} size={32} color="#3b82f6" />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
          </View>
          
          {method.requiresSelfie && (
            <View style={styles.requirementBadge}>
              <MaterialIcons name="camera" size={16} color="#3b82f6" />
              <Text style={styles.requirementText}>Selfie requerida</Text>
            </View>
          )}
          
          {method.requiresCode && (
            <View style={styles.requirementBadge}>
              <MaterialIcons name="sms" size={16} color="#3b82f6" />
              <Text style={styles.requirementText}>Código requerido</Text>
            </View>
          )}
          
          {userType === 'professional' && method.id !== 'google' && (
            <View style={styles.requirementBadge}>
              <MaterialIcons name="verified-user" size={16} color="#3b82f6" />
              <Text style={styles.requirementText}>Matrícula requerida</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCameraModal = () => (
    <Modal
      visible={showCameraModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCameraModal(false)}>
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {selectedMethod === 'selfie' ? 'Tomar Selfie' : 'Foto de Perfil'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.cameraInstructions}>
            <Ionicons name="camera" size={64} color="#3b82f6" />
            <Text style={styles.instructionTitle}>
              {selectedMethod === 'selfie' ? 'Toma una selfie clara' : 'Sube tu foto de perfil'}
            </Text>
            <Text style={styles.instructionText}>
              {selectedMethod === 'selfie' 
                ? 'Asegúrate de que tu rostro sea visible y bien iluminado. Sin gafas ni sombreros.'
                : 'Usa una foto clara donde se vea bien tu rostro.'
              }
            </Text>
          </View>

          <View style={styles.cameraOptions}>
            <TouchableOpacity
              style={[styles.cameraButton, styles.primaryButton]}
              onPress={() => handleCameraCapture(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="camera" size={24} color="#ffffff" />
                  <Text style={styles.buttonText}>Tomar Foto</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cameraButton, styles.secondaryButton]}
              onPress={() => handleCameraCapture(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#3b82f6" />
              ) : (
                <>
                  <MaterialIcons name="photo-library" size={24} color="#3b82f6" />
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>Seleccionar de Galería</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {userType === 'professional' && selectedMethod !== 'selfie' && (
            <View style={styles.licenseSection}>
              <Text style={styles.licenseTitle}>Matrícula Profesional</Text>
              <Text style={styles.licenseDescription}>
                Si tienes matrícula profesional (abogado, médico, etc.), sube una foto clara.
              </Text>
              
              <TouchableOpacity
                style={[styles.cameraButton, styles.licenseButton]}
                onPress={() => handleLicenseCapture(false)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="badge" size={24} color="#ffffff" />
                    <Text style={styles.buttonText}>Subir Matrícula</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderCodeModal = () => (
    <Modal
      visible={showCodeModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCodeModal(false)}>
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Verificar Código</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.codeInstructions}>
            <MaterialIcons name="sms" size={64} color="#3b82f6" />
            <Text style={styles.instructionTitle}>Ingresa el código de 6 dígitos</Text>
            <Text style={styles.instructionText}>
              Hemos enviado un código a tu {selectedMethod === 'whatsapp' ? 'WhatsApp' : selectedMethod === 'messenger' ? 'Messenger' : 'email'}
            </Text>
          </View>

          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, !verificationCode || verificationCode.length !== 6 && styles.disabledButton]}
            onPress={handleCodeSubmit}
            disabled={!verificationCode || verificationCode.length !== 6 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Verificar Código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendButton}>
            <Text style={styles.resendButtonText}>Reenviar código</Text>
          </TouchableOpacity>

          <Text style={styles.testCodeText}>
            Código de prueba: 123456
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderLegalDisclaimer = () => (
    <View style={styles.legalContainer}>
      <View style={styles.legalHeader}>
        <MaterialIcons name="gavel" size={24} color="#f59e0b" />
        <Text style={styles.legalTitle}>Importante: Limitación de Responsabilidad</Text>
      </View>
      
      <Text style={styles.legalText}>
        MiProfesional es una plataforma que únicamente conecta a clientes con profesionales. No manejamos dinero ni somos parte de los contratos entre las partes.
      </Text>
      
      <Text style={styles.legalText}>
        No nos hacemos responsables por falta de pago, trabajos mal terminados, o cualquier problema que surja entre clientes y profesionales.
      </Text>
      
      <Text style={styles.legalText}>
        Al registrarte, aceptas estos términos y comprendes que MiProfesional actúa únicamente como intermediario.
      </Text>
      
      <TouchableOpacity style={styles.termsButton}>
        <Text style={styles.termsButtonText}>Ver Términos y Condiciones Completos</Text>
      </TouchableOpacity>
    </View>
  );

  if (verificationStatus === 'verified') {
    return (
      <View style={styles.verifiedContainer}>
        <View style={styles.verifiedContent}>
          <MaterialIcons name="verified-user" size={80} color="#10b981" />
          <Text style={styles.verifiedTitle}>Verificación Completada</Text>
          <Text style={styles.verifiedText}>
            Tu identidad ha sido verificada exitosamente. Ya puedes comenzar a ofrecer tus servicios.
          </Text>
          <TouchableOpacity style={styles.continueButton} onPress={onVerificationComplete}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Verificación de Identidad</Text>
          <Text style={styles.subtitle}>
            {userType === 'professional' 
              ? 'Verifica tu identidad para ofrecer servicios con confianza'
              : 'Verifica tu identidad para mayor seguridad'
            }
          </Text>
        </View>

        {renderVerificationMethods()}
        {renderLegalDisclaimer()}
      </ScrollView>

      {renderCameraModal()}
      {renderCodeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  methodsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  requirementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  cameraInstructions: {
    alignItems: 'center',
    marginBottom: 32,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  cameraOptions: {
    gap: 12,
    marginBottom: 32,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
  licenseSection: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  licenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  licenseDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  licenseButton: {
    backgroundColor: '#10b981',
  },
  codeInstructions: {
    alignItems: 'center',
    marginBottom: 32,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '600',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  testCodeText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  legalContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  legalText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
    marginBottom: 12,
  },
  termsButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  termsButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  verifiedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  verifiedContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  verifiedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
});

export default IdentityVerificationScreen;

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Easing,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface CameraCaptureProps {
  onImageCapture: (imageUri: string) => void;
  title?: string;
  subtitle?: string;
  showGallery?: boolean;
  maxSize?: number;
  quality?: number;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImageCapture,
  title = "Toma una selfie",
  subtitle = "Tu foto ayudará a verificar tu identidad",
  showGallery = true,
  maxSize = 1024 * 1024, // 1MB
  quality = 0.8,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const checkCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (!granted) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }
    return true;
  };

  const validateImage = (imageUri: string): boolean => {
    // Aquí podrías agregar validaciones más avanzadas
    // como detección de rostros, calidad de imagen, etc.
    return true;
  };

  const processImage = async (imageUri: string): Promise<string> => {
    // Simulación de procesamiento de imagen
    // En producción, aquí podrías:
    // - Comprimir la imagen
    // - Detectar rostros
    // - Validar calidad
    // - Aplicar filtros si es necesario
    return new Promise((resolve) => {
      setTimeout(() => resolve(imageUri), 1000);
    });
  };

  const handleCameraCapture = async () => {
    try {
      setIsCapturing(true);

      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        Alert.alert('Error', 'Se requiere permiso de cámara para continuar');
        return;
      }

      const options = {
        mediaType: 'photo' as const,
        quality: quality,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: false,
      };

      launchCamera(options, (response) => {
        if (response.didCancel || response.errorMessage) {
          setIsCapturing(false);
          return;
        }

        if (response.assets && response.assets[0]) {
          const imageUri = response.assets[0].uri;
          if (imageUri) {
            setIsProcessing(true);
            processImage(imageUri)
              .then((processedUri) => {
                if (validateImage(processedUri)) {
                  setCapturedImage(processedUri);
                  onImageCapture(processedUri);
                } else {
                  Alert.alert('Error', 'La imagen no cumple con los requisitos');
                }
              })
              .catch((error) => {
                console.error('Error processing image:', error);
                Alert.alert('Error', 'No se pudo procesar la imagen');
              })
              .finally(() => {
                setIsProcessing(false);
                setIsCapturing(false);
              });
          }
        }
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
      setIsCapturing(false);
    }
  };

  const handleGallerySelect = async () => {
    try {
      setIsCapturing(true);

      const options = {
        mediaType: 'photo' as const,
        quality: quality,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: false,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel || response.errorMessage) {
          setIsCapturing(false);
          return;
        }

        if (response.assets && response.assets[0]) {
          const imageUri = response.assets[0].uri;
          if (imageUri) {
            setIsProcessing(true);
            processImage(imageUri)
              .then((processedUri) => {
                if (validateImage(processedUri)) {
                  setCapturedImage(processedUri);
                  onImageCapture(processedUri);
                } else {
                  Alert.alert('Error', 'La imagen no cumple con los requisitos');
                }
              })
              .catch((error) => {
                console.error('Error processing image:', error);
                Alert.alert('Error', 'No se pudo procesar la imagen');
              })
              .finally(() => {
                setIsProcessing(false);
                setIsCapturing(false);
              });
          }
        }
      });
    } catch (error) {
      console.error('Error accessing gallery:', error);
      Alert.alert('Error', 'No se pudo acceder a la galería');
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
    }
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <Text style={styles.previewTitle}>¡Foto capturada!</Text>
            <Text style={styles.previewSubtitle}>¿Estás satisfecho con el resultado?</Text>
          </View>
        </View>
        
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retakeButton]}
            onPress={handleRetake}
            disabled={isProcessing}
          >
            <MaterialIcons name="refresh" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Tomar otra</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleConfirm}
            disabled={isProcessing}
          >
            <MaterialIcons name="check" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="camera-alt" size={64} color="#3b82f6" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.cameraContainer}>
        <Animated.View style={[styles.cameraPlaceholder, { transform: [{ scale: pulseAnimation }] }]}>
          <MaterialIcons name="camera" size={80} color="#94a3b8" />
        </Animated.View>
        
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Requisitos:</Text>
          <View style={styles.requirementItem}>
            <MaterialIcons name="check-circle" size={16} color="#10b981" />
            <Text style={styles.requirementText}>Rostro claramente visible</Text>
          </View>
          <View style={styles.requirementItem}>
            <MaterialIcons name="check-circle" size={16} color="#10b981" />
            <Text style={styles.requirementText}>Buena iluminación</Text>
          </View>
          <View style={styles.requirementItem}>
            <MaterialIcons name="check-circle" size={16} color="#10b981" />
            <Text style={styles.requirementText}>Sin filtros o efectos</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.captureButton, styles.primaryButton]}
          onPress={handleCameraCapture}
          disabled={isCapturing || isProcessing}
        >
          {isCapturing || isProcessing ? (
            <MaterialIcons name="hourglass-empty" size={24} color="#ffffff" />
          ) : (
            <MaterialIcons name="camera-alt" size={24} color="#ffffff" />
          )}
          <Text style={styles.buttonText}>
            {isProcessing ? 'Procesando...' : 'Tomar Selfie'}
          </Text>
        </TouchableOpacity>

        {showGallery && (
          <TouchableOpacity
            style={[styles.captureButton, styles.secondaryButton]}
            onPress={handleGallerySelect}
            disabled={isCapturing || isProcessing}
          >
            <MaterialIcons name="photo-library" size={24} color="#3b82f6" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Elegir de Galería
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  cameraPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  requirements: {
    marginTop: 32,
    alignItems: 'flex-start',
    width: '100%',
  },
  requirementsTitle: {
    fontSize: 16,
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
  actions: {
    gap: 16,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f8fafc',
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
  // Preview styles
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    borderRadius: 16,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: '#ef4444',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CameraCapture;

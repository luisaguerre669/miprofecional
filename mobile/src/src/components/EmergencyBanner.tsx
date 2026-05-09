import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

interface EmergencyBannerProps {
  onPress?: () => void;
  style?: any;
}

const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ onPress, style }) => {
  const handlePress = () => {
    Alert.alert(
      'Servicio de Emergencia',
      '¿Necesitas ayuda urgente? Te conectaremos con profesionales disponibles 24/7.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Buscar Emergencia', onPress: onPress },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="warning" size={32} color="white" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Emergencias 24 Horas</Text>
            <Text style={styles.subtitle}>
              Profesionales disponibles para urgencias
            </Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Icon name="arrow-forward" size={24} color="white" />
          </View>
        </View>
        
        <View style={styles.pulseContainer}>
          <View style={styles.pulse} />
          <View style={styles.pulse} />
          <View style={styles.pulse} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 12,
    height: 12,
  },
  pulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});

export default EmergencyBanner;

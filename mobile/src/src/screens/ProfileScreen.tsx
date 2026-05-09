import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NavigationProps, User } from '../types';

const ProfileScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [user] = useState<User>({
    id: '1',
    name: 'Luis Aguero',
    email: 'luis.aguero@miprofesional.com',
    phone: '+54 9 1234-5678',
    type: 'professional',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0c2e8749c8a?w=150&h=150&fit=crop&crop=face&auto=format',
    location: {
      latitude: -34.6037,
      longitude: -58.3816,
      address: 'Palermo, Buenos Aires',
    },
    createdAt: '2024-01-15T10:00:00Z',
  });

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
  });

  const [privacy, setPrivacy] = useState({
    showPhone: true,
    showEmail: true,
    showLocation: true,
  });

  const handleEditProfile = () => {
    Alert.alert(
      'Editar Perfil',
      '¿Qué deseas editar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Información Personal', onPress: () => console.log('Edit personal info') },
        { text: 'Servicios', onPress: () => console.log('Edit services') },
        { text: 'Configuración', onPress: () => console.log('Edit settings') },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          onPress: () => {
            console.log('Logging out...');
            navigation.navigate('Home');
          }
        },
      ]
    );
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <TouchableOpacity style={styles.editAvatarButton}>
          <Icon name="camera-alt" size={16} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userType}>
          {user.type === 'professional' ? 'Profesional Verificado' : 'Cliente'}
        </Text>
        <View style={styles.verifiedBadge}>
          <Icon name="verified" size={16} color="#10b981" />
          <Text style={styles.verifiedText}>Verificado</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Icon name="edit" size={20} color="#3b82f6" />
      </TouchableOpacity>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Información Personal</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoValue}>{user.email}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Teléfono:</Text>
        <Text style={styles.infoValue}>{user.phone}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Ubicación:</Text>
        <Text style={styles.infoValue}>{user.location?.address || 'No especificada'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Miembro desde:</Text>
        <Text style={styles.infoValue}>
          {new Date(user.createdAt).toLocaleDateString('es-AR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>
    </View>
  );

  const renderServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mis Servicios</Text>
      
      <TouchableOpacity style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <Icon name="build" size={24} color="#3b82f6" />
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>Plomería y Electricidad</Text>
            <Text style={styles.serviceDescription}>Reparaciones y mantenimiento</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color="#9ca3af" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <Icon name="handyman" size={24} color="#3b82f6" />
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>Construcción</Text>
            <Text style={styles.serviceDescription}>Obras y reformas</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color="#9ca3af" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.addServiceButton}>
        <Icon name="add" size={20} color="#3b82f6" />
        <Text style={styles.addServiceText}>Agregar Servicio</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Configuración</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Notificaciones Push</Text>
          <Text style={styles.settingDescription}>Recibir alertas de nuevos trabajos</Text>
        </View>
        <Switch
          value={notifications.push}
          onValueChange={(value) => setNotifications({...notifications, push: value})}
          trackColor={{ true: '#3b82f6', false: '#e5e7eb' }}
        />
      </View>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Notificaciones Email</Text>
          <Text style={styles.settingDescription}>Actualizaciones y mensajes</Text>
        </View>
        <Switch
          value={notifications.email}
          onValueChange={(value) => setNotifications({...notifications, email: value})}
          trackColor={{ true: '#3b82f6', false: '#e5e7eb' }}
        />
      </View>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Notificaciones SMS</Text>
          <Text style={styles.settingDescription}>Alertas urgentes</Text>
        </View>
        <Switch
          value={notifications.sms}
          onValueChange={(value) => setNotifications({...notifications, sms: value})}
          trackColor={{ true: '#3b82f6', false: '#e5e7eb' }}
        />
      </View>
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacidad</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Mostrar Teléfono</Text>
          <Text style={styles.settingDescription}>En perfil público</Text>
        </View>
        <Switch
          value={privacy.showPhone}
          onValueChange={(value) => setPrivacy({...privacy, showPhone: value})}
          trackColor={{ true: '#3b82f6', false: '#e5e7eb' }}
        />
      </View>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Mostrar Email</Text>
          <Text style={styles.settingDescription}>En perfil público</Text>
        </View>
        <Switch
          value={privacy.showEmail}
          onValueChange={(value) => setPrivacy({...privacy, showEmail: value})}
          trackColor={{ true: '#3b82f6', false: '#e5e7eb' }}
        />
      </View>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Mostrar Ubicación</Text>
          <Text style={styles.settingDescription}>En perfil público</Text>
        </View>
        <Switch
          value={privacy.showLocation}
          onValueChange={(value) => setPrivacy({...privacy, showLocation: value})}
          trackColor={{ true: '#3b82f6', false: '#e5e7eb' }}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity>
          <Icon name="settings" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderPersonalInfo()}
        {renderServices()}
        {renderSettings()}
        {renderPrivacy()}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addServiceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProfileScreen;

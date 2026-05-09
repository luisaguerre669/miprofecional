import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Modal,
  Picker,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';

interface ConfigItem {
  section: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: 'payment' | 'subscription' | 'notification' | 'ui' | 'system' | 'security';
  isPublic: boolean;
  isEditable: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

interface AdminConsoleScreenProps {
  onLogout?: () => void;
}

const AdminConsoleScreen: React.FC<AdminConsoleScreenProps> = ({ onLogout }) => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('payment');
  const [editingConfig, setEditingConfig] = useState<ConfigItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState<any>('');
  const [saving, setSaving] = useState(false);

  const categories = [
    { key: 'payment', label: 'Pagos', icon: 'payment' },
    { key: 'subscription', label: 'Suscripciones', icon: 'card-membership' },
    { key: 'notification', label: 'Notificaciones', icon: 'notifications' },
    { key: 'ui', label: 'Interfaz', icon: 'palette' },
    { key: 'system', label: 'Sistema', icon: 'settings' },
    { key: 'security', label: 'Seguridad', icon: 'security' },
  ];

  useEffect(() => {
    loadConfigs();
  }, [selectedCategory]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      
      // Mock data - en producción esto vendría de la API
      const mockConfigs: ConfigItem[] = [
        // Configuraciones de Pago
        {
          section: 'mercadopago',
          key: 'access_token',
          value: 'TEST-123456789',
          type: 'string',
          description: 'Token de acceso a la API de Mercado Pago',
          category: 'payment',
          isPublic: false,
          isEditable: true,
        },
        {
          section: 'mercadopago',
          key: 'public_key',
          value: 'TEST-PUBLIC-KEY',
          type: 'string',
          description: 'Clave pública de Mercado Pago para frontend',
          category: 'payment',
          isPublic: true,
          isEditable: true,
        },
        {
          section: 'payment',
          key: 'alias',
          value: 'miprofesional.mp',
          type: 'string',
          description: 'Alias de la billetera virtual para recibir pagos',
          category: 'payment',
          isPublic: true,
          isEditable: true,
        },
        {
          section: 'payment',
          key: 'cbu',
          value: '1234567890123456789012',
          type: 'string',
          description: 'CBU de la cuenta bancaria para transferencias',
          category: 'payment',
          isPublic: false,
          isEditable: true,
        },
        {
          section: 'payment',
          key: 'currency',
          value: 'ARS',
          type: 'string',
          description: 'Moneda predeterminada para pagos',
          category: 'payment',
          isPublic: true,
          isEditable: true,
          validation: { options: ['ARS', 'USD', 'EUR'] },
        },
        
        // Configuraciones de Suscripción
        {
          section: 'subscription',
          key: 'trial_days',
          value: 30,
          type: 'number',
          description: 'Días de prueba gratuita para profesionales',
          category: 'subscription',
          isPublic: true,
          isEditable: true,
          validation: { min: 7, max: 90 },
        },
        {
          section: 'subscription',
          key: 'monthly_price',
          value: 8000,
          type: 'number',
          description: 'Precio mensual de suscripción en pesos argentinos',
          category: 'subscription',
          isPublic: true,
          isEditable: true,
          validation: { min: 1000, max: 50000 },
        },
        {
          section: 'subscription',
          key: 'warning_days',
          value: 5,
          type: 'number',
          description: 'Días antes del vencimiento para enviar advertencia',
          category: 'subscription',
          isPublic: false,
          isEditable: true,
        },
        {
          section: 'subscription',
          key: 'auto_renewal',
          value: true,
          type: 'boolean',
          description: 'Renovación automática de suscripciones',
          category: 'subscription',
          isPublic: false,
          isEditable: true,
        },
        
        // Configuraciones de UI
        {
          section: 'ui',
          key: 'app_name',
          value: 'MiProfesional',
          type: 'string',
          description: 'Nombre de la aplicación',
          category: 'ui',
          isPublic: true,
          isEditable: true,
        },
        {
          section: 'ui',
          key: 'primary_color',
          value: '#3b82f6',
          type: 'string',
          description: 'Color primario de la interfaz',
          category: 'ui',
          isPublic: true,
          isEditable: true,
        },
      ];

      const filteredConfigs = mockConfigs.filter(config => config.category === selectedCategory);
      setConfigs(filteredConfigs);
    } catch (error) {
      console.error('Error loading configs:', error);
      Alert.alert('Error', 'No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleEditConfig = (config: ConfigItem) => {
    if (!config.isEditable) {
      Alert.alert('Error', 'Esta configuración no puede ser editada');
      return;
    }

    setEditingConfig(config);
    setTempValue(config.value);
    setEditModalVisible(true);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;

    try {
      setSaving(true);

      // Validar valor
      if (editingConfig.validation) {
        const { min, max, options } = editingConfig.validation;

        if (editingConfig.type === 'number') {
          const numValue = Number(tempValue);
          if (min !== undefined && numValue < min) {
            Alert.alert('Error', `El valor debe ser al menos ${min}`);
            return;
          }
          if (max !== undefined && numValue > max) {
            Alert.alert('Error', `El valor debe ser como máximo ${max}`);
            return;
          }
        }

        if (options && options.length > 0 && !options.includes(tempValue)) {
          Alert.alert('Error', `El valor debe ser uno de: ${options.join(', ')}`);
          return;
        }
      }

      // Simular guardado - en producción esto llamaría a la API
      console.log('Saving config:', {
        section: editingConfig.section,
        key: editingConfig.key,
        value: tempValue,
      });

      // Actualizar localmente
      setConfigs(prev => prev.map(config => 
        config.section === editingConfig.section && config.key === editingConfig.key
          ? { ...config, value: tempValue }
          : config
      ));

      setEditModalVisible(false);
      setEditingConfig(null);
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving config:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const renderConfigInput = (config: ConfigItem, value: any, onChange: (value: any) => void) => {
    switch (config.type) {
      case 'boolean':
        return (
          <Switch
            value={value}
            onValueChange={onChange}
            trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
            thumbColor={value ? '#3b82f6' : '#f3f4f6'}
          />
        );

      case 'number':
        return (
          <TextInput
            style={styles.input}
            value={value?.toString() || ''}
            onChangeText={(text) => onChange(text ? Number(text) : '')}
            keyboardType="numeric"
            placeholder="Ingrese un número"
          />
        );

      case 'string':
        if (config.validation?.options) {
          return (
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={styles.picker}
            >
              {config.validation.options.map((option: string) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          );
        }

        if (config.key.includes('color')) {
          return (
            <View style={styles.colorInput}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={value || ''}
                onChangeText={onChange}
                placeholder="#000000"
              />
              <View 
                style={[styles.colorPreview, { backgroundColor: value || '#000000' }]}
              />
            </View>
          );
        }

        return (
          <TextInput
            style={styles.input}
            value={value || ''}
            onChangeText={onChange}
            placeholder="Ingrese un valor"
            multiline={config.key.includes('token') || config.key.includes('url')}
            numberOfLines={config.key.includes('token') || config.key.includes('url') ? 3 : 1}
          />
        );

      default:
        return (
          <TextInput
            style={styles.input}
            value={JSON.stringify(value) || ''}
            onChangeText={(text) => {
              try {
                onChange(JSON.parse(text));
              } catch {
                onChange(text);
              }
            }}
            placeholder="Ingrese un valor JSON"
          />
        );
    }
  };

  const renderConfigItem = (config: ConfigItem) => (
    <View key={`${config.section}.${config.key}`} style={styles.configItem}>
      <View style={styles.configHeader}>
        <View style={styles.configInfo}>
          <Text style={styles.configKey}>{config.key}</Text>
          <Text style={styles.configSection}>{config.section}</Text>
        </View>
        <View style={styles.configBadges}>
          {config.isPublic && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Público</Text>
            </View>
          )}
          {!config.isEditable && (
            <View style={[styles.badge, styles.badgeDisabled]}>
              <Text style={styles.badgeText}>No editable</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.configDescription}>{config.description}</Text>

      <View style={styles.configValue}>
        <Text style={styles.valueLabel}>Valor actual:</Text>
        <View style={styles.valueContainer}>
          {config.type === 'boolean' ? (
            <Switch
              value={config.value}
              disabled={true}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={config.value ? '#3b82f6' : '#f3f4f6'}
            />
          ) : (
            <Text style={styles.valueText}>
              {config.type === 'object' || config.type === 'array'
                ? JSON.stringify(config.value)
                : config.value?.toString() || 'N/A'
              }
            </Text>
          )}
        </View>
      </View>

      {config.isEditable && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditConfig(config)}
        >
          <MaterialIcons name="edit" size={20} color="#3b82f6" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Consola de Administración</Text>
          <Text style={styles.subtitle}>Configuración de la aplicación</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <MaterialIcons name="logout" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <MaterialIcons
                name={category.icon as any}
                size={20}
                color={selectedCategory === category.key ? '#ffffff' : '#64748b'}
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando configuraciones...</Text>
          </View>
        ) : configs.length > 0 ? (
          configs.map(renderConfigItem)
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="settings" size={64} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No hay configuraciones</Text>
            <Text style={styles.emptyMessage}>
              No se encontraron configuraciones para esta categoría
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Configuración</Text>
            <TouchableOpacity onPress={handleSaveConfig} disabled={saving}>
              <Text style={styles.modalSaveButton}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>

          {editingConfig && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Información</Text>
                <Text style={styles.modalConfigKey}>{editingConfig.key}</Text>
                <Text style={styles.modalConfigSection}>{editingConfig.section}</Text>
                <Text style={styles.modalConfigDescription}>{editingConfig.description}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Valor</Text>
                {renderConfigInput(editingConfig, tempValue, setTempValue)}
              </View>

              {editingConfig.validation && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Validación</Text>
                  {editingConfig.validation.min !== undefined && (
                    <Text style={styles.validationText}>Mínimo: {editingConfig.validation.min}</Text>
                  )}
                  {editingConfig.validation.max !== undefined && (
                    <Text style={styles.validationText}>Máximo: {editingConfig.validation.max}</Text>
                  )}
                  {editingConfig.validation.options && (
                    <Text style={styles.validationText}>
                      Opciones: {editingConfig.validation.options.join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  categoryScroll: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  configItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  configInfo: {
    flex: 1,
  },
  configKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  configSection: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  configBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeDisabled: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '500',
  },
  configDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  configValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  valueLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
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
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalConfigKey: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalConfigSection: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  modalConfigDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1e293b',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  colorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  validationText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});

export default AdminConsoleScreen;

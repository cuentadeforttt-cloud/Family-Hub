import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ImportModal } from '../components/ImportModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { databaseService } from '../services/database/database';
import { settingsRepository } from '../services/repositories/settings';
import { useTranslations } from '../utils/i18n';

const SettingsScreenSimplified: React.FC = () => {
  const t = useTranslations();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expiryAlertDays, setExpiryAlertDays] = useState(3);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [importModalVisible, setImportModalVisible] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Cargar configuración desde la base de datos
      const [expiryDays, lowStock, notifications] = await Promise.all([
        settingsRepository.get('expiryAlertDays'),
        settingsRepository.get('lowStockAlert'),
        settingsRepository.get('notificationsEnabled'),
      ]);

      console.log('Loaded settings from database:', {
        expiryDays,
        lowStock,
        notifications,
      });

      const parsedExpiryDays = expiryDays ? parseInt(expiryDays, 10) : 3;
      setExpiryAlertDays(parsedExpiryDays);
      setLowStockAlert(lowStock === 'true');
      setNotificationsEnabled(notifications === 'true');

      console.log('Settings loaded:', {
        parsedExpiryDays,
        lowStockAlert: lowStock === 'true',
        notificationsEnabled: notifications === 'true',
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(t.settings.resetConfirmation, t.settings.resetMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.reset,
        style: 'destructive',
        onPress: async () => {
          setExpiryAlertDays(3);
          setLowStockAlert(true);
          setNotificationsEnabled(true);

          // Guardar valores por defecto
          try {
            await Promise.all([
              settingsRepository.set('expiryAlertDays', '3'),
              settingsRepository.set('lowStockAlert', 'true'),
              settingsRepository.set('notificationsEnabled', 'true'),
            ]);
            // Configuración restablecida silenciosamente
          } catch (error) {
            console.error('Error resetting settings:', error);
            Alert.alert(
              t.common.error,
              'No se pudo restablecer la configuración',
            );
          }
        },
      },
    ]);
  };

  const handleImportSuccess = (count: number) => {
    setImportModalVisible(false);
    Alert.alert(
      t.common.success,
      t.import.importedCount.replace('{count}', count.toString()),
    );
  };

  const handleImportError = () => {
    Alert.alert(t.common.error, 'No se ha podido importar los datos');
  };

  // Función para guardar automáticamente sin mostrar alertas
  const autoSave = async () => {
    try {
      console.log('Auto-saving settings:', {
        expiryAlertDays,
        lowStockAlert,
        notificationsEnabled,
      });

      await Promise.all([
        settingsRepository.set('expiryAlertDays', expiryAlertDays.toString()),
        settingsRepository.set('lowStockAlert', lowStockAlert.toString()),
        settingsRepository.set(
          'notificationsEnabled',
          notificationsEnabled.toString(),
        ),
      ]);

      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error auto-saving settings:', error);
    }
  };

  // Guardar automáticamente cuando cambien los valores (con debounce)
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        autoSave().catch(error => {
          console.error('Error auto-saving settings:', error);
        });
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(timeoutId);
    }
  }, [expiryAlertDays, lowStockAlert, notificationsEnabled, loading]);

  // Guardar automáticamente al salir de la pantalla
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Esta función se ejecuta cuando el usuario sale de la pantalla
        // Usar setTimeout para evitar conflictos con operaciones de base de datos
        setTimeout(() => {
          autoSave().catch(error => {
            console.error('Error in auto-save cleanup:', error);
          });
        }, 100);
      };
    }, [expiryAlertDays, lowStockAlert, notificationsEnabled]), // Incluir dependencias para capturar cambios
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.settings.title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{t.settings.title}</Text>
          <Text style={styles.subtitle}>{t.settings.subtitle}</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.expiryAlerts}</Text>

            <View style={styles.setting}>
              <Text style={styles.settingLabel}>{t.settings.expiryDays}</Text>
              <Input
                value={expiryAlertDays > 0 ? expiryAlertDays.toString() : ''}
                onChangeText={text => {
                  if (text === '') {
                    setExpiryAlertDays(0);
                  } else {
                    const num = parseInt(text) || 0;
                    if (num >= 0 && num <= 30) {
                      setExpiryAlertDays(num);
                    }
                  }
                }}
                keyboardType="number-pad"
                style={styles.numberInput}
                placeholder="3"
              />
              <Text style={styles.settingDescription}>
                {t.settings.expiryDaysDescription}
              </Text>
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.notifications}</Text>

            <View style={styles.setting}>
              <View style={styles.switchContainer}>
                <Text style={styles.settingLabel}>
                  {t.settings.lowStockAlerts}
                </Text>
                <Switch
                  value={lowStockAlert}
                  onValueChange={setLowStockAlert}
                  trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
                  thumbColor={lowStockAlert ? '#ffffff' : '#ffffff'}
                />
              </View>
              <Text style={styles.settingDescription}>
                {t.settings.lowStockAlertsDescription}
              </Text>
            </View>

            <View style={styles.setting}>
              <View style={styles.switchContainer}>
                <Text style={styles.settingLabel}>
                  {t.settings.notificationsEnabled}
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
                  thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
                />
              </View>
              <Text style={styles.settingDescription}>
                {t.settings.notificationsEnabledDescription}
              </Text>
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.data}</Text>

            <View style={styles.setting}>
              <Text style={styles.settingLabel}>
                {t.settings.appInformation}
              </Text>
              <Text style={styles.appInfo}>{t.settings.appInfo}</Text>
            </View>

            <View style={styles.setting}>
              <Button
                title={t.import.title}
                onPress={() => setImportModalVisible(true)}
                variant="outline"
                style={styles.importButton}
              />
              <Text style={styles.settingDescription}>
                {t.import.description}
              </Text>
            </View>
          </Card>

          <View style={styles.actions}>
            <Button
              title={t.settings.reset}
              onPress={handleReset}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>

      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  setting: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberInput: {
    width: 80,
    textAlign: 'center',
  },
  appInfo: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  importButton: {
    marginBottom: 8,
  },
});

export default SettingsScreenSimplified;

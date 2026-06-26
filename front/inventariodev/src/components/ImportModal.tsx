import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Modal as RNModal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from './Button';
import { useTranslations } from '../utils/i18n';
import { productsRepository } from '../services/repositories/products';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const exampleJSON = `[
  {
    "name": "Leche entera",
    "description": "Leche fresca de vaca",
    "category": "Lácteos",
    "currentStock": 5,
    "expiryDate": "15/12/2025"
  },
  {
    "name": "Pan integral",
    "description": "Pan de molde integral",
    "category": "Panadería",
    "currentStock": 2,
    "expiryDate": "10/12/2025"
  },
  {
    "name": "Manzanas",
    "description": "Manzanas rojas frescas",
    "category": "Frutas",
    "currentStock": 8
  }
]`;

export const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations();
  const [jsonText, setJsonText] = useState(exampleJSON);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!jsonText.trim()) {
      Alert.alert(t.common.error, t.import.emptyJson);
      return;
    }

    setLoading(true);
    try {
      const data = JSON.parse(jsonText);

      if (!Array.isArray(data)) {
        Alert.alert(t.common.error, t.import.invalidFormat);
        return;
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const item of data) {
        try {
          // Validar que tenga nombre
          if (
            !item.name ||
            typeof item.name !== 'string' ||
            !item.name.trim()
          ) {
            errors.push(`${t.import.missingName}: ${JSON.stringify(item)}`);
            continue;
          }

          // Validar y convertir fecha de expiración
          let expiryDate = null;
          if (item.expiryDate && typeof item.expiryDate === 'string') {
            // Intentar convertir la fecha del formato dd/MM/yyyy a ISO
            try {
              const dateParts = item.expiryDate.split('/');
              if (dateParts.length === 3) {
                const day = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10);
                const year = parseInt(dateParts[2], 10);

                // Validar que los números sean válidos
                if (
                  day >= 1 &&
                  day <= 31 &&
                  month >= 1 &&
                  month <= 12 &&
                  year >= 2020
                ) {
                  const date = new Date(year, month - 1, day);
                  // Verificar que la fecha es válida
                  if (!isNaN(date.getTime())) {
                    expiryDate = item.expiryDate; // Mantener formato dd/MM/yyyy
                  }
                }
              }
            } catch (error) {
              console.warn('Invalid date format:', item.expiryDate);
            }
          }

          // Crear el producto con los datos disponibles
          const productData = {
            name: item.name.trim(),
            description: item.description || '',
            category: item.category || '',
            currentStock:
              typeof item.currentStock === 'number' ? item.currentStock : 0,
            expiryDate: expiryDate,
          };

          await productsRepository.create(productData);
          successCount++;
        } catch (error) {
          console.error('Error importing product:', error);
          errors.push(`${item.name}: ${error}`);
        }
      }

      if (successCount > 0) {
        onSuccess(successCount);
        setJsonText(exampleJSON); // Reset to example
      }

      if (errors.length > 0) {
        Alert.alert(
          t.import.partialSuccess,
          `${t.import.importedCount.replace(
            '{count}',
            successCount.toString(),
          )}\n\n${t.import.errors}:\n${errors.slice(0, 3).join('\n')}${
            errors.length > 3 ? '\n...' : ''
          }`,
        );
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      Alert.alert(t.common.error, t.import.invalidJson);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJsonText('');
  };

  const handleCancel = () => {
    setJsonText(exampleJSON);
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.overlayContent}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>{t.import.title}</Text>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
                <Text style={styles.description}>{t.import.description}</Text>

                <View style={styles.jsonContainer}>
                  <TextInput
                    style={styles.jsonInput}
                    value={jsonText}
                    onChangeText={setJsonText}
                    placeholder={t.import.placeholder}
                    multiline
                    textAlignVertical="top"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.buttons}>
                  <Button
                    title={t.import.clear}
                    onPress={handleClear}
                    variant="outline"
                    style={styles.button}
                  />
                  <Button
                    title={t.import.import}
                    onPress={handleImport}
                    variant="primary"
                    style={styles.button}
                    loading={loading}
                  />
                </View>

                <Button
                  title={t.common.cancel}
                  onPress={handleCancel}
                  variant="outline"
                  style={styles.cancelButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  jsonContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    minHeight: screenHeight * 0.4,
  },
  jsonInput: {
    flex: 1,
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    width: '100%',
  },
});

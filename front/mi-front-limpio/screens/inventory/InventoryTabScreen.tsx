import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';

export function InventoryTabScreen() {
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    navigation.navigate('InventoryStack');
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF8', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#CD7353" />
    </View>
  );
}
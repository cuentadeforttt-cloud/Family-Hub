import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppCard, AppText, AppButton } from '../ui';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { formatDateToDDMMYYYY, getExpiryStatus } from '../../utils/dateUtils';
import type { Product, ExpiryStatus } from '../../types/inventory';

interface InventoryCardProps {
  product: Product;
  onPress: () => void;
  onAddStock: () => void;
  onRemoveStock: () => void;
  showStockControls?: boolean;
  compact?: boolean;
}

export function InventoryCard({
  product,
  onPress,
  onAddStock,
  onRemoveStock,
  showStockControls = true,
  compact = false,
}: InventoryCardProps) {
  const expiryStatus = getExpiryStatus(product.expiryDate);
  const hasExpiry = !!product.expiryDate;
  const isLowStock = product.currentStock <= 0;

  const getExpiryColor = (variant: ExpiryStatus['variant']) => {
    switch (variant) {
      case 'danger': return colors.danger.base;
      case 'warning': return colors.warning.base;
      case 'info': return colors.info.base;
      case 'success': return colors.success.base;
      default: return colors.text.tertiary;
    }
  };

  const getExpiryBg = (variant: ExpiryStatus['variant']) => {
    switch (variant) {
      case 'danger': return colors.danger.soft;
      case 'warning': return colors.warning.soft;
      case 'info': return colors.info.soft;
      case 'success': return colors.success.soft;
      default: return colors.surface.soft;
    }
  };

  return (
    <AppCard
      variant="default"
      padding={compact ? 'compact' : 'default'}
      onPress={onPress}
      style={styles.card}
      contentStyle={styles.cardContent}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <AppText variant="body" weight="700" style={styles.name}>
            {product.name}
          </AppText>
          {product.category && (
            <AppText variant="micro" tone="tertiary" style={styles.category}>
              {product.category}
            </AppText>
          )}
        </View>

        {hasExpiry && (
          <View
            style={[
              styles.expiryBadge,
              { backgroundColor: getExpiryBg(expiryStatus.variant) },
            ]}
          >
            <AppText
              variant="micro"
              weight="700"
              style={{ color: getExpiryColor(expiryStatus.variant) }}
            >
              {expiryStatus.text}
            </AppText>
          </View>
        )}
      </View>

      {product.description && !compact && (
        <AppText variant="bodySmall" tone="secondary" style={styles.description}>
          {product.description}
        </AppText>
      )}

      {showStockControls && (
        <View style={styles.stockControls}>
          <TouchableOpacity
            onPress={onRemoveStock}
            disabled={isLowStock}
            style={[
              styles.stockButton,
              styles.stockButtonOutline,
              isLowStock && styles.stockButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <AppText variant="title3" weight="700" tone="primary" style={styles.stockButtonText}>
              −
            </AppText>
          </TouchableOpacity>

          <View style={styles.stockDisplay}>
            <AppText
              variant={compact ? "title3" : "title2"}
              weight="800"
              tone={isLowStock ? "danger" : "primary"}
              style={styles.stockNumber}
            >
              {product.currentStock}
            </AppText>
            <AppText variant="micro" tone="tertiary" style={styles.stockLabel}>
              {product.unit || 'unid'}
            </AppText>
          </View>

          <TouchableOpacity
            onPress={onAddStock}
            style={styles.stockButtonPrimary}
            activeOpacity={0.7}
          >
            <AppText variant="title3" weight="700" tone="inverse" style={styles.stockButtonText}>
              +
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {hasExpiry && !compact && (
        <View style={styles.expiryFooter}>
          <AppText variant="micro" tone="tertiary" style={styles.expiryText}>
            🗓️ Vence: {formatDateToDDMMYYYY(product.expiryDate!)}
          </AppText>
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  cardContent: {
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing[3],
  },
  name: {
    marginBottom: spacing[1],
  },
  category: {
    fontWeight: '600',
  },
  description: {
    fontStyle: 'italic',
    lineHeight: typography.bodySmall.lineHeight,
  },
  expiryBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
    minWidth: 56,
    alignItems: 'center',
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.soft,
    borderRadius: radius.lg,
    marginTop: spacing[1],
  },
  stockButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.terracotta[500],
  },
  stockButtonPrimary: {
    backgroundColor: colors.terracotta[500],
    borderWidth: 0,
  },
  stockButtonDisabled: {
    opacity: 0.4,
  },
  stockButtonText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  stockDisplay: {
    alignItems: 'center',
    marginHorizontal: spacing[3],
    minWidth: 50,
  },
  stockNumber: {
    lineHeight: 32,
  },
  stockLabel: {
    marginTop: -2,
  },
  expiryFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing[2],
    marginTop: spacing[1],
  },
  expiryText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
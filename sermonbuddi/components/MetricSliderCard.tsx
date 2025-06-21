import { COLORS } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MetricSliderCardProps {
  title: string;
  value: string;
  change?: number;
  icon: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
  iconColor?: string;
}

const MetricSliderCard: React.FC<MetricSliderCardProps> = ({ title, value, change, icon, children, iconColor }) => {
  const { dark } = useTheme();
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? COLORS.success : COLORS.error;
  
  return (
    <View style={[styles.metricCard, { backgroundColor: dark ? COLORS.dark3 : COLORS.white }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.metricCardTitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>{title}</Text>
        <Ionicons name={icon} size={22} color={iconColor || (dark ? COLORS.primary : COLORS.greyscale900)} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {children ? children :
          <Text style={[styles.metricCardValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{value}</Text>
        }
      </View>
      {change !== undefined ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={isPositive ? 'arrow-up' : 'arrow-down'} size={14} color={changeColor} />
          <Text style={[styles.metricCardChange, { color: changeColor, marginLeft: 4 }]}>
            {Math.abs(change)}%
          </Text>
        </View>
      ) : (
        <View style={{ height: 18 }} /> // Placeholder for consistent height
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    width: 160,
    height: 160,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  metricCardTitle: {
    fontSize: 14,
    fontFamily: 'medium',
  },
  metricCardValue: {
    fontSize: 32,
    fontFamily: 'bold',
  },
  metricCardChange: {
    fontSize: 12,
    fontFamily: 'semiBold',
  },
});

export default MetricSliderCard; 
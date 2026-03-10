import { StyleSheet } from 'react-native';
import { AppColors } from '../constants/colors';

export const theme = {
  colors: AppColors,
  typography: {
    displayLarge: { fontSize: 28, fontWeight: '700' as const },
    displayMedium: { fontSize: 24, fontWeight: '700' as const },
    headlineLarge: { fontSize: 22, fontWeight: '700' as const },
    headlineMedium: { fontSize: 20, fontWeight: '600' as const },
    titleLarge: { fontSize: 18, fontWeight: '600' as const },
    titleMedium: { fontSize: 16, fontWeight: '600' as const },
    bodyLarge: { fontSize: 16, fontWeight: '400' as const },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const },
    bodySmall: { fontSize: 12, fontWeight: '400' as const },
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.divider,
    marginHorizontal: 16,
  },
});

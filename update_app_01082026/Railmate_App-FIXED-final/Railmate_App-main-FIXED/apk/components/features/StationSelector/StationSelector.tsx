import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Train } from 'phosphor-react-native';
import { useStations } from '../../../hooks/useStations';
import { Station } from '../../../types/station.types';
import { useTranslation } from '../../../i18n';
import { Typography } from '../../ui/Typography/Typography';
import { Input } from '../../ui/Input/Input';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface StationSelectorProps {
  onSelect: (station: Station) => void;
  onClose: () => void;
  isBengali?: boolean;
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  onSelect,
  onClose,
  isBengali = false,
}) => {
  const { t } = useTranslation();
  const { data: stations, isLoading, error } = useStations();
  const [searchQuery, setSearchQuery] = useState('');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const filteredStations = useMemo(() => {
    if (!stations) return [];
    if (!searchQuery) return stations;

    const query = searchQuery.toLowerCase();
    return stations.filter(
      (s) =>
        s.name_en.toLowerCase().includes(query) ||
        s.name_bn.includes(query) ||
        s.code.toLowerCase().includes(query)
    );
  }, [stations, searchQuery]);

  const renderStationItem = ({ item }: { item: Station }) => (
    <Pressable
      onPress={() => onSelect(item)}
      style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors['bg-base'] }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors['primary-subtle'] }]}>
        <Train size={20} color={colors.primary} weight="bold" />
      </View>
      <View style={styles.rowText}>
        <Typography variant="h4" style={{ color: colors['text-primary'] }} isBengali={isBengali}>
          {isBengali ? item.name_bn : item.name_en}
        </Typography>
        <Typography variant="caption" style={{ color: colors['text-secondary'] }} isBengali={isBengali}>
          {item.code} {item.division ? `• ${item.division}` : ''}
        </Typography>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors['bg-base'] }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors['bg-base'] }]}>
        <View style={styles.headerInput}>
          <Input
            placeholder={t('station.search_placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            isBengali={isBengali}
            style={styles.inputHeight}
          />
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel={t('common.close')}>
          <X size={24} color={colors['text-secondary']} />
        </Pressable>
      </View>

      {/* List */}
      <View style={[styles.listWrap, { backgroundColor: colors['bg-base'] }]}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Typography variant="body" style={{ color: colors.danger }} isBengali={isBengali}>
              {t('error.generic')}
            </Typography>
          </View>
        ) : (
          <FlatList
            data={filteredStations}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderStationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Typography variant="body" style={{ color: colors['text-tertiary'] }} isBengali={isBengali}>
                  {t('search.no_stations_found')}
                </Typography>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerInput: { flex: 1 },
  inputHeight: { height: 40 },
  closeBtn: { marginLeft: 12, padding: 8 },
  listWrap: { flex: 1, paddingHorizontal: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
});
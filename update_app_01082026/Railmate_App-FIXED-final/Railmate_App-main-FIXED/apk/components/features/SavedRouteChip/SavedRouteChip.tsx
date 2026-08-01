import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowsLeftRight } from 'phosphor-react-native';
import { SavedRoute } from '../../../hooks/useSavedRoutes';
import { Typography } from '../../ui/Typography/Typography';

interface SavedRouteChipProps {
  route: SavedRoute;
  onPress: (route: SavedRoute) => void;
  isBengali?: boolean;
}

export const SavedRouteChip: React.FC<SavedRouteChipProps> = ({
  route,
  onPress,
  isBengali = false,
}) => {
  return (
    <Pressable
      onPress={() => onPress(route)}
      className="bg-bg-card border border-border rounded-full px-4 py-2 flex-row items-center mr-2 mb-2"
    >
      <Typography variant="label" className="text-text-primary" isBengali={isBengali}>
        {isBengali ? route.fromStation.name_bn : route.fromStation.name_en}
      </Typography>
      <View className="mx-2">
        <ArrowsLeftRight size={14} color="#00A859" weight="bold" />
      </View>
      <Typography variant="label" className="text-text-primary" isBengali={isBengali}>
        {isBengali ? route.toStation.name_bn : route.toStation.name_en}
      </Typography>
    </Pressable>
  );
};

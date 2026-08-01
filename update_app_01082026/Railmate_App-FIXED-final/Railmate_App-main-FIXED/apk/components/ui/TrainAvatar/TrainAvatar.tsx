import React from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';

const TRAIN_IMG = require('../../../assets/images/train.png');

interface TrainAvatarProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * TrainAvatar - circular train.webp icon used for generic "train" avatars
 * (report cards, route map header, report submission flow).
 * Single source of truth for the asset — change train.webp once, updates everywhere.
 */
export const TrainAvatar: React.FC<TrainAvatarProps> = ({ size = 40, style }) => (
  <Image
    source={TRAIN_IMG}
    style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
    resizeMode="cover"
  />
);

export default TrainAvatar;
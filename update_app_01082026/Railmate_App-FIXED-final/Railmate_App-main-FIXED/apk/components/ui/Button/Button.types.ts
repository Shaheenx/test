import { TouchableOpacityProps } from 'react-native';
import { IconProps } from 'phosphor-react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  icon?: React.FC<IconProps>;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  isBengali?: boolean;
}

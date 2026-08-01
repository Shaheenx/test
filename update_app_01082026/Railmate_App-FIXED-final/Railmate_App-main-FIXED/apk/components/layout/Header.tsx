import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  isBengali?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showBack = true, rightElement, isBengali = false }) => {
  const router = useRouter();
  const titleFont  = isBengali ? 'NotoSansBengali_600SemiBold' : 'Inter_600SemiBold';
  const subFont    = isBengali ? 'NotoSansBengali_400Regular'  : 'Inter_400Regular';

  return (
    <View style={s.row}>
      <View style={s.left}>
        {showBack && (
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}>
            <CaretLeft size={20} color="#00A859" weight="bold" />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { fontFamily: titleFont }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[s.subtitle, { fontFamily: subFont }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement && <View style={{ marginLeft: 12 }}>{rightElement}</View>}
    </View>
  );
};

const s = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, minHeight: 64 },
  left:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#162035', borderWidth: 1, borderColor: '#1E2E42', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title:   { fontSize: 20, color: '#F0F4FF', lineHeight: 28 },
  subtitle:{ fontSize: 13, color: '#8FA3C0', lineHeight: 18, marginTop: 1 },
});

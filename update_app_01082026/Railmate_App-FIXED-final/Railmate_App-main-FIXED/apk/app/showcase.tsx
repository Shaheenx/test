import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  AppText,
  Button,
  Badge,
  Chip,
  StationInput,
  TrainNumberBadge,
  StatusPill,
  EmptyState,
  Skeleton,
  SkeletonTrainCard,
} from '../components/ui';
import {
  JourneyTimeline,
  QuickActionsGrid,
  LiveUpdateCard,
  SavedRouteCard,
} from '../components/features';
import { ScreenHeader } from '../components/layout';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

/**
 * Showcase Screen - Visual verification of all Phase 1 components
 * Navigate here to verify design system implementation
 */
export default function ShowcaseScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScreenHeader title="Component Showcase" subtitle="Phase 1 Design System" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Typography */}
        <Section title="Typography">
          <AppText variant="displayXl">Display XL</AppText>
          <AppText variant="displayLg">Display Large</AppText>
          <AppText variant="h1">Heading 1</AppText>
          <AppText variant="h2">Heading 2</AppText>
          <AppText variant="h3">Heading 3</AppText>
          <AppText variant="h4">Heading 4</AppText>
          <AppText variant="body">Body text - Default</AppText>
          <AppText variant="bodySm">Body small</AppText>
          <AppText variant="label">Label text</AppText>
          <AppText variant="caption">Caption text</AppText>
          <AppText variant="mono">Monospace: 12:30</AppText>
          <AppText variant="time">Time: 06:40</AppText>
          <AppText variant="bengali">ঢাকা থেকে চট্টগ্রাম</AppText>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <Button variant="primary" size="lg" label="Primary Large" onPress={() => {}} />
          <Button variant="primary" size="md" label="Primary Medium" onPress={() => {}} />
          <Button variant="secondary" size="md" label="Secondary" onPress={() => {}} />
          <Button variant="ghost" size="md" label="Ghost" onPress={() => {}} />
          <Button variant="danger" size="md" label="Danger" onPress={() => {}} />
          <Button variant="primary" size="md" label="Loading" loading onPress={() => {}} />
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <View style={styles.row}>
            <Badge label="Success" variant="success" />
            <Badge label="Danger" variant="danger" />
            <Badge label="Info" variant="info" />
            <Badge label="Neutral" variant="neutral" />
            <Badge label="Accent" variant="accent" />
          </View>
        </Section>

        {/* Chips */}
        <Section title="Chips">
          <View style={styles.row}>
            <Chip label="All" isActive />
            <Chip label="Delays" />
            <Chip label="Crowding" />
          </View>
        </Section>

        {/* Badges (new) */}
        <Section title="Train Number Badge">
          <TrainNumberBadge number="721" />
          <TrainNumberBadge number="787" />
        </Section>

        {/* Status Pills */}
        <Section title="Status Pills">
          <StatusPill type="delay" label="15 min delay" />
          <StatusPill type="onTime" label="On Time" />
          <StatusPill type="warning" label="Schedule Being Verified" />
          <StatusPill type="crowding" label="Crowding High" />
        </Section>

        {/* Station Input */}
        <Section title="Station Input">
          <StationInput
            type="from"
            station={{
              name_en: 'Dhaka',
              name_bn: 'ঢাকা',
              subtitle: 'Kamlapur Railway Station',
            }}
            onPress={() => {}}
            onClear={() => {}}
          />
          <StationInput
            type="to"
            station={null}
            onPress={() => {}}
          />
        </Section>

        {/* Journey Timeline */}
        <Section title="Journey Timeline">
          <JourneyTimeline
            stops={[
              { station_en: 'Dhaka', station_bn: 'ঢাকা', time: '06:40', type: 'origin', halt_minutes: 0 },
              { station_en: 'Tongi', station_bn: 'টঙ্গী', time: '07:15', type: 'stop', halt_minutes: 5 },
              { station_en: 'Narsingdi', station_bn: 'নরসিংদী', time: '08:00', type: 'stop', halt_minutes: 3, is_current: true },
              { station_en: 'Cumilla', station_bn: 'কুমিল্লা', time: '09:30', type: 'stop', halt_minutes: 10 },
              { station_en: 'Chattogram', station_bn: 'চট্টগ্রাম', time: '11:15', type: 'destination', halt_minutes: 0 },
            ]}
          />
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions Grid">
          <QuickActionsGrid />
        </Section>

        {/* Live Update Card */}
        <Section title="Live Update Card">
          <LiveUpdateCard
            update={{
              train_name: 'Subarna Express',
              train_number: '721',
              route_from: 'Dhaka',
              route_to: 'Chattogram',
              status_type: 'delay',
              status_label: '15 min delay',
              description: 'Delayed departure from Dhaka',
              delay_minutes: 15,
              reported_at: '10m ago',
              reporter_count: 8,
            }}
          />
        </Section>

        {/* Saved Route Card */}
        <Section title="Saved Route Card">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            <SavedRouteCard
              from_en="Dhaka"
              from_bn="ঢাকা"
              to_en="Chattogram"
              to_bn="চট্টগ্রাম"
              last_viewed="2 hours ago"
              onPress={() => {}}
            />
            <SavedRouteCard
              from_en="Dhaka"
              from_bn="ঢাকা"
              to_en="Sylhet"
              to_bn="সিলেট"
              last_viewed="Yesterday"
              onPress={() => {}}
            />
          </ScrollView>
        </Section>

        {/* Empty State */}
        <Section title="Empty State">
          <EmptyState
            iconName="Train"
            title="No trains found"
            description="Try adjusting your search criteria or date"
            ctaLabel="Search Again"
            onCta={() => {}}
          />
        </Section>

        {/* Skeletons */}
        <Section title="Loading Skeletons">
          <Skeleton width="100%" height={20} />
          <Skeleton width="80%" height={16} />
          <SkeletonTrainCard />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const colors = useThemeColors();
  return (
    <View style={sectionStyles.section}>
      <AppText variant="h3" style={{ marginBottom: 16, color: colors.primary }}>{title}</AppText>
      <View style={sectionStyles.sectionContent}>{children}</View>
    </View>
  );
};

const sectionStyles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionContent: { gap: 12 },
});

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C['bg-base'],
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizontalScroll: {
    gap: 12,
  },
});

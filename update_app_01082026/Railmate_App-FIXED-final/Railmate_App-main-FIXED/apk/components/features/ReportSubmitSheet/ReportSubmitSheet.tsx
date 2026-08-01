// components/features/ReportSubmitSheet/ReportSubmitSheet.tsx
//
// Multi-step bottom sheet for submitting community reports.
// Step machine: TYPE_SELECT → (DELAY | CROWDING | CONDITION) → SUCCESS

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  } from 'react-native';
  import { useColorScheme } from 'nativewind';
  import { Colors } from '../../../constants/colors';
  import * as ImagePicker from 'expo-image-picker';
  import {
  Camera,
  CheckCircle,
  Lock,
  Minus,
  Plus,
  Star,
  Warning,
  Users,
  X,
} from 'phosphor-react-native';
import { useTranslation } from '../../../i18n';
import { useAuthStore } from '../../../stores/authStore';
import { Typography } from '../../ui/Typography/Typography';
import {
  useSubmitReport,
  useTrainSearch,
  useStationSearch,
} from '../../../hooks/useCommunityReports';
import type {
  CrowdLevel,
  ReportType,
  StationOption,
  TrainOption,
} from '../../../types/report.types';
import { router } from 'expo-router';

// ─── Constants ─────────────────────────────────────────────────────────────

type Step = 'TYPE_SELECT' | 'DELAY' | 'CROWD' | 'CONDITION' | 'SUCCESS';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

const CROWD_LEVELS: CrowdLevel[] = ['EMPTY', 'MODERATE', 'FULL', 'OVERCROWDED'];

// ─── Sub-components ─────────────────────────────────────────────────────────

function TypeCard({
  label,
  icon,
  accentClass,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  accentClass: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-row items-center bg-bg-card border border-border rounded-xl overflow-hidden mb-3"
    >
      <View className={`w-[3px] self-stretch ${accentClass}`} />
      <View className="flex-row items-center gap-3 px-4 py-4 flex-1">
        {icon}
        <Typography variant="body" className="text-text-primary">
          {label}
        </Typography>
      </View>
    </TouchableOpacity>
  );
}

// Searchable dropdown for train/station selection
function SearchableSelector<T extends { id: string }>({
  placeholder,
  value,
  displayValue,
  onSelect,
  renderItem,
  useSearch,
}: {
  placeholder: string;
  value: string | null;
  displayValue: string;
  onSelect: (item: T) => void;
  renderItem: (item: T) => string;
  useSearch: (q: string) => { data?: T[]; isLoading: boolean };
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useSearch(query);
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="bg-bg-card border border-border rounded-xl px-4 py-3 flex-row justify-between items-center"
        activeOpacity={0.8}
      >
        <Typography
          variant="body-sm"
          className={value ? 'text-text-primary' : 'text-text-secondary'}
        >
          {value ? displayValue : placeholder}
        </Typography>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-bg-card rounded-t-2xl max-h-96"
            onPress={() => {}}
          >
            <View className="px-4 pt-4 pb-2">
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder={placeholder}
                placeholderTextColor={currentColors['text-secondary']}
                className="bg-bg-base border border-border rounded-xl px-4 py-3 text-text-primary"
                style={{ color: currentColors['text-primary'] }}
              />
            </View>
            {isLoading ? (
              <ActivityIndicator color={currentColors.primary} className="py-4" />
            ) : (
              <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="px-4 py-3 border-b border-border"
                  >
                    <Typography
                      variant="body-sm"
                      className="text-text-primary"
                    >
                      {renderItem(item)}
                    </Typography>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Photo picker button
function PhotoPicker({
  uri,
  label,
  onPick,
  onRemove,
}: {
  uri: string | null;
  label: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  if (uri) {
    return (
      <View className="flex-row items-center gap-3 mb-4">
        <Image source={{ uri }} style={{ width: 72, height: 72 }} className="rounded-xl" />
        <TouchableOpacity
          onPress={onRemove}
          className="bg-danger/10 border border-danger px-3 py-1.5 rounded-full"
        >
          <Typography variant="caption" className="text-danger">
            Remove
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPick}
      className="flex-row items-center gap-2 border border-dashed border-border rounded-xl px-4 py-3 mb-4"
      activeOpacity={0.7}
    >
      <Camera size={20} color={currentColors['text-secondary']} />
      <Typography variant="body-sm" className="text-text-secondary">
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface ReportSubmitSheetProps {
  visible: boolean;
  onClose: () => void;
  isBengali: boolean;
}

export default function ReportSubmitSheet({
  visible,
  onClose,
  isBengali,
}: ReportSubmitSheetProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const submitMutation = useSubmitReport();
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  // ── Sheet slide animation ───────────────────────────────────────────────
  const [slideAnim] = useState(() => new Animated.Value(SHEET_HEIGHT));
  const [successScale] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // ── Form state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('TYPE_SELECT');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);

  const [selectedTrain, setSelectedTrain] = useState<TrainOption | null>(null);
  const [selectedStation, setSelectedStation] =
    useState<StationOption | null>(null);

  // DELAY
  const [delayMinutes, setDelayMinutes] = useState(15);

  // CROWDING
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel | null>(null);
  const [coachNumber, setCoachNumber] = useState('');

  // CONDITION
  const [conditionRating, setConditionRating] = useState(0);
  const [conditionNote, setConditionNote] = useState('');

  // Shared
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Reset on close ──────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setStep('TYPE_SELECT');
    setSelectedType(null);
    setSelectedTrain(null);
    setSelectedStation(null);
    setDelayMinutes(15);
    setCrowdLevel(null);
    setCoachNumber('');
    setConditionRating(0);
    setConditionNote('');
    setPhotoUri(null);
    successScale.setValue(0);
  }, [successScale]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── Photo picker ────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedTrain || !selectedStation || !selectedType) return;

    const today = new Date().toISOString().split('T')[0];

    setIsUploading(true);
    try {
      await submitMutation.mutateAsync({
        data: {
          train_id: selectedTrain.id,
          station_id: selectedStation.id,
          report_type: selectedType,
          journey_date: today,
          ...(selectedType === 'DELAY' && { delay_minutes: delayMinutes }),
          ...(selectedType === 'CROWD' && crowdLevel && { crowd_level: crowdLevel }),
          ...(selectedType === 'PLATFORM' && {
            condition_rating: conditionRating,
            ...(conditionNote && { condition_note: conditionNote }),
          }),
          ...(coachNumber && { coach_number: coachNumber }),
        },
        photoUri: photoUri ?? undefined,
      });

      setStep('SUCCESS');
      // Animate success checkmark
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
      }).start();
    } finally {
      setIsUploading(false);
    }
  };

  // ── Submit button validity ──────────────────────────────────────────────
  const canSubmit = (() => {
    if (!selectedTrain || !selectedStation) return false;
    if (selectedType === 'CROWD' && !crowdLevel) return false;
    if (selectedType === 'PLATFORM' && conditionRating === 0)
      return false;
    return true;
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Render steps
  // ─────────────────────────────────────────────────────────────────────────

  function renderAuthGate() {
    return (
      <View className="flex-1 items-center justify-center gap-5 px-6">
        <Lock size={48} color={currentColors['text-secondary']} />
        <Typography variant="h3" className="text-text-primary text-center">
          {t('community.sign_in_required')}
        </Typography>
        <TouchableOpacity
          onPress={() => {
            handleClose();
            router.push('/auth/login' as any);
          }}
          className="bg-primary px-8 py-3 rounded-xl w-full items-center"
        >
          <Typography variant="body" className="text-white font-semibold">
            Sign In
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  function renderTypeSelect() {
    return (
      <ScrollView
        className="flex-1 px-4 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <TypeCard
          label={t('community.type_delay')}
          icon={<Warning size={24} color={currentColors.danger} weight="fill" />}
          accentClass="bg-danger"
          onPress={() => {
            setSelectedType('DELAY');
            setStep('DELAY');
          }}
        />
        <TypeCard
          label={t('community.type_crowding')}
          icon={<Users size={24} color={currentColors.accent} weight="fill" />}
          accentClass="bg-accent"
          onPress={() => {
            setSelectedType('CROWD');
            setStep('CROWD');
          }}
        />
        <TypeCard
          label={t('community.type_condition')}
          icon={<Star size={24} color={currentColors.info} weight="fill" />}
          accentClass="bg-info"
          onPress={() => {
            setSelectedType('PLATFORM');
            setStep('CONDITION');
          }}
        />
      </ScrollView>
    );
  }

  function renderDelayForm() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          {/* Train selector */}
          <Typography variant="caption" className="text-text-secondary mb-1">
            {t('community.train_label')}
          </Typography>
          <SearchableSelector<TrainOption>
            placeholder={t('community.train_label')}
            value={selectedTrain?.id ?? null}
            displayValue={
              selectedTrain
                ? `${selectedTrain.number} · ${isBengali ? selectedTrain.name_bn : selectedTrain.name_en}`
                : ''
            }
            onSelect={setSelectedTrain}
            renderItem={(t) => `${t.number} · ${isBengali ? t.name_bn : t.name_en}`}
            useSearch={useTrainSearch}
          />

          {/* Station selector */}
          <Typography variant="caption" className="text-text-secondary mb-1">
            {t('community.station_label')}
          </Typography>
          <SearchableSelector<StationOption>
            placeholder={t('community.station_label')}
            value={selectedStation?.id ?? null}
            displayValue={
              selectedStation
                ? isBengali
                  ? selectedStation.name_bn
                  : selectedStation.name_en
                : ''
            }
            onSelect={setSelectedStation}
            renderItem={(s) => (isBengali ? s.name_bn : s.name_en)}
            useSearch={useStationSearch}
          />

          {/* Delay stepper */}
          <Typography variant="caption" className="text-text-secondary mb-2">
            {t('community.delay_label')}
          </Typography>
          <View className="flex-row items-center gap-4 mb-4 bg-bg-card border border-border rounded-xl px-4 py-3">
            <TouchableOpacity
              onPress={() => setDelayMinutes((v) => Math.max(1, v - 5))}
              className="w-9 h-9 rounded-full bg-bg-base items-center justify-center"
            >
              <Minus size={18} color={currentColors['text-primary']} />
            </TouchableOpacity>
            <TextInput
              value={String(delayMinutes)}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                if (!isNaN(n)) setDelayMinutes(Math.min(300, Math.max(1, n)));
              }}
              keyboardType="number-pad"
              className="flex-1 text-center text-text-primary text-lg font-semibold"
              style={{ color: currentColors['text-primary'] }}
              selectTextOnFocus
            />
            <TouchableOpacity
              onPress={() => setDelayMinutes((v) => Math.min(300, v + 5))}
              className="w-9 h-9 rounded-full bg-bg-base items-center justify-center"
            >
              <Plus size={18} color={currentColors['text-primary']} />
            </TouchableOpacity>
          </View>

          {/* Photo */}
          <Typography variant="caption" className="text-text-secondary mb-2">
            {t('community.add_photo')}
          </Typography>
          <PhotoPicker
            uri={photoUri}
            label={t('community.add_photo')}
            onPick={pickPhoto}
            onRemove={() => setPhotoUri(null)}
          />

          <SubmitButton
            canSubmit={canSubmit}
            isUploading={isUploading}
            label={t('community.submit')}
            onPress={handleSubmit}
          />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function renderCrowdingForm() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="caption" className="text-text-secondary mb-1">
            {t('community.train_label')}
          </Typography>
          <SearchableSelector<TrainOption>
            placeholder={t('community.train_label')}
            value={selectedTrain?.id ?? null}
            displayValue={
              selectedTrain
                ? `${selectedTrain.number} · ${isBengali ? selectedTrain.name_bn : selectedTrain.name_en}`
                : ''
            }
            onSelect={setSelectedTrain}
            renderItem={(tr) =>
              `${tr.number} · ${isBengali ? tr.name_bn : tr.name_en}`
            }
            useSearch={useTrainSearch}
          />

          <Typography variant="caption" className="text-text-secondary mb-1">
            {t('community.station_label')}
          </Typography>
          <SearchableSelector<StationOption>
            placeholder={t('community.station_label')}
            value={selectedStation?.id ?? null}
            displayValue={
              selectedStation
                ? isBengali
                  ? selectedStation.name_bn
                  : selectedStation.name_en
                : ''
            }
            onSelect={setSelectedStation}
            renderItem={(s) => (isBengali ? s.name_bn : s.name_en)}
            useSearch={useStationSearch}
          />

          {/* Coach number */}
          <Typography variant="caption" className="text-text-secondary mb-1">
            {t('community.coach_label')}
          </Typography>
          <TextInput
            value={coachNumber}
            onChangeText={setCoachNumber}
            placeholder="e.g. SL-4"
            placeholderTextColor={currentColors['text-secondary']}
            className="bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary mb-4"
            style={{ color: currentColors['text-primary'] }}
            maxLength={10}
          />

          {/* Crowd level pills */}
          <Typography variant="caption" className="text-text-secondary mb-2">
            Crowd Level
          </Typography>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CROWD_LEVELS.map((level) => {
              const isActive = crowdLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => setCrowdLevel(level)}
                  className={`px-4 py-2 rounded-full border ${
                    isActive
                      ? 'bg-primary border-primary'
                      : 'bg-bg-card border-border'
                  }`}
                >
                  <Typography
                    variant="caption"
                    className={isActive ? 'text-white' : 'text-text-secondary'}
                  >
                    {t(`community.crowd_${level.toLowerCase()}` as any)}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          <Typography variant="caption" className="text-text-secondary mb-2">
            {t('community.add_photo')}
          </Typography>
          <PhotoPicker
            uri={photoUri}
            label={t('community.add_photo')}
            onPick={pickPhoto}
            onRemove={() => setPhotoUri(null)}
          />

          <SubmitButton
            canSubmit={canSubmit}
            isUploading={isUploading}
            label={t('community.submit')}
            onPress={handleSubmit}
          />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function renderConditionForm() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="caption" className="text-text-secondary mb-1">
            {t('community.train_label')}
          </Typography>
          <SearchableSelector<TrainOption>
            placeholder={t('community.train_label')}
            value={selectedTrain?.id ?? null}
            displayValue={
              selectedTrain
                ? `${selectedTrain.number} · ${isBengali ? selectedTrain.name_bn : selectedTrain.name_en}`
                : ''
            }
            onSelect={setSelectedTrain}
            renderItem={(tr) =>
              `${tr.number} · ${isBengali ? tr.name_bn : tr.name_en}`
            }
            useSearch={useTrainSearch}
          />

          {/* Coach number */}
          <Typography variant="caption" className="text-text-secondary mb-1">
            {t('community.coach_label')}
          </Typography>
          <TextInput
            value={coachNumber}
            onChangeText={setCoachNumber}
            placeholder="e.g. SL-4"
            placeholderTextColor={currentColors['text-secondary']}
            className="bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary mb-4"
            style={{ color: currentColors['text-primary'] }}
            maxLength={10}
          />

          {/* Star rating */}
          <Typography variant="caption" className="text-text-secondary mb-2">
            {t('community.rating_label')}
          </Typography>
          <View className="flex-row gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setConditionRating(i)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Star
                  size={36}
                  weight={i <= conditionRating ? 'fill' : 'regular'}
                  color={i <= conditionRating ? currentColors.primary : currentColors.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <View className="flex-row justify-between mb-1">
            <Typography variant="caption" className="text-text-secondary">
              {t('community.note_label')}
            </Typography>
            <Typography variant="caption" className="text-text-secondary">
              {conditionNote.length}/120
            </Typography>
          </View>
          <TextInput
            value={conditionNote}
            onChangeText={(v) => setConditionNote(v.slice(0, 120))}
            placeholder={t('community.note_placeholder')}
            placeholderTextColor={currentColors['text-secondary']}
            multiline
            numberOfLines={3}
            className="bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary mb-4"
            style={{ color: currentColors['text-primary'], textAlignVertical: 'top', minHeight: 80 }}
          />

          <Typography variant="caption" className="text-text-secondary mb-2">
            {t('community.add_photo')}
          </Typography>
          <PhotoPicker
            uri={photoUri}
            label={t('community.add_photo')}
            onPick={pickPhoto}
            onRemove={() => setPhotoUri(null)}
          />

          <SubmitButton
            canSubmit={canSubmit}
            isUploading={isUploading}
            label={t('community.submit')}
            onPress={handleSubmit}
          />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function renderSuccess() {
    return (
      <View className="flex-1 items-center justify-center gap-5 px-6">
        <Animated.View style={{ transform: [{ scale: successScale }] }}>
          <CheckCircle size={80} color={currentColors.primary} weight="fill" />
        </Animated.View>
        <Typography
          variant="h2"
          className="text-text-primary text-center"
          isBengali={isBengali}
        >
          {t('community.success')}
        </Typography>
        <Typography
          variant="body-sm"
          className="text-text-secondary text-center"
          isBengali={isBengali}
        >
          {t('community.success_thanks')}
        </Typography>
        <TouchableOpacity
          onPress={handleClose}
          className="bg-primary px-8 py-3 rounded-xl w-full items-center mt-2"
        >
          <Typography variant="body" className="text-white font-semibold">
            {t('community.done')}
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Sheet title ───────────────────────────────────────────────────────────
  function getStepTitle() {
    switch (step) {
      case 'TYPE_SELECT':
        return t('community.submit_title');
      case 'DELAY':
        return t('community.type_delay');
      case 'CROWD':
        return t('community.type_crowding');
      case 'CONDITION':
        return t('community.type_condition');
      case 'SUCCESS':
        return '';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/60"
        onPress={handleClose}
      />

      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: SHEET_HEIGHT,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        className="bg-bg-base rounded-t-3xl overflow-hidden"
      >
        {/* Handle bar */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1 rounded-full bg-border" />
        </View>

        {/* Header */}
        {step !== 'SUCCESS' && (
          <View className="flex-row items-center px-4 py-3">
            {/* Back button */}
            {step !== 'TYPE_SELECT' ? (
              <TouchableOpacity
                onPress={() => setStep('TYPE_SELECT')}
                className="mr-3 w-9 h-9 rounded-full bg-bg-card items-center justify-center"
              >
                <X size={18} color={currentColors['text-primary']} />
              </TouchableOpacity>
            ) : (
              <View className="w-9 mr-3" />
            )}
            <Typography variant="h3" className="text-text-primary flex-1" isBengali={isBengali}>
              {getStepTitle()}
            </Typography>
            <TouchableOpacity
              onPress={handleClose}
              className="w-9 h-9 rounded-full bg-bg-card items-center justify-center"
            >
              <X size={18} color={currentColors['text-primary']} />
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {!isAuthenticated ? (
          renderAuthGate()
        ) : step === 'TYPE_SELECT' ? (
          renderTypeSelect()
        ) : step === 'DELAY' ? (
          renderDelayForm()
        ) : step === 'CROWD' ? (
          renderCrowdingForm()
        ) : step === 'CONDITION' ? (
          renderConditionForm()
        ) : (
          renderSuccess()
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Shared submit button ───────────────────────────────────────────────────

function SubmitButton({
  canSubmit,
  isUploading,
  label,
  onPress,
}: {
  canSubmit: boolean;
  isUploading: boolean;
  label: string;
  onPress: () => void;
}) {
  const disabled = !canSubmit || isUploading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`py-4 rounded-xl items-center mt-2 ${
        disabled ? 'bg-bg-card' : 'bg-primary'
      }`}
      activeOpacity={0.8}
    >
      {isUploading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Typography
          variant="body"
          className={`font-semibold ${disabled ? 'text-text-secondary' : 'text-white'}`}
        >
          {label}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

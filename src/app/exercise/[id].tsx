import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PoseBubble } from '@/components/PoseBubble';
import { T } from '@/components/T';
import { Icon } from '@/components/Icon';
import { Chip, IconButton, Screen } from '@/components/ui';
import { colors, fonts, glass, REGION_COLORS } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { GOAL_LABEL, LEVEL_NAME } from '@/data/content';
import { durationLabel, EQUIPMENT_LABEL, getExercise } from '@/data/exercises';
import { goBack } from '@/lib/flow';

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = getExercise(id);
  if (!exercise) return <Redirect href="/" />;
  const color = REGION_COLORS[exercise.area];

  return (
    <Screen scroll>
      <IconButton icon="back" label="Back" onPress={() => goBack()} />
      <View style={styles.stage}>
        <PoseBubble pose={exercise.pose} size={220} color={color} shadow breathe />
      </View>
      <T variant="kicker" style={styles.kicker}>
        {AREA_NAMES[exercise.area]}
      </T>
      <T variant="title" style={styles.name}>
        {exercise.name}
      </T>
      <View style={styles.chips}>
        <Chip label={LEVEL_NAME[exercise.level]} />
        <Chip label={durationLabel(exercise)} icon="clock" />
        <Chip label={EQUIPMENT_LABEL[exercise.equipment]} icon={exercise.equipment === 'none' ? undefined : exercise.equipment} />
      </View>
      <View style={styles.why}>
        <T variant="kicker">Why it helps</T>
        <T variant="body" style={styles.whyText}>
          {exercise.why}
        </T>
      </View>
      {exercise.careful ? (
        <View style={styles.careful} accessibilityRole="text">
          <Icon name="info" size={16} color={colors.muted} strokeWidth={2} />
          <T variant="small" color={colors.muted} style={styles.flex}>
            {exercise.careful}
          </T>
        </View>
      ) : null}
      <T variant="kicker" style={styles.howTo}>
        How to do it
      </T>
      <View style={styles.steps}>
        {exercise.steps.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={styles.number}>
              <T style={styles.numberText}>{String(i + 1)}</T>
            </View>
            <T variant="body" style={styles.flex}>
              {step}
            </T>
          </View>
        ))}
      </View>
      <T variant="kicker" style={styles.goodFor}>
        Good for
      </T>
      <View style={styles.chips}>
        {exercise.goals.map((g) => (
          <Chip key={g} label={GOAL_LABEL[g]} tone="green" />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stage: { marginTop: 6, alignItems: 'center' },
  kicker: { marginTop: 26 },
  name: { marginTop: 4, fontSize: 34, lineHeight: 38 },
  chips: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  why: { marginTop: 22, padding: 16, gap: 6, borderRadius: 18, backgroundColor: glass, borderWidth: 1, borderColor: colors.border },
  whyText: { lineHeight: 23 },
  careful: { marginTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  howTo: { marginTop: 24 },
  steps: { marginTop: 12, gap: 14 },
  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  number: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontFamily: fonts.bold, fontSize: 13, color: colors.greenText },
  goodFor: { marginTop: 26 },
});

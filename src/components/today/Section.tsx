import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';

/** Shared shapes for every card on Today, so sections read as one design. */
export const CARD = {
  /** Larger cards that hold rows (an area's moves). */
  radius: 20,
  /** Tiles you pick from (quick programmes, body parts, today's areas). */
  tileRadius: 16,
  /** Space between tiles and between rows of tiles. */
  gap: 10,
} as const;

type Props = {
  L: LookTokens;
  title: string;
  /** One short line under the title saying what to do here. */
  sub?: string;
  /** Something small on the right of the title, like a "Free" tag. */
  aside?: ReactNode;
  children: ReactNode;
};

/** A Today section: the same heading, subtitle and spacing everywhere. */
export function Section({ L, title, sub, aside, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
          {title}
        </T>
        {aside}
      </View>
      {sub ? (
        <T variant="body" color={L.muted} style={styles.sub}>
          {sub}
        </T>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 32 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  sub: { marginTop: 2, fontSize: 15, lineHeight: 21 },
  body: { marginTop: 14 },
});

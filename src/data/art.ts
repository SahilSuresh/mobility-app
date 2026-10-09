import type { ImageSourcePropType } from 'react-native';

import type { AreaId } from './types';

/**
 * Illustrated pictures for an exercise: the relaxed starting position and the exercise itself, drawn as one
 * character on a mat against a plain background. Moves without pictures here use their drawn pose instead.
 *
 * How they're made: each exercise is one two-panel picture (start on the left, exercise on the right) generated from
 * the same reference image, then cut into two square JPEGs (`<id>-start.jpg`, `<id>-pose.jpg`) that share a size and
 * position, so switching between them only shows the movement. `background` is the pictures' own background colour.
 */
export type ExerciseArt = {
  start: ImageSourcePropType;
  pose: ImageSourcePropType;
  /** The pictures' background colour, so the round frame around them blends in. */
  background: string;
};

export const ART: Record<string, ExerciseArt> = {
  // Neck
  'neck-tuck': {
    start: require('../../assets/exercises/neck-tuck-start.jpg'),
    pose: require('../../assets/exercises/neck-tuck-pose.jpg'),
    background: '#DFE6DC',
  },
  'neck-tilt': {
    start: require('../../assets/exercises/neck-tilt-start.jpg'),
    pose: require('../../assets/exercises/neck-tilt-pose.jpg'),
    background: '#DEE5DA',
  },
  'neck-turn': {
    start: require('../../assets/exercises/neck-turn-start.jpg'),
    pose: require('../../assets/exercises/neck-turn-pose.jpg'),
    background: '#DEE6DC',
  },
  'neck-roll': {
    start: require('../../assets/exercises/neck-roll-start.jpg'),
    pose: require('../../assets/exercises/neck-roll-pose.jpg'),
    background: '#DDE5DB',
  },
  'neck-levator': {
    start: require('../../assets/exercises/neck-levator-start.jpg'),
    pose: require('../../assets/exercises/neck-levator-pose.jpg'),
    background: '#DEE6DB',
  },

  // Shoulders
  'sh-reach': {
    start: require('../../assets/exercises/sh-reach-start.jpg'),
    pose: require('../../assets/exercises/sh-reach-pose.jpg'),
    background: '#DDE5DB',
  },
  'sh-cross': {
    start: require('../../assets/exercises/sh-cross-start.jpg'),
    pose: require('../../assets/exercises/sh-cross-pose.jpg'),
    background: '#DCE4D9',
  },
  'sh-rolls': {
    start: require('../../assets/exercises/sh-rolls-start.jpg'),
    pose: require('../../assets/exercises/sh-rolls-pose.jpg'),
    background: '#DEE5DB',
  },
  'sh-goalpost': {
    start: require('../../assets/exercises/sh-goalpost-start.jpg'),
    pose: require('../../assets/exercises/sh-goalpost-pose.jpg'),
    background: '#DEE7DC',
  },
  'sh-sidebend': {
    start: require('../../assets/exercises/sh-sidebend-start.jpg'),
    pose: require('../../assets/exercises/sh-sidebend-pose.jpg'),
    background: '#DDE6DD',
  },
  'sh-doorway': {
    start: require('../../assets/exercises/sh-doorway-start.jpg'),
    pose: require('../../assets/exercises/sh-doorway-pose.jpg'),
    background: '#DDE3D7',
  },

  // Elbows
  'el-circles': {
    start: require('../../assets/exercises/el-circles-start.jpg'),
    pose: require('../../assets/exercises/el-circles-pose.jpg'),
    background: '#DDE5DB',
  },
  'el-bend': {
    start: require('../../assets/exercises/el-bend-start.jpg'),
    pose: require('../../assets/exercises/el-bend-pose.jpg'),
    background: '#DEE7DC',
  },
  'el-turn': {
    start: require('../../assets/exercises/el-turn-start.jpg'),
    pose: require('../../assets/exercises/el-turn-pose.jpg'),
    background: '#DEE6DC',
  },
  'el-extensor': {
    start: require('../../assets/exercises/el-extensor-start.jpg'),
    pose: require('../../assets/exercises/el-extensor-pose.jpg'),
    background: '#DFE7DD',
  },
  'el-wall': {
    start: require('../../assets/exercises/el-wall-start.jpg'),
    pose: require('../../assets/exercises/el-wall-pose.jpg'),
    background: '#DDE2D7',
  },

  // Wrists
  'wr-circles': {
    start: require('../../assets/exercises/wr-circles-start.jpg'),
    pose: require('../../assets/exercises/wr-circles-pose.jpg'),
    background: '#DCE4D9',
  },
  'wr-prayer': {
    start: require('../../assets/exercises/wr-prayer-start.jpg'),
    pose: require('../../assets/exercises/wr-prayer-pose.jpg'),
    background: '#DEE6DC',
  },
  'wr-pull': {
    start: require('../../assets/exercises/wr-pull-start.jpg'),
    pose: require('../../assets/exercises/wr-pull-pose.jpg'),
    background: '#DEE5DB',
  },
  'wr-table': {
    start: require('../../assets/exercises/wr-table-start.jpg'),
    pose: require('../../assets/exercises/wr-table-pose.jpg'),
    background: '#DEE6DB',
  },
  'wr-reverse': {
    start: require('../../assets/exercises/wr-reverse-start.jpg'),
    pose: require('../../assets/exercises/wr-reverse-pose.jpg'),
    background: '#DEE6DB',
  },

  // Upper back
  'ub-catcow': {
    start: require('../../assets/exercises/ub-catcow-start.jpg'),
    pose: require('../../assets/exercises/ub-catcow-pose.jpg'),
    background: '#E1E9DF',
  },
  'ub-twist': {
    start: require('../../assets/exercises/ub-twist-start.jpg'),
    pose: require('../../assets/exercises/ub-twist-pose.jpg'),
    background: '#DCE5DB',
  },
  'ub-hug': {
    start: require('../../assets/exercises/ub-hug-start.jpg'),
    pose: require('../../assets/exercises/ub-hug-pose.jpg'),
    background: '#DDE5DB',
  },
  'ub-puppy': {
    start: require('../../assets/exercises/ub-puppy-start.jpg'),
    pose: require('../../assets/exercises/ub-puppy-pose.jpg'),
    background: '#DEE6DB',
  },
  'ub-lat': {
    start: require('../../assets/exercises/ub-lat-start.jpg'),
    pose: require('../../assets/exercises/ub-lat-pose.jpg'),
    background: '#DFE7DE',
  },
  'ub-thread': {
    start: require('../../assets/exercises/ub-thread-start.jpg'),
    pose: require('../../assets/exercises/ub-thread-pose.jpg'),
    background: '#DFE7DC',
  },
  'ub-wall': {
    start: require('../../assets/exercises/ub-wall-start.jpg'),
    pose: require('../../assets/exercises/ub-wall-pose.jpg'),
    background: '#DEE6DB',
  },

  // Lower back
  'lb-child': {
    start: require('../../assets/exercises/lb-child-start.jpg'),
    pose: require('../../assets/exercises/lb-child-pose.jpg'),
    background: '#DEE6DC',
  },
  'lb-hug': {
    start: require('../../assets/exercises/lb-hug-start.jpg'),
    pose: require('../../assets/exercises/lb-hug-pose.jpg'),
    background: '#DEE6DB',
  },
  'lb-seated': {
    start: require('../../assets/exercises/lb-seated-start.jpg'),
    pose: require('../../assets/exercises/lb-seated-pose.jpg'),
    background: '#DEE6DB',
  },
  'lb-sphinx': {
    start: require('../../assets/exercises/lb-sphinx-start.jpg'),
    pose: require('../../assets/exercises/lb-sphinx-pose.jpg'),
    background: '#DEE7DC',
  },
  'lb-twist': {
    start: require('../../assets/exercises/lb-twist-start.jpg'),
    pose: require('../../assets/exercises/lb-twist-pose.jpg'),
    background: '#DDE5DB',
  },
  'lb-cobra': {
    start: require('../../assets/exercises/lb-cobra-start.jpg'),
    pose: require('../../assets/exercises/lb-cobra-pose.jpg'),
    background: '#DFE6DC',
  },
  'lb-bridge': {
    start: require('../../assets/exercises/lb-bridge-start.jpg'),
    pose: require('../../assets/exercises/lb-bridge-pose.jpg'),
    background: '#DDE6DB',
  },
  'lb-fold': {
    start: require('../../assets/exercises/lb-fold-start.jpg'),
    pose: require('../../assets/exercises/lb-fold-pose.jpg'),
    background: '#DEE7DC',
  },
  'lb-birddog': {
    start: require('../../assets/exercises/lb-birddog-start.jpg'),
    pose: require('../../assets/exercises/lb-birddog-pose.jpg'),
    background: '#DFE7DD',
  },

  // Hips
  'hip-butterfly': {
    start: require('../../assets/exercises/hip-butterfly-start.jpg'),
    pose: require('../../assets/exercises/hip-butterfly-pose.jpg'),
    background: '#DEE6DB',
  },
  'hip-lunge': {
    start: require('../../assets/exercises/hip-lunge-start.jpg'),
    pose: require('../../assets/exercises/hip-lunge-pose.jpg'),
    background: '#DEE6DD',
  },
  'hip-fig4': {
    start: require('../../assets/exercises/hip-fig4-start.jpg'),
    pose: require('../../assets/exercises/hip-fig4-pose.jpg'),
    background: '#DEE7DD',
  },
  'hip-swing': {
    start: require('../../assets/exercises/hip-swing-start.jpg'),
    pose: require('../../assets/exercises/hip-swing-pose.jpg'),
    background: '#DDE5DA',
  },
  'hip-squat': {
    start: require('../../assets/exercises/hip-squat-start.jpg'),
    pose: require('../../assets/exercises/hip-squat-pose.jpg'),
    background: '#DEE5DB',
  },
  'hip-pigeon': {
    start: require('../../assets/exercises/hip-pigeon-start.jpg'),
    pose: require('../../assets/exercises/hip-pigeon-pose.jpg'),
    background: '#DEE6DC',
  },
  'hip-sidelunge': {
    start: require('../../assets/exercises/hip-sidelunge-start.jpg'),
    pose: require('../../assets/exercises/hip-sidelunge-pose.jpg'),
    background: '#DBE4DA',
  },
  'hip-wgs': {
    start: require('../../assets/exercises/hip-wgs-start.jpg'),
    pose: require('../../assets/exercises/hip-wgs-pose.jpg'),
    background: '#DDE5DB',
  },

  // Knees
  'kn-quad': {
    start: require('../../assets/exercises/kn-quad-start.jpg'),
    pose: require('../../assets/exercises/kn-quad-pose.jpg'),
    background: '#DDE5DB',
  },
  'kn-lyingham': {
    start: require('../../assets/exercises/kn-lyingham-start.jpg'),
    pose: require('../../assets/exercises/kn-lyingham-pose.jpg'),
    background: '#DEE6DC',
  },
  'kn-slides': {
    start: require('../../assets/exercises/kn-slides-start.jpg'),
    pose: require('../../assets/exercises/kn-slides-pose.jpg'),
    background: '#DDE5DB',
  },
  'kn-heelsit': {
    start: require('../../assets/exercises/kn-heelsit-start.jpg'),
    pose: require('../../assets/exercises/kn-heelsit-pose.jpg'),
    background: '#DEE6DB',
  },
  'kn-couch': {
    start: require('../../assets/exercises/kn-couch-start.jpg'),
    pose: require('../../assets/exercises/kn-couch-pose.jpg'),
    background: '#DEE6DD',
  },

  // Ankles
  'an-rock': {
    start: require('../../assets/exercises/an-rock-start.jpg'),
    pose: require('../../assets/exercises/an-rock-pose.jpg'),
    background: '#DEE7DD',
  },
  'an-circles': {
    start: require('../../assets/exercises/an-circles-start.jpg'),
    pose: require('../../assets/exercises/an-circles-pose.jpg'),
    background: '#DEE6DC',
  },
  'an-calf': {
    start: require('../../assets/exercises/an-calf-start.jpg'),
    pose: require('../../assets/exercises/an-calf-pose.jpg'),
    background: '#DEE7DC',
  },
  'an-dog': {
    start: require('../../assets/exercises/an-dog-start.jpg'),
    pose: require('../../assets/exercises/an-dog-pose.jpg'),
    background: '#DFE7DC',
  },
  'an-squat': {
    start: require('../../assets/exercises/an-squat-start.jpg'),
    pose: require('../../assets/exercises/an-squat-pose.jpg'),
    background: '#DFE8DD',
  },

  // Feet
  'ft-spread': {
    start: require('../../assets/exercises/ft-spread-start.jpg'),
    pose: require('../../assets/exercises/ft-spread-pose.jpg'),
    background: '#DFE8DE',
  },
  'ft-flex': {
    start: require('../../assets/exercises/ft-flex-start.jpg'),
    pose: require('../../assets/exercises/ft-flex-pose.jpg'),
    background: '#DDE5DA',
  },
  'ft-raise': {
    start: require('../../assets/exercises/ft-raise-start.jpg'),
    pose: require('../../assets/exercises/ft-raise-pose.jpg'),
    background: '#DFE6DC',
  },
  'ft-toes': {
    start: require('../../assets/exercises/ft-toes-start.jpg'),
    pose: require('../../assets/exercises/ft-toes-pose.jpg'),
    background: '#DEE6DB',
  },
  'ft-arch': {
    start: require('../../assets/exercises/ft-arch-start.jpg'),
    pose: require('../../assets/exercises/ft-arch-pose.jpg'),
    background: '#DEE7DC',
  },
  'ft-plantar': {
    start: require('../../assets/exercises/ft-plantar-start.jpg'),
    pose: require('../../assets/exercises/ft-plantar-pose.jpg'),
    background: '#DBE4D9',
  },
};

/**
 * The move that stands for each area wherever an area needs a picture (Today's area tiles, Train by body part,
 * the area pop-up). Chosen because they read clearly even at 40pt: compact seated, kneeling or close-up poses
 * that fill the circle, rather than thin standing ones.
 */
export const AREA_COVER: Record<AreaId, string> = {
  neck: 'neck-tilt',
  shoulders: 'sh-goalpost',
  elbows: 'el-bend',
  wrists: 'wr-prayer',
  upperBack: 'ub-catcow',
  lowerBack: 'lb-cobra',
  hips: 'hip-butterfly',
  knees: 'kn-heelsit',
  ankles: 'an-dog',
  feet: 'ft-spread',
};

/** The pictures' shared background and the deep green they're drawn with, for icons that sit beside them. */
export const ART_BACKGROUND = '#DEE6DB';
export const ART_INK = '#1F5A3E';

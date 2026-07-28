import { BodyProfile } from '../types';

export const BODY_TYPES: BodyProfile[] = [
  { id: 'feminine', label: 'Feminine', emoji: '⚘', shoulderHalf: 32, chestHalf: 36, waistHalf: 24, hipHalf: 38, limbWidth: 22, armSpread: 0 },
  { id: 'masculine', label: 'Masculine', emoji: '◆', shoulderHalf: 44, chestHalf: 42, waistHalf: 36, hipHalf: 30, limbWidth: 28, armSpread: 14 },
  { id: 'neutral', label: 'Neutral', emoji: '●', shoulderHalf: 36, chestHalf: 36, waistHalf: 30, hipHalf: 32, limbWidth: 24, armSpread: 6 },
];

export const SKIN_TONES = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a21'];

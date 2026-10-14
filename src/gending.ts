// Gending asli dari file isian guru (content/gending-isian.xlsx),
// dibuat ulang dengan `npm run gending`. Jangan diubah langsung.
import data from './data/gending.json';
import type { Preset } from './gamelan';

export const GENDING = data as Preset[];

import { ReactNode } from 'react';

// Global types for LunarJS (loaded via CDN)
declare global {
  interface Window {
    Solar: any;
    Lunar: any;
  }
}

export interface Star {
  name: string;
  light?: string; // 庙旺平陷
  type: 'main' | 'aux' | 'bad' | 'small' | 'flow';
}

export interface Mutagen {
  name: string; // 禄权科忌
  color: string;
}

export interface PalaceData {
  index: number; // 0-11 (寅=0)
  name: string; // 命宫, 兄弟...
  stem: string; // 天干
  branch: string; // 地支
  mainStars: Star[];
  auxStars: Star[];
  badStars: Star[];
  smallStars: Star[];
  liuStars: Star[]; // 流曜
  mutagens: Mutagen[];
  isBodyPalace?: boolean; // 身宫
}

export interface DecadeInfo {
  start: number;
  end: number;
  index: number;
  pos: number; // 宫位索引
  stemIdx: number;
}

export interface BaziInfo {
  year: { gan: string; zhi: string };
  month: { gan: string; zhi: string };
  day: { gan: string; zhi: string };
  time: { gan: string; zhi: string };
}

export interface ChartData {
  baziData: BaziInfo;
  wxCounts: Record<string, number>; // 五行统计
  wuxing: string; // 五行局
  mingZhu: string;
  shenZhu: string;
  palaces: PalaceData[];
  siHuaGan: string;
  decadeRanges: DecadeInfo[];
  currentDecadeIdx: number;
  viewMingIndex: number;
  gender: string;
  lunarDateStr: string;
}

export type ViewMode = 'native' | 'decade' | 'year' | 'bazi';
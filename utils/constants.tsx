import React from 'react';
import { 
  User, Users, Heart, Smile, DollarSign, Frown, Map, Briefcase, 
  Home, Flower, BookOpen, Crown, Leaf, Droplets, Flame, Mountain, Hammer 
} from 'lucide-react';

export const BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
export const ZHI_STD = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 宫位基本顺序 (逆时针)
export const PALACE_NAMES_BASE = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];

export const WUXING_CONFIG: Record<string, any> = {
  '金': { color: 'text-yellow-600', bg: 'bg-yellow-400', bar: 'bg-yellow-500', icon: <Hammer className="w-4 h-4" />, label: '金 (义)' },
  '木': { color: 'text-green-600', bg: 'bg-green-400', bar: 'bg-green-500', icon: <Leaf className="w-4 h-4" />, label: '木 (仁)' },
  '水': { color: 'text-blue-600', bg: 'bg-blue-400', bar: 'bg-blue-500', icon: <Droplets className="w-4 h-4" />, label: '水 (智)' },
  '火': { color: 'text-red-600', bg: 'bg-red-400', bar: 'bg-red-500', icon: <Flame className="w-4 h-4" />, label: '火 (礼)' },
  '土': { color: 'text-amber-700', bg: 'bg-amber-500', bar: 'bg-amber-600', icon: <Mountain className="w-4 h-4" />, label: '土 (信)' }
};

export const SI_HUA_RULES: Record<string, { lu: string; quan: string; ke: string; ji: string }> = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' }
};

export const BRIGHTNESS: Record<string, Record<string, string>> = {
  '紫微': { '子': '平', '丑': '庙', '寅': '庙', '卯': '平', '辰': '平', '巳': '旺', '午': '庙', '未': '庙', '申': '平', '酉': '平', '戌': '平', '亥': '旺' },
  '天机': { '子': '庙', '丑': '陷', '寅': '旺', '卯': '旺', '辰': '利', '巳': '平', '午': '庙', '未': '陷', '申': '旺', '酉': '旺', '戌': '平', '亥': '平' },
  '太阳': { '子': '陷', '丑': '陷', '寅': '旺', '卯': '庙', '辰': '庙', '巳': '旺', '午': '庙', '未': '平', '申': '平', '酉': '平', '戌': '陷', '亥': '陷' },
  '武曲': { '子': '旺', '丑': '庙', '寅': '平', '卯': '平', '辰': '庙', '巳': '平', '午': '旺', '未': '庙', '申': '平', '酉': '平', '戌': '庙', '亥': '平' },
  '天同': { '子': '旺', '丑': '陷', '寅': '平', '卯': '平', '辰': '平', '巳': '庙', '午': '陷', '未': '陷', '申': '旺', '酉': '平', '戌': '平', '亥': '庙' },
  '廉贞': { '子': '平', '丑': '利', '寅': '庙', '卯': '平', '辰': '利', '巳': '陷', '午': '平', '未': '利', '申': '庙', '酉': '平', '戌': '利', '亥': '陷' },
  '天府': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '平', '辰': '庙', '巳': '平', '午': '旺', '未': '庙', '申': '平', '酉': '平', '戌': '庙', '亥': '平' },
  '太阴': { '子': '庙', '丑': '庙', '寅': '陷', '卯': '陷', '辰': '陷', '巳': '陷', '午': '陷', '未': '平', '申': '平', '酉': '旺', '戌': '旺', '亥': '庙' },
  '贪狼': { '子': '旺', '丑': '庙', '寅': '平', '卯': '平', '辰': '庙', '巳': '陷', '午': '旺', '未': '庙', '申': '平', '酉': '平', '戌': '庙', '亥': '陷' },
  '巨门': { '子': '旺', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '陷', '巳': '平', '午': '旺', '未': '陷', '申': '庙', '酉': '庙', '戌': '陷', '亥': '旺' },
  '天相': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '陷', '辰': '平', '巳': '平', '午': '旺', '未': '平', '申': '庙', '酉': '陷', '戌': '平', '亥': '平' },
  '天梁': { '子': '庙', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '旺', '巳': '陷', '午': '庙', '未': '旺', '申': '陷', '酉': '平', '戌': '旺', '亥': '陷' },
  '七杀': { '子': '旺', '丑': '庙', '寅': '庙', '卯': '平', '辰': '庙', '巳': '平', '午': '旺', '未': '庙', '申': '庙', '酉': '平', '戌': '庙', '亥': '平' },
  '破军': { '子': '庙', '丑': '旺', '寅': '平', '卯': '陷', '辰': '旺', '巳': '平', '午': '庙', '未': '旺', '申': '平', '酉': '陷', '戌': '旺', '亥': '平' },
};

export const PALACE_ICONS: Record<string, React.ReactNode> = {
  '命宫': <User className="w-full h-full text-pink-300 opacity-20" />,
  '兄弟': <Users className="w-full h-full text-blue-300 opacity-20" />,
  '夫妻': <Heart className="w-full h-full text-red-300 opacity-20" />,
  '子女': <Smile className="w-full h-full text-orange-300 opacity-20" />,
  '财帛': <DollarSign className="w-full h-full text-yellow-300 opacity-20" />,
  '疾厄': <Frown className="w-full h-full text-green-300 opacity-20" />,
  '迁移': <Map className="w-full h-full text-purple-300 opacity-20" />,
  '交友': <Users className="w-full h-full text-teal-300 opacity-20" />,
  '官禄': <Briefcase className="w-full h-full text-indigo-300 opacity-20" />,
  '田宅': <Home className="w-full h-full text-amber-300 opacity-20" />,
  '福德': <Flower className="w-full h-full text-rose-300 opacity-20" />,
  '父母': <BookOpen className="w-full h-full text-cyan-300 opacity-20" />,
};

// 纳音五行局
export const WXJ_MAP: Record<string, number> = {
  '甲子': 4, '乙丑': 4, '丙寅': 6, '丁卯': 6, '戊辰': 3, '己巳': 3, '庚午': 5, '辛未': 5, '壬申': 4, '癸酉': 4, '甲戌': 6, '乙亥': 6,
  '丙子': 2, '丁丑': 2, '戊寅': 5, '己卯': 5, '庚辰': 4, '辛巳': 4, '壬午': 3, '癸未': 3, '甲申': 2, '乙酉': 2, '丙戌': 5, '丁亥': 5,
  '戊子': 6, '己丑': 6, '庚寅': 3, '辛卯': 3, '壬辰': 2, '癸巳': 2, '甲午': 4, '乙未': 4, '丙申': 6, '丁酉': 6, '戊戌': 3, '己亥': 3,
  '庚子': 5, '辛丑': 5, '壬寅': 4, '癸卯': 4, '甲辰': 6, '乙巳': 6, '丙午': 2, '丁未': 2, '戊申': 5, '己酉': 5, '庚戌': 4, '辛亥': 4,
  '壬子': 3, '癸丑': 3, '甲寅': 2, '乙卯': 2, '丙辰': 5, '丁巳': 5, '戊午': 6, '己未': 6, '庚申': 3, '辛酉': 3, '壬戌': 2, '癸亥': 2
};
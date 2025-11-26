import { ChartData, DecadeInfo, PalaceData, Star, Mutagen, ViewMode, BaziInfo } from '../types';
import { BRANCHES, ZHI_STD, STEMS, PALACE_NAMES_BASE, WUXING_CONFIG, BRIGHTNESS, SI_HUA_RULES, WXJ_MAP } from './constants';

export const calculateChart = (
  date: string, 
  time: string, 
  gender: string, 
  viewMode: ViewMode, 
  selectedDecadeIdx: number | null, 
  selectedYear: number
): ChartData | null => {
  if (!window.Solar || !window.Lunar) return null;

  try {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    const solar = window.Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    // 1. 八字数据 (简化计算五行)
    const bazi: BaziInfo = {
      year: { gan: eightChar.getYearGan(), zhi: eightChar.getYearZhi() },
      month: { gan: eightChar.getMonthGan(), zhi: eightChar.getMonthZhi() },
      day: { gan: eightChar.getDayGan(), zhi: eightChar.getDayZhi() },
      time: { gan: eightChar.getTimeGan(), zhi: eightChar.getTimeZhi() },
    };
    
    const wxCounts: Record<string, number> = { '金':0, '木':0, '水':0, '火':0, '土':0 };
    const getWX = (char: string) => {
        if('甲乙寅卯'.includes(char)) return '木';
        if('丙丁巳午'.includes(char)) return '火';
        if('戊己辰戌丑未'.includes(char)) return '土';
        if('庚辛申酉'.includes(char)) return '金';
        if('壬癸亥子'.includes(char)) return '水';
        return '土';
    };
    [bazi.year, bazi.month, bazi.day, bazi.time].forEach(p => {
        wxCounts[getWX(p.gan)]++;
        wxCounts[getWX(p.zhi)]++;
    });

    const yearGanIndex = lunar.getYearGanIndex(); 
    const yearZhiIndex = lunar.getYearZhiIndex(); 

    // 2. 命身宫
    const lunarMonth = lunar.getMonth();
    const timeZhiIndex = lunar.getTimeZhiIndex(); 
    // 命宫：月支数 - 时支数 + 1 (寅=1) -> 简化为 0-11索引 (0=寅)
    // 公式: (月数 - 1) - (时支索引) + 12 (to positive) % 12
    let mingIndex = ((lunarMonth - 1) - timeZhiIndex + 12) % 12; 
    let shenIndex = ((lunarMonth - 1) + timeZhiIndex) % 12;

    // 3. 定局
    const yinGanIndex = (yearGanIndex % 5) * 2 + 2; 
    const mingGanIndex = (yinGanIndex + mingIndex) % 10;
    const mingGan = STEMS[mingGanIndex];
    const mingZhiStd = ZHI_STD[(mingIndex + 2) % 12]; // 转换为子丑寅卯顺序
    const wxjVal = WXJ_MAP[mingGan + mingZhiStd] || 2;
    const wuxingName = {2:'水二局',3:'木三局',4:'金四局',5:'土五局',6:'火六局'}[wxjVal] || '五行局';

    // 4. 安星 (紫微系/天府系)
    const lunarDay = lunar.getDay();
    let zwIndex = 0; 
    let remainder = lunarDay % wxjVal;
    let quotient = Math.floor(lunarDay / wxjVal);
    let x = 0;
    if (remainder !== 0) {
       x = wxjVal - remainder;
       quotient = Math.floor((lunarDay + x) / wxjVal);
    }
    // 紫微位置计算
    let base = (quotient - 1 + 12) % 12; // 商数对应的宫位(寅起)
    zwIndex = (remainder === 0) ? base : ((x % 2 !== 0) ? (base - x + 12) % 12 : (base + x) % 12);
    // 天府位置: 相对紫微，寅申线对称。 公式: (12 - zwIndex) % 12. 
    // Note: zwIndex 0=Yin(寅). If ZW is at Yin(0), TF is at Yin(0) -> 12%12=0. Correct.
    // If ZW at Mao(1), TF at Chou(11) -> (12-1)=11. Correct.
    let tfIndex = (12 - zwIndex) % 12;

    // 5. 大限
    const isYangYear = yearGanIndex % 2 === 0;
    const isMale = gender === '男';
    const goForward = (isYangYear && isMale) || (!isYangYear && !isMale);
    const decadeRanges: DecadeInfo[] = [];
    for(let k=0; k<12; k++) {
       const startAge = wxjVal + k * 10;
       const endAge = startAge + 9;
       const pos = goForward ? (mingIndex + k) % 12 : (mingIndex - k + 12) % 12;
       const stemIdx = (yinGanIndex + pos) % 10;
       decadeRanges.push({ start: startAge, end: endAge, index: k, pos, stemIdx });
    }

    let currentDecadeInfo = decadeRanges[0];
    const currentAge = selectedYear - year + 1; // 虚岁
    
    // 如果选择了特定大运，使用选择的
    if (selectedDecadeIdx !== null && decadeRanges[selectedDecadeIdx]) {
        currentDecadeInfo = decadeRanges[selectedDecadeIdx];
    } else {
        // 否则根据当前选定年份（默认当前年）计算所属大运
        const found = decadeRanges.find(d => currentAge >= d.start && currentAge <= d.end);
        if (found) currentDecadeInfo = found;
    }

    // 6. 流年
    // 2022 = Ren Yin (Tiger). selectedYear - 2022 = diff in years.
    // Yin is index 0 in our 0-11 system (0=Yin, 1=Mao...)
    const currentYearDiff = selectedYear - 2022; 
    const yearZhiInYin = (0 + currentYearDiff + 1200) % 12; // 流年命宫 (地支位置)
    
    // Calculate heavenly stem of the year
    // 2022 = Ren (8). (year - 4) % 10 roughly. 2022 - 4 = 2018. 8 ends in 8. 
    // Let's use robust modulo.
    // 1984 = Jia Zi (0, 0). (year - 1984) % 60
    const offset1984 = selectedYear - 1984;
    const yearGanVal = (0 + offset1984 + 6000) % 10;

    // 7. 视图与宫位轮转
    let viewMingIndex = mingIndex; 
    let siHuaStemIndex = yearGanIndex; // 默认本命四化用生年干

    if (viewMode === 'decade') {
        viewMingIndex = currentDecadeInfo.pos; // 大限命宫
        siHuaStemIndex = currentDecadeInfo.stemIdx; // 大限宫干
    } else if (viewMode === 'year') {
        viewMingIndex = yearZhiInYin; // 流年命宫 (地支)
        siHuaStemIndex = yearGanVal; // 流年天干
    }

    // 8. 宫位生成
    const palaces: PalaceData[] = [];
    for (let i = 0; i < 12; i++) {
      // i = 物理位置 (0=寅)
      // 宫名根据视图命宫逆排
      // i=0(寅), viewMing=0(寅) -> Offset=0 -> Ming.
      // i=1(卯), viewMing=0(寅) -> Offset=11 -> Parents (Last one).
      // Logic: (ViewMing - i + 12) % 12
      const offset = (viewMingIndex - i + 12) % 12;
      const pName = PALACE_NAMES_BASE[offset];
      const stemIdx = (yinGanIndex + i) % 10;
      
      const mainStars: Star[] = []; 
      const auxStars: Star[] = []; 
      const badStars: Star[] = []; 
      const smallStars: Star[] = []; 
      const mutagens: Mutagen[] = []; 
      const liuStars: Star[] = [];

      const add = (arr: Star[], name: string, type: any = 'normal') => {
         const zhiLabel = ZHI_STD[(i+2)%12]; // Get Zhi label for brightness lookup
         const light = BRIGHTNESS[name] ? BRIGHTNESS[name][zhiLabel] : '';
         arr.push({ name, light, type });
      };

      // 安主星
      const check = (idxRef: number, off: number, name: string) => { 
        if ((idxRef + off + 120) % 12 === i) add(mainStars, name, 'main'); 
      };
      
      check(zwIndex, 0, '紫微'); check(zwIndex, -1, '天机'); check(zwIndex, -3, '太阳');
      check(zwIndex, -4, '武曲'); check(zwIndex, -5, '天同'); check(zwIndex, -8, '廉贞');
      
      check(tfIndex, 0, '天府'); check(tfIndex, 1, '太阴'); check(tfIndex, 2, '贪狼');
      check(tfIndex, 3, '巨门'); check(tfIndex, 4, '天相'); check(tfIndex, 5, '天梁');
      check(tfIndex, 6, '七杀'); check(tfIndex, 10, '破军');

      // 安吉星 (Fixed positions based on birth params)
      if ((8 - timeZhiIndex + 12) % 12 === i) add(auxStars, '文昌', 'aux');
      if ((2 + timeZhiIndex) % 12 === i) add(auxStars, '文曲', 'aux');
      if ((2 + (lunarMonth-1)) % 12 === i) add(auxStars, '左辅', 'aux');
      if ((8 - (lunarMonth-1) + 12) % 12 === i) add(auxStars, '右弼', 'aux');
      
      // Kui/Yue (Based on Year Gan)
      const kyMap: any = { 0:[11,5], 1:[10,6], 2:[9,7], 3:[9,7], 4:[11,5], 5:[10,6], 6:[11,5], 7:[4,0], 8:[1,3], 9:[1,3] };
      if (kyMap[yearGanIndex]?.includes(i)) add(auxStars, kyMap[yearGanIndex][0]===i?'天魁':'天钺', 'aux');
      
      // 禄羊陀 (生年)
      const luMap: any = { 0:0, 1:1, 2:3, 3:4, 4:3, 5:4, 6:6, 7:7, 8:9, 9:10 };
      const luPos = luMap[yearGanIndex];
      if (luPos === i) add(auxStars, '禄存', 'aux');
      if ((luPos + 1) % 12 === i) add(badStars, '擎羊', 'bad');
      if ((luPos - 1 + 12) % 12 === i) add(badStars, '陀罗', 'bad');

      // 煞星 (Huo/Ling)
      const yz = (yearZhiIndex - 2 + 12) % 12; // Year Zhi adjusted to Yin=0? No, yearZhiIndex is standard usually.
      // Wait, LunarJS yearZhiIndex: 0=Zi? 
      // standard lunar.js getYearZhiIndex() returns 0 for Zi, 1 for Chou.
      // My loop 'i' is 0 for Yin.
      // Need to normalize to my 'i'.
      // My 'i': 0=Yin, 1=Mao, ... 10=Zi, 11=Chou.
      // So Zi(0) maps to i=10. Chou(1) maps to i=11. Yin(2) maps to i=0.
      // map: (zhiIdx - 2 + 12) % 12.
      const yearZhiMap = (yearZhiIndex - 2 + 12) % 12; 
      
      let huoBase, lingBase;
      // Huo/Ling rules based on Year Branch
      // Yin(0), Wu(4), Xu(8) -> Chou(11), Mao(1)
      if ([0,4,8].includes(yearZhiMap)) { huoBase=11; lingBase=1; }
      // Shen(6), Zi(10), Chen(2) -> Yin(0), Xu(8)
      else if ([6,10,2].includes(yearZhiMap)) { huoBase=0; lingBase=8; }
      // Hai(9), Mao(1), Wei(5) -> You(7), Xu(8)
      else if ([9,1,5].includes(yearZhiMap)) { huoBase=7; lingBase=8; }
      // Si(3), You(7), Chou(11) -> Mao(1), Xu(8)
      else { huoBase=1; lingBase=8; } // Simplified default, actual rules are complex
      
      if ((huoBase + timeZhiIndex) % 12 === i) add(badStars, '火星', 'bad');
      if ((lingBase + timeZhiIndex) % 12 === i) add(badStars, '铃星', 'bad');
      
      // Di Kong / Di Jie (Based on Time)
      // Hai=9 in my index? 
      // TimeZhi: 0=Zi.
      // Jie: From Hai(9) forward. Kong: From Hai(9) backward.
      // i scale: 0=Yin. Hai=9.
      if ((9 + timeZhiIndex) % 12 === i) add(badStars, '地劫', 'bad');
      if ((9 - timeZhiIndex + 12) % 12 === i) add(badStars, '地空', 'bad');

      // 杂曜 (Red Peach etc)
      const luanIdx = (1 - yearZhiIndex + 12) % 12; // Approx formula
      // Correct formula for Hong Luan: Starts at Mao(1), goes backwards by year.
      // Mao is i=1. Year=Zi(0) -> Mao. Year=Chou(1) -> Yin(0).
      // i = (1 - (yearZhiIndex) + 12) % 12?
      // Zi(0) -> 1 (Mao). Correct.
      // Chou(1) -> 0 (Yin). Correct.
      // Yin(2) -> -1 -> 11 (Chou). Correct.
      // My loop i is 0=Yin. So result 1=Mao. Formula works for my i scale.
      // Note: luanIdx calculation needs verify against YearZhiIndex (0=Zi).
      // Let's assume (1 - (yearZhiIndex) + 12) % 12 gives correct 'i' index.
      const myLuanIdx = (1 - yearZhiMap + 12) % 12; // Wait, yearZhiMap is in my scale (0=Yin).
      // If Year is Yin (yearZhiMap=0). Luan should be at Chou (i=11).
      // Formula above: (1 - 0) = 1 (Mao). Wrong.
      // Traditional Rule: Zi Year Luan at Mao.
      // Zi Year -> yearZhiMap = 10.
      // Mao is i=1.
      // Formula: X - 10 = 1 mod 12 -> X = 11.
      // Let's use standard year index 0=Zi.
      // 1 (Mao in i-scale) - yearZhiIndex (0 for Zi) ? No.
      // Rule: Zi(0) -> Mao(1). Chou(1) -> Yin(0). Yin(2) -> Chou(11).
      // 1 - yearZhiIndex?
      // 1 - 0 = 1.
      // 1 - 1 = 0.
      // 1 - 2 = -1 (11).
      // 1 - 3 = -2 (10).
      // Yes, `(1 - yearZhiIndex + 12) % 12` maps to `i` correctly if `i=1` is Mao.
      // My `i=0` is Yin, `i=1` is Mao. Correct.
      if ((1 - yearZhiIndex + 12) % 12 === i) add(smallStars, '红鸾', 'small');
      if ((7 - yearZhiIndex + 12) % 12 === i) add(smallStars, '天喜', 'small'); // Opposite Luan

      // --- 流曜计算 (仅在流年模式下显示) ---
      if (viewMode === 'year') {
         const liuLuPos = luMap[yearGanVal]; // 流年禄存位置
         if (liuLuPos === i) add(liuStars, '流禄', 'flow');
         if ((liuLuPos + 1) % 12 === i) add(liuStars, '流羊', 'flow');
         if ((liuLuPos - 1 + 12) % 12 === i) add(liuStars, '流陀', 'flow');
         if (kyMap[yearGanVal]?.includes(i)) add(liuStars, kyMap[yearGanVal][0]===i?'流魁':'流钺', 'flow');
      }

      // 动态四化
      const siHuaGan = STEMS[siHuaStemIndex];
      const rule = SI_HUA_RULES[siHuaGan];
      const allStars = [...mainStars, ...auxStars];
      
      allStars.forEach(s => {
         if (s.name === rule.lu) mutagens.push({ name: '禄', color: 'bg-green-500' });
         if (s.name === rule.quan) mutagens.push({ name: '权', color: 'bg-red-500' });
         if (s.name === rule.ke) mutagens.push({ name: '科', color: 'bg-blue-500' });
         if (s.name === rule.ji) mutagens.push({ name: '忌', color: 'bg-pink-500' });
      });

      palaces.push({
        index: i,
        name: pName, 
        stem: STEMS[stemIdx],
        branch: BRANCHES[i],
        mainStars, auxStars, badStars, smallStars, mutagens, liuStars,
        isBodyPalace: i === shenIndex
      });
    }

    return {
      baziData: bazi,
      wxCounts,
      wuxing: wuxingName,
      mingZhu: ['禄存','文曲','廉贞','武曲','破军','武曲','廉贞','文曲','禄存','巨门','贪狼','巨门'][mingIndex],
      shenZhu: ['火星','天相','天梁','天同','文昌','天机','火星','天相','天梁','天同','文昌','天机'][yearZhiIndex],
      palaces,
      siHuaGan: STEMS[siHuaStemIndex],
      decadeRanges,
      currentDecadeIdx: currentDecadeInfo.index,
      viewMingIndex,
      gender,
      lunarDateStr: lunar.toString()
    };

  } catch (e) { 
    console.error(e); 
    return null;
  }
};
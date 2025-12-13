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
    let mingIndex = ((lunarMonth - 1) - timeZhiIndex + 12) % 12; 
    let shenIndex = ((lunarMonth - 1) + timeZhiIndex) % 12;

    // 3. 定局
    const yinGanIndex = (yearGanIndex % 5) * 2 + 2; 
    const mingGanIndex = (yinGanIndex + mingIndex) % 10;
    const mingGan = STEMS[mingGanIndex];
    const mingZhiStd = ZHI_STD[(mingIndex + 2) % 12];
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
    let base = (quotient - 1 + 12) % 12;
    zwIndex = (remainder === 0) ? base : ((x % 2 !== 0) ? (base - x + 12) % 12 : (base + x) % 12);
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
    const currentAge = selectedYear - year + 1;
    
    if (selectedDecadeIdx !== null && decadeRanges[selectedDecadeIdx]) {
        currentDecadeInfo = decadeRanges[selectedDecadeIdx];
    } else {
        const found = decadeRanges.find(d => currentAge >= d.start && currentAge <= d.end);
        if (found) currentDecadeInfo = found;
    }

    // 6. 流年
    const currentYearDiff = selectedYear - 2022; 
    const yearZhiInYin = (0 + currentYearDiff + 1200) % 12;
    const offset1984 = selectedYear - 1984;
    const yearGanVal = (0 + offset1984 + 6000) % 10;

    // 7. 视图与宫位轮转
    let viewMingIndex = mingIndex; 
    let siHuaStemIndex = yearGanIndex;

    if (viewMode === 'decade') {
        viewMingIndex = currentDecadeInfo.pos;
        siHuaStemIndex = currentDecadeInfo.stemIdx;
    } else if (viewMode === 'year') {
        viewMingIndex = yearZhiInYin;
        siHuaStemIndex = yearGanVal;
    }

    // 8. 宫位生成
    const palaces: PalaceData[] = [];
    for (let i = 0; i < 12; i++) {
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
         const zhiLabel = ZHI_STD[(i+2)%12];
         const light = BRIGHTNESS[name] ? BRIGHTNESS[name][zhiLabel] : '';
         arr.push({ name, light, type });
      };

      const check = (idxRef: number, off: number, name: string) => { 
        if ((idxRef + off + 120) % 12 === i) add(mainStars, name, 'main'); 
      };
      
      check(zwIndex, 0, '紫微'); check(zwIndex, -1, '天机'); check(zwIndex, -3, '太阳');
      check(zwIndex, -4, '武曲'); check(zwIndex, -5, '天同'); check(zwIndex, -8, '廉贞');
      
      check(tfIndex, 0, '天府'); check(tfIndex, 1, '太阴'); check(tfIndex, 2, '贪狼');
      check(tfIndex, 3, '巨门'); check(tfIndex, 4, '天相'); check(tfIndex, 5, '天梁');
      check(tfIndex, 6, '七杀'); check(tfIndex, 10, '破军');

      if ((8 - timeZhiIndex + 12) % 12 === i) add(auxStars, '文昌', 'aux');
      if ((2 + timeZhiIndex) % 12 === i) add(auxStars, '文曲', 'aux');
      if ((2 + (lunarMonth-1)) % 12 === i) add(auxStars, '左辅', 'aux');
      if ((8 - (lunarMonth-1) + 12) % 12 === i) add(auxStars, '右弼', 'aux');
      
      const kyMap: any = { 0:[11,5], 1:[10,6], 2:[9,7], 3:[9,7], 4:[11,5], 5:[10,6], 6:[11,5], 7:[4,0], 8:[1,3], 9:[1,3] };
      if (kyMap[yearGanIndex]?.includes(i)) add(auxStars, kyMap[yearGanIndex][0]===i?'天魁':'天钺', 'aux');
      
      const luMap: any = { 0:0, 1:1, 2:3, 3:4, 4:3, 5:4, 6:6, 7:7, 8:9, 9:10 };
      const luPos = luMap[yearGanIndex];
      if (luPos === i) add(auxStars, '禄存', 'aux');
      if ((luPos + 1) % 12 === i) add(badStars, '擎羊', 'bad');
      if ((luPos - 1 + 12) % 12 === i) add(badStars, '陀罗', 'bad');

      const yearZhiMap = (yearZhiIndex - 2 + 12) % 12; 
      
      let huoBase, lingBase;
      if ([0,4,8].includes(yearZhiMap)) { huoBase=11; lingBase=1; }
      else if ([6,10,2].includes(yearZhiMap)) { huoBase=0; lingBase=8; }
      else if ([9,1,5].includes(yearZhiMap)) { huoBase=7; lingBase=8; }
      else { huoBase=1; lingBase=8; }
      
      if ((huoBase + timeZhiIndex) % 12 === i) add(badStars, '火星', 'bad');
      if ((lingBase + timeZhiIndex) % 12 === i) add(badStars, '铃星', 'bad');
      
      if ((9 + timeZhiIndex) % 12 === i) add(badStars, '地劫', 'bad');
      if ((9 - timeZhiIndex + 12) % 12 === i) add(badStars, '地空', 'bad');

      if ((1 - yearZhiIndex + 12) % 12 === i) add(smallStars, '红鸾', 'small');
      if ((7 - yearZhiIndex + 12) % 12 === i) add(smallStars, '天喜', 'small');

      if (viewMode === 'year') {
         const liuLuPos = luMap[yearGanVal];
         if (liuLuPos === i) add(liuStars, '流禄', 'flow');
         if ((liuLuPos + 1) % 12 === i) add(liuStars, '流羊', 'flow');
         if ((liuLuPos - 1 + 12) % 12 === i) add(liuStars, '流陀', 'flow');
         if (kyMap[yearGanVal]?.includes(i)) add(liuStars, kyMap[yearGanVal][0]===i?'流魁':'流钺', 'flow');
      }

      // --- 多级四化计算 ---
      const allStarsInPalace = [...mainStars, ...auxStars];

      // 生年四化 (Natal)
      const natalSiHuaGan = STEMS[yearGanIndex];
      const natalRule = SI_HUA_RULES[natalSiHuaGan];
      natalRule && allStarsInPalace.forEach(s => {
          if (s.name === natalRule.lu) mutagens.push({ name: '禄', color: 'bg-green-500', type: 'natal' });
          if (s.name === natalRule.quan) mutagens.push({ name: '权', color: 'bg-red-500', type: 'natal' });
          if (s.name === natalRule.ke) mutagens.push({ name: '科', color: 'bg-blue-500', type: 'natal' });
          if (s.name === natalRule.ji) mutagens.push({ name: '忌', color: 'bg-pink-500', type: 'natal' });
      });

      // 大限四化 (Decade)
      if (viewMode === 'decade' || viewMode === 'year') {
          const decadeSiHuaGan = STEMS[currentDecadeInfo.stemIdx];
          const decadeRule = SI_HUA_RULES[decadeSiHuaGan];
          decadeRule && allStarsInPalace.forEach(s => {
              if (s.name === decadeRule.lu) mutagens.push({ name: '禄', color: 'bg-green-500', type: 'decade' });
              if (s.name === decadeRule.quan) mutagens.push({ name: '权', color: 'bg-red-500', type: 'decade' });
              if (s.name === decadeRule.ke) mutagens.push({ name: '科', color: 'bg-blue-500', type: 'decade' });
              if (s.name === decadeRule.ji) mutagens.push({ name: '忌', color: 'bg-pink-500', type: 'decade' });
          });
      }

      // 流年四化 (Yearly)
      if (viewMode === 'year') {
          const yearSiHuaGan = STEMS[yearGanVal];
          const yearRule = SI_HUA_RULES[yearSiHuaGan];
          yearRule && allStarsInPalace.forEach(s => {
              if (s.name === yearRule.lu) mutagens.push({ name: '禄', color: 'bg-green-500', type: 'year' });
              if (s.name === yearRule.quan) mutagens.push({ name: '权', color: 'bg-red-500', type: 'year' });
              if (s.name === yearRule.ke) mutagens.push({ name: '科', color: 'bg-blue-500', type: 'year' });
              if (s.name === yearRule.ji) mutagens.push({ name: '忌', color: 'bg-pink-500', type: 'year' });
          });
      }

      palaces.push({
        index: i, name: pName, stem: STEMS[stemIdx], branch: BRANCHES[i],
        mainStars, auxStars, badStars, smallStars, mutagens, liuStars,
        isBodyPalace: i === shenIndex
      });
    }

    return {
      baziData: bazi, wxCounts, wuxing: wuxingName,
      mingZhu: ['禄存','文曲','廉贞','武曲','破军','武曲','廉贞','文曲','禄存','巨门','贪狼','巨门'][mingIndex],
      shenZhu: ['火星','天相','天梁','天同','文昌','天机','火星','天相','天梁','天同','文昌','天机'][yearZhiIndex],
      palaces, siHuaGan: STEMS[siHuaStemIndex], decadeRanges,
      currentDecadeIdx: currentDecadeInfo.index,
      viewMingIndex, gender, lunarDateStr: lunar.toString()
    };
  } catch (e) { 
    console.error(e); 
    return null;
  }
};
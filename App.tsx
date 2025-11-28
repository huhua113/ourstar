// FIX: Corrected the import for React and its hooks.
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Moon, Anchor, Map, Sun, Flame, ChevronDown, RefreshCw, Zap, Send } from 'lucide-react';
import { ChartData, ViewMode } from './types';
import { calculateChart } from './utils/ziwei';
import PalaceCard from './components/PalaceCard';
import BaziView from './components/BaziView';
import { STEMS, SI_HUA_RULES } from './utils/constants';
import StarIllustration from './components/StarIllustration';

const PRESETS = {
  huhu: { date: '1993-01-13', time: '05:42', gender: '女' },
  qianqian: { date: '1995-11-20', time: '04:50', gender: '男' }
};

const App = () => {
  const [libLoaded, setLibLoaded] = useState(false);
  const [inputDate, setInputDate] = useState('2000-01-01');
  const [inputTime, setInputTime] = useState('12:00');
  const [gender, setGender] = useState('男');
  
  const [viewMode, setViewMode] = useState<ViewMode>('native');
  const [selectedDecadeIdx, setSelectedDecadeIdx] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  // Check for LunarJS
  useEffect(() => {
    const checkLib = () => {
      if (window.Solar && window.Lunar) {
        setLibLoaded(true);
      } else {
        setTimeout(checkLib, 100);
      }
    };
    checkLib();
  }, []);

  const loadPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    setInputDate(p.date);
    setInputTime(p.time);
    setGender(p.gender);
  };

  useEffect(() => {
    if (libLoaded) {
      const data = calculateChart(inputDate, inputTime, gender, viewMode, selectedDecadeIdx, selectedYear);
      setChartData(data);
      // When chart changes, reset selected palace if it's not a view mode change
      // setSelectedPalaceIndex(null);
    }
  }, [libLoaded, inputDate, inputTime, gender, viewMode, selectedDecadeIdx, selectedYear]);

  // San Fang Si Zheng indices
  const sanFang = useMemo(() => {
    if (selectedPalaceIndex === null || !chartData) return [];
    const idx = selectedPalaceIndex;
    return [idx, (idx+6)%12, (idx+4)%12, (idx+8)%12];
  }, [selectedPalaceIndex, chartData]);

  // Flying Si Hua calculation
  const flyingSiHuaTargets = useMemo(() => {
    if (selectedPalaceIndex === null || !chartData) return [];

    const sourcePalace = chartData.palaces[selectedPalaceIndex];
    const sourceStem = sourcePalace.stem;
    const rule = SI_HUA_RULES[sourceStem];
    if (!rule) return [];

    const targets: { targetIndex: number; mutagen: { name: string; color: string; }; starName: string; }[] = [];
    const mutagensDef = [
        { name: '禄', star: rule.lu, color: 'bg-green-500' },
        { name: '权', star: rule.quan, color: 'bg-red-500' },
        { name: '科', star: rule.ke, color: 'bg-blue-500' },
        { name: '忌', star: rule.ji, color: 'bg-pink-500' },
    ];

    for (const m of mutagensDef) {
        const targetPalace = chartData.palaces.find(p => 
            [...p.mainStars, ...p.auxStars].some(s => s.name === m.star)
        );

        if (targetPalace) {
            targets.push({
                targetIndex: targetPalace.index,
                mutagen: { name: m.name, color: m.color },
                starName: m.star
            });
        }
    }
    return targets;
  }, [selectedPalaceIndex, chartData]);
  
  // Grid layout mapping: 
  // 3(巳) 4(午) 5(未) 6(申)
  // 2(辰)           7(酉)
  // 1(卯)           8(戌)
  // 0(寅) 11(丑) 10(子) 9(亥)
  const visualGrid = [3,4,5,6, 2,-1,-1,7, 1,-1,-1,8, 0,11,10,9];

  // AI Prompt Generator
  const generatePrompt = () => {
    if (selectedPalaceIndex === null || !chartData) return '';
    const p = chartData.palaces[selectedPalaceIndex];
    const tri = sanFang.map(k => chartData.palaces[k]);
    
    let context = "【先天本命】";
    let contextHua = "生年";
    if (viewMode === 'decade') {
       const d = chartData.decadeRanges.find(r => r.index === chartData.currentDecadeIdx);
       context = `【大限运势 (${d?.start}-${d?.end}岁)】`;
       contextHua = "大限";
    } else if (viewMode === 'year') {
       context = `【流年运势 (${selectedYear}年)】`;
       contextHua = "流年";
    }

    const fmtFull = (pl: typeof p) => {
        const stars = [...pl.mainStars, ...pl.auxStars, ...pl.badStars, ...pl.smallStars, ...pl.liuStars];
        const starsStr = stars.map(s => `${s.name}${s.light?`(${s.light})`:''}`).join(' ');
        const mutStr = pl.mutagens.map(m => `[${m.name}]`).join('');
        return `星曜: ${starsStr} ${mutStr}`;
    };

    let text = `请作为紫微斗数专家，分析${context}下的【${p.name}】（${p.stem}${p.branch}位）。\n`;
    text += `基本信息：${gender}命，${chartData.wuxing}。\n\n`;

    text += '【各级四化总览】\n';
    
    if (viewMode === 'native') {
        const natalGan = chartData.baziData.year.gan;
        const natalHua = SI_HUA_RULES[natalGan];
        text += `- 生年四化 (${natalGan}干): 禄-${natalHua.lu}, 权-${natalHua.quan}, 科-${natalHua.ke}, 忌-${natalHua.ji}。\n`;
    }
    
    if (viewMode === 'decade' || viewMode === 'year') {
        const decadeInfo = chartData.decadeRanges.find(r => r.index === chartData.currentDecadeIdx);
        if (decadeInfo) {
            const decadeGan = STEMS[decadeInfo.stemIdx];
            const decadeHua = SI_HUA_RULES[decadeGan];
            text += `- 大限四化 (${decadeGan}干): 禄-${decadeHua.lu}, 权-${decadeHua.quan}, 科-${decadeHua.ke}, 忌-${decadeHua.ji}。\n`;
        }
    }
    if (viewMode === 'year') {
        const yearGan = chartData.siHuaGan;
        const yearHua = SI_HUA_RULES[yearGan];
        text += `- 流年四化 (${yearGan}干): 禄-${yearHua.lu}, 权-${yearHua.quan}, 科-${yearHua.ke}, 忌-${yearHua.ji}。\n`;
    }

    if (flyingSiHuaTargets.length > 0) {
        const flyingHuaText = flyingSiHuaTargets.map(fly => {
            const targetPalace = chartData.palaces.find(p => p.index === fly.targetIndex);
            return `化${fly.mutagen.name}入[${targetPalace?.name}]的[${fly.starName}]`;
        }).join('； ');
        text += `- 宫干飞化 (${p.stem}干): 从本宫【${p.name}】飞出: ${flyingHuaText}。\n`;
    }

    text += `\n【三方四正星曜】(星曜上的[化]标记为${contextHua}四化)\n`;
    text += `- 本宫【${p.name}】: ${fmtFull(p)}\n`;
    text += `- 对宫【${tri[1].name}】: ${fmtFull(tri[1])}\n`;
    text += `- 三合【${tri[2].name}】: ${fmtFull(tri[2])}\n`;
    text += `- 三合【${tri[3].name}】: ${fmtFull(tri[3])}\n\n`;
    
    const analysisReqs = [
        '1. 结合本宫及三方四正的星曜组合（主星、吉煞、流曜等）。'
    ];

    if (viewMode === 'native') {
        analysisReqs.push('2. 综合解读【生年四化】对格局的先天影响。');
    } else if (viewMode === 'decade') {
        analysisReqs.push('2. 综合解读【大限四化】对格局的后天影响。');
    } else if (viewMode === 'year') {
        analysisReqs.push('2. 综合解读【大限四化】与【流年四化】对格局的后天影响。');
    }

    analysisReqs.push('3. 重点分析【宫干飞化】中，化禄、化权、化科、化忌飞入相应宫位所触发的具体事件和吉凶含义。');
    analysisReqs.push('4. 识别格局（如杀破狼、机月同梁等），并用温柔语气给出具体吉凶判断和建议。');

    if (viewMode === 'native' && p.name === '命宫') {
        analysisReqs.push('5. 根据以上信息判断此人MBTI。');
    }

    text += '分析要求：\n' + analysisReqs.join('\n');
    return text;
  };

  if (!libLoaded) return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-400 font-bold"><Sparkles className="animate-spin mr-2"/> 加载星盘引擎...</div>;

  return (
    <div className="min-h-screen bg-pink-50 text-slate-700 font-sans p-3 md:p-6 select-none overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-xl shadow-pink-100 border border-white mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-pink-400 to-rose-400 p-2.5 rounded-2xl shadow-lg shadow-pink-200 text-white">
                 <Moon className="w-6 h-6" />
              </div>
              <div>
                 <h1 className="text-xl font-bold text-slate-800 tracking-tight">Zi Wei Pro Max</h1>
              </div>
           </div>
           <div className="flex gap-2">
              <button onClick={()=>loadPreset('huhu')} className="px-3 py-1.5 text-xs font-bold text-pink-600 bg-white border border-pink-100 rounded-lg hover:bg-pink-50">糊糊 (女)</button>
              <button onClick={()=>loadPreset('qianqian')} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-100 rounded-lg hover:bg-blue-50">乾乾 (男)</button>
           </div>
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-inner border border-slate-100">
              <input type="date" value={inputDate} onChange={e=>setInputDate(e.target.value)} className="bg-transparent text-sm text-slate-600 outline-none font-medium w-28" />
              <input type="time" value={inputTime} onChange={e=>setInputTime(e.target.value)} className="bg-transparent text-sm text-slate-600 outline-none font-medium w-16" />
              <select value={gender} onChange={e=>setGender(e.target.value)} className="bg-transparent text-sm text-slate-600 outline-none font-medium cursor-pointer">
                 <option>男</option>
                 <option>女</option>
              </select>
           </div>
        </div>

        {/* View Switcher */}
        <div className="flex flex-col items-center gap-4 mb-6">
           <div className="bg-white p-1 rounded-full shadow-md flex gap-1 border border-pink-50">
              {(['native', 'decade', 'year', 'bazi'] as ViewMode[]).map(mode => (
                 <button 
                   key={mode} onClick={() => setViewMode(mode)}
                   className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode===mode ? 'bg-pink-400 text-white shadow-md shadow-pink-200' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {mode==='native' && <Anchor className="w-3 h-3"/>}
                   {mode==='decade' && <Map className="w-3 h-3"/>}
                   {mode==='year' && <Sun className="w-3 h-3"/>}
                   {mode==='bazi' && <Flame className="w-3 h-3"/>}
                   {mode==='native'?'先天':mode==='decade'?'大限':mode==='year'?'流年':'八字'}
                 </button>
              ))}
           </div>

           <div className="h-8">
              {viewMode === 'decade' && chartData && (
                 <div className="relative group animate-in fade-in slide-in-from-top-2">
                    <select 
                      value={selectedDecadeIdx ?? chartData.currentDecadeIdx} 
                      onChange={(e) => setSelectedDecadeIdx(Number(e.target.value))}
                      className="appearance-none pl-4 pr-8 py-1.5 bg-white border-2 border-pink-200 text-pink-500 font-bold rounded-xl text-xs outline-none cursor-pointer shadow-sm"
                    >
                       {chartData.decadeRanges.map((r) => (
                          <option key={r.index} value={r.index}>{r.start} - {r.end} 岁 ({STEMS[r.stemIdx]}干)</option>
                       ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-pink-400 absolute right-2.5 top-2.5 pointer-events-none" />
                 </div>
              )}
              {viewMode === 'year' && (
                 <div className="relative group animate-in fade-in slide-in-from-top-2">
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="appearance-none pl-4 pr-8 py-1.5 bg-white border-2 border-blue-200 text-blue-500 font-bold rounded-xl text-xs outline-none cursor-pointer shadow-sm"
                    >
                       {Array.from({length: 80}, (_, i) => new Date().getFullYear() - 60 + i).map(y => (
                          <option key={y} value={y}>{y} 年</option>
                       ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-blue-400 absolute right-2.5 top-2.5 pointer-events-none" />
                 </div>
              )}
           </div>
        </div>

        {/* Content Area */}
        {viewMode === 'bazi' && chartData ? (
           <BaziView chartData={chartData} />
        ) : (
           /* Zi Wei Chart */
           <div className="relative aspect-square max-w-[600px] mx-auto mb-8">
              <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full">
                 {visualGrid.map((idx, k) => {
                    // Center Info Box
                    if (idx === -1) {
                       if (k === 5 && chartData) {
                          return (
                            <div key={k} className="col-span-2 row-span-2 relative z-0">
                                <div className="absolute inset-0 m-1 bg-white/60 backdrop-blur-md rounded-[2rem] border-2 border-white flex flex-col items-center justify-between text-center shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] p-3">
                                
                                  {/* Top Section: Bazi + Info */}
                                  <div className="flex flex-col items-center gap-2">
                                    {/* Bazi Pillars */}
                                    <div className="flex justify-center gap-5">
                                      {(['year', 'month', 'day', 'time'] as const).map((key, i) => {
                                        const pillar = chartData.baziData[key];
                                        const label = ['年柱', '月柱', '日柱', '时柱'][i];
                                        return (
                                          <div key={key} className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
                                            <div className="text-xl font-black text-slate-800 leading-tight mt-1">
                                              <div>{pillar.gan}</div>
                                              <div>{pillar.zhi}</div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    
                                    {/* Other Info */}
                                    <div className="text-xs font-bold text-pink-500 tracking-wider">
                                      {chartData.wuxing} · 命主: {chartData.mingZhu} · 身主: {chartData.shenZhu}
                                    </div>
                                  </div>

                                  {/* Bottom Section: Si Hua */}
                                  <div className="flex items-center gap-2 bg-slate-100/70 px-3 py-1 rounded-full border border-white">
                                    <div className="text-[10px] text-slate-500 font-semibold">{viewMode==='year'?'流年四化':'当前四化'}</div>
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-pink-200">
                                      {chartData.siHuaGan}
                                    </div>
                                  </div>
                                </div>
                            </div>
                          )
                       }
                       return null;
                    }

                    const p = chartData?.palaces[idx];
                    if (!p) return <div key={k}></div>;
                    
                    const isSel = selectedPalaceIndex === idx;
                    const isTri = sanFang.includes(idx) && !isSel;
                    const isMing = p.name === '命宫'; // Based on current view Rotation
                    const flyingHua = flyingSiHuaTargets.find(t => t.targetIndex === idx);

                    return (
                       <PalaceCard 
                         key={idx}
                         palace={p}
                         isSelected={isSel}
                         isTri={isTri}
                         isMing={isMing}
                         onClick={() => setSelectedPalaceIndex(idx)}
                         flyingHua={flyingHua?.mutagen}
                       />
                    )
                 })}
              </div>
           </div>
        )}

        {/* Bottom Details */}
        {viewMode !== 'bazi' && chartData && selectedPalaceIndex !== null && (
           <div className="grid md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-6 duration-500 pb-8">
              <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-100 border border-slate-50">
                 <h3 className="text-pink-500 font-bold mb-3 flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4" /> 三方四正详情
                 </h3>
                 <div className="space-y-2">
                    {sanFang.map((idx, i) => {
                       const p = chartData.palaces[idx];
                       return (
                          <div key={idx} className={`p-2.5 rounded-2xl flex flex-col gap-1 ${i===0 ? 'bg-pink-50/50 border border-pink-100' : 'bg-slate-50/50 border border-slate-100'}`}>
                             <div className="flex items-center gap-2">
                                 <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${i===0?'bg-pink-200 text-pink-700':'bg-slate-200 text-slate-500'}`}>{i===0?'本宫':i===1?'对宫':'三合'}</span>
                                 <span className="text-xs font-bold text-slate-700">{p.name}</span>
                             </div>
                             <div className="flex flex-wrap gap-1.5 text-[10px] items-center">
                                {p.mainStars.map(s=><span key={s.name} className="font-bold text-purple-600">{s.name}{s.light&&<span className="text-[8px] text-slate-400 font-normal">({s.light})</span>}</span>)}
                                {p.auxStars.map(s=><span key={s.name} className="text-blue-500">{s.name}</span>)}
                                {p.badStars.map(s=><span key={s.name} className="text-rose-400">{s.name}</span>)}
                                {p.smallStars.map(s=><span key={s.name} className="text-slate-400 scale-90">{s.name}</span>)}
                                {p.liuStars.map(s=><span key={s.name} className="text-indigo-500 font-bold">{s.name}</span>)}
                                {p.mutagens.map(m=><span key={m.name} className={`px-1 rounded text-white ${m.color}`}>化{m.name}</span>)}
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 shadow-xl shadow-blue-50 border border-white flex flex-col relative overflow-hidden">
                 <h3 className="text-blue-500 font-bold mb-3 flex items-center gap-2 text-sm z-10">
                    <Sparkles className="w-4 h-4" /> AI 命理解析提示词
                 </h3>
                 <div className="flex-1 bg-white/60 border border-blue-100 rounded-2xl p-1 z-10 flex flex-col">
                    <textarea 
                      value={generatePrompt()}
                      readOnly
                      className="flex-1 bg-transparent p-3 text-[10px] text-slate-500 font-mono resize-none outline-none mb-2 min-h-[100px]"
                    />
                    <button 
                      onClick={() => navigator.clipboard.writeText(generatePrompt())}
                      className="mx-3 mb-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3 h-3" /> 复制提示词
                    </button>
                 </div>
              </div>
           </div>
        )}
        
        <StarIllustration />
      </div>
    </div>
  );
};

export default App;
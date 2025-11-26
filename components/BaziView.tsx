import React from 'react';
import { ChartData } from '../types';
import { Flame } from 'lucide-react';
import { WUXING_CONFIG } from '../utils/constants';

interface BaziViewProps {
  chartData: ChartData;
}

const BaziView: React.FC<BaziViewProps> = ({ chartData }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-xl shadow-pink-50 animate-in fade-in zoom-in-95 duration-300">
       <h2 className="text-center text-xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
           <Flame className="w-5 h-5 text-red-500"/> 八字五行分析
       </h2>
       
       <div className="grid grid-cols-4 gap-3 mb-8">
           {['年柱','月柱','日柱','时柱'].map((label, i) => {
               const key = ['year','month','day','time'][i] as keyof typeof chartData.baziData;
               const col = chartData.baziData[key];
               return (
                   <div key={i} className="flex flex-col items-center">
                       <span className="text-xs text-slate-400 mb-2">{label}</span>
                       <div className="bg-slate-50 w-full rounded-2xl p-4 flex flex-col items-center gap-2 border border-slate-100 shadow-inner">
                           <span className="text-xl font-black text-slate-700">{col.gan}</span>
                           <span className="text-xl font-black text-slate-700">{col.zhi}</span>
                       </div>
                   </div>
               )
           })}
       </div>

       <div className="space-y-4">
           <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">五行能量分布</h3>
           {Object.keys(WUXING_CONFIG).map(wx => {
               const count = chartData.wxCounts[wx];
               const percent = Math.min((count / 8) * 100, 100);
               return (
                   <div key={wx} className="flex items-center gap-4 group">
                       <div className={`w-20 flex items-center gap-2 text-xs font-bold ${WUXING_CONFIG[wx].color}`}>
                           {WUXING_CONFIG[wx].icon} {WUXING_CONFIG[wx].label}
                       </div>
                       <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full ${WUXING_CONFIG[wx].bar} transition-all duration-1000 group-hover:opacity-80`} style={{width: `${percent}%`}}></div>
                       </div>
                       <span className="text-xs font-bold text-slate-400 w-4 text-right">{count}</span>
                   </div>
               )
           })}
       </div>
    </div>
  );
};

export default BaziView;
import React from 'react';
import { Mutagen, PalaceData } from '../types';
import { PALACE_ICONS } from '../utils/constants';

interface PalaceCardProps {
  palace: PalaceData;
  isSelected: boolean;
  isTri: boolean; // San Fang
  isMing: boolean;
  onClick: () => void;
  flyingHua?: Mutagen;
}

const PalaceCard: React.FC<PalaceCardProps> = ({ palace, isSelected, isTri, isMing, onClick, flyingHua }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative p-1.5 flex flex-col cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border-[1.5px] select-none
        ${isSelected ? 'bg-white border-pink-400 scale-[1.05] z-20 shadow-xl' : 
          isTri ? 'bg-pink-50/60 border-pink-200' : 
          'bg-white/50 border-white hover:bg-white hover:border-pink-100'}
        ${isMing ? 'ring-2 ring-yellow-300 ring-offset-1 z-10' : ''}
      `}
    >
       {/* Flying Hua Indicator */}
       {flyingHua && (
         <div className={`absolute top-1 left-1 z-20 w-4 h-4 rounded-full ${flyingHua.color} flex items-center justify-center text-white text-[9px] font-bold shadow-md animate-in zoom-in-50`}>
           {flyingHua.name}
         </div>
       )}

       <div className="absolute right-0 bottom-0 w-10 h-10 transform translate-x-2 translate-y-2 rotate-[-15deg] pointer-events-none opacity-80">
          {PALACE_ICONS[palace.name]}
       </div>

       <div className="flex justify-between items-start mb-1 relative z-10">
          <div className="flex flex-col items-center bg-slate-100/80 px-1 rounded-md">
             <span className="text-[9px] text-slate-400 font-bold scale-90">{palace.stem}</span>
             <span className="text-[10px] text-slate-600 font-black">{palace.branch}</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isMing ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600' : 'bg-slate-100/80 text-slate-500'}`}>
             {palace.name}
          </span>
       </div>

       <div className="flex-1 flex flex-col gap-0 relative z-10 pl-0.5">
          <div className="flex flex-wrap gap-x-1 gap-y-0 leading-none mb-0.5 min-h-[14px]">
             {palace.mainStars.map((s, i) => (
                <span key={i} className={`text-[11px] font-black flex items-baseline ${['紫微','天府','太阳','太阴'].includes(s.name) ? 'text-amber-500' : 'text-purple-600'}`}>
                   {s.name}<span className={`text-[8px] font-normal scale-75 ml-[-1px] ${s.light==='庙'||s.light==='旺'?'text-red-500 font-bold':'text-slate-400'}`}>{s.light}</span>
                </span>
             ))}
          </div>
          <div className="flex flex-wrap gap-x-1 leading-none mb-0.5">
             {palace.auxStars.map((s,i)=><span key={i} className="text-[9px] text-blue-500 font-bold scale-[0.95] origin-left">{s.name}</span>)}
             {palace.badStars.map((s,i)=><span key={i} className="text-[9px] text-rose-400 font-bold scale-[0.95] origin-left">{s.name}</span>)}
          </div>
          <div className="flex flex-wrap gap-x-1 leading-none opacity-60">
             {palace.smallStars.map((s,i)=><span key={i} className="text-[8px] text-slate-500 scale-90 origin-left">{s.name}</span>)}
             {palace.liuStars.map((s,i)=><span key={i} className="text-[8px] text-indigo-500 scale-90 origin-left font-bold">{s.name}</span>)}
          </div>
       </div>

       <div className="flex justify-end gap-0.5 mt-auto relative z-10 pt-1">
          {palace.mutagens.map((m,i)=>{
            let shapeClass = 'rounded-sm'; // Natal (生年)
            if (m.type === 'decade') shapeClass = 'rounded-full'; // Decade (大限)
            if (m.type === 'year') shapeClass = 'transform rotate-45 rounded-sm'; // Year (流年)

            const content = m.type === 'year' 
                ? <span className="transform -rotate-45 block leading-none">{m.name}</span> 
                : m.name;
            
            return (
              <span key={i} className={`${m.color} text-white text-[8px] w-3 h-3 flex items-center justify-center font-bold shadow-sm ${shapeClass}`}>
                {content}
              </span>
            )
          })}
       </div>
    </div>
  );
};

export default PalaceCard;
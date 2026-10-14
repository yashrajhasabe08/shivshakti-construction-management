import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export default function ModuleHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  fullDescription, 
  badge, 
  actions,
  children
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
              {badge && (
                <span className="badge badge-info">{badge}</span>
              )}
              {/* Interactive Tooltip Button */}
              {fullDescription && (
                <div className="relative inline-block">
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(prev => !prev)}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
                    title="Module Info & Guide"
                    aria-label="Module Description"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  {showTooltip && (
                    <div 
                      className="absolute left-0 sm:left-auto sm:right-auto z-40 w-72 sm:w-80 mt-1 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 leading-relaxed font-normal"
                      style={{ top: '100%' }}
                    >
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-100 mb-1">{title}</p>
                          <p className="text-slate-300 text-[11px]">{fullDescription}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* One line description as requested in Feature 3 */}
            <p className="text-xs text-slate-500 mt-0.5 leading-normal">
              {subtitle}
            </p>
          </div>
        </div>

        {actions && (
          <div className="flex items-center space-x-2.5">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

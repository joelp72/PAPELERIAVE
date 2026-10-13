import React from 'react';
import { ArrowLeftRight, Clock, RefreshCw, Calculator, TrendingUp } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatBs, formatDate } from '../utils/formatters';

interface RateBarProps {
  onOpenRateModal: () => void;
  onOpenConverterModal: () => void;
}

export const RateBar: React.FC<RateBarProps> = ({ onOpenRateModal, onOpenConverterModal }) => {
  const { exchangeRate } = useInventory();

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Current Exchange Rate Information */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Tasa del Día:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-white tracking-wide tabular-nums">
              1 USD = {formatBs(exchangeRate.rate).replace('Bs. ', '')} Bs.
            </span>
            <span className="text-slate-400 hidden sm:inline">
              ({exchangeRate.source})
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Actualizado: {formatDate(exchangeRate.lastUpdated)}</span>
          </div>
        </div>

        {/* Right: Quick actions for rates */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRateModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer border border-slate-700"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Modificar Tasa</span>
          </button>

          <button
            onClick={onOpenConverterModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors cursor-pointer"
          >
            <Calculator className="w-3 h-3" />
            <span>Calculadora de Vueltos & Conversión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

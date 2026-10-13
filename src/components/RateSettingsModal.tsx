import React, { useState } from 'react';
import { X, TrendingUp, Check, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatBs, formatDate } from '../utils/formatters';

interface RateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RateSettingsModal: React.FC<RateSettingsModalProps> = ({ isOpen, onClose }) => {
  const { exchangeRate, setExchangeRate, products } = useInventory();
  const [rateInput, setRateInput] = useState<string>(exchangeRate.rate.toString());
  const [sourceInput, setSourceInput] = useState<string>(exchangeRate.source);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rateInput);
    if (!parsed || parsed <= 0) return;

    setExchangeRate(parsed, sourceInput);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  const handlePreset = (rateVal: number, sourceName: string) => {
    setRateInput(rateVal.toString());
    setSourceInput(sourceName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 text-base">
              Actualizar Tasa del Día (Bs. / USD)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Valor de 1 Dólar en Bolívares (VES / Bs.)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-sm font-bold pointer-events-none">
                Bs.
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                placeholder="Ej. 82.50"
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
              <span>Actual: {formatBs(exchangeRate.rate)}</span>
              <span>Última vez: {formatDate(exchangeRate.lastUpdated)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fuente o Referencia
            </label>
            <input
              type="text"
              value={sourceInput}
              onChange={e => setSourceInput(e.target.value)}
              placeholder="Ej. Tasa Oficial (BCV), Paralelo, etc."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="block text-xs text-slate-500 mb-2">Sugerencias rápidas:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreset(82.50, 'Tasa Oficial (BCV)')}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-slate-800">82.50 Bs.</div>
                <div className="text-[10px] text-slate-500">Tasa Oficial (BCV)</div>
              </button>
              <button
                type="button"
                onClick={() => handlePreset(85.00, 'Tasa Monitor')}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-slate-800">85.00 Bs.</div>
                <div className="text-[10px] text-slate-500">Tasa Monitor</div>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Al guardar, se recalcularán automáticamente los precios en Bolívares de los{' '}
              <span className="font-bold">{products.length} productos</span> de tu inventario según la nueva tasa.
            </p>
          </div>

          {isSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>¡Tasa actualizada con éxito! Catálogo sincronizado.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Guardar y Aplicar Tasa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

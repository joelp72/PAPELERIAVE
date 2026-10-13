import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Calculator, Coins, DollarSign, Wallet } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatBs, formatUsd, convertUsdToBs, convertBsToUsd } from '../utils/formatters';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { exchangeRate } = useInventory();
  const [activeTab, setActiveTab] = useState<'converter' | 'changeCalculator'>('converter');

  // Converter state
  const [usdInput, setUsdInput] = useState<string>('1');
  const [bsInput, setBsInput] = useState<string>('');

  // Change calculator state
  const [saleTotalUsd, setSaleTotalUsd] = useState<string>('5.50');
  const [paidUsd, setPaidUsd] = useState<string>('10');
  const [paidBs, setPaidBs] = useState<string>('0');

  useEffect(() => {
    if (exchangeRate.rate > 0) {
      const val = parseFloat(usdInput) || 0;
      setBsInput((val * exchangeRate.rate).toFixed(2));
    }
  }, [exchangeRate.rate]);

  if (!isOpen) return null;

  const handleUsdChange = (val: string) => {
    setUsdInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && exchangeRate.rate > 0) {
      setBsInput((num * exchangeRate.rate).toFixed(2));
    } else {
      setBsInput('');
    }
  };

  const handleBsChange = (val: string) => {
    setBsInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && exchangeRate.rate > 0) {
      setUsdInput((num / exchangeRate.rate).toFixed(2));
    } else {
      setUsdInput('');
    }
  };

  // Change calculation
  const totalCostInUsd = parseFloat(saleTotalUsd) || 0;
  const totalCostInBs = convertUsdToBs(totalCostInUsd, exchangeRate.rate);

  const customerPaidUsd = parseFloat(paidUsd) || 0;
  const customerPaidBs = parseFloat(paidBs) || 0;

  // Convert all payments to equivalent USD
  const totalPaidInUsd = customerPaidUsd + convertBsToUsd(customerPaidBs, exchangeRate.rate);
  const diffUsd = totalPaidInUsd - totalCostInUsd;
  const diffBs = convertUsdToBs(diffUsd, exchangeRate.rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              Convertidor de Moneda & Calculadora
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'converter'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Convertidor Rápido (USD ↔ Bs.)
            </button>
            <button
              onClick={() => setActiveTab('changeCalculator')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'changeCalculator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calculadora de Vuelto / Cambio
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Rate indicator */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between text-xs text-blue-900">
            <span className="font-medium">Tasa aplicada:</span>
            <span className="font-mono font-bold tabular-nums">
              1 USD = {formatBs(exchangeRate.rate).replace('Bs. ', '')} Bs.
            </span>
          </div>

          {activeTab === 'converter' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monto en Dólares ($ USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={usdInput}
                    onChange={e => handleUsdChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-center -my-2">
                <div className="p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monto en Bolívares (Bs. Digital)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs font-bold">
                    Bs.
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={bsInput}
                    onChange={e => handleBsChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quick preset chips for rapid counter service */}
              <div className="pt-2">
                <span className="block text-xs text-slate-500 mb-2">Billetes / Montos rápidos:</span>
                <div className="flex flex-wrap gap-2">
                  {[1, 5, 10, 20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleUsdChange(amt.toString())}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-medium rounded-md transition-colors cursor-pointer"
                    >
                      ${amt} ({formatBs(amt * exchangeRate.rate).replace('Bs. ', '')} Bs.)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changeCalculator' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total a Cobrar ($ USD)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={saleTotalUsd}
                    onChange={e => setSaleTotalUsd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Equiv: {formatBs(totalCostInBs)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cliente entrega en USD ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={paidUsd}
                    onChange={e => setPaidUsd(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente entrega en Bolívares (Pago Móvil / Efectivo)
                </label>
                <input
                  type="number"
                  step="any"
                  value={paidBs}
                  onChange={e => setPaidBs(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Result card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Total recibido:</span>
                  <span className="font-mono font-medium">
                    {formatUsd(totalPaidInUsd)} / {formatBs(convertUsdToBs(totalPaidInUsd, exchangeRate.rate))}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {diffUsd >= 0 ? 'Vuelto a devolver:' : 'Falta por pagar:'}
                  </span>
                  <div className="text-right">
                    <div className={`text-base font-bold font-mono tabular-nums ${diffUsd >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatUsd(Math.abs(diffUsd))}
                    </div>
                    <div className={`text-xs font-mono font-semibold tabular-nums ${diffUsd >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatBs(Math.abs(diffBs))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

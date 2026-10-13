import React from 'react';
import { ShoppingCart, Calculator, ArrowLeftRight, Settings } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatBs } from '../utils/formatters';

interface HeaderProps {
  currentTab: 'inventory' | 'pos' | 'stockin' | 'sales' | 'movements';
  setCurrentTab: (tab: 'inventory' | 'pos' | 'stockin' | 'sales' | 'movements') => void;
  openConverterModal: () => void;
  openRateModal: () => void;
  openSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  openConverterModal,
  openRateModal,
  openSettingsModal,
}) => {
  const { exchangeRate, storeInfo } = useInventory();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentTab('inventory')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <div className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                PapeleraVE
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-[280px]">
                {storeInfo.name}
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single-line, clean hover underline) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setCurrentTab('inventory')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                currentTab === 'inventory'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Inventario & Productos
            </button>
            <button
              onClick={() => setCurrentTab('pos')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'pos'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              Punto de Venta (Salida)
            </button>
            <button
              onClick={() => setCurrentTab('stockin')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                currentTab === 'stockin'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Entrada de Mercancía
            </button>
            <button
              onClick={() => setCurrentTab('sales')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                currentTab === 'sales'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Registro de Ventas
            </button>
            <button
              onClick={() => setCurrentTab('movements')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                currentTab === 'movements'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Historial / Kardex
            </button>
          </nav>

          {/* Zone 3: Exchange rate display & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Exchange Rate button */}
            <button
              onClick={openRateModal}
              title="Haz clic para actualizar la tasa de cambio del día"
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <span className="text-slate-500 font-medium">Tasa Hoy:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                1$ = {formatBs(exchangeRate.rate).replace('Bs. ', '')} Bs.
              </span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Converter tool */}
            <button
              onClick={openConverterModal}
              title="Calculadora y conversor de divisas / vuelto"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir calculadora y convertidor"
            >
              <Calculator className="w-4 h-4" />
            </button>

            {/* Store settings */}
            <button
              onClick={openSettingsModal}
              title="Configuración de la papelería y respaldo"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setCurrentTab('pos')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              Nueva Venta
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-100 py-2 overflow-x-auto text-xs font-medium text-slate-600 gap-2">
          <button
            onClick={() => setCurrentTab('inventory')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-md ${
              currentTab === 'inventory' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            Inventario
          </button>
          <button
            onClick={() => setCurrentTab('pos')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-md ${
              currentTab === 'pos' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            Punto de Venta
          </button>
          <button
            onClick={() => setCurrentTab('stockin')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-md ${
              currentTab === 'stockin' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setCurrentTab('sales')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-md ${
              currentTab === 'sales' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            Ventas
          </button>
          <button
            onClick={() => setCurrentTab('movements')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-md ${
              currentTab === 'movements' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            Historial
          </button>
        </div>
      </div>
    </header>
  );
};

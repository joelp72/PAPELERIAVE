import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { RateBar } from './components/RateBar';
import { InventoryView } from './components/InventoryView';
import { POSView } from './components/POSView';
import { StockInView } from './components/StockInView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { MovementsView } from './components/MovementsView';
import { CurrencyConverterModal } from './components/CurrencyConverterModal';
import { RateSettingsModal } from './components/RateSettingsModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<
    'inventory' | 'pos' | 'stockin' | 'sales' | 'movements'
  >('inventory');

  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { storeInfo, exchangeRate } = useInventory();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openConverterModal={() => setIsConverterOpen(true)}
        openRateModal={() => setIsRateModalOpen(true)}
        openSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* Exchange Rate Status & Converter Action Strip */}
      <RateBar
        onOpenRateModal={() => setIsRateModalOpen(true)}
        onOpenConverterModal={() => setIsConverterOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {currentTab === 'inventory' && <InventoryView />}
        {currentTab === 'pos' && <POSView />}
        {currentTab === 'stockin' && <StockInView />}
        {currentTab === 'sales' && <SalesHistoryView />}
        {currentTab === 'movements' && <MovementsView />}
      </main>

      {/* Clean, quiet Footer without clutter */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{storeInfo.name}</span>
            <span>·</span>
            <span>RIF: {storeInfo.rif}</span>
            <span>·</span>
            <span className="font-mono text-slate-600">Tasa: {exchangeRate.rate.toFixed(2)} Bs./USD</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setIsConverterOpen(true)}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Calculadora de Vueltos
            </button>
            <span>·</span>
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Ajustar Tasa
            </button>
            <span>·</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Copia de Respaldo
            </button>
          </div>
        </div>
      </footer>

      {/* Global Interactive Modals */}
      <CurrencyConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
      />

      <RateSettingsModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
      />

      <StoreSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}

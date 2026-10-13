import React, { useState } from 'react';
import { X, ArrowDownRight, PackagePlus, Check, AlertCircle, Percent } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  formatBs,
  formatUsd,
  convertUsdToBs,
  convertBsToUsd,
  calculateMargin,
} from '../utils/formatters';
import { ProductSearchAutocomplete } from './ProductSearchAutocomplete';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  preselectedProductId,
}) => {
  const { products, recordStockIn, exchangeRate } = useInventory();

  const [selectedId, setSelectedId] = useState<string>(
    preselectedProductId || (products[0] ? products[0].id : '')
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [costUsd, setCostUsd] = useState<string>('0.00');
  const [costBs, setCostBs] = useState<string>('0.00');
  const [marginInput, setMarginInput] = useState<string>('50');
  const [updateCatalogPrice, setUpdateCatalogPrice] = useState<boolean>(true);
  const [invoiceRef, setInvoiceRef] = useState<string>('');
  const [isDone, setIsDone] = useState<boolean>(false);

  const selectedProduct = products.find(p => p.id === selectedId);

  // When selected product changes, prefill its current cost and margin
  React.useEffect(() => {
    if (selectedProduct) {
      setCostUsd(selectedProduct.costUsd.toFixed(2));
      setCostBs(convertUsdToBs(selectedProduct.costUsd, exchangeRate.rate).toFixed(2));
      const prodMargin =
        selectedProduct.desiredMargin !== undefined
          ? selectedProduct.desiredMargin
          : calculateMargin(selectedProduct.costUsd, selectedProduct.priceUsd);
      setMarginInput(prodMargin.toString());
    }
  }, [selectedId, selectedProduct, exchangeRate.rate]);

  if (!isOpen) return null;

  const handleCostUsdChange = (val: string) => {
    setCostUsd(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && exchangeRate.rate > 0) {
      setCostBs(convertUsdToBs(parsed, exchangeRate.rate).toFixed(2));
    }
  };

  const handleCostBsChange = (val: string) => {
    setCostBs(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && exchangeRate.rate > 0) {
      setCostUsd(convertBsToUsd(parsed, exchangeRate.rate).toFixed(2));
    }
  };

  const parsedCost = parseFloat(costUsd) || (selectedProduct?.costUsd ?? 0);
  const parsedMargin = parseFloat(marginInput) || 0;
  const newCalculatedPriceUsd = Math.round(parsedCost * (1 + parsedMargin / 100) * 100) / 100;
  const newCalculatedPriceBs = convertUsdToBs(newCalculatedPriceUsd, exchangeRate.rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;

    const parsedCostUsd = parseFloat(costUsd) || selectedProduct.costUsd;
    const reasonText = invoiceRef.trim()
      ? `Reabastecimiento (${invoiceRef.trim()})`
      : 'Entrada de mercancía / Reabastecimiento';

    recordStockIn(
      selectedProduct.id,
      quantity,
      parsedCostUsd,
      reasonText,
      updateCatalogPrice ? newCalculatedPriceUsd : undefined,
      updateCatalogPrice ? parsedMargin : undefined
    );
    setIsDone(true);

    setTimeout(() => {
      setIsDone(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              Registrar Entrada de Mercancía / Reabastecer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <ProductSearchAutocomplete
            products={products}
            selectedProductId={selectedId}
            onSelectProduct={p => setSelectedId(p.id)}
            label="Buscar o seleccionar producto de papelería (autocompletado)"
          />

          {selectedProduct && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Stock Actual:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{selectedProduct.stock} uds.</span>
              </div>
              <div>
                <span className="text-slate-500">Nuevo Stock Estimado:</span>{' '}
                <span className="font-mono font-bold text-emerald-600">
                  {selectedProduct.stock + (Number(quantity) || 0)} uds.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cantidad que Ingresa *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proveedor / Factura N° (Opcional)
              </label>
              <input
                type="text"
                value={invoiceRef}
                onChange={e => setInvoiceRef(e.target.value)}
                placeholder="Ej. Distribuidora El Sol #1024"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Cost updates */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
            <span className="block text-xs font-bold text-slate-700">
              Costo Unitario de Adquisición (Opcional si varió)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Costo en USD ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-mono text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costUsd}
                    onChange={e => handleCostUsdChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Costo en Bolívares (Bs.)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-mono text-[10px] font-bold">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costBs}
                    onChange={e => handleCostBsChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profit margin and new price preview */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Margen de Ganancia (%)</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={updateCatalogPrice}
                  onChange={e => setUpdateCatalogPrice(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-medium text-emerald-900">
                  Actualizar precio en catálogo
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-28">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={marginInput}
                  onChange={e => setMarginInput(e.target.value)}
                  className="w-full pl-2.5 pr-6 py-1 bg-white border border-emerald-300 rounded text-xs font-mono font-bold text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs pointer-events-none">
                  %
                </span>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {[30, 40, 50, 60, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setMarginInput(pct.toString())}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                      parseFloat(marginInput) === pct
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-emerald-100/50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-600 pt-1 border-t border-emerald-100 flex items-center justify-between">
              <span>Precio venta resultante:</span>
              <strong className="font-mono text-slate-900">
                {formatUsd(newCalculatedPriceUsd)} ({formatBs(newCalculatedPriceBs)})
              </strong>
            </div>
          </div>

          {isDone && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>¡Entrada registrada con éxito! Stock actualizado en el inventario.</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              Confirmar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

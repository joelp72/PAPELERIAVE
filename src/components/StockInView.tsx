import React, { useState } from 'react';
import {
  PackagePlus,
  Plus,
  ArrowDownRight,
  Truck,
  CheckCircle,
  FileText,
  Search,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import {
  formatBs,
  formatUsd,
  convertUsdToBs,
  convertBsToUsd,
  calculateMargin,
  formatDate,
} from '../utils/formatters';
import { ProductFormModal } from './ProductFormModal';
import { ProductSearchAutocomplete } from './ProductSearchAutocomplete';

export const StockInView: React.FC = () => {
  const { products, recordStockIn, movements, exchangeRate } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [costUsd, setCostUsd] = useState<string>('1.00');
  const [costBs, setCostBs] = useState<string>('');
  const [marginInput, setMarginInput] = useState<string>('50');
  const [updateCatalogPrice, setUpdateCatalogPrice] = useState<boolean>(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Sync cost and margin when product changes
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
  }, [selectedProductId, selectedProduct, exchangeRate.rate]);

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

  // Profit margin calculations
  const parsedCostUsd = parseFloat(costUsd) || (selectedProduct?.costUsd ?? 0);
  const parsedMargin = parseFloat(marginInput) || 0;
  const newCalculatedPriceUsd = Math.round(parsedCostUsd * (1 + parsedMargin / 100) * 100) / 100;
  const newCalculatedPriceBs = convertUsdToBs(newCalculatedPriceUsd, exchangeRate.rate);
  const unitProfitUsd = Math.max(0, newCalculatedPriceUsd - parsedCostUsd);
  const unitProfitBs = convertUsdToBs(unitProfitUsd, exchangeRate.rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;

    const parts = [];
    if (supplierName.trim()) parts.push(`Proveedor: ${supplierName.trim()}`);
    if (invoiceNumber.trim()) parts.push(`Factura #${invoiceNumber.trim()}`);
    if (notes.trim()) parts.push(notes.trim());

    const reason = parts.length > 0 ? parts.join(' - ') : 'Reabastecimiento de papelería';

    recordStockIn(
      selectedProduct.id,
      quantity,
      parsedCostUsd,
      reason,
      updateCatalogPrice ? newCalculatedPriceUsd : undefined,
      updateCatalogPrice ? parsedMargin : undefined
    );

    setIsSuccess(true);
    setQuantity(10);
    setInvoiceNumber('');
    setSupplierName('');
    setNotes('');

    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  // Recent entries filter
  const recentEntries = movements
    .filter(m => m.type === 'IN')
    .slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-600" />
            Recepción de Mercancía / Ingreso de Productos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registra compras a proveedores mayoristas, facturas y reabastecimiento de stock de papelería.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewProductModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Producto Nuevo no Existente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Entry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-600" />
              <span>Formulario de Entrada de Stock</span>
            </h2>
            <span className="text-xs text-slate-500">
              Tasa: <strong className="font-mono text-slate-800">{formatBs(exchangeRate.rate)}</strong>
            </span>
          </div>

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ¡Entrada registrada con éxito! El inventario ha sido actualizado.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Searchable Autocomplete for Product Selection */}
            <ProductSearchAutocomplete
              products={products}
              selectedProductId={selectedProductId}
              onSelectProduct={product => setSelectedProductId(product.id)}
              label="Selecciona o busca el producto que ingresa (autocompletado)"
            />

            {selectedProduct && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Stock Actual:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">{selectedProduct.stock} uds.</span>
                </div>
                <div>
                  <span className="text-slate-500">Nuevo Stock Resultante:</span>{' '}
                  <span className="font-mono font-bold text-emerald-600">
                    {selectedProduct.stock + (Number(quantity) || 0)} uds.
                  </span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad de Unidades Entrantes *
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
                  Proveedor Mayorista (Opcional)
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="Ej. Distribuidora Papelera Caracas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Invoice & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  N° de Factura o Nota de Entrega
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="Ej. FACT-0932"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Lote
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej. Bulto de 50 cuadernos"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bi-currency cost breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="block text-xs font-bold text-slate-800">
                Costo Unitario de Adquisición (Actualización Automática)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Costo en USD ($)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costUsd}
                      onChange={e => handleCostUsdChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Costo en Bolívares (Bs.)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs font-bold">
                      Bs.
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costBs}
                      onChange={e => handleCostBsChange(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-600 border-t border-slate-200">
                <span>Inversión total de la entrada:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatUsd((parseFloat(costUsd) || 0) * (Number(quantity) || 0))} (
                  {formatBs(convertUsdToBs((parseFloat(costUsd) || 0) * (Number(quantity) || 0), exchangeRate.rate))})
                </span>
              </div>
            </div>

            {/* Profit Margin & Auto Price Update Section */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span>Margen de Ganancia del Producto (%)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={updateCatalogPrice}
                    onChange={e => setUpdateCatalogPrice(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-semibold text-emerald-900">
                    Actualizar precio de venta en catálogo
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-32">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={marginInput}
                    onChange={e => setMarginInput(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-mono font-bold text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs pointer-events-none">
                    %
                  </span>
                </div>

                {/* Preset buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[20, 30, 40, 50, 60, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMarginInput(pct.toString())}
                      className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                        parseFloat(marginInput) === pct
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-emerald-100/60 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Resulting price preview */}
              <div className="p-2.5 bg-white rounded-lg border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Nuevo Precio de Venta:</span>{' '}
                  <strong className="font-mono text-slate-900">
                    {formatUsd(newCalculatedPriceUsd)}
                  </strong>{' '}
                  <span className="font-mono text-blue-600 font-semibold">
                    ({formatBs(newCalculatedPriceBs)})
                  </span>
                </div>

                <div className="text-emerald-700 font-semibold">
                  Ganancia por unidad: +{formatUsd(unitProfitUsd)} ({formatBs(unitProfitBs)})
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Confirmar e Ingresar al Inventario</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Recent Inbound Records (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Últimas Entradas Registradas</span>
            </h2>
            <span className="text-[11px] text-slate-500">{recentEntries.length} recientes</span>
          </div>

          <div className="space-y-3">
            {recentEntries.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay entradas registradas recientemente.
              </div>
            ) : (
              recentEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                      {entry.productName}
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-xs tabular-nums">
                      +{entry.quantity} uds.
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[180px]">{entry.reason}</span>
                    <span className="font-mono">
                      Stock: {entry.previousStock} → {entry.newStock}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 text-right">
                    {formatDate(entry.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Product Modal if user wants to add an entirely new item */}
      <ProductFormModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
      />
    </div>
  );
};

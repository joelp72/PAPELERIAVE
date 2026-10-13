import React, { useState, useEffect } from 'react';
import { X, Plus, Save, DollarSign, Tag, Archive, AlertTriangle, Percent } from 'lucide-react';
import { Product, CurrencyType } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';
import { formatBs, formatUsd, convertUsdToBs, convertBsToUsd, calculateMargin } from '../utils/formatters';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, exchangeRate, products } = useInventory();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[1] || 'Escolar');
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [costUsd, setCostUsd] = useState<string>('0.00');
  const [costBs, setCostBs] = useState<string>('0.00');
  const [priceUsd, setPriceUsd] = useState<string>('0.00');
  const [priceBs, setPriceBs] = useState<string>('0.00');
  const [marginInput, setMarginInput] = useState<string>('50');
  const [baseCurrency, setBaseCurrency] = useState<CurrencyType>('USD');
  const [location, setLocation] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');

  // Initialize or reset form
  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setStock(productToEdit.stock);
      setMinStock(productToEdit.minStock);
      setCostUsd(productToEdit.costUsd.toFixed(2));
      setCostBs(productToEdit.costBs.toFixed(2));
      setPriceUsd(productToEdit.priceUsd.toFixed(2));
      setPriceBs(productToEdit.priceBs.toFixed(2));
      const calcInitialMargin =
        productToEdit.desiredMargin !== undefined
          ? productToEdit.desiredMargin
          : calculateMargin(productToEdit.costUsd, productToEdit.priceUsd);
      setMarginInput(calcInitialMargin.toString());
      setBaseCurrency(productToEdit.baseCurrency || 'USD');
      setLocation(productToEdit.location || '');
      setBarcode(productToEdit.barcode || '');
      setDescription(productToEdit.description || '');
    } else {
      // Auto-generate next suggested SKU (PAP-0XX)
      const nextNum = products.length + 1;
      setSku(`PAP-${nextNum.toString().padStart(3, '0')}`);
      setName('');
      setCategory(DEFAULT_CATEGORIES[1] || 'Escolar');
      setStock(10);
      setMinStock(5);
      const initialCost = 1.0;
      const initialMargin = 50; // 50% margin
      const initialPrice = initialCost * (1 + initialMargin / 100);
      setCostUsd(initialCost.toFixed(2));
      setCostBs(convertUsdToBs(initialCost, exchangeRate.rate).toFixed(2));
      setMarginInput(initialMargin.toString());
      setPriceUsd(initialPrice.toFixed(2));
      setPriceBs(convertUsdToBs(initialPrice, exchangeRate.rate).toFixed(2));
      setBaseCurrency('USD');
      setLocation('');
      setBarcode('');
      setDescription('');
    }
  }, [productToEdit, isOpen, exchangeRate.rate]);

  if (!isOpen) return null;

  // Handlers for setting margin % directly: automatically calculates sale prices
  const handleMarginChange = (val: string) => {
    setMarginInput(val);
    const parsedMargin = parseFloat(val);
    const currentCost = parseFloat(costUsd) || 0;
    if (!isNaN(parsedMargin) && currentCost > 0) {
      const calculatedPrice = Math.round(currentCost * (1 + parsedMargin / 100) * 100) / 100;
      setPriceUsd(calculatedPrice.toFixed(2));
      setPriceBs(convertUsdToBs(calculatedPrice, exchangeRate.rate).toFixed(2));
    }
  };

  // Handlers for automatic dual-currency price calculation & bidirectional margin update
  const handlePriceUsdChange = (val: string) => {
    setPriceUsd(val);
    const parsed = parseFloat(val);
    const currentCost = parseFloat(costUsd) || 0;
    if (!isNaN(parsed) && exchangeRate.rate > 0) {
      setPriceBs(convertUsdToBs(parsed, exchangeRate.rate).toFixed(2));
      if (currentCost > 0) {
        setMarginInput(calculateMargin(currentCost, parsed).toString());
      }
    }
  };

  const handlePriceBsChange = (val: string) => {
    setPriceBs(val);
    const parsed = parseFloat(val);
    const currentCost = parseFloat(costUsd) || 0;
    if (!isNaN(parsed) && exchangeRate.rate > 0) {
      const convertedUsd = convertBsToUsd(parsed, exchangeRate.rate);
      setPriceUsd(convertedUsd.toFixed(2));
      if (currentCost > 0) {
        setMarginInput(calculateMargin(currentCost, convertedUsd).toString());
      }
    }
  };

  const handleCostUsdChange = (val: string) => {
    setCostUsd(val);
    const parsedCost = parseFloat(val);
    if (!isNaN(parsedCost) && exchangeRate.rate > 0) {
      setCostBs(convertUsdToBs(parsedCost, exchangeRate.rate).toFixed(2));
      const parsedMargin = parseFloat(marginInput);
      if (!isNaN(parsedMargin) && parsedCost > 0) {
        const calculatedPrice = Math.round(parsedCost * (1 + parsedMargin / 100) * 100) / 100;
        setPriceUsd(calculatedPrice.toFixed(2));
        setPriceBs(convertUsdToBs(calculatedPrice, exchangeRate.rate).toFixed(2));
      }
    }
  };

  const handleCostBsChange = (val: string) => {
    setCostBs(val);
    const parsedBs = parseFloat(val);
    if (!isNaN(parsedBs) && exchangeRate.rate > 0) {
      const convertedCostUsd = convertBsToUsd(parsedBs, exchangeRate.rate);
      setCostUsd(convertedCostUsd.toFixed(2));
      const parsedMargin = parseFloat(marginInput);
      if (!isNaN(parsedMargin) && convertedCostUsd > 0) {
        const calculatedPrice = Math.round(convertedCostUsd * (1 + parsedMargin / 100) * 100) / 100;
        setPriceUsd(calculatedPrice.toFixed(2));
        setPriceBs(convertUsdToBs(calculatedPrice, exchangeRate.rate).toFixed(2));
      }
    }
  };

  const parsedCostUsd = parseFloat(costUsd) || 0;
  const parsedPriceUsd = parseFloat(priceUsd) || 0;
  const marginPercent = calculateMargin(parsedCostUsd, parsedPriceUsd);
  const profitUsd = Math.max(0, parsedPriceUsd - parsedCostUsd);
  const profitBs = convertUsdToBs(profitUsd, exchangeRate.rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalProductData = {
      sku: sku.trim() || `PAP-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      category,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      costUsd: parseFloat(costUsd) || 0,
      costBs: parseFloat(costBs) || 0,
      priceUsd: parseFloat(priceUsd) || 0,
      priceBs: parseFloat(priceBs) || 0,
      desiredMargin: parseFloat(marginInput) || marginPercent,
      baseCurrency,
      location: location.trim(),
      barcode: barcode.trim(),
      description: description.trim(),
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, finalProductData);
    } else {
      addProduct(finalProductData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              {productToEdit ? 'Editar Producto de Papelería' : 'Ingresar Nuevo Producto al Inventario'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tasa del día helper */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between text-xs text-blue-900">
            <span>Conversión automática usando tasa del día:</span>
            <span className="font-mono font-bold tabular-nums">
              1 USD = {formatBs(exchangeRate.rate).replace('Bs. ', '')} Bs.
            </span>
          </div>

          {/* Row 1: SKU & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código / SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ej. PAP-015"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Cuaderno Doble Línea Caribe 100 Hojas"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {DEFAULT_CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ubicación / Estante (Opcional)
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ej. Pasillo 1, Vitrina B"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Stock controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Inicial (Unidades) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={e => setStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alerta de Stock Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={e => setMinStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
              <span className="text-[11px] text-slate-500">Estado de existencia:</span>
              <span className={`text-xs font-semibold ${stock <= minStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                {stock <= 0 ? 'Agotado' : stock <= minStock ? 'Stock Bajo' : 'Disponible'}
              </span>
            </div>
          </div>

          {/* Bi-currency Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Precios y Conversión Automática (USD y Bs.)
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Moneda base fija:</span>
                <button
                  type="button"
                  onClick={() => setBaseCurrency(baseCurrency === 'USD' ? 'VES' : 'USD')}
                  className="px-2 py-0.5 rounded font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer"
                >
                  {baseCurrency === 'USD' ? 'Dólares ($)' : 'Bolívares (Bs.)'}
                </button>
              </div>
            </div>

            {/* Cost inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Costo de Compra en USD ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costUsd}
                    onChange={e => handleCostUsdChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Costo de Compra en Bolívares (Bs.)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs font-bold pointer-events-none">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costBs}
                    onChange={e => handleCostBsChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Profit Margin Control (Interactive with presets & automatic pricing) */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>Margen de Ganancia Deseado (%)</span>
                </div>
                <span className="text-[11px] text-blue-700 font-medium hidden sm:inline">
                  Calcula el precio de venta en USD y Bs. automáticamente
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-32">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={marginInput}
                    onChange={e => handleMarginChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono font-bold text-slate-900 tabular-nums focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs pointer-events-none">
                    %
                  </span>
                </div>

                {/* Quick presets for stationery store */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[20, 30, 40, 50, 60, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleMarginChange(pct.toString())}
                      className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                        parseFloat(marginInput) === pct
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white hover:bg-blue-100/60 text-blue-800 border-blue-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-blue-100">
                <span>Ganancia neta calculada por unidad:</span>
                <span className="font-mono font-bold text-emerald-700">
                  +{formatUsd(profitUsd)} ({formatBs(profitBs)})
                </span>
              </div>
            </div>

            {/* Sale Price inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Precio de Venta en USD ($) *</span>
                  {baseCurrency === 'USD' && (
                    <span className="text-[10px] text-blue-600 font-normal">Base principal</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-600 font-mono font-bold text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceUsd}
                    onChange={e => handlePriceUsdChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border-2 border-slate-300 focus:border-blue-500 rounded-lg text-base font-mono font-bold tabular-nums text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Precio de Venta en Bolívares (Bs.) *</span>
                  {baseCurrency === 'VES' && (
                    <span className="text-[10px] text-blue-600 font-normal">Base principal</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-600 font-mono font-bold text-xs pointer-events-none">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceBs}
                    onChange={e => handlePriceBsChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border-2 border-slate-300 focus:border-blue-500 rounded-lg text-base font-mono font-bold tabular-nums text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Profit margin estimation */}
            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Margen de ganancia estimado:</span>
              <span className={`font-mono font-bold ${marginPercent >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {marginPercent}% (Ganancia: {formatUsd(parsedPriceUsd - parsedCostUsd)} / {formatBs(convertUsdToBs(parsedPriceUsd - parsedCostUsd, exchangeRate.rate))})
              </span>
            </div>
          </div>

          {/* Barcode & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de Barras (Opcional)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="Ej. 759100100101"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción / Detalle (Opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej. Marca, presentación, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {productToEdit ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

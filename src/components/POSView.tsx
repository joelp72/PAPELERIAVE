import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { Product, SaleItem, PaymentMethod, PaymentDetails, Sale } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';
import { formatBs, formatUsd, convertUsdToBs, convertBsToUsd } from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';

interface CartItem extends SaleItem {
  maxStock: number;
}

export const POSView: React.FC = () => {
  const { products, exchangeRate, recordSale } = useInventory();

  // Search & category state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [posSort, setPosSort] = useState<'DEFAULT' | 'NAME_ASC' | 'LOW_STOCK' | 'PRICE_DESC' | 'PRICE_ASC'>('DEFAULT');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAGO_MOVIL');
  const [receivedUsd, setReceivedUsd] = useState<string>('');
  const [receivedBs, setReceivedBs] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });

    return list.sort((a, b) => {
      switch (posSort) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'LOW_STOCK':
          return a.stock - b.stock;
        case 'PRICE_DESC':
          return b.priceUsd - a.priceUsd;
        case 'PRICE_ASC':
          return a.priceUsd - b.priceUsd;
        default:
          return 0;
      }
    });
  }, [products, selectedCategory, searchQuery, posSort]);

  // Cart calculations
  const totalUsd = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotalUsd, 0);
  }, [cart]);

  const totalBs = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotalBs, 0);
  }, [cart]);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0 && product.stock !== 9999) return;

    setCart(prevCart => {
      const existing = prevCart.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock && product.stock !== 9999) {
          return prevCart; // Exceeds stock
        }
        const updatedQty = existing.quantity + 1;
        return prevCart.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: updatedQty,
                subtotalUsd: Math.round(updatedQty * item.unitPriceUsd * 100) / 100,
                subtotalBs: Math.round(updatedQty * item.unitPriceBs * 100) / 100,
              }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            quantity: 1,
            unitPriceUsd: product.priceUsd,
            unitPriceBs: product.priceBs,
            subtotalUsd: product.priceUsd,
            subtotalBs: product.priceBs,
            maxStock: product.stock,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.maxStock && item.maxStock !== 9999) return item;
            return {
              ...item,
              quantity: newQty,
              subtotalUsd: Math.round(newQty * item.unitPriceUsd * 100) / 100,
              subtotalBs: Math.round(newQty * item.unitPriceBs * 100) / 100,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setReceivedUsd('');
    setReceivedBs('');
    setPaymentRef('');
  };

  // Change computation
  const parsedReceivedUsd = parseFloat(receivedUsd) || 0;
  const parsedReceivedBs = parseFloat(receivedBs) || 0;
  const totalPaidInUsd = parsedReceivedUsd + convertBsToUsd(parsedReceivedBs, exchangeRate.rate);
  const changeUsd = totalPaidInUsd > totalUsd ? Math.round((totalPaidInUsd - totalUsd) * 100) / 100 : 0;
  const changeBs = changeUsd > 0 ? convertUsdToBs(changeUsd, exchangeRate.rate) : 0;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
      receivedUsd: parsedReceivedUsd > 0 ? parsedReceivedUsd : undefined,
      receivedBs: parsedReceivedBs > 0 ? parsedReceivedBs : undefined,
      changeUsd: changeUsd > 0 ? changeUsd : undefined,
      changeBs: changeBs > 0 ? changeBs : undefined,
      reference: paymentRef.trim() || undefined,
    };

    const newSale = recordSale({
      items: cart,
      paymentDetails,
      customerName: customerName.trim() || undefined,
    });

    setCompletedSale(newSale);
    setShowReceipt(true);
    clearCart();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* View Title */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Punto de Venta / Salida de Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona los productos solicitados en mostrador para cobrar y descontar de inventario.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          <span>Tasa actual de venta:</span>
          <span className="font-mono font-bold text-blue-600 tabular-nums">
            1$ = {formatBs(exchangeRate.rate).replace('Bs. ', '')} Bs.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar and sort controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, código (PAP-001) o código de barras..."
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <select
                value={posSort}
                onChange={e => setPosSort(e.target.value as any)}
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value="DEFAULT">Predeterminado</option>
                <option value="NAME_ASC">Nombre (A → Z)</option>
                <option value="LOW_STOCK">Menor stock primero</option>
                <option value="PRICE_DESC">Mayor precio ($)</option>
                <option value="PRICE_ASC">Menor precio ($)</option>
              </select>
            </div>
          </div>

          {/* Category Tabs (Interactive Filter Controls) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {DEFAULT_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                <p className="text-sm">No se encontraron productos coincidentes.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Intenta cambiar el término de búsqueda o categoría.
                </p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0 && product.stock !== 9999;
                const isLowStock = product.stock > 0 && product.stock <= product.minStock;

                return (
                  <div
                    key={product.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-mono font-semibold">{product.sku}</span>
                        <span>{product.category}</span>
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Existencia:{' '}
                          <strong
                            className={`font-mono ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {product.stock === 9999 ? 'Ilimitado (Servicio)' : `${product.stock} uds.`}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          {formatUsd(product.priceUsd)}
                        </span>
                        <span className="font-mono font-semibold text-blue-600 text-xs tabular-nums">
                          {formatBs(product.priceBs)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">
                Ticket de Mostrador ({cart.reduce((a, b) => a + b.quantity, 0)} artículos)
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 max-h-[280px] overflow-y-auto space-y-2.5 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>El ticket está vacío.</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Haz clic en "Añadir" en los productos del catálogo.
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {formatUsd(item.unitPriceUsd)} · {formatBs(item.unitPriceBs)} c/u
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-slate-900 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[70px]">
                    <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                      {formatUsd(item.subtotalUsd)}
                    </div>
                    <div className="font-mono text-[10px] text-blue-600 tabular-nums">
                      {formatBs(item.subtotalBs)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout & Payment Form */}
          <form onSubmit={handleCheckout} className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
            {/* Customer name */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Nombre del Cliente (Opcional):</span>
              </div>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Cliente Mostrador"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Método de Pago:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'PAGO_MOVIL', label: 'Pago Móvil' },
                  { id: 'PUNTO_VENTA', label: 'Punto de Venta' },
                  { id: 'EFECTIVO_USD', label: 'Efectivo $' },
                  { id: 'EFECTIVO_BS', label: 'Efectivo Bs.' },
                  { id: 'ZELLE', label: 'Zelle' },
                  { id: 'MIXTO', label: 'Pago Mixto' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer text-left truncate ${
                      paymentMethod === opt.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details / Reference / Cash calculation */}
            {(paymentMethod === 'EFECTIVO_USD' || paymentMethod === 'MIXTO') && (
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Paga con USD ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={receivedUsd}
                    onChange={e => setReceivedUsd(e.target.value)}
                    placeholder="Ej. 10 o 20"
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Vuelto estimado
                  </label>
                  <div className="text-xs font-mono font-bold text-emerald-700 pt-1 tabular-nums">
                    {changeUsd > 0 ? `${formatUsd(changeUsd)} / ${formatBs(changeBs)}` : 'Exacto'}
                  </div>
                </div>
              </div>
            )}

            {(paymentMethod === 'PAGO_MOVIL' || paymentMethod === 'PUNTO_VENTA' || paymentMethod === 'ZELLE') && (
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                  N° de Referencia / Aprobación (Opcional):
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  placeholder="Ej. Ref #8934"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            )}

            {/* Total box */}
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>TOTAL A COBRAR (USD):</span>
                <span className="font-mono text-base font-bold text-white tabular-nums">
                  {formatUsd(totalUsd)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-300 border-t border-slate-800 pt-1">
                <span>TOTAL A COBRAR (BS.):</span>
                <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                  {formatBs(totalBs)}
                </span>
              </div>
            </div>

            {/* Submit checkout */}
            <button
              type="submit"
              disabled={cart.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                cart.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cobrar y Descontar de Inventario</span>
            </button>
          </form>
        </div>
      </div>

      {/* Sales Receipt Modal */}
      <ReceiptModal
        sale={completedSale}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
};

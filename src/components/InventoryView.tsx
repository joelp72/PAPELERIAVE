import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  AlertTriangle,
  Package,
  Layers,
  Edit2,
  Trash2,
  SlidersHorizontal,
  PackagePlus,
  TrendingUp,
} from 'lucide-react';
import { Product } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';
import {
  formatBs,
  formatUsd,
  formatCompactNumber,
  calculateMargin,
} from '../utils/formatters';
import { ProductFormModal } from './ProductFormModal';
import { QuickAdjustModal } from './QuickAdjustModal';
import { StockInModal } from './StockInModal';
import { DeleteProductModal } from './DeleteProductModal';

export const InventoryView: React.FC = () => {
  const { products, deleteProduct, exportProductsCSV, exchangeRate } = useInventory();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [stockInProductId, setStockInProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;

      // Stock status filter
      let matchesStock = true;
      if (stockStatusFilter === 'low') {
        matchesStock = p.stock > 0 && p.stock <= p.minStock;
      } else if (stockStatusFilter === 'out') {
        matchesStock = p.stock <= 0 && p.stock !== 9999;
      }

      // Query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      return matchesCat && matchesStock && matchesQuery;
    });
  }, [products, selectedCategory, stockStatusFilter, searchQuery]);

  // Overall Inventory Metrics
  const metrics = useMemo(() => {
    const totalItems = products.length;
    const physicalProducts = products.filter(p => p.stock !== 9999);
    const totalUnits = physicalProducts.reduce((sum, p) => sum + p.stock, 0);

    const inventoryValueCostUsd = physicalProducts.reduce(
      (sum, p) => sum + p.costUsd * p.stock,
      0
    );
    const inventoryValueSaleUsd = physicalProducts.reduce(
      (sum, p) => sum + p.priceUsd * p.stock,
      0
    );

    const lowStockCount = physicalProducts.filter(
      p => p.stock > 0 && p.stock <= p.minStock
    ).length;
    const outOfStockCount = physicalProducts.filter(p => p.stock <= 0).length;

    return {
      totalItems,
      totalUnits,
      inventoryValueCostUsd,
      inventoryValueCostBs: inventoryValueCostUsd * exchangeRate.rate,
      inventoryValueSaleUsd,
      inventoryValueSaleBs: inventoryValueSaleUsd * exchangeRate.rate,
      lowStockCount,
      outOfStockCount,
    };
  }, [products, exchangeRate.rate]);

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Catálogo Registrado</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.totalItems} productos
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatCompactNumber(metrics.totalUnits)} unidades en tienda
          </div>
        </div>

        {/* Metric 2: Inventory Value (Cost) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Valor al Costo</span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatUsd(metrics.inventoryValueCostUsd)}
          </div>
          <div className="text-xs text-blue-600 font-mono tabular-nums mt-1">
            {formatBs(metrics.inventoryValueCostBs)}
          </div>
        </div>

        {/* Metric 3: Inventory Value (Sale) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Valor Total Venta</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatUsd(metrics.inventoryValueSaleUsd)}
          </div>
          <div className="text-xs text-emerald-600 font-mono tabular-nums mt-1">
            {formatBs(metrics.inventoryValueSaleBs)}
          </div>
        </div>

        {/* Metric 4: Alerts */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Alertas de Reposición</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {metrics.lowStockCount + metrics.outOfStockCount} alertas
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-amber-600 font-semibold">{metrics.lowStockCount} stock bajo</span>
            {' · '}
            <span className="text-rose-600 font-semibold">{metrics.outOfStockCount} agotados</span>
          </div>
        </div>
      </div>

      {/* Action Bar & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código o estante..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={exportProductsCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="Descargar archivo Excel / CSV del inventario"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => setStockInProductId(products[0]?.id || '')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>+ Entrada / Reabastecer</span>
            </button>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ingresar Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Stock status and categories */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Stock status filter tabs (Segmented controls) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                stockStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('low')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                stockStatusFilter === 'low'
                  ? 'bg-white text-amber-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Bajo ({metrics.lowStockCount})
            </button>
            <button
              onClick={() => setStockStatusFilter('out')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                stockStatusFilter === 'out'
                  ? 'bg-white text-rose-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agotados ({metrics.outOfStockCount})
            </button>
          </div>

          {/* Category dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Categoría:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {DEFAULT_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* High-Density Data Grid / Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Código / SKU</th>
                <th className="py-3 px-4 min-w-[240px]">Producto & Categoría</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-right">Costo (USD / Bs.)</th>
                <th className="py-3 px-4 text-right">Precio Venta (USD / Bs.)</th>
                <th className="py-3 px-4 text-center">Margen</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No se encontraron productos con estos filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.stock <= 0 && product.stock !== 9999;
                  const isLowStock =
                    product.stock > 0 &&
                    product.stock <= product.minStock &&
                    product.stock !== 9999;
                  const margin =
                    product.desiredMargin !== undefined
                      ? product.desiredMargin
                      : calculateMargin(product.costUsd, product.priceUsd);
                  const unitGainUsd = Math.max(0, product.priceUsd - product.costUsd);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {product.sku}
                      </td>

                      {/* Product Name & Metadata */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {product.name}
                        </div>
                        {/* Zero-Pill metadata with typographic separator */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{product.category}</span>
                          {product.location && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{product.location}</span>
                            </>
                          )}
                          {product.barcode && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-[10px]">{product.barcode}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Stock Level with explicit text status */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                          {product.stock === 9999 ? 'Servicio' : product.stock}
                        </div>
                        <div className="text-[10px] font-medium mt-0.5">
                          {isOutOfStock ? (
                            <span className="text-rose-600 font-semibold">Agotado</span>
                          ) : isLowStock ? (
                            <span className="text-amber-600 font-semibold">
                              Bajo (mín {product.minStock})
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Disponible</span>
                          )}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono text-slate-700 tabular-nums">
                          {formatUsd(product.costUsd)}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {formatBs(product.costBs)}
                        </div>
                      </td>

                      {/* Price (Sale) */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          {formatUsd(product.priceUsd)}
                        </div>
                        <div className="font-mono font-semibold text-blue-600 text-xs tabular-nums">
                          {formatBs(product.priceBs)}
                        </div>
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-xs tabular-nums ${
                            margin >= 25 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {margin}%
                        </span>
                        <div className="font-mono text-[10px] text-slate-400 tabular-nums">
                          +{formatUsd(unitGainUsd)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setStockInProductId(product.id)}
                            title="Entrada rápida de stock"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setAdjustingProduct(product)}
                            title="Ajustar existencia (+ / -)"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsAddModalOpen(true);
                            }}
                            title="Editar datos y precios"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            title={product.stock > 0 ? "No se puede eliminar: tiene stock" : "Eliminar producto"}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              product.stock > 0
                                ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-rose-500 hover:bg-rose-50"
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
      />

      <QuickAdjustModal
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        product={adjustingProduct}
      />

      <StockInModal
        isOpen={Boolean(stockInProductId)}
        onClose={() => setStockInProductId(null)}
        preselectedProductId={stockInProductId || undefined}
      />

      <DeleteProductModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        onConfirmDelete={id => deleteProduct(id)}
        onOpenQuickAdjust={prod => setAdjustingProduct(prod)}
      />
    </div>
  );
};

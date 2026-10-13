import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Check, ChevronDown, X, Package, AlertTriangle } from 'lucide-react';
import { Product } from '../types/inventory';
import { formatBs, formatUsd } from '../utils/formatters';

interface ProductSearchAutocompleteProps {
  products: Product[];
  selectedProductId: string;
  onSelectProduct: (product: Product) => void;
  label?: string;
}

export const ProductSearchAutocomplete: React.FC<ProductSearchAutocompleteProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  label = 'Buscar o seleccionar producto de papelería',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Filter products matching search query
  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} *
        </label>
      )}

      {/* Selected Product Banner if chosen */}
      {selectedProduct && !isOpen ? (
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3 transition-all">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700">
                {selectedProduct.sku}
              </span>
              <span className="text-[11px] text-slate-500">· {selectedProduct.category}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {selectedProduct.name}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Existencia actual:{' '}
              <strong className="font-mono font-semibold text-slate-800">
                {selectedProduct.stock === 9999 ? 'Servicio Ilimitado' : `${selectedProduct.stock} uds.`}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setQuery('');
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-xs"
          >
            Cambiar Producto
          </button>
        </div>
      ) : (
        /* Search input with live dropdown */
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus={isOpen}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Escribe para buscar... (ej. borrador, cuaderno, mongol, PAP-001)"
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
              <div className="p-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                <span>
                  {query ? `Resultados para "${query}" (${filteredProducts.length})` : `Todos los productos (${filteredProducts.length})`}
                </span>
                <span className="text-[10px] lowercase text-slate-400 font-normal">
                  haz clic para seleccionar
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <p>No se encontró ningún producto con "{query}".</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Verifica la ortografía o crea un nuevo producto si no existe aún.
                  </p>
                </div>
              ) : (
                filteredProducts.map(p => {
                  const isSelected = p.id === selectedProductId;
                  const isOutOfStock = p.stock <= 0 && p.stock !== 9999;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p)}
                      className={`w-full text-left p-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {p.sku}
                          </span>
                          <span className="text-[11px] text-slate-500">· {p.category}</span>
                          {p.location && (
                            <span className="text-[11px] text-slate-400">· {p.location}</span>
                          )}
                        </div>

                        <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                          {p.name}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>
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
                              {p.stock === 9999 ? 'Servicio' : `${p.stock} uds.`}
                            </strong>
                          </span>
                          <span>·</span>
                          <span className="font-mono text-slate-600">
                            Costo: {formatUsd(p.costUsd)} ({formatBs(p.costBs)})
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="shrink-0 p-1 bg-blue-600 text-white rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

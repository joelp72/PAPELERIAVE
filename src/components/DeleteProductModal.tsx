import React from 'react';
import { AlertCircle, Trash2, X, SlidersHorizontal } from 'lucide-react';
import { Product } from '../types/inventory';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmDelete: (productId: string) => void;
  onOpenQuickAdjust?: (product: Product) => void;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmDelete,
  onOpenQuickAdjust,
}) => {
  if (!isOpen || !product) return null;

  const hasStock = product.stock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            {hasStock ? (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            ) : (
              <Trash2 className="w-5 h-5 text-rose-600" />
            )}
            <h3 className="font-semibold text-slate-900 text-base">
              {hasStock ? 'Acción no permitida: Hay stock activo' : 'Confirmar eliminación'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {hasStock ? (
            /* Warning: Product still has stock */
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>No se puede eliminar este producto</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  El producto <strong className="text-slate-900 font-semibold">{product.name}</strong> ({product.sku}) aún cuenta con{' '}
                  <strong className="text-amber-900 font-mono font-bold">{product.stock} unidades</strong> en existencia en el inventario.
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Por seguridad y consistencia contable, <strong>solo se permite eliminar productos cuando su stock está completamente en cero (0)</strong>.
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-700 block">¿Qué puedes hacer?</span>
                <p>
                  1. Vender las unidades restantes a través del Punto de Venta.
                </p>
                <p>
                  2. O ajustar manualmente la existencia a 0 si la mercancía sufrió merma o daño.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Entendido
                </button>
                {onOpenQuickAdjust && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQuickAdjust(product);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Ajustar stock</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Allowed: Product has 0 stock */
            <>
              <div className="space-y-2">
                <p className="text-sm text-slate-700">
                  ¿Estás seguro de que deseas eliminar definitivamente el producto{' '}
                  <strong className="text-slate-900 font-semibold">{product.name}</strong> ({product.sku})?
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <span className="text-slate-600">Existencia actual:</span>
                  <span className="font-mono font-bold text-rose-600">0 unidades (Agotado)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Esta acción retirará el artículo del catálogo de papelería. Los movimientos históricos previos se mantendrán en el Kardex.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmDelete(product.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, Eliminar Producto</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

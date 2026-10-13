import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Product } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const QuickAdjustModal: React.FC<QuickAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { quickAdjustStock } = useInventory();
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState<number>(1);
  const [reason, setReason] = useState<string>('Corrección de inventario físico');

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const delta = adjustmentType === 'add' ? amount : -amount;
    quickAdjustStock(product.id, delta, reason);
    onClose();
  };

  const calculatedNewStock =
    adjustmentType === 'add'
      ? product.stock + (amount || 0)
      : Math.max(0, product.stock - (amount || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              Ajustar Existencia Rápida
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
          <div>
            <span className="text-xs text-slate-500">Producto:</span>
            <div className="font-semibold text-slate-900 text-sm">{product.name}</div>
            <div className="text-xs text-slate-500 font-mono">Código: {product.sku}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <span>Stock actual: <strong className="font-mono">{product.stock}</strong></span>
            <span>Nuevo stock: <strong className="font-mono text-blue-600">{calculatedNewStock}</strong></span>
          </div>

          {/* Type selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentType('add')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                adjustmentType === 'add'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              + Sumar al Stock
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('subtract')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                adjustmentType === 'subtract'
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              - Restar del Stock
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cantidad de Unidades
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo del Ajuste
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Corrección de inventario físico">Corrección de inventario físico</option>
              <option value="Merma o producto dañado">Merma o producto defectuoso/dañado</option>
              <option value="Uso interno de papelería (gasto)">Uso interno de papelería (gasto)</option>
              <option value="Devolución de cliente">Devolución de cliente</option>
              <option value="Regalo o promoción">Muestra / Promoción</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Aplicar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

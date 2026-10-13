import React, { useState, useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  RotateCcw,
  Search,
  Filter,
  History,
  Calendar,
  ArrowUpDown,
  X,
  PackagePlus,
  ShoppingCart,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Movement, MovementType } from '../types/inventory';
import { formatDate, formatBs, formatUsd } from '../utils/formatters';

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
type SortOption = 'RECENT' | 'OLDEST' | 'QTY_DESC' | 'QTY_ASC' | 'NAME_ASC' | 'NAME_DESC';

export const MovementsView: React.FC = () => {
  const { movements } = useInventory();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('RECENT');

  // Filtered & Sorted movements list
  const filteredAndSortedMovements = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const firstDayOfMonth = new Date().toISOString().slice(0, 7) + '-01';

    let list = movements.filter(m => {
      // 1. Movement type filter
      if (filterType !== 'ALL' && m.type !== filterType) {
        return false;
      }

      // 2. Date filter
      const mDate = m.timestamp.slice(0, 10);
      if (dateFilter === 'TODAY' && mDate !== today) return false;
      if (dateFilter === 'YESTERDAY' && mDate !== yesterday) return false;
      if (dateFilter === 'WEEK' && mDate < sevenDaysAgo) return false;
      if (dateFilter === 'MONTH' && mDate < firstDayOfMonth) return false;
      if (dateFilter === 'CUSTOM' && customDate && mDate !== customDate) return false;

      // 3. Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery =
          m.productName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.reason.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });

    // Sort list
    return list.sort((a, b) => {
      switch (sortOption) {
        case 'RECENT':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'OLDEST':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'QTY_DESC':
          return b.quantity - a.quantity;
        case 'QTY_ASC':
          return a.quantity - b.quantity;
        case 'NAME_ASC':
          return a.productName.localeCompare(b.productName);
        case 'NAME_DESC':
          return b.productName.localeCompare(a.productName);
        default:
          return 0;
      }
    });
  }, [movements, filterType, dateFilter, customDate, searchQuery, sortOption]);

  // Quick metrics of current filtered selection
  const selectionMetrics = useMemo(() => {
    let unitsIn = 0;
    let unitsOut = 0;
    filteredAndSortedMovements.forEach(m => {
      if (m.type === 'IN' || m.type === 'RETURN') {
        unitsIn += m.quantity;
      } else if (m.type === 'OUT_SALE') {
        unitsOut += m.quantity;
      }
    });
    return { unitsIn, unitsOut, totalCount: filteredAndSortedMovements.length };
  }, [filteredAndSortedMovements]);

  const getTypeLabel = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return { label: 'Entrada (+)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'OUT_SALE':
        return { label: 'Salida Venta (-)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'ADJUSTMENT':
        return { label: 'Ajuste Manual', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'RETURN':
        return { label: 'Devolución (+)', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default:
        return { label: type, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    filterType !== 'ALL' ||
    dateFilter !== 'ALL' ||
    customDate !== '' ||
    sortOption !== 'RECENT';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setDateFilter('ALL');
    setCustomDate('');
    setSortOption('RECENT');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Historial de Movimientos de Inventario (Kardex)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta cronológica con búsqueda avanzada por fecha, tipo de movimiento y diferentes formas de ordenación.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
            <span>Movimientos Registrados</span>
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {selectionMetrics.totalCount} operaciones
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {dateFilter === 'ALL' ? 'Histórico completo' : 'Según período seleccionado'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
            <span>Unidades Ingresadas (Entradas)</span>
            <PackagePlus className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            +{selectionMetrics.unitsIn} uds.
          </div>
          <div className="text-xs text-slate-400 mt-1">Reabastecimientos y compras</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
            <span>Unidades Despachadas (Salidas)</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 tabular-nums">
            -{selectionMetrics.unitsOut} uds.
          </div>
          <div className="text-xs text-slate-400 mt-1">Ventas de mostrador</div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
        {/* Row 1: Search & Sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por producto, código SKU o motivo (ej. Venta, Factura)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap">Ordenar por:</span>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="RECENT">Más recientes primero (Fecha ↓)</option>
              <option value="OLDEST">Más antiguos primero (Fecha ↑)</option>
              <option value="QTY_DESC">Mayor cantidad de unidades (↓)</option>
              <option value="QTY_ASC">Menor cantidad de unidades (↑)</option>
              <option value="NAME_ASC">Producto: A → Z</option>
              <option value="NAME_DESC">Producto: Z → A</option>
            </select>
          </div>
        </div>

        {/* Row 2: Movement Type tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 mr-1">Tipo de movimiento:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({movements.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('IN')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'IN'
                  ? 'bg-white text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entradas (+)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('OUT_SALE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'OUT_SALE'
                  ? 'bg-white text-blue-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Salidas por Venta (-)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ADJUSTMENT')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'ADJUSTMENT'
                  ? 'bg-white text-amber-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ajustes Manuales
            </button>
          </div>
        </div>

        {/* Row 3: Date Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtro de fecha:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Todas las fechas' },
              { id: 'TODAY', label: 'Hoy' },
              { id: 'YESTERDAY', label: 'Ayer' },
              { id: 'WEEK', label: 'Últimos 7 días' },
              { id: 'MONTH', label: 'Este mes' },
              { id: 'CUSTOM', label: 'Fecha específica...' },
            ].map(df => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id as DateFilterType)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  dateFilter === df.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {df.label}
              </button>
            ))}

            {dateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Código / Producto</th>
                <th className="py-3 px-4 text-center">Cantidad</th>
                <th className="py-3 px-4 text-center">Stock Anterior</th>
                <th className="py-3 px-4 text-center">Stock Resultante</th>
                <th className="py-3 px-4">Motivo / Documento</th>
                <th className="py-3 px-4 text-right">Tasa Aplicada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No se encontraron movimientos para los filtros seleccionados.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Prueba cambiando las fechas o el término de búsqueda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedMovements.map(mov => {
                  const typeInfo = getTypeLabel(mov.type);
                  const isPositive = mov.type === 'IN' || mov.type === 'RETURN';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(mov.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{mov.productName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{mov.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold tabular-nums text-sm ${
                            isPositive ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500 tabular-nums">
                        {mov.previousStock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                        {mov.newStock}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-[220px] truncate" title={mov.reason}>
                        {mov.reason}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                        {mov.rateApplied ? `${mov.rateApplied.toFixed(2)} Bs.` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

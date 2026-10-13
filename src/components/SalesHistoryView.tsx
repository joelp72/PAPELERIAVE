import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  X,
  Filter,
} from 'lucide-react';
import { Sale, PaymentMethod } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { formatBs, formatUsd, formatDate } from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
type SalesSortOption = 'RECENT' | 'OLDEST' | 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'ITEMS_DESC';

export const SalesHistoryView: React.FC = () => {
  const { sales, cancelSale, exchangeRate } = useInventory();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<SalesSortOption>('RECENT');

  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Filtered & Sorted sales
  const filteredAndSortedSales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const firstDayOfMonth = new Date().toISOString().slice(0, 7) + '-01';

    let list = sales.filter(s => {
      // Date filter
      const sDate = s.timestamp.slice(0, 10);
      if (dateFilter === 'TODAY' && sDate !== today) return false;
      if (dateFilter === 'YESTERDAY' && sDate !== yesterday) return false;
      if (dateFilter === 'WEEK' && sDate < sevenDaysAgo) return false;
      if (dateFilter === 'MONTH' && sDate < firstDayOfMonth) return false;
      if (dateFilter === 'CUSTOM' && customDate && sDate !== customDate) return false;

      // Payment method filter
      if (paymentFilter !== 'ALL' && s.paymentDetails.method !== paymentFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery =
          s.receiptNumber.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          s.items.some(i => i.name.toLowerCase().includes(q)) ||
          (s.paymentDetails.reference && s.paymentDetails.reference.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      switch (sortOption) {
        case 'RECENT':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'OLDEST':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'AMOUNT_DESC':
          return b.totalUsd - a.totalUsd;
        case 'AMOUNT_ASC':
          return a.totalUsd - b.totalUsd;
        case 'ITEMS_DESC': {
          const aCount = a.items.reduce((sum, i) => sum + i.quantity, 0);
          const bCount = b.items.reduce((sum, i) => sum + i.quantity, 0);
          return bCount - aCount;
        }
        default:
          return 0;
      }
    });
  }, [sales, dateFilter, customDate, paymentFilter, statusFilter, searchQuery, sortOption]);

  // Aggregated totals of the filtered view
  const currentTotals = useMemo(() => {
    const completedList = filteredAndSortedSales.filter(s => s.status === 'COMPLETED');
    const totalUsd = completedList.reduce((acc, s) => acc + s.totalUsd, 0);
    const totalBs = completedList.reduce((acc, s) => acc + s.totalBs, 0);
    const count = completedList.length;
    const cancelledCount = filteredAndSortedSales.filter(s => s.status === 'CANCELLED').length;

    return { totalUsd, totalBs, count, cancelledCount };
  }, [filteredAndSortedSales]);

  const handleCancelSale = (sale: Sale) => {
    if (
      confirm(
        `¿Deseas anular la venta ${sale.receiptNumber}? Los artículos se reintegrarán automáticamente al inventario.`
      )
    ) {
      cancelSale(sale.id);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'PAGO_MOVIL':
        return 'Pago Móvil';
      case 'PUNTO_VENTA':
        return 'Punto Débito';
      case 'EFECTIVO_USD':
        return 'Efectivo $';
      case 'EFECTIVO_BS':
        return 'Efectivo Bs.';
      case 'ZELLE':
        return 'Zelle';
      case 'MIXTO':
        return 'Mixto';
      default:
        return method;
    }
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    dateFilter !== 'ALL' ||
    customDate !== '' ||
    paymentFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    sortOption !== 'RECENT';

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('ALL');
    setCustomDate('');
    setPaymentFilter('ALL');
    setStatusFilter('ALL');
    setSortOption('RECENT');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Registro de Ventas & Arqueo de Caja
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta tus ventas con búsqueda por fecha, ordenamiento flexible y reimpresión de comprobantes.
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

      {/* Dynamic Metrics Cards (reflects the filtered date & selection) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Ventas Filtradas (USD)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatUsd(currentTotals.totalUsd)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {currentTotals.count} {currentTotals.count === 1 ? 'ticket cobrado' : 'tickets cobrados'}
            {currentTotals.cancelledCount > 0 && ` (${currentTotals.cancelledCount} anulados)`}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Ventas Filtradas (Bolívares)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
            {formatBs(currentTotals.totalBs)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total en Bolívares del período filtrado
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Tasa de Referencia Actual</span>
            <Banknote className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            1$ = {formatBs(exchangeRate.rate).replace('Bs. ', '')} Bs.
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {exchangeRate.source}
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
        {/* Row 1: Search & Sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por comprobante (REC-...), cliente, producto o referencia..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap">Ordenar por:</span>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SalesSortOption)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="RECENT">Más recientes primero (Fecha ↓)</option>
              <option value="OLDEST">Más antiguas primero (Fecha ↑)</option>
              <option value="AMOUNT_DESC">Mayor monto ($ USD ↓)</option>
              <option value="AMOUNT_ASC">Menor monto ($ USD ↑)</option>
              <option value="ITEMS_DESC">Mayor cantidad de artículos</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Filters */}
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

        {/* Row 3: Payment Method and Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Forma de pago:</span>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los métodos</option>
              <option value="PAGO_MOVIL">Pago Móvil</option>
              <option value="PUNTO_VENTA">Punto Débito</option>
              <option value="EFECTIVO_USD">Efectivo $</option>
              <option value="EFECTIVO_BS">Efectivo Bs.</option>
              <option value="ZELLE">Zelle</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Estado:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="COMPLETED">Solo Completadas</option>
              <option value="CANCELLED">Solo Anuladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">N° Comprobante</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Artículos Vendidos</th>
                <th className="py-3 px-4">Forma de Pago</th>
                <th className="py-3 px-4 text-right">Total USD</th>
                <th className="py-3 px-4 text-right">Total Bs.</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No se encontraron ventas para esta búsqueda o fecha.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Intenta ajustar el filtro de fecha o el término de búsqueda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedSales.map(sale => {
                  const isCancelled = sale.status === 'CANCELLED';

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCancelled ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(sale.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {sale.customerName || 'Cliente Mostrador'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-[220px] truncate text-slate-700 font-medium">
                          {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sale.items.reduce((sum, i) => sum + i.quantity, 0)} artículos
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-medium">
                          {getMethodBadge(sale.paymentDetails.method)}
                        </span>
                        {sale.paymentDetails.reference && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {sale.paymentDetails.reference}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {formatUsd(sale.totalUsd)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-blue-600 tabular-nums">
                        {formatBs(sale.totalBs)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCancelled ? (
                          <span className="text-rose-600 font-semibold text-[11px]">
                            Anulada
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            Completada
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            title="Reimprimir Comprobante"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancelSale(sale)}
                              title="Anular venta y devolver stock"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Receipt Modal */}
      <ReceiptModal
        sale={selectedSaleForReceipt}
        isOpen={Boolean(selectedSaleForReceipt)}
        onClose={() => setSelectedSaleForReceipt(null)}
      />
    </div>
  );
};

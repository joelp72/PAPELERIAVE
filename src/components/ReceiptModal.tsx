import React from 'react';
import { X, Printer, CheckCircle, Share2 } from 'lucide-react';
import { Sale } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { formatBs, formatUsd, formatDate } from '../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { storeInfo } = useInventory();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'PAGO_MOVIL':
        return 'Pago Móvil';
      case 'PUNTO_VENTA':
        return 'Punto de Venta (Tarjeta Débito)';
      case 'EFECTIVO_USD':
        return 'Efectivo Dólares ($)';
      case 'EFECTIVO_BS':
        return 'Efectivo Bolívares (Bs.)';
      case 'ZELLE':
        return 'Zelle / Divisas Digitales';
      case 'MIXTO':
        return 'Pago Mixto (Efectivo / Pago Móvil)';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle className="w-4 h-4" />
            <span>Venta Registrada Exitosamente</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket Receipt Area */}
        <div id="printable-ticket" className="p-6 font-mono text-xs text-slate-800 bg-white">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="font-bold text-sm text-slate-900 tracking-tight uppercase">
              {storeInfo.name}
            </h2>
            <div className="text-[11px] text-slate-600 mt-0.5">RIF: {storeInfo.rif}</div>
            <div className="text-[10px] text-slate-500">{storeInfo.address}</div>
            <div className="text-[10px] text-slate-500">Telf: {storeInfo.phone}</div>
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>N° COMPROBANTE:</span>
              <span className="font-bold">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA / HORA:</span>
              <span>{formatDate(sale.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span>CLIENTE:</span>
              <span className="truncate max-w-[180px]">{sale.customerName || 'Cliente Mostrador'}</span>
            </div>
            <div className="flex justify-between text-blue-700 font-semibold pt-0.5">
              <span>TASA APLICADA:</span>
              <span>1$ = {formatBs(sale.rate).replace('Bs. ', '')} Bs.</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="text-[10px] text-slate-400 uppercase pb-1 flex justify-between">
              <span>Cant. / Artículo</span>
              <span>Total ($ / Bs.)</span>
            </div>
            <div className="space-y-2 mt-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium text-slate-900 text-[11px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold tabular-nums text-[11px] text-right whitespace-nowrap">
                      {formatUsd(item.subtotalUsd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      P.U: {formatUsd(item.unitPriceUsd)} ({formatBs(item.unitPriceBs)})
                    </span>
                    <span className="tabular-nums">
                      {formatBs(item.subtotalBs)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between items-center text-sm font-bold text-slate-900">
              <span>TOTAL DÓLARES:</span>
              <span className="tabular-nums text-base">{formatUsd(sale.totalUsd)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-900">
              <span>TOTAL BOLÍVARES:</span>
              <span className="tabular-nums text-base">{formatBs(sale.totalBs)}</span>
            </div>
          </div>

          {/* Payment method & Change details */}
          <div className="pt-2.5 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>FORMA DE PAGO:</span>
              <span className="font-medium text-slate-900">{getPaymentMethodName(sale.paymentDetails.method)}</span>
            </div>
            {sale.paymentDetails.reference && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>REF / COMPROBANTE:</span>
                <span>{sale.paymentDetails.reference}</span>
              </div>
            )}
            {sale.paymentDetails.receivedUsd !== undefined && sale.paymentDetails.receivedUsd > 0 && (
              <div className="flex justify-between text-[10px]">
                <span>RECIBIDO USD:</span>
                <span>{formatUsd(sale.paymentDetails.receivedUsd)}</span>
              </div>
            )}
            {sale.paymentDetails.changeUsd !== undefined && sale.paymentDetails.changeUsd > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-emerald-700">
                <span>VUELTO USD:</span>
                <span>{formatUsd(sale.paymentDetails.changeUsd)}</span>
              </div>
            )}
            {sale.paymentDetails.changeBs !== undefined && sale.paymentDetails.changeBs > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-emerald-700">
                <span>VUELTO BOLÍVARES:</span>
                <span>{formatBs(sale.paymentDetails.changeBs)}</span>
              </div>
            )}
          </div>

          <div className="text-center pt-4 text-[10px] text-slate-500">
            <p>{storeInfo.greeting}</p>
            <p className="mt-0.5 text-[9px] text-slate-400">Comprobante de entrega y control interno de inventario</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprobante
          </button>
        </div>
      </div>
    </div>
  );
};

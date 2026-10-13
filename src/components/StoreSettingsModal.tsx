import React, { useState, useRef } from 'react';
import {
  X,
  Store,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    storeInfo,
    updateStoreInfo,
    exportDataJSON,
    importDataJSON,
    resetToDefaults,
  } = useInventory();

  const [name, setName] = useState(storeInfo.name);
  const [rif, setRif] = useState(storeInfo.rif);
  const [phone, setPhone] = useState(storeInfo.phone);
  const [address, setAddress] = useState(storeInfo.address);
  const [greeting, setGreeting] = useState(storeInfo.greeting);
  const [message, setMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      name: name.trim(),
      rif: rif.trim(),
      phone: phone.trim(),
      address: address.trim(),
      greeting: greeting.trim(),
    });
    setMessage('¡Datos del negocio actualizados exitosamente!');
    setTimeout(() => setMessage(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          setMessage('¡Copia de respaldo restaurada con éxito!');
        } else {
          setMessage('Error: El archivo no tiene un formato válido de PapeleraVE.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetCatalog = () => {
    if (
      confirm(
        '¿Deseas restaurar el catálogo predeterminado de papelería? Esto reemplazará los datos actuales.'
      )
    ) {
      resetToDefaults();
      setMessage('¡Catálogo inicial restaurado!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              Configuración & Copias de Respaldo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Store profile form */}
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Datos de la Papelería (Impresión en Comprobantes)
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Negocio / Razón Social
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RIF (Registro Fiscal)
                </label>
                <input
                  type="text"
                  value={rif}
                  onChange={e => setRif(e.target.value)}
                  placeholder="Ej. J-31459876-0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. 0414-1234567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección Física
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Ej. Av. Principal, Local 4"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mensaje al pie del comprobante
              </label>
              <input
                type="text"
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
                placeholder="¡Gracias por su compra!"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Guardar Datos de Tienda
              </button>
            </div>
          </form>

          {/* Backup & Restore Section */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Seguridad & Copias de Respaldo
            </h4>
            <p className="text-xs text-slate-500">
              Tus datos se guardan de forma local en tu navegador. Puedes descargar un respaldo en tu computadora para mayor seguridad o transferirlo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={exportDataJSON}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Descargar Respaldo (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Restaurar desde Respaldo</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleResetCatalog}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar datos de muestra de papelería</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

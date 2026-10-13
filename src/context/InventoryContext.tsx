import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Sale,
  Movement,
  ExchangeRateConfig,
  StoreInfo,
  SaleItem,
  PaymentDetails,
  CurrencyType,
} from '../types/inventory';
import {
  INITIAL_EXCHANGE_RATE,
  DEFAULT_STORE_INFO,
  INITIAL_PRODUCTS,
} from '../data/defaultProducts';
import {
  convertUsdToBs,
  convertBsToUsd,
  generateReceiptNumber,
} from '../utils/formatters';

interface InventoryContextType {
  products: Product[];
  sales: Sale[];
  movements: Movement[];
  exchangeRate: ExchangeRateConfig;
  storeInfo: StoreInfo;
  setExchangeRate: (rate: number, source?: string) => void;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  addProduct: (productData: Omit<Product, 'id' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  quickAdjustStock: (productId: string, delta: number, reason: string) => void;
  recordStockIn: (
    productId: string,
    quantity: number,
    unitCostUsd: number,
    reason?: string,
    newPriceUsd?: number,
    desiredMargin?: number
  ) => void;
  recordSale: (saleData: {
    items: SaleItem[];
    paymentDetails: PaymentDetails;
    customerName?: string;
  }) => Sale;
  cancelSale: (saleId: string) => boolean;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  exportProductsCSV: () => void;
  resetToDefaults: () => void;
}

const STORAGE_KEYS = {
  PRODUCTS: 'papelera_products_v1',
  SALES: 'papelera_sales_v1',
  MOVEMENTS: 'papelera_movements_v1',
  EXCHANGE_RATE: 'papelera_exchange_rate_v1',
  STORE_INFO: 'papelera_store_info_v1',
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exchangeRate, setExchangeRateState] = useState<ExchangeRateConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      rate: INITIAL_EXCHANGE_RATE,
      lastUpdated: new Date().toISOString(),
      source: 'Tasa Oficial (BCV)',
      autoSyncPrices: true,
    };
  });

  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE_INFO);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STORE_INFO;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATE, JSON.stringify(exchangeRate));
    } catch (e) {
      console.error(e);
    }
  }, [exchangeRate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_INFO, JSON.stringify(storeInfo));
    } catch (e) {
      console.error(e);
    }
  }, [storeInfo]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error(e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error(e);
    }
  }, [movements]);

  // Set exchange rate and optionally re-sync dependent product prices
  const setExchangeRate = (newRate: number, source: string = 'Tasa BCV') => {
    if (newRate <= 0) return;
    const now = new Date().toISOString();
    setExchangeRateState(prev => ({
      ...prev,
      rate: newRate,
      lastUpdated: now,
      source: source || prev.source,
    }));

    // Auto-update converted prices according to each product's baseCurrency
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        if (prod.baseCurrency === 'USD') {
          return {
            ...prod,
            priceBs: convertUsdToBs(prod.priceUsd, newRate),
            costBs: convertUsdToBs(prod.costUsd, newRate),
            updatedAt: now,
          };
        } else {
          return {
            ...prod,
            priceUsd: convertBsToUsd(prod.priceBs, newRate),
            costUsd: convertBsToUsd(prod.costBs, newRate),
            updatedAt: now,
          };
        }
      })
    );
  };

  const updateStoreInfo = (info: Partial<StoreInfo>) => {
    setStoreInfo(prev => ({ ...prev, ...info }));
  };

  const addProduct = (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    const id = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id,
      updatedAt: now,
    };

    setProducts(prev => [newProduct, ...prev]);

    // Log initial entry movement if stock > 0
    if (newProduct.stock > 0) {
      const movement: Movement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'IN',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        reason: 'Inventario inicial / Registro de producto',
        timestamp: now,
        totalUsd: newProduct.costUsd * newProduct.stock,
        totalBs: newProduct.costBs * newProduct.stock,
        rateApplied: exchangeRate.rate,
      };
      setMovements(prev => [movement, ...prev]);
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          ...updates,
          updatedAt: now,
        };
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Quick adjust (+ or -) stock
  const quickAdjustStock = (productId: string, delta: number, reason: string) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    const previousStock = target.stock;
    const newStock = Math.max(0, previousStock + delta);
    const now = new Date().toISOString();

    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: newStock, updatedAt: now } : p))
    );

    const movement: Movement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      type: delta >= 0 ? 'IN' : 'ADJUSTMENT',
      quantity: Math.abs(delta),
      previousStock,
      newStock,
      reason: reason || (delta >= 0 ? 'Entrada manual' : 'Ajuste manual'),
      timestamp: now,
      rateApplied: exchangeRate.rate,
    };

    setMovements(prev => [movement, ...prev]);
  };

  // Record replenishment / stock purchase
  const recordStockIn = (
    productId: string,
    quantity: number,
    unitCostUsd: number,
    reason: string = 'Compra de mercancía',
    newPriceUsd?: number,
    desiredMargin?: number
  ) => {
    const target = products.find(p => p.id === productId);
    if (!target || quantity <= 0) return;

    const previousStock = target.stock;
    const newStock = previousStock + quantity;
    const now = new Date().toISOString();

    const updatedCostUsd = unitCostUsd > 0 ? unitCostUsd : target.costUsd;
    const updatedCostBs = convertUsdToBs(updatedCostUsd, exchangeRate.rate);

    const updatedPriceUsd = newPriceUsd && newPriceUsd > 0 ? newPriceUsd : target.priceUsd;
    const updatedPriceBs = convertUsdToBs(updatedPriceUsd, exchangeRate.rate);

    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              costUsd: updatedCostUsd,
              costBs: updatedCostBs,
              priceUsd: updatedPriceUsd,
              priceBs: updatedPriceBs,
              desiredMargin: desiredMargin !== undefined ? desiredMargin : p.desiredMargin,
              updatedAt: now,
            }
          : p
      )
    );

    const movement: Movement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      type: 'IN',
      quantity,
      previousStock,
      newStock,
      reason,
      timestamp: now,
      totalUsd: updatedCostUsd * quantity,
      totalBs: updatedCostBs * quantity,
      rateApplied: exchangeRate.rate,
    };

    setMovements(prev => [movement, ...prev]);
  };

  // Record Sale and decrease inventory
  const recordSale = (saleData: {
    items: SaleItem[];
    paymentDetails: PaymentDetails;
    customerName?: string;
  }): Sale => {
    const now = new Date().toISOString();
    const receiptNumber = generateReceiptNumber();

    const totalUsd = saleData.items.reduce((acc, item) => acc + item.subtotalUsd, 0);
    const totalBs = saleData.items.reduce((acc, item) => acc + item.subtotalBs, 0);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber,
      items: saleData.items,
      totalUsd: Math.round(totalUsd * 100) / 100,
      totalBs: Math.round(totalBs * 100) / 100,
      rate: exchangeRate.rate,
      paymentDetails: saleData.paymentDetails,
      customerName: saleData.customerName || 'Cliente Mostrador',
      timestamp: now,
      status: 'COMPLETED',
    };

    // Update product stock and log movements
    const newMovements: Movement[] = [];

    setProducts(prevProducts => {
      const updated = [...prevProducts];

      saleData.items.forEach(saleItem => {
        const prodIndex = updated.findIndex(p => p.id === saleItem.productId);
        if (prodIndex >= 0) {
          const currentProd = updated[prodIndex];
          // For service items (like copies with very high virtual stock), avoid negative
          const previousStock = currentProd.stock;
          const nextStock = Math.max(0, previousStock - saleItem.quantity);

          updated[prodIndex] = {
            ...currentProd,
            stock: nextStock,
            updatedAt: now,
          };

          newMovements.push({
            id: `mov-${Date.now()}-${saleItem.productId}`,
            productId: currentProd.id,
            productName: currentProd.name,
            sku: currentProd.sku,
            type: 'OUT_SALE',
            quantity: saleItem.quantity,
            previousStock,
            newStock: nextStock,
            reason: `Venta ${receiptNumber}`,
            timestamp: now,
            totalUsd: saleItem.subtotalUsd,
            totalBs: saleItem.subtotalBs,
            rateApplied: exchangeRate.rate,
          });
        }
      });

      return updated;
    });

    setMovements(prev => [...newMovements, ...prev]);
    setSales(prev => [newSale, ...prev]);

    return newSale;
  };

  // Cancel sale and restore items
  const cancelSale = (saleId: string): boolean => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale || targetSale.status === 'CANCELLED') return false;

    const now = new Date().toISOString();

    // Mark sale cancelled
    setSales(prev =>
      prev.map(s => (s.id === saleId ? { ...s, status: 'CANCELLED' } : s))
    );

    // Restore stock
    const newMovements: Movement[] = [];

    setProducts(prevProducts => {
      const updated = [...prevProducts];

      targetSale.items.forEach(item => {
        const prodIndex = updated.findIndex(p => p.id === item.productId);
        if (prodIndex >= 0) {
          const current = updated[prodIndex];
          const previousStock = current.stock;
          const nextStock = previousStock + item.quantity;

          updated[prodIndex] = {
            ...current,
            stock: nextStock,
            updatedAt: now,
          };

          newMovements.push({
            id: `mov-${Date.now()}-ret-${item.productId}`,
            productId: current.id,
            productName: current.name,
            sku: current.sku,
            type: 'RETURN',
            quantity: item.quantity,
            previousStock,
            newStock: nextStock,
            reason: `Anulación de Venta ${targetSale.receiptNumber}`,
            timestamp: now,
            totalUsd: item.subtotalUsd,
            totalBs: item.subtotalBs,
            rateApplied: targetSale.rate,
          });
        }
      });

      return updated;
    });

    setMovements(prev => [...newMovements, ...prev]);
    return true;
  };

  // Export all database to JSON
  const exportDataJSON = () => {
    const exportObject = {
      app: 'PapeleraVE',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exchangeRate,
      storeInfo,
      products,
      sales,
      movements,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `respaldo-papeleria-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products);
        if (parsed.sales && Array.isArray(parsed.sales)) setSales(parsed.sales);
        if (parsed.movements && Array.isArray(parsed.movements)) setMovements(parsed.movements);
        if (parsed.exchangeRate && typeof parsed.exchangeRate.rate === 'number') {
          setExchangeRateState(parsed.exchangeRate);
        }
        if (parsed.storeInfo) setStoreInfo(parsed.storeInfo);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Export products to CSV compatible with Excel
  const exportProductsCSV = () => {
    const headers = [
      'Código (SKU)',
      'Nombre de Producto',
      'Categoría',
      'Stock Actual',
      'Stock Mínimo',
      'Costo USD',
      'Costo Bs',
      'Precio Venta USD',
      'Precio Venta Bs',
      'Moneda Base',
      'Ubicación',
    ];

    const rows = products.map(p => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.stock,
      p.minStock,
      p.costUsd.toFixed(2),
      p.costBs.toFixed(2),
      p.priceUsd.toFixed(2),
      p.priceBs.toFixed(2),
      p.baseCurrency,
      `"${(p.location || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario-papeleria-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Reset to default sample catalog
  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales([]);
    setMovements([]);
    setExchangeRateState({
      rate: INITIAL_EXCHANGE_RATE,
      lastUpdated: new Date().toISOString(),
      source: 'Tasa Oficial (BCV)',
      autoSyncPrices: true,
    });
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        sales,
        movements,
        exchangeRate,
        storeInfo,
        setExchangeRate,
        updateStoreInfo,
        addProduct,
        updateProduct,
        deleteProduct,
        quickAdjustStock,
        recordStockIn,
        recordSale,
        cancelSale,
        exportDataJSON,
        importDataJSON,
        exportProductsCSV,
        resetToDefaults,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

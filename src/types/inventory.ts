export type CurrencyType = 'USD' | 'VES';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  costUsd: number;
  costBs: number;
  priceUsd: number;
  priceBs: number;
  baseCurrency: CurrencyType;
  desiredMargin?: number;
  location?: string;
  barcode?: string;
  description?: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT_SALE' | 'ADJUSTMENT' | 'RETURN';

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  totalBs?: number;
  totalUsd?: number;
  rateApplied?: number;
}

export interface SaleItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceUsd: number;
  unitPriceBs: number;
  subtotalUsd: number;
  subtotalBs: number;
}

export type PaymentMethod = 
  | 'PAGO_MOVIL' 
  | 'PUNTO_VENTA' 
  | 'EFECTIVO_USD' 
  | 'EFECTIVO_BS' 
  | 'ZELLE' 
  | 'MIXTO';

export interface PaymentDetails {
  method: PaymentMethod;
  receivedUsd?: number;
  receivedBs?: number;
  changeUsd?: number;
  changeBs?: number;
  reference?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  items: SaleItem[];
  totalUsd: number;
  totalBs: number;
  rate: number;
  paymentDetails: PaymentDetails;
  customerName?: string;
  timestamp: string;
  status: 'COMPLETED' | 'CANCELLED';
}

export interface ExchangeRateConfig {
  rate: number; // Bolívares per 1 USD
  lastUpdated: string;
  source: string; // e.g., 'Tasa BCV', 'Paralelo', 'Personalizada'
  autoSyncPrices: boolean;
}

export interface StoreInfo {
  name: string;
  rif: string;
  phone: string;
  address: string;
  greeting: string;
}

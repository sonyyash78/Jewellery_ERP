import { create } from 'zustand';

export type MakingChargeType = 'percent' | 'per_gm' | 'flat';
export type GSTState = 'same_state' | 'different_state';
export type ItemType = 'Gold' | 'Silver';

export interface BaseCalcForm {
  itemName: string;
  category: string;
  hsn: string;
  grossWeight: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  otherCharges: number;
  discount: number;
}

export interface GoldForm extends BaseCalcForm {
  purity: string;
  touch: number;
  stoneWeight: number;
  ratePerGm: number;
  hallmark: number;
}

export interface SilverForm extends BaseCalcForm {
  tanch: number;
  silverPurity: string;
  ratePerKg: number;
}

export interface BillItem {
  id: string;
  itemType: ItemType;
  stockItemId?: number; // Added for QR Billing
  
  // Display fields
  itemName: string;
  purityDisplay: string;
  touchDisplay: number;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  rateDisplay: number;
  
  // Math fields
  metalValue: number;
  makingAmount: number;
  hallmark: number;
  otherCharges: number;
  discount: number;
  taxableAmount: number;
  
  // Store the raw form for re-editing/API payload
  rawGold?: GoldForm;
  rawSilver?: SilverForm;
}

interface BillingStoreState {
  cart: BillItem[];
  gstState: GSTState;
  recentScans: string[]; // Keep track of scanned item codes
  
  // Independent Forms
  goldForm: GoldForm;
  silverForm: SilverForm;
  
  // Actions
  setGstState: (val: GSTState) => void;
  updateGoldForm: (field: keyof GoldForm, value: any) => void;
  updateSilverForm: (field: keyof SilverForm, value: any) => void;
  resetGoldForm: () => void;
  resetSilverForm: () => void;
  addToCart: (item: BillItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  addRecentScan: (code: string) => void;
}

const initialGoldForm: GoldForm = {
  itemName: '', category: '', hsn: '', purity: '22K (91.6)', touch: 91.6,
  grossWeight: 0, stoneWeight: 0, ratePerGm: 7245,
  makingChargeType: 'per_gm', makingChargeValue: 650,
  hallmark: 120, otherCharges: 250, discount: 0
};

const initialSilverForm: SilverForm = {
  itemName: '', category: '', hsn: '',
  grossWeight: 0, tanch: 65, silverPurity: 'Fine', ratePerKg: 90000,
  makingChargeType: 'per_gm', makingChargeValue: 30,
  otherCharges: 150, discount: 0
};

export const useBillingStore = create<BillingStoreState>((set) => ({
  cart: [],
  gstState: 'same_state',
  recentScans: [],
  
  goldForm: initialGoldForm,
  silverForm: initialSilverForm,
  
  setGstState: (val) => set({ gstState: val }),
  updateGoldForm: (field, value) => set((state) => ({ goldForm: { ...state.goldForm, [field]: value } })),
  updateSilverForm: (field, value) => set((state) => ({ silverForm: { ...state.silverForm, [field]: value } })),
  
  resetGoldForm: () => set({ goldForm: initialGoldForm }),
  resetSilverForm: () => set({ silverForm: initialSilverForm }),
  
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter(i => i.id !== id) })),
  clearCart: () => set({ cart: [], recentScans: [] }),
  addRecentScan: (code) => set((state) => ({ recentScans: [code, ...state.recentScans] }))
}));

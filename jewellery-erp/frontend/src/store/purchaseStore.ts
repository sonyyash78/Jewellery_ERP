import { create } from 'zustand';

export interface PurchaseItem {
  id: string;
  metalType: 'Gold' | 'Silver';
  itemName: string;
  category: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  touchPurity: number;
  wastage: number;
  fineWeight: number;
  metalRate: number;
  metalValue: number;
  labourCharge: number;
  testingMeltingCharge: number;
  hallmarkCharge: number;
  otherCharges: number;
  discount: number;
  taxableAmount: number;
}

interface PurchaseStoreState {
  items: PurchaseItem[];
  gstState: 'same_state' | 'different_state';
  
  goldForm: {
    itemName: string;
    category: string;
    grossWeight: number;
    stoneWeight: number;
    touchPurity: number;
    metalRate: number;
    labourCharge: number;
    hallmarkCharge: number;
    otherCharges: number;
    discount: number;
  };
  
  silverForm: {
    itemName: string;
    grossWeight: number;
    tanch: number;
    wastage: number;
    metalRate: number;
    testingMeltingCharge: number;
    otherCharges: number;
    discount: number;
  };

  updateGoldForm: (key: string, value: any) => void;
  updateSilverForm: (key: string, value: any) => void;
  setGstState: (val: 'same_state' | 'different_state') => void;
  addItem: (item: PurchaseItem) => void;
  removeItem: (id: string) => void;
  resetForms: () => void;
  clearCart: () => void;
}

export const usePurchaseStore = create<PurchaseStoreState>((set) => ({
  items: [],
  gstState: 'same_state',
  
  goldForm: {
    itemName: '', category: '', grossWeight: 0, stoneWeight: 0, touchPurity: 0,
    metalRate: 0, labourCharge: 0, hallmarkCharge: 0, otherCharges: 0, discount: 0
  },
  
  silverForm: {
    itemName: '', grossWeight: 0, tanch: 0, wastage: 0,
    metalRate: 0, testingMeltingCharge: 0, otherCharges: 0, discount: 0
  },

  updateGoldForm: (key, value) => set((state) => ({ goldForm: { ...state.goldForm, [key]: value } })),
  updateSilverForm: (key, value) => set((state) => ({ silverForm: { ...state.silverForm, [key]: value } })),
  setGstState: (val) => set({ gstState: val }),
  
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  
  resetForms: () => set({
    goldForm: { itemName: '', category: '', grossWeight: 0, stoneWeight: 0, touchPurity: 0, metalRate: 0, labourCharge: 0, hallmarkCharge: 0, otherCharges: 0, discount: 0 },
    silverForm: { itemName: '', grossWeight: 0, tanch: 0, wastage: 0, metalRate: 0, testingMeltingCharge: 0, otherCharges: 0, discount: 0 }
  }),
  
  clearCart: () => set({ items: [] })
}));

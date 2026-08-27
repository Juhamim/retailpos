export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  loyaltyPoints: number;
  creditBalance: number;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithStats extends Customer {
  averageOrderValue: number;
}

export interface DemoProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: string;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  status: string;
}

export interface DemoCategory {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface DemoCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  loyaltyPoints: number;
  creditBalance: number;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseAt: string;
}

export interface DemoSupplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: "cat1", name: "Beverages", description: "Soft drinks, juices, and water", sortOrder: 1 },
  { id: "cat2", name: "Snacks", description: "Chips, biscuits, and namkeen", sortOrder: 2 },
  { id: "cat3", name: "Food", description: "Staples, oil, and cooking essentials", sortOrder: 3 },
  { id: "cat4", name: "Dairy", description: "Milk, butter, and cheese", sortOrder: 4 },
  { id: "cat5", name: "Personal Care", description: "Soaps, toothpaste, and shampoo", sortOrder: 5 },
  { id: "cat6", name: "Household", description: "Cleaning and home essentials", sortOrder: 6 },
  { id: "cat7", name: "Stationery", description: "Pens, pencils, and notebooks", sortOrder: 7 },
];

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: "p1", name: "Coca-Cola 500ml", sku: "CC500", barcode: "8901234567890", category: "Beverages", description: "Refreshing cola drink", purchasePrice: 28, sellingPrice: 40, gstRate: "18", stockQuantity: 150, reorderLevel: 20, unit: "piece", status: "active" },
  { id: "p2", name: "Pepsi 500ml", sku: "PEP500", barcode: "8901234567891", category: "Beverages", description: "Refreshing cola drink", purchasePrice: 28, sellingPrice: 40, gstRate: "18", stockQuantity: 120, reorderLevel: 20, unit: "piece", status: "active" },
  { id: "p3", name: "Lays Classic Salted", sku: "LCS100", barcode: "8901234567892", category: "Snacks", description: "Classic salted potato chips", purchasePrice: 12, sellingPrice: 20, gstRate: "12", stockQuantity: 200, reorderLevel: 30, unit: "piece", status: "active" },
  { id: "p4", name: "Maggi Noodles 70g", sku: "MAG70", barcode: "8901234567893", category: "Food", description: "Instant noodles", purchasePrice: 9, sellingPrice: 14, gstRate: "18", stockQuantity: 180, reorderLevel: 25, unit: "piece", status: "active" },
  { id: "p5", name: "Dove Soap 100g", sku: "DOV100", barcode: "8901234567894", category: "Personal Care", description: "Mourishing soap", purchasePrice: 42, sellingPrice: 58, gstRate: "18", stockQuantity: 75, reorderLevel: 15, unit: "piece", status: "active" },
  { id: "p6", name: "Colgate Toothpaste 150g", sku: "COL150", barcode: "8901234567895", category: "Personal Care", description: "Complete oral care", purchasePrice: 68, sellingPrice: 95, gstRate: "18", stockQuantity: 60, reorderLevel: 15, unit: "piece", status: "active" },
  { id: "p7", name: "Britannia Biscuits", sku: "BRB250", barcode: "8901234567896", category: "Snacks", description: "Premium biscuits", purchasePrice: 22, sellingPrice: 30, gstRate: "18", stockQuantity: 90, reorderLevel: 20, unit: "piece", status: "active" },
  { id: "p8", name: "Parle-G 100g", sku: "PGL100", barcode: "8901234567897", category: "Snacks", description: "Glucose biscuits", purchasePrice: 6, sellingPrice: 10, gstRate: "18", stockQuantity: 300, reorderLevel: 50, unit: "piece", status: "active" },
  { id: "p9", name: "Amul Butter 100g", sku: "AMB100", barcode: "8901234567898", category: "Dairy", description: "Fresh butter", purchasePrice: 44, sellingPrice: 56, gstRate: "12", stockQuantity: 30, reorderLevel: 10, unit: "piece", status: "active" },
  { id: "p10", name: "Nescafe Classic 50g", sku: "NES50", barcode: "8901234567899", category: "Beverages", description: "Instant coffee", purchasePrice: 110, sellingPrice: 145, gstRate: "18", stockQuantity: 45, reorderLevel: 10, unit: "piece", status: "active" },
  { id: "p11", name: "Tata Salt 1kg", sku: "TAS1K", barcode: "8901234567800", category: "Food", description: "Iodised salt", purchasePrice: 20, sellingPrice: 28, gstRate: "0", stockQuantity: 100, reorderLevel: 20, unit: "kg", status: "active" },
  { id: "p12", name: "Fortune Oil 1L", sku: "FRO1L", barcode: "8901234567801", category: "Food", description: "Refined sunflower oil", purchasePrice: 155, sellingPrice: 185, gstRate: "5", stockQuantity: 25, reorderLevel: 10, unit: "litre", status: "active" },
  { id: "p13", name: "Surf Excel 500g", sku: "SFX500", barcode: "8901234567802", category: "Household", description: "Washing powder", purchasePrice: 48, sellingPrice: 62, gstRate: "18", stockQuantity: 80, reorderLevel: 15, unit: "piece", status: "active" },
  { id: "p14", name: "Vim Dishwash 250ml", sku: "VIM250", barcode: "8901234567803", category: "Household", description: "Dishwashing liquid", purchasePrice: 25, sellingPrice: 35, gstRate: "18", stockQuantity: 70, reorderLevel: 15, unit: "piece", status: "active" },
  { id: "p15", name: "Harpic Power Plus", sku: "HPP500", barcode: "8901234567804", category: "Household", description: "Toilet cleaner", purchasePrice: 72, sellingPrice: 99, gstRate: "18", stockQuantity: 40, reorderLevel: 10, unit: "piece", status: "active" },
  { id: "p16", name: "Close-Up Toothpaste 150g", sku: "CUP150", barcode: "8901234567805", category: "Personal Care", description: "Red hot flavor", purchasePrice: 65, sellingPrice: 90, gstRate: "18", stockQuantity: 55, reorderLevel: 15, unit: "piece", status: "active" },
  { id: "p17", name: "Milk Bikis 250g", sku: "MBS250", barcode: "8901234567806", category: "Snacks", description: "Milk biscuits", purchasePrice: 18, sellingPrice: 25, gstRate: "18", stockQuantity: 120, reorderLevel: 20, unit: "piece", status: "active" },
  { id: "p18", name: "Thums Up 300ml", sku: "TU300", barcode: "8901234567807", category: "Beverages", description: "Strong cola", purchasePrice: 14, sellingPrice: 20, gstRate: "18", stockQuantity: 0, reorderLevel: 20, unit: "piece", status: "active" },
  { id: "p19", name: "Red Bull 250ml", sku: "RDB250", barcode: "8901234567808", category: "Beverages", description: "Energy drink", purchasePrice: 85, sellingPrice: 115, gstRate: "18", stockQuantity: 3, reorderLevel: 5, unit: "piece", status: "active" },
  { id: "p20", name: "Haldiram Aloo Bhujia 200g", sku: "HAB200", barcode: "8901234567809", category: "Snacks", description: "Spicy potato snack", purchasePrice: 32, sellingPrice: 45, gstRate: "12", stockQuantity: 65, reorderLevel: 15, unit: "piece", status: "active" },
  { id: "p21", name: "Minute Maid 400ml", sku: "MMM400", barcode: "8901234567810", category: "Beverages", description: "Pulpy orange drink", purchasePrice: 20, sellingPrice: 30, gstRate: "12", stockQuantity: 40, reorderLevel: 10, unit: "piece", status: "active" },
  { id: "p22", name: "Nataraj Pencils Box", sku: "NPB10", barcode: "8901234567811", category: "Stationery", description: "Pack of 10 pencils", purchasePrice: 30, sellingPrice: 45, gstRate: "12", stockQuantity: 100, reorderLevel: 20, unit: "box", status: "active" },
  { id: "p23", name: "Linc Pen Pack", sku: "LPN5", barcode: "8901234567812", category: "Stationery", description: "Pack of 5 pens", purchasePrice: 35, sellingPrice: 50, gstRate: "12", stockQuantity: 80, reorderLevel: 15, unit: "pack", status: "active" },
  { id: "p24", name: "Kurkure 90g", sku: "KRK90", barcode: "8901234567813", category: "Snacks", description: "Crunchy corn snack", purchasePrice: 12, sellingPrice: 20, gstRate: "12", stockQuantity: 150, reorderLevel: 25, unit: "piece", status: "active" },
];

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { id: "c1", name: "Rajesh Kumar", phone: "9876543210", email: "rajesh@email.com", address: "12 MG Road, Bangalore", loyaltyPoints: 1250, creditBalance: 0, totalSpent: 12500, totalOrders: 45, lastPurchaseAt: "2026-08-27T10:30:00Z" },
  { id: "c2", name: "Priya Sharma", phone: "9876543211", email: "priya@email.com", address: "45 Park Street, Kolkata", loyaltyPoints: 890, creditBalance: 200, totalSpent: 8900, totalOrders: 32, lastPurchaseAt: "2026-08-26T14:15:00Z" },
  { id: "c3", name: "Amit Patel", phone: "9876543212", email: "amit@email.com", address: "78 CG Road, Ahmedabad", loyaltyPoints: 1560, creditBalance: 0, totalSpent: 15600, totalOrders: 28, lastPurchaseAt: "2026-08-25T09:00:00Z" },
  { id: "c4", name: "Sunita Devi", phone: "9876543213", email: "", address: "", loyaltyPoints: 450, creditBalance: 0, totalSpent: 4500, totalOrders: 18, lastPurchaseAt: "2026-08-24T16:45:00Z" },
  { id: "c5", name: "Mohammed Ali", phone: "9876543214", email: "mohammed@email.com", address: "23 MG Road, Hyderabad", loyaltyPoints: 2200, creditBalance: 0, totalSpent: 22000, totalOrders: 52, lastPurchaseAt: "2026-08-27T11:00:00Z" },
  { id: "c6", name: "Anjali Singh", phone: "9876543215", email: "anjali@email.com", address: "56 Civil Lines, Delhi", loyaltyPoints: 380, creditBalance: 0, totalSpent: 3800, totalOrders: 15, lastPurchaseAt: "2026-08-20T13:30:00Z" },
  { id: "c7", name: "Vikram Reddy", phone: "9876543216", email: "vikram@email.com", address: "89 Banjara Hills, Hyderabad", loyaltyPoints: 1820, creditBalance: 500, totalSpent: 18200, totalOrders: 41, lastPurchaseAt: "2026-08-27T09:15:00Z" },
  { id: "c8", name: "Deepa Nair", phone: "9876543217", email: "", address: "34 Marine Drive, Kochi", loyaltyPoints: 670, creditBalance: 0, totalSpent: 6700, totalOrders: 22, lastPurchaseAt: "2026-08-22T17:00:00Z" },
  { id: "c9", name: "Sanjay Gupta", phone: "9876543218", email: "sanjay@email.com", address: "67 Lajpat Nagar, Delhi", loyaltyPoints: 1430, creditBalance: 0, totalSpent: 14300, totalOrders: 38, lastPurchaseAt: "2026-08-26T12:45:00Z" },
  { id: "c10", name: "Meera Joshi", phone: "9876543219", email: "meera@email.com", address: "90 FC Road, Pune", loyaltyPoints: 290, creditBalance: 0, totalSpent: 2900, totalOrders: 12, lastPurchaseAt: "2026-08-18T15:30:00Z" },
];

export const DEMO_SUPPLIERS: DemoSupplier[] = [
  { id: "s1", name: "Fresh Groceries Ltd", contactPerson: "Ramesh Iyer", phone: "9123456780", email: "ramesh@freshgroceries.com", address: "12 Industrial Area, Bangalore", gstNumber: "27AABCT1234F1Z5" },
  { id: "s2", name: "Tech Distributors", contactPerson: "Suresh Menon", phone: "9123456781", email: "suresh@techdist.com", address: "34 Commerce Street, Chennai", gstNumber: "29CCCDT5678G1Z3" },
  { id: "s3", name: "FMCG Wholesale", contactPerson: "Anil Kapoor", phone: "9123456782", email: "anil@fmcgwholesale.com", address: "56 Market Yard, Mumbai", gstNumber: "07DDDWE9012H1Z1" },
  { id: "s4", name: "Premium Brands", contactPerson: "Neha Agarwal", phone: "9123456783", email: "neha@premiumbrands.com", address: "78 Brand Avenue, Delhi", gstNumber: "24EEEFB3456I1Z7" },
  { id: "s5", name: "Local Farmers Market", contactPerson: "Venkat Rao", phone: "9123456784", email: "venkat@farmersmarket.in", address: "90 Farm Road, Hyderabad", gstNumber: "36FFFGA7890J1Z9" },
];

export const DEMO_USER = {
  id: "u1",
  username: "admin",
  email: "admin@retailflow.com",
  firstName: "Admin",
  lastName: "User",
  role: "owner" as const,
};

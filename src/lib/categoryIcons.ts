import {
    ShoppingCart,
    Utensils,
    Car,
    Home,
    Gamepad2,
    Shirt,
    Heart,
    GraduationCap,
    Plane,
    Gift,
    Smartphone,
    Briefcase,
    TrendingUp,
    Banknote,
    PiggyBank,
    Coins,
    CreditCard,
    Receipt,
    Zap,
    Droplets,
    Wifi,
    Phone,
    Building,
    Coffee,
    Music,
    Film,
    Book,
    Dumbbell,
    Pill,
    Baby,
    Dog,
    Hammer,
    Scissors,
    Fuel,
    Bus,
    Bike,
    LucideIcon,
    MoreHorizontal
} from 'lucide-react';

// Category icon mapping
export const categoryIcons: Record<string, LucideIcon> = {
    // Expense categories
    'Makanan': Utensils,
    'Makanan & Minuman': Utensils,
    'Transportasi': Car,
    'Belanja': ShoppingCart,
    'Hiburan': Gamepad2,
    'Tagihan': Receipt,
    'Listrik': Zap,
    'Air': Droplets,
    'Internet': Wifi,
    'Telepon': Phone,
    'Sewa': Building,
    'Kebutuhan Rumah': Home,
    'Pakaian': Shirt,
    'Kesehatan': Pill,
    'Pendidikan': GraduationCap,
    'Kecantikan': Scissors,
    'Hobi': Music,
    'Olahraga': Dumbbell,
    'Perjalanan': Plane,
    'Hadiah': Gift,
    'Kopi': Coffee,
    'Film': Film,
    'Buku': Book,
    'Bayi': Baby,
    'Hewan Peliharaan': Dog,
    'Perbaikan': Hammer,
    'Bensin': Fuel,
    'Transportasi Umum': Bus,
    'Sepeda': Bike,
    'Gadget': Smartphone,

    // Income categories
    'Gaji': Briefcase,
    'Bonus': Gift,
    'Investasi': TrendingUp,
    'Freelance': Briefcase,
    'Bisnis': Building,
    'Penjualan': Coins,
    'Hadiah Uang': Banknote,
    'Cashback': CreditCard,
    'Bunga': PiggyBank,
    'Dividen': TrendingUp,
    'Lainnya': MoreHorizontal,
};

// Get icon for category, fallback to default
export const getCategoryIcon = (categoryName: string): LucideIcon => {
    return categoryIcons[categoryName] || MoreHorizontal;
};

// Category colors based on type
export const getCategoryColor = (type: 'income' | 'expense'): string => {
    return type === 'income' ? '#22c55e' : '#ef4444';
};

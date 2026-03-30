export type Role = 'ADMIN' | 'SUPERVISOR' | 'SELLER';
export type User = { id: string; name: string; email: string; role: Role };
export type SessionUser = User & {
  mustChangePassword?: boolean;
  _forceChangePassword?: boolean;
};

export type InstallerAutoConfig =
  | { mode: 'server'; host?: string; port?: number; user?: string; password?: string; database?: string }
  | { mode: 'cashier' }
  | null;

export type Product = {
  id?: string;
  brand: string;
  model: string;
  cpu: string;
  ram_gb: number;
  storage: string;
  condition: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  notes?: string;
};

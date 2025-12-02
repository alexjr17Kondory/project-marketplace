export type UserRole = 'user' | 'admin' | 'superadmin';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  cedula?: string;
  address?: UserAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

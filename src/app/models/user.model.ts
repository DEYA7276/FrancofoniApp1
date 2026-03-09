export interface User {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'usuario';
  createdAt?: Date;
}

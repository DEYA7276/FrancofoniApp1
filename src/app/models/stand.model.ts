export interface Stand {
  id?: string;
  nombre: string;
  descripcion: string;
  usuarioId: string; // The user (role 'usuario') assigned to this stand
  activo: boolean;
}

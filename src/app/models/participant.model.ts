export interface Participant {
  id?: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  ciudad: string;
  municipio: string;
  sexo: string;
  correo: string;
  qrCode?: string; // URL from Storage
  correoEnviado?: boolean;
  createdAt?: string | Date | any; // Any valid Firestore timestamp or date string
}

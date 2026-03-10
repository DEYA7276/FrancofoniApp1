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
<<<<<<< HEAD
  correoEnviado?: boolean;
=======
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
  createdAt?: string | Date | any; // Any valid Firestore timestamp or date string
}

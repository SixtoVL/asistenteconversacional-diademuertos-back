import { z } from 'zod';

export const categoriaSchema = z.enum(['historia', 'ofrendas', 'simbolos', 'tradiciones']);

export const estadoHechoSchema = z.enum(['pending', 'in_review', 'verified', 'rejected']);

export const referenciaFuenteSchema = z.object({
  fuenteId: z.string().min(1),
  paginas: z.string().min(1),
});

export const hechoSchema = z.object({
  id: z.string().min(1),
  tema: z.string().min(1),
  afirmacion: z.string().min(1),
  descripcion: z.string().min(1),
  categoria: categoriaSchema,
  ambito: z.string().min(1),
  fuentes: z.array(referenciaFuenteSchema).min(1),
  estado: estadoHechoSchema,
});

export const fuenteSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  autor: z.string().min(1),
  anio: z.number().int().min(1500).max(2100),
  publicacion: z.string().min(1).optional(),
  archivo: z.string().min(1),
  temas: z.array(z.string().min(1)).min(1),
});

export type Hecho = z.infer<typeof hechoSchema>;
export type Fuente = z.infer<typeof fuenteSchema>;

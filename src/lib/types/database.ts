export type Rol = 'comprador' | 'vendedor' | 'ambos'
export type EstadoDiseno = 'revision' | 'publicado' | 'rechazado'

export type Perfil = {
  id: string
  nombre: string
  email: string | null
  rol: Rol
  es_suscriptor: boolean
  suscripcion_vence: string | null
  es_admin: boolean
  created_at: string
}

export type Diseno = {
  id: string
  vendedor_id: string
  nombre: string
  deporte: string
  formato: string
  es_gratis: boolean
  precio: number
  estado: EstadoDiseno
  autoria_confirmada: boolean
  es_oficial: boolean
  es_pro: boolean
  rar_url: string | null
  imagen_url: string | null
  created_at: string
}

export type Descarga = {
  id: string
  diseno_id: string
  usuario_id: string | null
  precio_pagado: number
  via_suscripcion: boolean
  cuenta_para_pago: boolean
  created_at: string
}

export type MetodoCobro = {
  id: string
  vendedor_id: string
  banco: string | null
  numero_cuenta: string | null
  titular: string | null
  ci_ruc: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil
        Insert: Partial<Perfil> & Pick<Perfil, 'id' | 'nombre'>
        Update: Partial<Perfil>
        Relationships: []
      }
      disenos: {
        Row: Diseno
        Insert: Partial<Diseno> & Pick<Diseno, 'vendedor_id' | 'nombre' | 'deporte'>
        Update: Partial<Diseno>
        Relationships: []
      }
      descargas: {
        Row: Descarga
        Insert: Partial<Descarga> & Pick<Descarga, 'diseno_id'>
        Update: Partial<Descarga>
        Relationships: []
      }
      metodos_cobro: {
        Row: MetodoCobro
        Insert: Partial<MetodoCobro> & Pick<MetodoCobro, 'vendedor_id'>
        Update: Partial<MetodoCobro>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

export type Rol = 'comprador' | 'vendedor' | 'ambos'
export type EstadoDiseno = 'revision' | 'publicado' | 'rechazado'
export type EstadoVendedor = 'ninguno' | 'pendiente' | 'aprobado' | 'rechazado'

export type Perfil = {
  id: string
  nombre: string
  email: string | null
  rol: Rol
  es_suscriptor: boolean
  suscripcion_vence: string | null
  es_admin: boolean
  limite_disenos_mes: number | null
  estado_vendedor: EstadoVendedor
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

export type EstadoSolicitudPrecio = 'pendiente' | 'aprobada' | 'rechazada'

export type SolicitudPrecio = {
  id: string
  diseno_id: string
  vendedor_id: string
  es_gratis: boolean
  precio: number
  estado: EstadoSolicitudPrecio
  created_at: string
}

export type EstadoSolicitudPago = 'pendiente' | 'pagado'

export type SolicitudPago = {
  id: string
  vendedor_id: string
  estado: EstadoSolicitudPago
  created_at: string
  pagado_at: string | null
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
      solicitudes_precio: {
        Row: SolicitudPrecio
        Insert: Partial<SolicitudPrecio> & Pick<SolicitudPrecio, 'diseno_id' | 'vendedor_id' | 'es_gratis'>
        Update: Partial<SolicitudPrecio>
        Relationships: []
      }
      solicitudes_pago: {
        Row: SolicitudPago
        Insert: Partial<SolicitudPago> & Pick<SolicitudPago, 'vendedor_id'>
        Update: Partial<SolicitudPago>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

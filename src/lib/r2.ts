import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const R2_LIMITS = {
  MAX_RAR_BYTES: 50 * 1024 * 1024,
  MAX_IMAGEN_BYTES: 3 * 1024 * 1024,
  MAX_DISENOS_EN_REVISION: 3,
  MAX_DISENOS_POR_MES: 10,
  DISENOS_APROBADOS_PARA_COBRO: 10,
  STORAGE_LIMIT_BYTES: 10 * 1024 * 1024 * 1024,
} as const

export const SUSCRIPCION = {
  PRECIO_MENSUAL: 50000,
  MAX_DESCARGAS_EXTERNAS_POR_MES: 10,
  MAX_DESCARGAS_EXTERNAS_POR_DIA: 5,
} as const

/** Tipos de archivo aceptados. Se validan en el servidor: el navegador puede mentir. */
export const TIPOS_RAR = [
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-rar',
  'application/octet-stream',
] as const

export const EXTENSION_POR_TIPO_IMAGEN: Record<string, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

let client: S3Client | null = null

function getR2Client() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      // El SDK agrega por defecto un checksum a la firma que un PUT plano desde
      // el navegador no puede replicar, y R2 responde 403. Lo desactivamos.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    })
  }
  return client
}

/**
 * Dos buckets:
 *  - público (R2_BUCKET_NAME): solo portadas, se sirven por R2_PUBLIC_URL.
 *  - privado (R2_BUCKET_PRIVATE): los .rar, sin acceso público; solo con URL firmada.
 * Mientras R2_BUCKET_PRIVATE no esté definido, los .rar siguen en el bucket único de antes.
 */
type Almacen = 'publico' | 'privado'

const BUCKET_PUBLICO = () => process.env.R2_BUCKET_NAME!
const BUCKET_PRIVADO = () => process.env.R2_BUCKET_PRIVATE || process.env.R2_BUCKET_NAME!

function almacenDeClave(key: string): Almacen {
  return key.endsWith('/archivo.rar') ? 'privado' : 'publico'
}

const bucketDeClave = (key: string) => (almacenDeClave(key) === 'privado' ? BUCKET_PRIVADO() : BUCKET_PUBLICO())

export function disenoRarKey(disenoId: string) {
  return `disenos/${disenoId}/archivo.rar`
}

export function disenoImagenKey(disenoId: string, extension: 'jpg' | 'png' | 'webp') {
  return `disenos/${disenoId}/portada.${extension}`
}

/** ¿Es exactamente la clave del .rar de este diseño? */
export function esClaveRarDe(disenoId: string, key: string) {
  return key === disenoRarKey(disenoId)
}

/** ¿Es una portada válida (jpg/png/webp) de este diseño? */
export function esClaveImagenDe(disenoId: string, key: string) {
  const prefijo = `disenos/${disenoId}/portada.`
  return key.startsWith(prefijo) && ['jpg', 'png', 'webp'].includes(key.slice(prefijo.length))
}

/**
 * URL firmada temporal para que el vendedor suba un archivo directo a R2 (PUT).
 * El tamaño y el tipo quedan firmados: si el navegador manda otra cosa, R2 rechaza la subida.
 */
export async function getUploadUrl(key: string, contentType: string, sizeBytes: number, expiresInSeconds = 300) {
  const command = new PutObjectCommand({
    Bucket: bucketDeClave(key),
    Key: key,
    ContentType: contentType,
    ContentLength: sizeBytes,
  })
  // Por defecto el SDK no firma Content-Type; firmarlo (junto con Content-Length) hace que R2
  // rechace con 403 cualquier subida de otro tipo o tamaño que el autorizado.
  return getSignedUrl(getR2Client(), command, {
    expiresIn: expiresInSeconds,
    signableHeaders: new Set(['content-type', 'content-length']),
  })
}

/** URL firmada temporal para descargar un archivo, solo debe emitirse para diseños publicados. */
export async function getDownloadUrl(key: string, expiresInSeconds = 300) {
  const command = new GetObjectCommand({ Bucket: bucketDeClave(key), Key: key })
  return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds })
}

/** Tamaño y tipo reales del objeto guardado, o null si no existe. */
export async function getObjetoInfo(key: string): Promise<{ bytes: number; contentType: string | undefined } | null> {
  try {
    const res = await getR2Client().send(new HeadObjectCommand({ Bucket: bucketDeClave(key), Key: key }))
    return { bytes: res.ContentLength ?? 0, contentType: res.ContentType }
  } catch {
    return null
  }
}

/** Borra el archivo de R2 (rechazo o eliminación de un diseño). */
export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({ Bucket: bucketDeClave(key), Key: key })
  await getR2Client().send(command)
}

/**
 * Borra los archivos de un diseño. Solo toca claves dentro de `disenos/<id>/`:
 * así una clave manipulada en la base nunca puede borrar el archivo de otro diseño.
 */
export async function borrarArchivosDeDiseno(diseno: { id: string; rar_url: string | null; imagen_url: string | null }) {
  const prefijo = `disenos/${diseno.id}/`
  const claves = [diseno.rar_url, diseno.imagen_url].filter((k): k is string => !!k && k.startsWith(prefijo))
  await Promise.all(claves.map((k) => deleteObject(k).catch(() => {})))
}

async function usoDeBucket(bucket: string): Promise<{ bytes: number; objetos: number }> {
  let bytes = 0
  let objetos = 0
  let continuationToken: string | undefined

  do {
    const command = new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken })
    const res = await getR2Client().send(command)
    for (const obj of res.Contents ?? []) {
      bytes += obj.Size ?? 0
      objetos += 1
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  return { bytes, objetos }
}

/** Suma el tamaño real de todo lo guardado (bucket público + privado), paginando si hace falta. */
export async function getStorageUsage(): Promise<{ bytes: number; objetos: number }> {
  const buckets = [...new Set([BUCKET_PUBLICO(), BUCKET_PRIVADO()])]
  const partes = await Promise.all(buckets.map(usoDeBucket))
  return partes.reduce((a, p) => ({ bytes: a.bytes + p.bytes, objetos: a.objetos + p.objetos }), { bytes: 0, objetos: 0 })
}

/** URL pública (bucket con Public Access habilitado) para servir portadas del catálogo sin firmar. */
export function publicUrl(key: string | null): string | null {
  if (!key) return null
  const base = process.env.R2_PUBLIC_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/${key}`
}

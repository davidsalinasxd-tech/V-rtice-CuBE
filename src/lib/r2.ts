import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const R2_LIMITS = {
  MAX_RAR_BYTES: 50 * 1024 * 1024,
  MAX_IMAGEN_BYTES: 3 * 1024 * 1024,
  MAX_DISENOS_EN_REVISION: 3,
  MAX_DISENOS_POR_MES: 10,
  DISENOS_APROBADOS_PARA_COBRO: 10,
} as const

export const SUSCRIPCION = {
  PRECIO_MENSUAL: 50000,
  MAX_DESCARGAS_EXTERNAS_POR_MES: 10,
  MAX_DESCARGAS_EXTERNAS_POR_DIA: 5,
} as const

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

const BUCKET = () => process.env.R2_BUCKET_NAME!

export function disenoRarKey(disenoId: string) {
  return `disenos/${disenoId}/archivo.rar`
}

export function disenoImagenKey(disenoId: string, extension: string) {
  return `disenos/${disenoId}/portada.${extension}`
}

/** URL firmada temporal para que el vendedor suba un archivo directo a R2 (PUT). */
export async function getUploadUrl(key: string, contentType: string, expiresInSeconds = 300) {
  const command = new PutObjectCommand({ Bucket: BUCKET(), Key: key, ContentType: contentType })
  return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds })
}

/** URL firmada temporal para descargar un archivo, solo debe emitirse para diseños publicados. */
export async function getDownloadUrl(key: string, expiresInSeconds = 300) {
  const command = new GetObjectCommand({ Bucket: BUCKET(), Key: key })
  return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds })
}

/** Borra el archivo de R2 cuando el admin rechaza un diseño. */
export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({ Bucket: BUCKET(), Key: key })
  await getR2Client().send(command)
}

/** URL pública (bucket con Public Access habilitado) para servir portadas del catálogo sin firmar. */
export function publicUrl(key: string | null): string | null {
  if (!key) return null
  const base = process.env.R2_PUBLIC_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/${key}`
}

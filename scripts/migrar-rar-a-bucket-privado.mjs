// Mueve los .rar (disenos/<id>/archivo.rar) del bucket público al bucket privado.
//
// Uso (desde la carpeta del proyecto, con R2_BUCKET_PRIVATE ya definido en .env.local):
//   node --env-file=.env.local scripts/migrar-rar-a-bucket-privado.mjs            # solo copia y verifica
//   node --env-file=.env.local scripts/migrar-rar-a-bucket-privado.mjs --delete   # además borra del público lo ya verificado
//
// Seguro de repetir: lo que ya está copiado con el mismo tamaño se saltea.
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

const publico = process.env.R2_BUCKET_NAME;
const privado = process.env.R2_BUCKET_PRIVATE;
const borrar = process.argv.includes("--delete");

if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !publico) {
  console.error("Faltan variables R2_* (¿corriste con --env-file=.env.local?).");
  process.exit(1);
}
if (!privado || privado === publico) {
  console.error("R2_BUCKET_PRIVATE tiene que estar definido y ser distinto de R2_BUCKET_NAME.");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  requestChecksumCalculation: "WHEN_REQUIRED",
});

async function listarRar() {
  const claves = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: publico, Prefix: "disenos/", ContinuationToken: token }));
    for (const o of res.Contents ?? []) if (o.Key.endsWith("/archivo.rar")) claves.push({ key: o.Key, size: o.Size });
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return claves;
}

async function tamanoEn(bucket, key) {
  try {
    return (await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))).ContentLength ?? 0;
  } catch {
    return null;
  }
}

const rars = await listarRar();
console.log(`${rars.length} archivo(s) .rar en el bucket público.`);

let copiados = 0;
let saltados = 0;
let verificados = 0;
let borrados = 0;
let errores = 0;

for (const { key, size } of rars) {
  try {
    if ((await tamanoEn(privado, key)) === size) {
      saltados++;
    } else {
      await s3.send(
        new CopyObjectCommand({
          Bucket: privado,
          Key: key,
          CopySource: `${publico}/${key}`,
          ContentType: "application/x-rar-compressed",
          MetadataDirective: "REPLACE",
        }),
      );
      copiados++;
    }

    if ((await tamanoEn(privado, key)) !== size) throw new Error("el tamaño copiado no coincide");
    verificados++;

    if (borrar) {
      await s3.send(new DeleteObjectCommand({ Bucket: publico, Key: key }));
      borrados++;
    }
  } catch (e) {
    errores++;
    console.error(`  ✗ ${key}: ${e instanceof Error ? e.message : e}`);
  }
}

console.log(`Copiados: ${copiados} · ya estaban: ${saltados} · verificados: ${verificados}` + (borrar ? ` · borrados del público: ${borrados}` : ""));
if (errores > 0) {
  console.error(`${errores} con error: NO se borró nada de esos.`);
  process.exit(1);
}
if (!borrar) console.log("Cuando confirmes que las descargas funcionan, corré de nuevo con --delete.");

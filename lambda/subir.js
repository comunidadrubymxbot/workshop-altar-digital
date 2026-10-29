import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// requestChecksumCalculation: 'WHEN_REQUIRED' evita firmar el checksum de un
// cuerpo vacío en la URL de PUT, lo que rompería la subida desde el navegador.
const s3 = new S3Client({ requestChecksumCalculation: 'WHEN_REQUIRED' })
const BUCKET = process.env.BUCKET

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

const CONTENT_TYPES_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const EXTENSIONES = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function handler(event) {
  const metodo = event.httpMethod

  // ------------------------------------------------------------------ //
  // GET /uploads/{proxy+} → URL firmada de lectura                       //
  // ------------------------------------------------------------------ //
  if (metodo === 'GET') {
    const imageKey = event.pathParameters?.proxy

    if (!imageKey) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Falta imageKey' }) }
    }

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: imageKey }),
      { expiresIn: 3600 }, // 1 hora
    )

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ url }) }
  }

  // ------------------------------------------------------------------ //
  // POST /uploads → URL firmada de subida                                //
  // ------------------------------------------------------------------ //
  let cuerpo
  try {
    cuerpo = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Cuerpo inválido' }) }
  }

  const { altarId, contentType } = cuerpo

  if (!altarId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Falta altarId' }) }
  }

  if (!contentType || !CONTENT_TYPES_VALIDOS.includes(contentType)) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'contentType de imagen inválido. Usa image/jpeg, image/png, image/webp o image/gif' }),
    }
  }

  const ext = EXTENSIONES[contentType]
  const imageKey = `${altarId}/${crypto.randomUUID()}.${ext}`

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: imageKey, ContentType: contentType }),
    { expiresIn: 300 }, // 5 minutos
  )

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ url, imageKey }),
  }
}

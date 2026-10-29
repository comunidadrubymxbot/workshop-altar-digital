import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

const cliente = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLA = process.env.TABLA

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// Campos que se aceptan del cliente; los demás se ignoran
const CAMPOS_PERMITIDOS = ['tipo', 'nivel', 'texto', 'link', 'puestoPor', 'imageKey']

export async function handler(event) {
  let cuerpo
  try {
    cuerpo = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Cuerpo inválido' }) }
  }

  const { altarId, borrar, id } = cuerpo

  if (!altarId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Falta altarId' }) }
  }

  // ------------------------------------------------------------------ //
  // Borrar                                                               //
  // ------------------------------------------------------------------ //
  if (borrar === true) {
    if (!id) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Falta id' }) }
    }

    // Buscar la sk del elemento para poder borrarlo
    const busqueda = await cliente.send(
      new QueryCommand({
        TableName: TABLA,
        KeyConditionExpression: 'altarId = :aid',
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: { ':aid': altarId, ':id': id },
        Limit: 200,
      }),
    )

    if (!busqueda.Items || busqueda.Items.length === 0) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'No encontrado' }) }
    }

    const item = busqueda.Items[0]
    await cliente.send(
      new DeleteCommand({
        TableName: TABLA,
        Key: { altarId, sk: item.sk },
      }),
    )

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ borrado: id }) }
  }

  // ------------------------------------------------------------------ //
  // Agregar                                                              //
  // ------------------------------------------------------------------ //
  if (!cuerpo.tipo) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Falta tipo' }) }
  }

  // Filtrar solo los campos permitidos
  const campos = {}
  for (const campo of CAMPOS_PERMITIDOS) {
    if (cuerpo[campo] !== undefined) campos[campo] = cuerpo[campo]
  }

  // Calcular la posición contando los elementos que hay en ese nivel
  const nivel = campos.nivel ?? 1
  const enNivel = await cliente.send(
    new QueryCommand({
      TableName: TABLA,
      KeyConditionExpression: 'altarId = :aid',
      FilterExpression: 'nivel = :nivel',
      ExpressionAttributeValues: { ':aid': altarId, ':nivel': nivel },
      Limit: 200,
    }),
  )
  const posicion = enNivel.Items?.length ?? 0

  const nuevoCreadoEn = new Date().toISOString()
  const nuevoId = crypto.randomUUID()
  const sk = `${nuevoCreadoEn}#${nuevoId}`

  const elemento = {
    altarId,
    ...campos,
    nivel,
    posicion,
    id: nuevoId,
    creadoEn: nuevoCreadoEn,
    sk,
  }

  await cliente.send(new PutCommand({ TableName: TABLA, Item: elemento }))

  // Devolver el elemento sin sk
  const { sk: _sk, ...elementoSinSk } = elemento

  return {
    statusCode: 201,
    headers: HEADERS,
    body: JSON.stringify(elementoSinSk),
  }
}

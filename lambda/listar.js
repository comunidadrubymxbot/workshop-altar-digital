import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

const cliente = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLA = process.env.TABLA

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function handler(event) {
  const altarId = event.queryStringParameters?.altarId

  if (!altarId) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Falta altarId' }),
    }
  }

  const resultado = await cliente.send(
    new QueryCommand({
      TableName: TABLA,
      KeyConditionExpression: 'altarId = :aid',
      ExpressionAttributeValues: { ':aid': altarId },
      ScanIndexForward: true,
      Limit: 200,
    }),
  )

  // Quitar sk antes de devolver: es un campo interno de la tabla
  const elementos = (resultado.Items ?? []).map(({ sk: _sk, ...rest }) => rest)

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ elementos }),
  }
}

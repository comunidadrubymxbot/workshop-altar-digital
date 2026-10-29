import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'

export class OfrendaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ------------------------------------------------------------------ //
    // Tabla de DynamoDB                                                    //
    // ------------------------------------------------------------------ //
    // La llave NO se toca. Un cambio aquí puede borrar los elementos del altar.
    const tabla = new dynamodb.Table(this, 'Tabla', {
      tableName: 'ofrenda-elementos',
      partitionKey: { name: 'altarId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // ------------------------------------------------------------------ //
    // Bucket de S3 para imágenes                                           //
    // ------------------------------------------------------------------ //
    const bucket = new s3.Bucket(this, 'Imagenes', {
      bucketName: `ofrenda-imagenes-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    })

    // ------------------------------------------------------------------ //
    // Lambdas: JavaScript plano, Code.fromAsset, sin NodejsFunction        //
    // ------------------------------------------------------------------ //
    const opcionesComunes: lambda.FunctionProps = {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLA: tabla.tableName,
        BUCKET: bucket.bucketName,
        REGION: this.region,
      },
    }

    const fnListar = new lambda.Function(this, 'Listar', {
      ...opcionesComunes,
      handler: 'listar.handler',
    })
    tabla.grantReadData(fnListar)

    const fnAgregar = new lambda.Function(this, 'Agregar', {
      ...opcionesComunes,
      handler: 'agregar.handler',
    })
    tabla.grantReadWriteData(fnAgregar)

    const fnSubir = new lambda.Function(this, 'Subir', {
      ...opcionesComunes,
      handler: 'subir.handler',
    })
    bucket.grantPut(fnSubir)
    bucket.grantRead(fnSubir)

    // ------------------------------------------------------------------ //
    // REST API                                                             //
    // ------------------------------------------------------------------ //
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'ofrenda-api',
      deployOptions: { stageName: 'v1' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Content-Type'],
      },
    })

    // GET /elements?altarId=...  y  POST /elements
    const elements = api.root.addResource('elements')
    elements.addMethod('GET', new apigateway.LambdaIntegration(fnListar))
    elements.addMethod('POST', new apigateway.LambdaIntegration(fnAgregar))

    // POST /uploads  y  GET /uploads/{proxy+}
    const uploads = api.root.addResource('uploads')
    uploads.addMethod('POST', new apigateway.LambdaIntegration(fnSubir))
    const uploadProxy = uploads.addResource('{proxy+}')
    uploadProxy.addMethod('GET', new apigateway.LambdaIntegration(fnSubir))

    // La URL base de la API, para pegarla en Amplify como VITE_API_URL
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url })
  }
}

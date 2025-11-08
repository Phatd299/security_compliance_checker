import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.FINDINGS_TABLE;

// Handler to get all evidences
export const getEvidencesHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getEvidences only accepts GET method, you tried: ${event.httpMethod}`);
  }
  console.info('received:', event);

  const params = {
    TableName: tableName,
  };

  let items = [];
  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    items = data.Items || [];
  } catch (err) {
    console.error("Error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch evidences" }),
    };
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(items),
  };

  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
};


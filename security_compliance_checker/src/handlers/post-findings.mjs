import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

export const postFindingsHandler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { message: `Method not allowed: ${event.httpMethod}` });
  }

  const claims = event?.requestContext?.authorizer?.claims;
  if (!claims) return createResponse(401, { message: 'Unauthorized - no claims found' });

  const userGroups = claims['cognito:groups'] || [];
  const isAdmin = userGroups.includes('admin');
  if (!isAdmin) return createResponse(403, { message: 'Forbidden - Admins only' });

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createResponse(400, { message: 'Invalid JSON' });
  }

  const { id, name } = body;
  if (!id || !name) return createResponse(400, { message: 'Missing id or name' });

  const params = {
    TableName: tableName,
    Item: { id, name, createdAt: new Date().toISOString(), createdBy: claims['sub'] }
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return createResponse(200, body);
  } catch (err) {
    console.error('Failed to put item', err);
    return createResponse(500, { message: 'Failed to put item', errorMsg: err.message });
  }
};

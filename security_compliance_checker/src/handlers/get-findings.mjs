import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddbDocClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME;

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

export const getFindingsHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return createResponse(405, { message: `Method not allowed: ${event.httpMethod}` });
  }

  try {
    const claims = event?.requestContext?.authorizer?.claims;
    if (!claims) return createResponse(401, { message: 'Unauthorized' });

    const userId = claims['sub'];
    const userGroups = claims['cognito:groups'] || [];
    const isAdmin = userGroups.includes('admin');

    let findings;

    if (isAdmin) {
      const data = await ddbDocClient.send(new ScanCommand({ TableName: tableName }));
      findings = data.Items || [];
    } else {
      const data = await ddbDocClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: 'assignedToIndex',
        KeyConditionExpression: 'assignedTo = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ProjectionExpression: 'id,title,status,assignedTo'
      }));
      findings = data.Items || [];
    }

    return createResponse(200, { findings, count: findings.length });

  } catch (error) {
    console.error({ message: 'Failed to fetch findings', error });
    return createResponse(500, { message: 'Internal server error' });
  }
};

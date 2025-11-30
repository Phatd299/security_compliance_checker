import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const tableName = process.env.TABLE_NAME;

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const getEvidencesHandler = async (event) => {
  console.info('Received event:', event);

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: `Method ${event.httpMethod} not allowed` }),
    };
  }

  const params = { TableName: tableName };
  try {
    let items = [];
    let ExclusiveStartKey;

    do {
      const data = await ddbDocClient.send(new ScanCommand({ ...params, ExclusiveStartKey }));
      items = items.concat(data.Items || []);
      ExclusiveStartKey = data.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return {
      statusCode: 200,
      body: JSON.stringify(items),
    };
  } catch (err) {
    console.error({ message: "Failed to scan DynamoDB", error: err });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch evidences" }),
    };
  }
};

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.FINDINGS_TABLE;

/**
 * Get findings based on user's Cognito group.
 * Admin users can see all findings.
 * Normal users can only see findings assigned to them.
 */
export const getFindingsHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: `Method not allowed: ${event.httpMethod}` })
        };
    }

    try {
        // Extract user information from Cognito authorizer
        const authorizer = event.requestContext.authorizer;
        if (!authorizer || !authorizer.claims) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized - No valid claims found' })
            };
        }

        const userId = authorizer.claims['sub'];
        const userGroups = authorizer.claims['cognito:groups'] || [];
        const isAdmin = userGroups.includes('admin');

        let findings;

        if (isAdmin) {
            // Admin users - get all findings
            const params = {
                TableName: tableName
            };
            const data = await ddbDocClient.send(new ScanCommand(params));
            findings = data.Items;
        } else {
            // Normal users - get only assigned findings
            const params = {
                TableName: tableName,
                IndexName: 'assignedToIndex', // Make sure this GSI exists
                KeyConditionExpression: 'assignedTo = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            };
            const data = await ddbDocClient.send(new QueryCommand(params));
            findings = data.Items;
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                findings: findings,
                count: findings.length
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                errorMsg: error.message
            })
        };
    }
}

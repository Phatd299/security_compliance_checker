import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getFindingsHandler } from '../../../src/handlers/get-findings.mjs';

// Mock DynamoDB DocumentClient
const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
  process.env.TABLE_NAME = 'TestTable';
});

test('Admin user returns all findings (ScanCommand)', async () => {
  ddbMock.on(ScanCommand).resolves({
    Items: [{ id: 1, title: 'f1' }, { id: 2, title: 'f2' }]
  });

  const event = {
    httpMethod: 'GET',
    requestContext: { authorizer: { claims: { 'sub': 'adminUser', 'cognito:groups': ['admin'] } } }
  };

  const result = await getFindingsHandler(event);

  expect(result.statusCode).toBe(200);
  const body = JSON.parse(result.body);
  expect(body.findings).toHaveLength(2);
  expect(body.count).toBe(2);
  expect(body.findings[0].title).toBe('f1');
});

test('Non-admin user returns filtered findings (QueryCommand)', async () => {
  ddbMock.on(QueryCommand).resolves({
    Items: [{ id: 3, title: 'f3' }]
  });

  const event = {
    httpMethod: 'GET',
    requestContext: { authorizer: { claims: { 'sub': 'user1', 'cognito:groups': [] } } }
  };

  const result = await getFindingsHandler(event);

  expect(result.statusCode).toBe(200);
  const body = JSON.parse(result.body);
  expect(body.findings).toHaveLength(1);
  expect(body.findings[0].title).toBe('f3');
});

test('Returns 405 for non-GET method', async () => {
  const event = { httpMethod: 'POST' };
  const result = await getFindingsHandler(event);

  expect(result.statusCode).toBe(405);
  const body = JSON.parse(result.body);
  expect(body.message).toMatch(/Method not allowed/);
});

test('Returns 401 if authorizer claims missing', async () => {
  const event = { httpMethod: 'GET', requestContext: {} };
  const result = await getFindingsHandler(event);

  expect(result.statusCode).toBe(401);
  const body = JSON.parse(result.body);
  expect(body.message).toBe('Unauthorized');
});

test('Returns 500 on DynamoDB error', async () => {
  ddbMock.on(ScanCommand).rejects(new Error('DynamoDB failure'));

  const event = {
    httpMethod: 'GET',
    requestContext: { authorizer: { claims: { 'sub': 'adminUser', 'cognito:groups': ['admin'] } } }
  };

  const result = await getFindingsHandler(event);

  expect(result.statusCode).toBe(500);
  const body = JSON.parse(result.body);
  expect(body.message).toBe('Internal server error');
});

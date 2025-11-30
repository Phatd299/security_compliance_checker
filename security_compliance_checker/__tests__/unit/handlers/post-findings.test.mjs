import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { postFindingsHandler } from '../../../src/handlers/post-findings.mjs';

// Mock DynamoDB DocumentClient
const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
  process.env.TABLE_NAME = 'TestTable';
});

test('Admin user can successfully post item', async () => {
  ddbMock.on(PutCommand).resolves({});

  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ id: '123', name: 'Test Finding' }),
    requestContext: {
      authorizer: {
        claims: { 'sub': 'adminUser', 'cognito:groups': ['admin'] }
      }
    },
    path: '/findings'
  };

  const result = await postFindingsHandler(event);

  expect(result.statusCode).toBe(200);
  const body = JSON.parse(result.body);
  expect(body.id).toBe('123');
  expect(body.name).toBe('Test Finding');
});

test('Non-admin user gets 403 Forbidden', async () => {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ id: '123', name: 'Test Finding' }),
    requestContext: {
      authorizer: {
        claims: { 'sub': 'user1', 'cognito:groups': [] }
      }
    },
    path: '/findings'
  };

  const result = await postFindingsHandler(event);

  expect(result.statusCode).toBe(403);
  const body = JSON.parse(result.body);
  expect(body.message).toMatch(/Admins only/);
});

test('Missing claims returns 401 Unauthorized', async () => {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ id: '123', name: 'Test Finding' }),
    requestContext: {},
    path: '/findings'
  };

  const result = await postFindingsHandler(event);

  expect(result.statusCode).toBe(401);
  const body = JSON.parse(result.body);
  expect(body.message).toMatch(/Unauthorized/);
});

test('Invalid HTTP method returns 405', async () => {
  const event = { httpMethod: 'GET', body: '{}', path: '/findings' };
  const result = await postFindingsHandler(event);

  expect(result.statusCode).toBe(405);
  const body = JSON.parse(result.body);
  expect(body.message).toMatch(/Method not allowed/);
});

test('Invalid JSON body returns 400', async () => {
  const event = {
    httpMethod: 'POST',
    body: '{invalid-json}',
    requestContext: {
      authorizer: { claims: { 'sub': 'adminUser', 'cognito:groups': ['admin'] } }
    },
    path: '/findings'
  };

  const result = await postFindingsHandler(event);

  expect(result.statusCode).toBe(400);
  const body = JSON.parse(result.body);
  expect(body.message).toMatch(/Invalid JSON/);
});

test('Missing id or name returns 400', async () => {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ id: '123' }), // missing name
    requestContext: {
      authorizer: { claims: { 'sub': 'adminUser', 'cognito:groups': ['admin'] } }
    },
    path: '/findings'
  };

  const result = await postFindingsHandler(event);

  expect(result.statusCode).toBe(400);
  const body = JSON.parse(result.body);
  expect(body.message).toMatch(/Missing id or name/);
});

test('DynamoDB error returns 500', async () => {
  ddbMock.on(PutCommand).rejects(new Error('DynamoDB failure'));

  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ id: '123', name: 'Test Finding' }),
    requestContext: {
      authorizer: { claims: { 'sub': 'adminUser', 'cognito:groups': ['admin'] } }
    },
    path: '/findings'
  };

  const result = await postFindingsHandler(event);

  expect(result.statusCode).toBe(500);
  const body = JSON.parse(result.body);
  expect(body.message).toMatch(/Failed to put item/);
});

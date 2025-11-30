import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getEvidencesHandler } from '../../../src/handlers/get-evidences.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
  process.env.TABLE_NAME = 'TestTable';
});

test('getEvidences returns items successfully', async () => {
  // Mock DynamoDB scan response
  ddbMock.on(ScanCommand).resolves({
    Items: [{ id: 1, name: 'evidence1' }, { id: 2, name: 'evidence2' }],
  });

  const event = { httpMethod: 'GET', path: '/evidences' };
  const result = await getEvidencesHandler(event);

  expect(result.statusCode).toBe(200);
  const body = JSON.parse(result.body);
  expect(body).toHaveLength(2);
  expect(body[0].name).toBe('evidence1');
});

test('getEvidences returns 405 for non-GET method', async () => {
  const event = { httpMethod: 'POST', path: '/evidences' };
  const result = await getEvidencesHandler(event);

  expect(result.statusCode).toBe(405);
  const body = JSON.parse(result.body);
  expect(body.error).toMatch(/not allowed/);
});

test('getEvidences returns 500 on DynamoDB error', async () => {
  // Mock DynamoDB to throw error
  ddbMock.on(ScanCommand).rejects(new Error('DynamoDB failure'));

  const event = { httpMethod: 'GET', path: '/evidences' };
  const result = await getEvidencesHandler(event);

  expect(result.statusCode).toBe(500);
  const body = JSON.parse(result.body);
  expect(body.error).toBe('Failed to fetch evidences');
});

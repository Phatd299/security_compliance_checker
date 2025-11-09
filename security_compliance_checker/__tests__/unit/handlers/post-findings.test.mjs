import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import { putItemHandler } from "../../../src/handlers/post-findings.mjs";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('putItemHandler (post-findings)', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should put finding item and return 200 with echoed body', async () => {
    ddbMock.on(PutCommand).resolves({});

    const body = { id: 'f1', name: 'Finding 1' };
    const event = {
      httpMethod: 'POST',
      path: '/findings',
      body: JSON.stringify(body)
    };

    const result = await putItemHandler(event);
    expect(result.statusCode).toBe(200);
    const resBody = JSON.parse(result.body);
    expect(resBody.id).toBe('f1');
    expect(resBody.name).toBe('Finding 1');
  });

  it('should return 500 when DynamoDB PutCommand fails', async () => {
    ddbMock.on(PutCommand).rejects(new Error('Put failed'));

    const body = { id: 'f2', name: 'Finding 2' };
    const event = {
      httpMethod: 'POST',
      path: '/findings',
      body: JSON.stringify(body)
    };

    const result = await putItemHandler(event);
    expect(result.statusCode).toBe(500);
    const resBody = JSON.parse(result.body);
    expect(resBody.error).toBe('Failed to put item');
    expect(resBody.errorMsg).toBeDefined();
  });
});

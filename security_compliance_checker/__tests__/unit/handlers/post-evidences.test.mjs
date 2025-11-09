import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import { putItemHandler } from "../../../src/handlers/post-evidences.mjs";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('putItemHandler (post-evidences)', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should put item and return 200 with body echoed', async () => {
    ddbMock.on(PutCommand).resolves({});

    const body = { id: 'i1', name: 'Item 1' };
    const event = {
      httpMethod: 'POST',
      path: '/evidences',
      body: JSON.stringify(body)
    };

    const result = await putItemHandler(event);
    expect(result.statusCode).toBe(200);
    const resBody = JSON.parse(result.body);
    expect(resBody.id).toBe('i1');
    expect(resBody.name).toBe('Item 1');
  });

  it('should return 500 when DynamoDB PutCommand fails', async () => {
    ddbMock.on(PutCommand).rejects(new Error('Put failed'));

    const body = { id: 'i2', name: 'Item 2' };
    const event = {
      httpMethod: 'POST',
      path: '/evidences',
      body: JSON.stringify(body)
    };

    const result = await putItemHandler(event);
    expect(result.statusCode).toBe(500);
    const resBody = JSON.parse(result.body);
    expect(resBody.error).toBe('Failed to put item');
    expect(resBody.errorMsg).toBeDefined();
  });
});

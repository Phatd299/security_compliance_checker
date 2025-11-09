import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

// Import your Lambda handler
import { getFindingsHandler } from "../../../src/handlers/get-findings.mjs";

// Create a mock DynamoDB client
const ddbMock = mockClient(DynamoDBDocumentClient);

describe("getFindingsHandler", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it("should return all findings for admin (ScanCommand)", async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [
        { findingId: "f1", title: "Finding 1" },
        { findingId: "f2", title: "Finding 2" }
      ]
    });

    const event = {
      httpMethod: "GET",
      requestContext: {
        authorizer: {
          claims: {
            sub: "user-123",
            // simulate cognito groups as an array containing 'admin'
            'cognito:groups': ['admin']
          }
        }
      }
    };

    const result = await getFindingsHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.findings).toHaveLength(2);
    expect(body.count).toBe(2);
    expect(body.findings[0].findingId).toBe('f1');
  });

  it("should return assigned findings for normal user (QueryCommand)", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { findingId: "f3", assignedTo: "user-123", title: "Assigned Finding" }
      ]
    });

    const event = {
      httpMethod: "GET",
      requestContext: {
        authorizer: {
          claims: {
            sub: "user-123",
            'cognito:groups': []
          }
        }
      }
    };

    const result = await getFindingsHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.findings).toHaveLength(1);
    expect(body.findings[0].assignedTo).toBe('user-123');
  });

  it("should return 500 on DynamoDB error", async () => {
    ddbMock.on(QueryCommand).rejects(new Error('DynamoDB failure'));

    const event = {
      httpMethod: "GET",
      requestContext: {
        authorizer: {
          claims: {
            sub: "user-123",
            'cognito:groups': []
          }
        }
      }
    };

    const result = await getFindingsHandler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Internal server error');
    expect(body.errorMsg).toBeDefined();
  });
});

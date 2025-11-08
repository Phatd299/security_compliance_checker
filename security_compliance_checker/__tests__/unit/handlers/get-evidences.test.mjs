import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

// Import your Lambda handler
import { getEvidencesHandler } from "../../../src/handlers/get-evidences.mjs";

// Create a mock DynamoDB client
const ddbMock = mockClient(DynamoDBDocumentClient);

describe("getEvidencesHandler", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it("should return all evidences from DynamoDB", async () => {
    // Mock the ScanCommand to return test data
    ddbMock.on(ScanCommand).resolves({
      Items: [
        { evidenceId: "e1", findingId: "f1", title: "Evidence 1" },
        { evidenceId: "e2", findingId: "f1", title: "Evidence 2" },
      ]
    });

    // Mock API Gateway event
    const event = {
      httpMethod: "GET",
    };

    const result = await getEvidencesHandler(event);

    // Assert
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.length).toBe(2);
    expect(body[0].evidenceId).toBe("e1");
    expect(body[1].title).toBe("Evidence 2");
  });

  it("should return 500 on error", async () => {
    // Force ScanCommand to throw
    ddbMock.on(ScanCommand).rejects(new Error("DynamoDB error"));

    const event = { httpMethod: "GET" };
    const result = await getEvidencesHandler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Failed to fetch evidences");
  });
});

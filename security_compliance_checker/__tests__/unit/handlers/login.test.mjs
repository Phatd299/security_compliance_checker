// --- Set env variables BEFORE import ---
process.env.USER_POOL_ID = "test-user-pool-id";
process.env.CLIENT_ID = "test-client-id";

import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { mockClient } from "aws-sdk-client-mock";
import { loginHandler } from '../../../src/handlers/login.mjs';

// Mock Cognito client
const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe("loginHandler", () => {
  beforeEach(() => {
    cognitoMock.reset();
  });

  afterAll(() => {
    delete process.env.USER_POOL_ID;
    delete process.env.CLIENT_ID;
  });

  it("should return tokens on successful login", async () => {
    const mockTokens = {
      AuthenticationResult: {
        AccessToken: "mock-access-token",
        IdToken: "mock-id-token",
        RefreshToken: "mock-refresh-token"
      }
    };

    cognitoMock.on(AdminInitiateAuthCommand).resolves(mockTokens);

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({ username: "testuser", password: "testpassword123" })
    };

    const result = await loginHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.AuthenticationResult.AccessToken).toBe("mock-access-token");
    expect(body.AuthenticationResult.IdToken).toBe("mock-id-token");
    expect(body.AuthenticationResult.RefreshToken).toBe("mock-refresh-token");

    const call = cognitoMock.calls()[0];
    expect(call.args[0].input.AuthFlow).toBe("ADMIN_NO_SRP_AUTH");
    expect(call.args[0].input.UserPoolId).toBe("test-user-pool-id");
    expect(call.args[0].input.ClientId).toBe("test-client-id");
    expect(call.args[0].input.AuthParameters.USERNAME).toBe("testuser");
    expect(call.args[0].input.AuthParameters.PASSWORD).toBe("testpassword123");
  });

  it("should return 401 on invalid credentials", async () => {
    const error = new Error("Incorrect username or password");
    error.name = "NotAuthorizedException";
    cognitoMock.on(AdminInitiateAuthCommand).rejects(error);

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({ username: "wronguser", password: "wrongpassword" })
    };

    const result = await loginHandler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Incorrect username or password");
  });

  it("should return 400 on missing username or password", async () => {
    const event = {
      httpMethod: "POST",
      body: JSON.stringify({ username: "testuser" }) // missing password
    };

    const result = await loginHandler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toMatch(/Missing username or password/);
  });

  it("should return 400 on malformed JSON", async () => {
    const event = { httpMethod: "POST", body: "invalid-json" };

    const result = await loginHandler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toMatch(/Invalid JSON/);
  });

  it("should return 401 on other Cognito errors (UserNotFoundException)", async () => {
    const error = new Error("User does not exist");
    error.name = "UserNotFoundException";
    cognitoMock.on(AdminInitiateAuthCommand).rejects(error);

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({ username: "nonexistent", password: "password123" })
    };

    const result = await loginHandler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("User not found");
  });

  it("should return 405 for wrong HTTP method", async () => {
    const event = { httpMethod: "GET", body: "{}" };
    const result = await loginHandler(event);

    expect(result.statusCode).toBe(405);
    const body = JSON.parse(result.body);
    expect(body.message).toMatch(/Method not allowed/);
  });
});
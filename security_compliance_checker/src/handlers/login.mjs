import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";

export const loginHandler = async (event) => {
  // Read env variables dynamically inside handler
  const USER_POOL_ID = process.env.USER_POOL_ID;
  const CLIENT_ID = process.env.CLIENT_ID;

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ message: `Method not allowed: ${event.httpMethod}` })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) };
  }

  const { username, password } = body;
  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing username or password' }) };
  }

  try {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: { USERNAME: username, PASSWORD: password }
    });

    const client = new CognitoIdentityProviderClient({});
    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ AuthenticationResult: response.AuthenticationResult })
    };
  } catch (err) {
    let message = 'Login failed';
    if (err.name === 'NotAuthorizedException') message = 'Incorrect username or password';
    if (err.name === 'UserNotFoundException') message = 'User not found';
    if (err.name === 'UserNotConfirmedException') message = 'User not confirmed';

    return { statusCode: 401, body: JSON.stringify({ message }) };
  }
};

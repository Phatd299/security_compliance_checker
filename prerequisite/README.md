# Prerequisite Stack - Security Compliance Checker

This CloudFormation template creates the prerequisite AWS resources needed for the Security Compliance Checker application, specifically the Cognito User Pool with Admin and Standard user groups.

## What This Stack Creates

1. **Cognito User Pool** - User authentication pool with email as username
2. **User Pool Client** - Client application for authentication (supports ADMIN_NO_SRP_AUTH and USER_PASSWORD_AUTH flows)
3. **Admin Group** - User group for administrators
4. **Standard Group** - User group for standard users

## Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- CloudFormation permissions

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name security-compliance-checker-prerequisite \
  --template-body file://prerequisite.yaml \
  --capabilities CAPABILITY_IAM \
  --region ap-southeast-1
```

Or update an existing stack:

```bash
aws cloudformation update-stack \
  --stack-name security-compliance-checker-prerequisite \
  --template-body file://prerequisite.yaml \
  --capabilities CAPABILITY_IAM \
  --region ap-southeast-1
```

### Get Stack Outputs

After deployment, get the outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name security-compliance-checker-prerequisite \
  --query 'Stacks[0].Outputs' \
  --region ap-southeast-1
```

## Creating Test Users

After the stack is deployed, create test users using the AWS CLI commands shown in the stack outputs, or use these examples:

### Create Admin User

```bash
# Get UserPoolId from stack outputs
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name security-compliance-checker-prerequisite \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --region ap-southeast-1)

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=name,Value=Admin \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region ap-southeast-1

# Add to Admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --group-name Admin \
  --region ap-southeast-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --password AdminPass123! \
  --permanent \
  --region ap-southeast-1
```

### Create Standard User

```bash
# Create standard user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=name,Value=User \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region ap-southeast-1

# Add to Standard group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --group-name Standard \
  --region ap-southeast-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --password UserPass123! \
  --permanent \
  --region ap-southeast-1
```

## How Groups Work

- When users are assigned to groups (Admin or Standard), Cognito automatically includes the group names in the JWT ID token as the `cognito:groups` claim
- The frontend application extracts this claim to display the user's role
- Users in the **Admin** group will see "Admin" role in the dashboard
- Users in the **Standard** group (or no group) will see "Standard" role in the dashboard

## Password Policy

The User Pool enforces the following password policy:
- Minimum length: 8 characters
- Requires lowercase letters
- Requires uppercase letters
- Requires numbers
- Requires symbols

## Integration with Main Application

The main application stack (`security_compliance_checker/template.yaml`) should reference this prerequisite stack's outputs using CloudFormation exports:

- `UserPoolId` - Import using: `!ImportValue security-compliance-checker-prerequisite-UserPoolId`
- `UserPoolArn` - Import using: `!ImportValue security-compliance-checker-prerequisite-UserPoolArn`
- `UserPoolClientId` - Import using: `!ImportValue security-compliance-checker-prerequisite-UserPoolClientId`

## Stack Outputs

The stack exports the following values:

- **UserPoolId** - Cognito User Pool ID
- **UserPoolArn** - Cognito User Pool ARN
- **UserPoolClientId** - Cognito User Pool Client ID
- **UserPoolProviderName** - Cognito User Pool Provider Name
- **AdminGroupName** - Admin Group Name (value: "Admin")
- **StandardGroupName** - Standard Group Name (value: "Standard")
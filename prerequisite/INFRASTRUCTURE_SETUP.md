# Infrastructure Setup Guide

## Overview

The infrastructure is split into two CloudFormation stacks:

1. **Prerequisite Stack** (`prerequisite.yaml`) - Contains all AWS resources (Cognito, DynamoDB, S3, SNS)
2. **Main Stack** (`template.yaml`) - Contains only Lambda functions and API Gateway

## Prerequisite Stack Resources

### 1. AWS Cognito User Pool
- **UserPool**: Main user pool for authentication
- **UserPoolClient**: Client for authentication flows
- **AdminGroup**: Admin user group
- **StandardGroup**: Standard user group

### 2. AWS DynamoDB Table
- **CaseTable**: Single-table design for findings and evidences
  - Primary Key: PK (HASH), SK (RANGE)
  - GSI: `assignedToIndex` on `assignedTo` attribute
  - Point-in-time recovery enabled
  - Pay-per-request billing mode

### 3. AWS S3 Bucket
- **EvidenceBucket**: Stores evidence files (PDFs, images, logs)
  - Versioning enabled
  - Public access blocked
  - Server-side encryption (AES256)
  - Lifecycle rules:
    - Delete old versions after 90 days
    - Abort incomplete multipart uploads after 7 days
  - Bucket policy allows Lambda functions to access

### 4. AWS SNS Topic
- **NotificationTopic**: Sends notifications (e.g., when all findings are complete)
  - Can be subscribed to via email, SMS, or other protocols

## Stack Exports

The prerequisite stack exports the following values for cross-stack references:

- `${StackName}-UserPoolId`
- `${StackName}-UserPoolArn`
- `${StackName}-UserPoolClientId`
- `${StackName}-CaseTableName`
- `${StackName}-CaseTableArn`
- `${StackName}-EvidenceBucketName`
- `${StackName}-EvidenceBucketArn`
- `${StackName}-NotificationTopicArn`

## Deployment Order

1. **Deploy Prerequisite Stack First:**
   ```bash
   aws cloudformation create-stack \
     --stack-name security-compliance-checker-prerequisite \
     --template-body file://prerequisite/prerequisite.yaml \
     --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Deploy Main Stack:**
   ```bash
   cd security_compliance_checker
   sam build
   sam deploy \
     --parameter-overrides PrerequisiteStackName=security-compliance-checker-prerequisite
   ```

## Main Stack Resources

The main stack (`template.yaml`) contains:

- **API Gateway**: REST API with Cognito authorizer
- **Lambda Functions**:
  - `GetEvidencesFunction` - GET /evidence
  - `PostEvidenceFunction` - POST /evidence
  - `GetFindingsFunction` - GET /finding
  - `PostFindingFunction` - POST /finding
  - `LoginFunction` - POST /login (no auth required)

All Lambda functions:
- Reference resources from prerequisite stack via `ImportValue`
- Have IAM permissions for DynamoDB, S3, and SNS
- Receive environment variables with resource names/ARNs

## Environment Variables

Lambda functions receive these environment variables:

- `TABLE_NAME`: DynamoDB table name
- `EVIDENCE_BUCKET`: S3 bucket name for evidence files
- `SNS_TOPIC_ARN`: SNS topic ARN for notifications
- `USER_POOL_ID`: Cognito User Pool ID (login function only)
- `CLIENT_ID`: Cognito User Pool Client ID (login function only)

## IAM Permissions

### Lambda Functions Have:
- **DynamoDB**: Full CRUD access to CaseTable
- **S3**: Read/Write/Delete access to EvidenceBucket
- **SNS**: Publish messages to NotificationTopic
- **Cognito**: AdminInitiateAuth (login function only)

### S3 Bucket Policy:
- Allows Lambda service from the same account to access objects

## Notes

- The prerequisite stack name must match the `PrerequisiteStackName` parameter in the main stack
- All exports use the format: `${StackName}-ResourceName`
- The main stack uses `Fn::Join` to construct export names dynamically
- S3 bucket name includes AWS Account ID to ensure uniqueness globally


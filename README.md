# Security Compliance Checker

## Project Overview

The Security Compliance Checker is a serverless web application that allows users to upload compliance evidence (e.g., logs, screenshots, PDFs) for findings. 

The system tracks which findings have evidence, provides a dashboard, and notifies admins when all findings are complete.

This project is built entirely on AWS serverless services.

## Serverless Architecture

![AWS Services](image.png)

## Data Model

1. /findings scheme

| Attribute | Type | Key Type |
|---|---|---|
| findingId | String | Primary Key. Unique ID for each finding. |
| projectId | String | ID of the project this finding. |
| title | String | Short description of the finding. |
| status | String | "Open" or "Completed". |
| createdAt | String | ISO timestamp of creation. |

2. /evidences scheme

| Attribute | Type | Key Type |
|---|---|---|
| evidenceId | String | Primary Key |
| findingId | String | Foreign key to link evidence to a finding. |
| s3Key | String | Object key in S3. |
| s3Url | String | Optional access URL or presigned URL. |
| uploadedAt | String | ISO timestamp of creation. |




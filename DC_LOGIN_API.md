# Sahyog Login — UI Changes and DC API Contract

## Overview

The Sahyog UI now opens on a dedicated login page that is consistent with the existing Application Registration (AR) and Data Collection (DC) visual theme.

The login and account-registration functionality is connected to the Data Collection backend using the endpoints in this document.

## UI Changes Completed

- Added `/login` as the login page route.
- Changed `/` to redirect to `/login`.
- Added two selectable login profiles:
  - Government Official
  - Citizen Profile
- Government Official accepts an official email address or employee ID.
- Citizen Profile accepts a mobile number or Aadhaar number.
- Added password entry with Show/Hide functionality.
- Added a Forgot Password action placeholder.
- Added a Create New Account action placeholder.
- Added required-field validation at the top of the form.
- Added responsive desktop, tablet, and mobile styling.
- Existing `/application-registration/*` and `/data-collection/*` routes remain unchanged.

## Base URL

```text
http://localhost:8091/ms-data-collection/api/v1/auth
```

## 1. Government Official Login

```http
POST /government-official/login
```

Full URL:

```text
http://localhost:8091/ms-data-collection/api/v1/auth/government-official/login
```

Request:

```json
{
  "loginId": "CW000123",
  "password": "SecurePassword@123"
}
```

`loginId` may contain either the employee ID or official email address.

Successful response:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": 101,
    "profileType": "GOVERNMENT_OFFICIAL",
    "employeeId": "CW000123",
    "email": "caseworker@sahyog.gov.in",
    "fullName": "Anand Dikshit",
    "role": "CASE_WORKER"
  }
}
```

## 2. Citizen Login

```http
POST /citizen/login
```

Full URL:

```text
http://localhost:8091/ms-data-collection/api/v1/auth/citizen/login
```

Request using a mobile number:

```json
{
  "loginId": "9876543210",
  "password": "SecurePassword@123"
}
```

Request using an Aadhaar number:

```json
{
  "loginId": "123456789012",
  "password": "SecurePassword@123"
}
```

Successful response:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": 202,
    "profileType": "CITIZEN",
    "citizenId": "CT000202",
    "fullName": "Ramesh Sharma",
    "mobileNumber": "9876543210"
  }
}
```

## 3. Create New Citizen Account

The registration popup calls this endpoint when Citizen Profile is selected.

```http
POST /citizen/register
```

Full URL:

```text
http://localhost:8091/ms-data-collection/api/v1/auth/citizen/register
```

Request:

```json
{
  "firstName": "Ramesh",
  "middleName": null,
  "lastName": "Sharma",
  "mobileNumber": "9876543210",
  "email": "ramesh@example.com",
  "aadharNumber": "123456789012",
  "password": "SecurePassword@123",
  "confirmPassword": "SecurePassword@123"
}
```

Successful response:

```json
{
  "userId": 202,
  "citizenId": "CT000202",
  "profileType": "CITIZEN",
  "message": "Account created successfully",
  "verificationRequired": true
}
```

## 3A. Create New Government Official Account

```http
POST /government-official/register
```

Full URL:

```text
http://localhost:8091/ms-data-collection/api/v1/auth/government-official/register
```

Request:

```json
{
  "firstName": "Anand",
  "middleName": null,
  "lastName": "Dikshit",
  "employeeId": "CW000123",
  "officialEmail": "anand.dikshit@sahyog.gov.in",
  "department": "Citizen Welfare Department",
  "designation": "Case Worker",
  "password": "SecurePassword@123",
  "confirmPassword": "SecurePassword@123"
}
```

Successful response:

```json
{
  "userId": 101,
  "employeeId": "CW000123",
  "profileType": "GOVERNMENT_OFFICIAL",
  "role": "CASE_WORKER",
  "message": "Government Official account registration submitted",
  "approvalStatus": "PENDING_APPROVAL"
}
```

Government Official accounts should remain inactive until an authorized administrator verifies and approves the employee details.

## Registration Type Mapping

| UI selection | Endpoint | `profileType` |
| --- | --- | --- |
| Citizen Profile | `/citizen/register` | `CITIZEN` |
| Government Official | `/government-official/register` | `GOVERNMENT_OFFICIAL` |

## 4. Forgot Password

The current UI contains the action. The backend can expose one shared endpoint for both profile types.

```http
POST /forgot-password
```

Full URL:

```text
http://localhost:8091/ms-data-collection/api/v1/auth/forgot-password
```

Request:

```json
{
  "profileType": "CITIZEN",
  "loginId": "9876543210"
}
```

For an official, `profileType` must be `GOVERNMENT_OFFICIAL` and `loginId` may be the employee ID or official email address.

Response:

```json
{
  "message": "Password reset instructions have been sent",
  "requestAccepted": true
}
```

## Standard Error Response

```json
{
  "timestamp": "2026-09-01T10:30:00Z",
  "status": 401,
  "errorCode": "INVALID_CREDENTIALS",
  "message": "Invalid login ID or password"
}
```

Suggested error codes:

| HTTP Status | Error Code | Usage |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Required or malformed request value |
| `401` | `INVALID_CREDENTIALS` | Login ID or password is incorrect |
| `403` | `ACCOUNT_DISABLED` | User account cannot access the system |
| `409` | `ACCOUNT_ALREADY_EXISTS` | Citizen mobile, email, or Aadhaar is registered |
| `429` | `TOO_MANY_ATTEMPTS` | Login attempt limit exceeded |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected backend failure |

## Backend Validation

- `loginId` and `password` are required for both login APIs.
- Citizen mobile number must contain exactly 10 digits when a mobile number is supplied.
- Citizen Aadhaar number must contain exactly 12 digits when an Aadhaar number is supplied.
- Official email must use a valid email format when an email is supplied.
- Password values must not be logged or included in error responses.
- Aadhaar should be masked in logs and responses.
- Passwords must be stored using a secure one-way password hash.
- Access and refresh tokens must have independent expiration times.

## Frontend Integration Status

Implemented:

1. Government Official and Citizen login API calls.
2. Government Official and Citizen registration API calls.
3. Access token, refresh token, and user profile storage in session storage.
4. Government Official routing to the AR/DC workflow.
5. Citizen routing to the citizen dashboard.
6. Citizen application-context API call immediately after successful citizen login.
7. Application number, status, and current module displayed from the backend response.

Still pending:

1. Attach the bearer token to all protected API requests.
2. Connect Forgot Password to the recovery API.
3. Add protected-route handling, token refresh, and complete logout behavior.

## UI Files Changed

- `src/App.js`
- `src/pages/LoginPage.jsx`
- `src/pages/LoginPage.css`

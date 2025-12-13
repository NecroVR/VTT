# Forms API Reference

This document describes the REST API endpoints for managing forms in the VTT platform.

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Form Endpoints](#form-endpoints)
4. [Campaign Form Assignment Endpoints](#campaign-form-assignment-endpoints)
5. [Form Version History Endpoints](#form-version-history-endpoints)
6. [Form Import/Export Endpoints](#form-importexport-endpoints)
7. [Data Types](#data-types)
8. [Error Codes](#error-codes)

---

## Overview

The Forms API allows you to create, read, update, and delete custom forms for your game system. Forms are the templates used to render character sheets, item cards, spell cards, and other entity types.

**Base URL**: `/api/v1`

**Data Format**: JSON

**Authentication**: Required for all endpoints

---

## Authentication

All API endpoints require authentication via JWT token.

### Headers
```
Authorization: Bearer <jwt_token>
```

### Getting a Token
Authenticate via the `/api/v1/auth/login` endpoint to receive a JWT token.

---

## Form Endpoints

### List Forms for Game System

Get all forms for a specific game system.

**Endpoint**: `GET /api/v1/game-systems/:systemId/forms`

**Parameters**:
- `systemId` (path, required) - Game system ID
- `entityType` (query, optional) - Filter by entity type (e.g., "character", "item")

**Response**: `200 OK`
```json
{
  "forms": [
    {
      "id": "form_abc123",
      "name": "D&D 5e Character Sheet",
      "description": "Standard character sheet for D&D 5e",
      "gameSystemId": "dnd5e",
      "entityType": "character",
      "version": 1,
      "isDefault": true,
      "isLocked": true,
      "visibility": "public",
      "licenseType": "free",
      "price": 0,
      "ownerId": "user_123",
      "layout": [ /* layout nodes */ ],
      "fragments": [ /* fragments */ ],
      "styles": { /* styles */ },
      "computedFields": [ /* computed fields */ ],
      "scripts": [],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ]
}
```

**Access Control**:
- Returns public forms OR forms owned by the authenticated user

---

### Get Form by ID

Retrieve a single form by its ID.

**Endpoint**: `GET /api/v1/forms/:formId`

**Parameters**:
- `formId` (path, required) - Form ID

**Response**: `200 OK`
```json
{
  "form": {
    "id": "form_abc123",
    "name": "D&D 5e Character Sheet",
    "description": "Standard character sheet for D&D 5e",
    "gameSystemId": "dnd5e",
    "entityType": "character",
    "version": 1,
    "isDefault": true,
    "isLocked": true,
    "visibility": "public",
    "licenseType": "free",
    "price": 0,
    "ownerId": "user_123",
    "layout": [ /* layout nodes */ ],
    "fragments": [ /* fragments */ ],
    "styles": { /* styles */ },
    "computedFields": [ /* computed fields */ ],
    "scripts": [],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z"
  }
}
```

**Errors**:
- `404 Not Found` - Form doesn't exist
- `403 Forbidden` - User doesn't have access to this form

**Access Control**:
- Public forms OR owned by user OR assigned to a campaign where user is GM

---

### Create Form

Create a new form for a game system.

**Endpoint**: `POST /api/v1/game-systems/:systemId/forms`

**Parameters**:
- `systemId` (path, required) - Game system ID

**Request Body**:
```json
{
  "name": "My Custom Character Sheet",
  "description": "A custom character sheet with extra sections",
  "entityType": "character",
  "visibility": "private",
  "layout": [],
  "fragments": [],
  "styles": {},
  "computedFields": []
}
```

**Response**: `201 Created`
```json
{
  "form": {
    "id": "form_xyz789",
    "name": "My Custom Character Sheet",
    "description": "A custom character sheet with extra sections",
    "gameSystemId": "dnd5e",
    "entityType": "character",
    "version": 1,
    "isDefault": false,
    "isLocked": false,
    "visibility": "private",
    "licenseType": "free",
    "price": 0,
    "ownerId": "user_456",
    "layout": [],
    "fragments": [],
    "styles": {},
    "computedFields": [],
    "scripts": [],
    "createdAt": "2024-01-25T09:00:00Z",
    "updatedAt": "2024-01-25T09:00:00Z"
  }
}
```

**Errors**:
- `400 Bad Request` - Missing required fields or invalid data
- `404 Not Found` - Game system doesn't exist

**Access Control**:
- Authenticated users can create forms

---

### Update Form

Update an existing form. Only the owner can update.

**Endpoint**: `PATCH /api/v1/forms/:formId`

**Parameters**:
- `formId` (path, required) - Form ID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Form Name",
  "description": "Updated description",
  "layout": [ /* updated layout */ ],
  "fragments": [ /* updated fragments */ ],
  "styles": { /* updated styles */ },
  "computedFields": [ /* updated computed fields */ ],
  "visibility": "campaign",
  "changeNotes": "Added spell section"
}
```

**Response**: `200 OK`
```json
{
  "form": {
    /* Updated form object */
  }
}
```

**Version Increment**:
The version number automatically increments when any of these fields change:
- `layout`
- `fragments`
- `styles`
- `computedFields`

The previous version is saved to version history.

**Errors**:
- `404 Not Found` - Form doesn't exist
- `403 Forbidden` - User is not the owner OR form is locked
- `400 Bad Request` - Invalid data

**Access Control**:
- Only the form owner can update
- Locked forms cannot be updated

---

### Delete Form

Delete a form.

**Endpoint**: `DELETE /api/v1/forms/:formId`

**Parameters**:
- `formId` (path, required) - Form ID

**Response**: `204 No Content`

**Errors**:
- `404 Not Found` - Form doesn't exist
- `403 Forbidden` - User is not the owner OR form is default

**Access Control**:
- Only the form owner can delete
- Default forms cannot be deleted

---

### Duplicate Form

Create a copy of an existing form.

**Endpoint**: `POST /api/v1/forms/:formId/duplicate`

**Parameters**:
- `formId` (path, required) - Form ID to duplicate

**Request Body**:
```json
{
  "name": "Copy of Original Form",
  "description": "Duplicated form with modifications"
}
```

**Response**: `201 Created`
```json
{
  "form": {
    /* New form object with copied content */
  }
}
```

**Notes**:
- Version resets to 1
- `isDefault` and `isLocked` flags are cleared
- Visibility is set to "private"
- Owner is set to the requesting user

**Errors**:
- `404 Not Found` - Original form doesn't exist
- `403 Forbidden` - User doesn't have access to the original form
- `400 Bad Request` - Missing required fields

**Access Control**:
- Can duplicate public forms OR forms owned by user

---

## Campaign Form Assignment Endpoints

### List Campaign Forms

Get all forms assigned to a campaign.

**Endpoint**: `GET /api/v1/campaigns/:campaignId/forms`

**Parameters**:
- `campaignId` (path, required) - Campaign ID

**Response**: `200 OK`
```json
{
  "campaignForms": [
    {
      "id": "assignment_123",
      "campaignId": "campaign_abc",
      "formId": "form_xyz",
      "entityType": "character",
      "priority": 10,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "form": {
        /* Full form object */
      }
    }
  ]
}
```

**Errors**:
- `404 Not Found` - Campaign doesn't exist
- `403 Forbidden` - User is not a GM of this campaign

**Access Control**:
- Campaign owner OR GM can list assigned forms

---

### Assign Form to Campaign

Assign a form to a campaign.

**Endpoint**: `POST /api/v1/campaigns/:campaignId/forms`

**Parameters**:
- `campaignId` (path, required) - Campaign ID

**Request Body**:
```json
{
  "formId": "form_xyz",
  "entityType": "character",
  "priority": 10
}
```

**Response**: `201 Created`
```json
{
  "campaignForm": {
    "id": "assignment_456",
    "campaignId": "campaign_abc",
    "formId": "form_xyz",
    "entityType": "character",
    "priority": 10,
    "createdAt": "2024-01-25T11:00:00Z",
    "updatedAt": "2024-01-25T11:00:00Z"
  }
}
```

**Errors**:
- `404 Not Found` - Campaign or form doesn't exist
- `403 Forbidden` - User is not a GM OR doesn't have access to form
- `400 Bad Request` - Form already assigned to campaign

**Access Control**:
- Campaign owner OR GM can assign forms
- Must have access to the form (own it OR it's public)

---

### Update Campaign Form Assignment

Update the priority of a form assignment.

**Endpoint**: `PATCH /api/v1/campaigns/:campaignId/forms/:assignmentId`

**Parameters**:
- `campaignId` (path, required) - Campaign ID
- `assignmentId` (path, required) - Assignment ID

**Request Body**:
```json
{
  "priority": 20
}
```

**Response**: `200 OK`
```json
{
  "campaignForm": {
    /* Updated assignment object */
  }
}
```

**Errors**:
- `404 Not Found` - Campaign or assignment doesn't exist
- `403 Forbidden` - User is not a GM
- `400 Bad Request` - No fields to update

**Access Control**:
- Campaign owner OR GM can update assignments

---

### Remove Form from Campaign

Remove a form assignment from a campaign.

**Endpoint**: `DELETE /api/v1/campaigns/:campaignId/forms/:assignmentId`

**Parameters**:
- `campaignId` (path, required) - Campaign ID
- `assignmentId` (path, required) - Assignment ID

**Response**: `204 No Content`

**Errors**:
- `404 Not Found` - Campaign or assignment doesn't exist
- `403 Forbidden` - User is not a GM

**Access Control**:
- Campaign owner OR GM can remove assignments

---

### Get Active Form for Entity Type

Get the highest priority form for a specific entity type in a campaign.

**Endpoint**: `GET /api/v1/campaigns/:campaignId/forms/active/:entityType`

**Parameters**:
- `campaignId` (path, required) - Campaign ID
- `entityType` (path, required) - Entity type (e.g., "character", "item")

**Response**: `200 OK`
```json
{
  "form": {
    /* Form object */
  }
}
```

**Priority Logic**:
1. Checks assigned forms ordered by priority (highest first)
2. Validates license access for premium forms
3. Falls back to default form if no valid assignments

**Errors**:
- `404 Not Found` - Campaign doesn't exist OR no form found for entity type

**Access Control**:
- Any user with campaign access can get active forms

---

## Form Version History Endpoints

### List Form Versions

Get version history for a form (summary without full layout data).

**Endpoint**: `GET /api/v1/forms/:formId/versions`

**Parameters**:
- `formId` (path, required) - Form ID

**Response**: `200 OK`
```json
{
  "versions": [
    {
      "id": "version_123",
      "formId": "form_abc",
      "version": 5,
      "changeNotes": "Added spell section",
      "createdBy": "user_456",
      "createdAt": "2024-01-20T14:30:00Z"
    },
    {
      "id": "version_122",
      "formId": "form_abc",
      "version": 4,
      "changeNotes": "Fixed ability score layout",
      "createdBy": "user_456",
      "createdAt": "2024-01-18T10:15:00Z"
    }
  ]
}
```

**Notes**:
- Versions are ordered newest first
- Maximum of 50 versions kept per form

**Errors**:
- `404 Not Found` - Form doesn't exist
- `403 Forbidden` - User doesn't have access to form

**Access Control**:
- Form owner OR public forms can view version history

---

### Get Specific Form Version

Get full data for a specific version.

**Endpoint**: `GET /api/v1/forms/:formId/versions/:version`

**Parameters**:
- `formId` (path, required) - Form ID
- `version` (path, required) - Version number

**Response**: `200 OK`
```json
{
  "version": {
    "id": "version_123",
    "formId": "form_abc",
    "version": 5,
    "layout": [ /* layout at this version */ ],
    "fragments": [ /* fragments at this version */ ],
    "computedFields": [ /* computed fields at this version */ ],
    "styles": { /* styles at this version */ },
    "scripts": [],
    "changeNotes": "Added spell section",
    "createdBy": "user_456",
    "createdAt": "2024-01-20T14:30:00Z"
  }
}
```

**Errors**:
- `404 Not Found` - Form or version doesn't exist
- `403 Forbidden` - User doesn't have access to form
- `400 Bad Request` - Invalid version number

**Access Control**:
- Form owner OR public forms can view versions

---

### Revert to Previous Version

Revert a form to a previous version (creates a new version with old content).

**Endpoint**: `POST /api/v1/forms/:formId/versions/:version/revert`

**Parameters**:
- `formId` (path, required) - Form ID
- `version` (path, required) - Version number to revert to

**Request Body**:
```json
{
  "changeNotes": "Reverted to version 3 due to layout issues"
}
```

**Response**: `200 OK`
```json
{
  "form": {
    /* Updated form object with content from target version */
  }
}
```

**Notes**:
- Creates a new version (doesn't actually go backwards)
- Saves current version to history before reverting
- Increments version number

**Errors**:
- `404 Not Found` - Form or target version doesn't exist
- `403 Forbidden` - User is not owner OR form is locked
- `400 Bad Request` - Invalid version number

**Access Control**:
- Only the form owner can revert
- Locked forms cannot be reverted

---

## Form Import/Export Endpoints

### Export Form

Export a form as JSON for sharing or backup.

**Endpoint**: `GET /api/v1/forms/:formId/export`

**Parameters**:
- `formId` (path, required) - Form ID

**Response**: `200 OK`
```json
{
  "export": {
    "exportVersion": "1.0",
    "exportedAt": "2024-01-25T15:30:00Z",
    "form": {
      "name": "D&D 5e Character Sheet",
      "description": "Standard character sheet",
      "entityType": "character",
      "gameSystemId": "dnd5e",
      "version": 5,
      "layout": [ /* layout */ ],
      "fragments": [ /* fragments */ ],
      "computedFields": [ /* computed fields */ ],
      "styles": { /* styles */ },
      "scripts": []
    },
    "metadata": {
      "exportedBy": "john_doe",
      "sourceUrl": "http://localhost/forms/form_abc",
      "license": "free",
      "notes": "Exported from VTT Platform on 1/25/2024"
    }
  }
}
```

**Errors**:
- `404 Not Found` - Form doesn't exist
- `403 Forbidden` - User doesn't have access to form

**Access Control**:
- Can export public forms OR owned forms

---

### Import Form

Import a form from exported JSON.

**Endpoint**: `POST /api/v1/game-systems/:systemId/forms/import`

**Parameters**:
- `systemId` (path, required) - Target game system ID

**Request Body**:
```json
{
  "formData": {
    "exportVersion": "1.0",
    "form": {
      "name": "Imported Form",
      "entityType": "character",
      /* ... other form data ... */
    }
  },
  "conflictResolution": {
    "nameConflict": "rename",
    "fragmentConflict": "regenerate"
  }
}
```

**Conflict Resolution Options**:
- `nameConflict`: "rename" | "replace" | "error"
- `fragmentConflict`: "keep" | "regenerate"

**Response**: `201 Created`
```json
{
  "form": {
    /* New imported form object */
  },
  "validation": {
    "valid": true,
    "warnings": [
      "Form was created for game system dnd5e but importing to pf2e"
    ],
    "errors": [],
    "conflicts": {
      "gameSystemMismatch": true,
      "gameSystemId": "dnd5e"
    }
  }
}
```

**Validation Response (on conflict)**: `400 Bad Request`
```json
{
  "validation": {
    "valid": false,
    "warnings": [],
    "errors": [
      "Form with name \"Character Sheet\" already exists"
    ],
    "conflicts": {
      "nameConflict": true
    }
  }
}
```

**Errors**:
- `400 Bad Request` - Invalid export format, missing fields, or unresolved conflicts

**Access Control**:
- Authenticated users can import forms

---

## Data Types

### FormDefinition
```typescript
{
  id: string;
  name: string;
  description?: string;
  gameSystemId: string;
  entityType: string;
  version: number;
  isDefault: boolean;
  isLocked: boolean;
  visibility: 'private' | 'campaign' | 'public' | 'marketplace';
  licenseType?: 'free' | 'paid' | 'subscription';
  price?: number;
  ownerId: string;
  layout: LayoutNode[];
  fragments: FormFragment[];
  styles: Record<string, any>;
  computedFields: FormComputedField[];
  scripts?: FormScript[];
  createdAt: string;
  updatedAt: string;
}
```

### LayoutNode
```typescript
{
  id: string;
  type: string;
  children?: LayoutNode[];
  // Type-specific properties vary
}
```

### FormFragment
```typescript
{
  id: string;
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  layout: LayoutNode[];
}
```

### FormComputedField
```typescript
{
  id: string;
  name: string;
  description?: string;
  formula: string;
  resultType: 'number' | 'string' | 'boolean';
}
```

### CampaignForm
```typescript
{
  id: string;
  campaignId: string;
  formId: string;
  entityType: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `204` | No Content | Request successful, no content returned |
| `400` | Bad Request | Invalid request data or missing required fields |
| `401` | Unauthorized | Authentication required or token invalid |
| `403` | Forbidden | User doesn't have permission for this action |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Server error occurred |

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Messages

#### Authentication Errors
- `"Not authenticated"` - No valid JWT token provided
- `"Access denied"` - User doesn't have permission

#### Validation Errors
- `"Form name is required"` - Missing required field
- `"Form name cannot be empty"` - Invalid field value
- `"Entity type is required"` - Missing required field
- `"Invalid version number"` - Malformed version parameter

#### Permission Errors
- `"Only the owner can update this form"` - Non-owner trying to modify
- `"Only the owner can delete this form"` - Non-owner trying to delete
- `"Cannot update locked form"` - Trying to modify locked form
- `"Cannot delete default form"` - Trying to delete system default
- `"Only GMs can assign forms to campaigns"` - Non-GM trying to assign

#### Conflict Errors
- `"Form is already assigned to this campaign"` - Duplicate assignment
- `"Form with name \"X\" already exists"` - Name conflict on import

---

## Rate Limiting

Currently, there are no rate limits enforced on the Forms API. This may change in the future.

## Versioning

API version is specified in the URL path: `/api/v1/...`

Breaking changes will be introduced in new versions (e.g., `/api/v2/...`).

## Support

For API support, please contact the development team or file an issue in the project repository.

---

**Related Documentation:**
- [Form Designer User Guide](../guides/form-designer-guide.md)
- [Formula Language Reference](../guides/form-designer-formula-reference.md)
- [Field Types Reference](../guides/field-types-reference.md)

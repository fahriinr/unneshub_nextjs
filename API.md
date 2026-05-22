# UnnesHub API Documentation

This document describes the API endpoints and data models for UnnesHub.

## Base URL
The API is accessible at:
`http://localhost:3000/api`

---

## Authentication
UnnesHub uses **Better Auth** with a Prisma adapter for authentication.

### Endpoints
Authentication endpoints are located under `/api/auth/[...all]`.

#### 1. Sign Up (Email)
- **Endpoint**: `POST /api/auth/sign-up/email`
- **Description**: Register a new user with an email and password.
- **Rules**:
  - Email must match the `@students.unnes.ac.id` domain pattern.
- **Request Body**:
  ```json
  {
    "email": "user@students.unnes.ac.id",
    "password": "Password123!",
    "name": "John Doe"
  }
  ```

#### 2. Sign In (Email)
- **Endpoint**: `POST /api/auth/sign-in/email`
- **Description**: Authenticate using email and password.
- **Request Body**:
  ```json
  {
    "email": "user@students.unnes.ac.id",
    "password": "Password123!"
  }
  ```

#### 3. Sign Out
- **Endpoint**: `POST /api/auth/sign-out`
- **Description**: Invalidate the current session.

#### 4. Get Session
- **Endpoint**: `GET /api/auth/session`
- **Description**: Retrieve the current user's session information.

---

## Data Models (Prisma)

### User
Represents a student or administrator in the system.
| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Unique identifier |
| `name` | `String` | Full name |
| `email` | `String` | Unique email (@students.unnes.ac.id) |
| `prodi` | `String?` | Study program |
| `angkatan`| `Int?` | Batch year |
| `role` | `UserRole` | `MAHASISWA`, `COMMUNITY_ADMIN`, `GLOBAL_ADMIN` |
| `isVerified`| `Boolean` | Verification status |

### Community
Represents a student community/organization.
| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Unique identifier |
| `name` | `String` | Unique community name |
| `category`| `Enum` | `AKADEMIK`, `HOBI`, `KARIR`, `ORGANISASI`, `EVENT` |
| `status` | `Enum` | `PENDING_APPROVAL`, `APPROVED`, `REJECTED` |

### Post
Represents a discussion thread within a community.
| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Unique identifier |
| `communityId`| `String` | Reference to Community |
| `userId` | `String` | Reference to User (Author) |
| `content` | `Text` | Markdown or plain text content |
| `isAnonymous`| `Boolean` | Flag for anonymous posting |

### Comment
Represents a comment or reply on a post.
| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Unique identifier |
| `postId` | `String` | Reference to Post |
| `userId` | `String` | Reference to User (Author) |
| `parentId` | `String?` | Reference to parent Comment (for nested replies) |
| `content` | `Text` | Comment content |

### Like
Represents a "like" engagement on a post.
| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Unique identifier |
| `postId` | `String` | Reference to Post |
| `userId` | `String` | Reference to User |

---

## Planned API Endpoints

### Communities
- `GET /api/communities` - List all approved communities.
- `POST /api/communities` - Request to create a new community.
- `GET /api/communities/:id` - Get community details and members.

### Posts
- `GET /api/communities/:id/posts` - List posts in a specific community.
- `POST /api/communities/:id/posts` - Create a new post.
- `DELETE /api/posts/:id` - Delete a post (Author or Admin only).

### Comments & Likes
- `POST /api/posts/:id/comments` - Add a comment to a post.
- `POST /api/posts/:id/likes` - Toggle like on a post.

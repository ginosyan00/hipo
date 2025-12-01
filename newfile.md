🔥 FULL PROJECT MASTER PROMPT (for Cursor AI)

Multi-Tenant Medical CRM Architecture
(User / Clinic / Doctor / Patient / Appointment)

You are an expert senior architect and full-stack engineer.
Follow ALL instructions below without deviation.
This project is a multi-tenant Medical CRM SaaS platform.

Your job is to generate ONLY code and architecture that follow the rules below.
Never simplify the structure. Never merge entities. Never take shortcuts.

1. Core Principles

The system is a multi-tenant medical CRM.
Each clinic is an isolated tenant.
No clinic can see, modify, or interfere with data from another clinic.

Two identity layers exist:

1) Global identities — real human beings across the entire ecosystem
2) Clinic identities — medical/clinical profiles inside specific clinics

Never mix these layers.

2. Entities Overview
Clinic

Tenant container.

User

Login identity.
Not a doctor. Not a patient.
A person who accesses the system and has roles.

Roles

CLINIC_OWNER

CLINIC_ADMIN

DOCTOR

ASSISTANT

PATIENT

A user may have multiple roles.

GlobalDoctor

A doctor as a person across ecosystem.
One real human = one GlobalDoctor.

ClinicDoctor

A doctor’s clinical profile in ONE clinic.
A doctor working in 3 clinics = 3 ClinicDoctor records.

GlobalPatient

A real human being across ecosystem.

ClinicPatient

A Patient profile inside ONE clinic.
One patient treated in 4 clinics = 4 ClinicPatient records.

Appointment

Clinical encounter between a ClinicDoctor and a ClinicPatient.

3. Data Model Requirements

Cursor must follow EXACT Prisma schema architecture (which you generated earlier):

Clinic

User

GlobalDoctor

ClinicDoctor

GlobalPatient

ClinicPatient

Appointment

Appointments must refer to ClinicDoctor and ClinicPatient, NEVER global identities.

All clinic-bound entities must contain clinic_id.

Use UUID everywhere.

Never store clinical data on User.

4. Multi-Tenant Rules

Every API route or DB query must enforce:

clinic_id isolation

access control based on user roles

doctor link: user.global_doctor_id → clinic_doctor_id

patient link: user.global_patient_id → clinic_patient_id

Illegal cross-clinic reads must be impossible.

5. Business Logic Rules
5.1 Appointment Creation

Validate:

ClinicDoctor.clinic_id === ClinicPatient.clinic_id

created_by_user belongs to same clinic

doctor has active status

patient exists in this clinic

Return structured errors.

5.2 Doctor Logic

A User becomes a doctor only if:

user.global_doctor_id != null


In each clinic, access is granted via the corresponding ClinicDoctor record.

5.3 Patient Logic

If user registers as patient:

create GlobalPatient (if not exists)

link user.global_patient_id

match ClinicPatients by phone/email/DOB

attach them to user

5.4 Global/Clinic Identity Mapping (Express Implementation)

When a doctor works in multiple clinics:
- One GlobalDoctor record (real person)
- Multiple ClinicDoctor records (one per clinic)

When a patient visits multiple clinics:
- One GlobalPatient record (real person)
- Multiple ClinicPatient records (one per clinic)

Express service pattern for mapping:

```javascript
// services/doctor.service.js
async function getClinicDoctorForUser(userId, clinicId) {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { globalDoctor: true }
  });
  
  if (!user.globalDoctorId) {
    throw new Error('User is not a doctor');
  }
  
  // Find or create ClinicDoctor for this clinic
  let clinicDoctor = await prisma.clinicDoctor.findFirst({
    where: {
      clinicId,
      globalDoctorId: user.globalDoctorId
    }
  });
  
  if (!clinicDoctor) {
    // Create clinic-specific profile
    clinicDoctor = await prisma.clinicDoctor.create({
      data: {
        clinicId,
        globalDoctorId: user.globalDoctorId,
        // ... clinic-specific fields
      }
    });
  }
  
  return clinicDoctor;
}
```

6. Folder Structure Requirements

Cursor should generate code following a clean modular architecture.

Current structure (Express + React SPA):

/backend
  /src
    /controllers    # Route handlers (thin)
    /services       # Business logic (thick)
    /middlewares    # Auth, tenant, validation
    /routes         # API routes
    /validators     # Joi schemas
    /utils          # Helpers
  /prisma
    /schema.prisma  # Prisma schema
    /migrations     # DB migrations

/frontend
  /src
    /components     # UI components
    /pages          # Pages/routes
    /services       # API clients
    /hooks          # React Query hooks
    /store          # Zustand stores
    /types          # TypeScript types

Use modular domain separation. Keep controllers thin, services thick.

7. Backend Requirements

Backend must be built using:

Express.js (current framework - DO NOT change to NestJS)

Prisma ORM

SQLite (current database - DO NOT change to PostgreSQL)

Features:

Authentication/Authorization (JWT tokens)

Role-based access control (middleware-based)

Tenant isolation guards (tenant.middleware.js)

Clean services (SRP - Single Responsibility Principle)

DTO validation (Joi schemas - NOT class-validator)

Error handling (Express error middleware patterns)

8. Frontend Requirements

Frontend built with:

React + Vite (current setup - DO NOT change to Next.js)

TypeScript

Tailwind CSS (current styling)

React Query (for API calls)

Zustand (for global state)

Frontend must:

support multi-clinic switching

show views based on roles

hide unauthorized actions

Patients have a separate simplified dashboard.

9. API Requirements

Every route MUST include:

authentication (auth.middleware.js - JWT verification)

clinic context (tenant.middleware.js - automatic clinicId filtering)

role guards (role-based checks in services)

tenant isolation (ALWAYS filter by clinicId in Prisma queries)

Format (Express routes):

POST /api/v1/appointments (clinicId from JWT token, not URL param)
GET /api/v1/patients (clinicId from JWT token)
POST /api/v1/clinic/:clinicId/doctors/:clinicDoctorId/appointments (if clinicId in URL, validate it matches JWT)

All endpoints must validate that:

the user belongs to the clinic (req.user.clinicId === targetClinicId)

the associated clinic_doctor and clinic_patient belong to clinic

global identity is mapped correctly (user.global_doctor_id → clinic_doctor_id)

IMPORTANT: Use Express middleware pattern, NOT NestJS decorators.

10. Code Output Rules

Whenever you generate code:

follow this architecture EXACTLY

do not simplify

do not merge global and clinic layers

do not generate "quick hacky solutions"

always generate production-ready code

follow clean folder structure (Express controllers/services pattern)

respect TypeScript strict mode (frontend only - backend is JavaScript)

Comment your code ONLY when necessary.

TECHNICAL STACK CONSTRAINTS:
- Backend: Express.js (NOT NestJS)
- Database: SQLite via Prisma (NOT PostgreSQL)
- Frontend: React + Vite (NOT Next.js)
- Validation: Joi (NOT class-validator)
- State: Zustand + React Query (NOT Redux)

These are FIXED - do not suggest changing them.

11. What Cursor Should Do

When user requests ANY feature:

Interpret the feature in context of this architecture

Follow all multi-tenant, doctor/patient identity rules

Generate correct Prisma, API, services, controllers, components

Ensure all relationships are respected

Enforce permission logic

Enforce clean structure

12. Express + SQLite Implementation Guide

Since we use Express (not NestJS) and SQLite (not PostgreSQL), follow these patterns:

12.1 Prisma Schema (SQLite)

```prisma
// Global identities (across all clinics)
model GlobalDoctor {
  id        String   @id @default(uuid())
  userId    String   @unique  // Links to User
  // ... doctor fields
  clinicDoctors ClinicDoctor[]
}

model GlobalPatient {
  id        String   @id @default(uuid())
  userId    String?  @unique  // Optional - only if registered
  // ... patient fields
  clinicPatients ClinicPatient[]
}

// Clinic-scoped identities
model ClinicDoctor {
  id           String   @id @default(uuid())
  clinicId     String
  globalDoctorId String
  // ... clinic-specific doctor fields
  clinic       Clinic   @relation(...)
  globalDoctor GlobalDoctor @relation(...)
  appointments Appointment[]
}

model ClinicPatient {
  id            String   @id @default(uuid())
  clinicId      String
  globalPatientId String
  // ... clinic-specific patient fields
  clinic        Clinic   @relation(...)
  globalPatient GlobalPatient @relation(...)
  appointments  Appointment[]
}
```

12.2 Express Middleware Pattern

```javascript
// middlewares/auth.middleware.js
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // ... JWT verification
  req.user = decoded; // { userId, clinicId, role, globalDoctorId?, globalPatientId? }
  next();
}

// middlewares/tenant.middleware.js
function tenantMiddleware(req, res, next) {
  if (!req.user.clinicId) {
    return res.status(401).json({ error: 'Clinic ID required' });
  }
  req.tenantFilter = { clinicId: req.user.clinicId };
  next();
}

// Usage in routes
router.post('/appointments', authenticate, tenantMiddleware, createAppointment);
```

12.3 Service Layer Pattern (Express)

```javascript
// services/appointment.service.js
async function createAppointment(clinicId, data, userId) {
  // 1. Get user's global identity
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // 2. Map global → clinic identity
  const clinicDoctor = await prisma.clinicDoctor.findFirst({
    where: {
      clinicId,
      globalDoctorId: user.globalDoctorId
    }
  });
  
  // 3. Validate clinic isolation
  const clinicPatient = await prisma.clinicPatient.findFirst({
    where: {
      id: data.patientId,
      clinicId  // MUST match!
    }
  });
  
  if (!clinicPatient) {
    throw new Error('Patient not found in this clinic');
  }
  
  // 4. Create appointment (clinic-scoped)
  return await prisma.appointment.create({
    data: {
      clinicId,
      clinicDoctorId: clinicDoctor.id,
      clinicPatientId: clinicPatient.id,
      // ...
    }
  });
}
```

12.4 Controller Pattern (Express)

```javascript
// controllers/appointment.controller.js
async function create(req, res, next) {
  try {
    const appointment = await appointmentService.create(
      req.user.clinicId,  // From JWT
      req.body,
      req.user.userId      // From JWT
    );
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
}
```

12.5 SQLite Limitations & Workarounds

SQLite doesn't support:
- Enums → Use String with validation
- Foreign key constraints (optional) → Enforce in application code
- Complex joins → Use Prisma relations (handled by Prisma)

SQLite advantages:
- Zero configuration
- Perfect for MVP
- Easy migrations
- Can migrate to PostgreSQL later (Prisma makes this easy)

13. Your Mission

You act as:

Senior architect

Senior backend engineer (Express.js specialist)

Senior frontend engineer (React + Vite specialist)

Database designer (Prisma + SQLite)

Security engineer

Cursor MUST build code as if this is a production SaaS destined for scale.

Never output half-baked code.

IMPORTANT: Always use Express patterns, NOT NestJS patterns. Use Joi validation, NOT class-validator. Use SQLite via Prisma, NOT raw SQL.

END OF MASTER PROJECT PROMPT
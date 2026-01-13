# Database Schema - Sistema de Gestión de Condominios

## 📊 Diagrama ER Conceptual

```
Users ←→ Residents ←→ Units ←→ Complexes
                              ↓
                          Amenities → Reservations
                              ↓
                          Services → Unit_Services → Invoices → Payments
                              ↓
                          Access_Cards
                              ↓
                          Visitors → Visitor_Logs
```

---

## 🗄️ Schema Prisma Completo

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ========================================
// AUTHENTICATION & USERS
// ========================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  OPERATOR
  GUARD
  RESIDENT
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model User {
  id            String      @id @default(uuid())
  email         String      @unique
  password      String
  name          String
  phone         String?
  avatar_url    String?
  role          UserRole    @default(RESIDENT)
  status        UserStatus  @default(ACTIVE)
  
  // Relations
  complex_id    String?
  complex       Complex?    @relation(fields: [complex_id], references: [id])
  resident      Resident?
  
  // Notifications preferences
  notifications Json?
  
  // Audit
  created_at    DateTime    @default(now())
  updated_at    DateTime    @updatedAt
  last_login    DateTime?
  
  @@index([email])
  @@index([complex_id])
  @@map("users")
}

// ========================================
// COMPLEXES & PROPERTIES
// ========================================

enum ComplexType {
  EDIFICIO
  RESIDENCIAL
  CONDOMINIO
  CONJUNTO_CERRADO
}

model Complex {
  id            String       @id @default(uuid())
  name          String
  address       String       @db.Text
  type          ComplexType
  logo_url      String?
  description   String?      @db.Text
  
  // Settings (JSON)
  settings      Json?
  
  // Relations
  units         Unit[]
  amenities     Amenity[]
  services      Service[]
  users         User[]
  announcements Announcement[]
  events        Event[]
  documents     Document[]
  
  // Audit
  created_at    DateTime     @default(now())
  updated_at    DateTime     @updatedAt
  
  @@map("complexes")
}

enum UnitType {
  APARTAMENTO
  CASA
  LOCAL_COMERCIAL
}

enum UnitStatus {
  OCCUPIED
  VACANT
  MAINTENANCE
  RESERVED
}

model Unit {
  id            String       @id @default(uuid())
  number        String       // A-101, Casa 5, etc.
  type          UnitType
  status        UnitStatus   @default(VACANT)
  
  // Details
  bedrooms      Int?
  bathrooms     Int?
  area          Decimal?     @db.Decimal(10, 2) // m2
  floor         String?
  
  // Relations
  complex_id    String
  complex       Complex      @relation(fields: [complex_id], references: [id], onDelete: Cascade)
  
  residents     Resident[]
  unit_services UnitService[]
  invoices      Invoice[]
  access_cards  AccessCard[]
  parking_spots ParkingSpot[]
  
  // Audit
  created_at    DateTime     @default(now())
  updated_at    DateTime     @updatedAt
  
  @@unique([complex_id, number])
  @@index([complex_id])
  @@index([status])
  @@map("units")
}

enum ResidentType {
  OWNER
  TENANT
}

model Resident {
  id                String       @id @default(uuid())
  
  // Personal Info
  identification    String       @unique // DPI, Cédula, Passport
  
  // Relations
  user_id           String       @unique
  user              User         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  unit_id           String
  unit              Unit         @relation(fields: [unit_id], references: [id], onDelete: Cascade)
  
  type              ResidentType @default(OWNER)
  
  // Emergency Contact
  emergency_name    String?
  emergency_phone   String?
  emergency_relation String?
  
  // Occupancy dates
  start_date        DateTime     @default(now())
  end_date          DateTime?
  
  // Relations
  vehicles          Vehicle[]
  visitors          Visitor[]
  incidents         Incident[]
  
  // Audit
  created_at        DateTime     @default(now())
  updated_at        DateTime     @updatedAt
  
  @@index([user_id])
  @@index([unit_id])
  @@map("residents")
}

// ========================================
// SERVICES & BILLING
// ========================================

enum ServiceType {
  MANTENIMIENTO
  AGUA
  BASURA
  SEGURIDAD
  LIMPIEZA
  GAS
  INTERNET
  CABLE
  OTROS
}

model Service {
  id            String        @id @default(uuid())
  name          String
  type          ServiceType
  description   String?       @db.Text
  
  // Pricing
  monthly_cost  Decimal       @db.Decimal(10, 2)
  is_mandatory  Boolean       @default(false)
  
  // Relations
  complex_id    String
  complex       Complex       @relation(fields: [complex_id], references: [id], onDelete: Cascade)
  
  unit_services UnitService[]
  
  // Status
  is_active     Boolean       @default(true)
  
  // Audit
  created_at    DateTime      @default(now())
  updated_at    DateTime      @updatedAt
  
  @@index([complex_id])
  @@map("services")
}

model UnitService {
  id            String   @id @default(uuid())
  
  // Relations
  unit_id       String
  unit          Unit     @relation(fields: [unit_id], references: [id], onDelete: Cascade)
  
  service_id    String
  service       Service  @relation(fields: [service_id], references: [id], onDelete: Cascade)
  
  // Pricing override (if different from service base price)
  custom_cost   Decimal? @db.Decimal(10, 2)
  
  // Status
  is_active     Boolean  @default(true)
  start_date    DateTime @default(now())
  end_date      DateTime?
  
  // Audit
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  @@unique([unit_id, service_id])
  @@index([unit_id])
  @@index([service_id])
  @@map("unit_services")
}

// ========================================
// INVOICING & PAYMENTS
// ========================================

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

model Invoice {
  id              String         @id @default(uuid())
  invoice_number  String         @unique
  
  // Relations
  unit_id         String
  unit            Unit           @relation(fields: [unit_id], references: [id])
  
  // Amounts
  subtotal        Decimal        @db.Decimal(10, 2)
  tax             Decimal        @db.Decimal(10, 2) @default(0)
  total           Decimal        @db.Decimal(10, 2)
  
  // Dates
  issue_date      DateTime       @default(now())
  due_date        DateTime
  paid_date       DateTime?
  
  // Status
  status          InvoiceStatus  @default(PENDING)
  
  // Relations
  items           InvoiceItem[]
  payments        Payment[]
  
  // Audit
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt
  
  @@index([unit_id])
  @@index([status])
  @@index([due_date])
  @@map("invoices")
}

enum InvoiceItemType {
  SERVICE
  AMENITY_RESERVATION
  FINE
  OTHER
}

model InvoiceItem {
  id            String           @id @default(uuid())
  
  // Relations
  invoice_id    String
  invoice       Invoice          @relation(fields: [invoice_id], references: [id], onDelete: Cascade)
  
  // Item details
  type          InvoiceItemType
  description   String
  quantity      Int              @default(1)
  unit_price    Decimal          @db.Decimal(10, 2)
  total         Decimal          @db.Decimal(10, 2)
  
  // Optional reference to source
  reference_id  String?          // ID of service, reservation, etc.
  
  // Audit
  created_at    DateTime         @default(now())
  
  @@index([invoice_id])
  @@map("invoice_items")
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  BANK_TRANSFER
  CASH
  CHECK
}

model Payment {
  id                String        @id @default(uuid())
  
  // Relations
  invoice_id        String
  invoice           Invoice       @relation(fields: [invoice_id], references: [id])
  
  // Payment details
  amount            Decimal       @db.Decimal(10, 2)
  method            PaymentMethod
  status            PaymentStatus @default(PENDING)
  
  // Stripe/Payment Gateway
  stripe_payment_id String?       @unique
  stripe_customer   String?
  
  // Transaction info
  transaction_id    String?
  confirmation_code String?
  receipt_url       String?
  
  // Dates
  payment_date      DateTime      @default(now())
  
  // Audit
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt
  
  @@index([invoice_id])
  @@index([status])
  @@map("payments")
}

// ========================================
// AMENITIES & RESERVATIONS
// ========================================

enum AmenityType {
  PISCINA
  GIMNASIO
  CASA_CLUB
  CANCHA_DEPORTIVA
  SALON_EVENTOS
  BBQ
  PARQUE
  COWORKING
  OTROS
}

enum AmenityStatus {
  AVAILABLE
  MAINTENANCE
  CLOSED
}

model Amenity {
  id              String         @id @default(uuid())
  name            String
  type            AmenityType
  description     String?        @db.Text
  
  // Relations
  complex_id      String
  complex         Complex        @relation(fields: [complex_id], references: [id], onDelete: Cascade)
  
  // Capacity & Hours
  capacity        Int?
  operating_hours Json?          // {monday: {start: "08:00", end: "20:00"}, ...}
  
  // Pricing
  cost_per_day    Decimal?       @db.Decimal(10, 2)
  cost_per_hour   Decimal?       @db.Decimal(10, 2)
  
  // Images
  images          String?        @db.Text // JSON array of S3 URLs
  
  // Status
  status          AmenityStatus  @default(AVAILABLE)
  
  // Reservation settings
  requires_approval Boolean      @default(false)
  max_hours       Int?
  advance_booking_days Int?
  
  // Relations
  reservations    Reservation[]
  
  // Audit
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt
  
  @@index([complex_id])
  @@map("amenities")
}

enum ReservationType {
  FULL_DAY
  HOURLY
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

model Reservation {
  id            String            @id @default(uuid())
  
  // Relations
  amenity_id    String
  amenity       Amenity           @relation(fields: [amenity_id], references: [id], onDelete: Cascade)
  
  resident_id   String
  resident      Resident          @relation(fields: [resident_id], references: [id])
  
  // Reservation details
  type          ReservationType
  date          DateTime          @db.Date
  start_time    DateTime?
  end_time      DateTime?
  guests        Int               @default(1)
  
  // Pricing
  total_cost    Decimal           @db.Decimal(10, 2)
  
  // Status
  status        ReservationStatus @default(PENDING)
  
  // Notes
  notes         String?           @db.Text
  cancellation_reason String?     @db.Text
  
  // Audit
  created_at    DateTime          @default(now())
  updated_at    DateTime          @updatedAt
  cancelled_at  DateTime?
  
  @@index([amenity_id])
  @@index([resident_id])
  @@index([date])
  @@map("reservations")
}

// ========================================
// ACCESS CONTROL
// ========================================

enum CardStatus {
  ACTIVE
  INACTIVE
  LOST
  STOLEN
}

model AccessCard {
  id            String     @id @default(uuid())
  card_number   String     @unique
  
  // Relations
  unit_id       String
  unit          Unit       @relation(fields: [unit_id], references: [id], onDelete: Cascade)
  
  // Details
  holder_name   String
  status        CardStatus @default(ACTIVE)
  
  // Dates
  issued_date   DateTime   @default(now())
  expiry_date   DateTime?
  deactivated_at DateTime?
  
  // Audit
  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
  
  @@index([unit_id])
  @@index([card_number])
  @@map("access_cards")
}

enum VisitorStatus {
  AUTHORIZED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
}

model Visitor {
  id              String         @id @default(uuid())
  
  // Personal Info
  name            String
  identification  String?
  phone           String?
  vehicle_plate   String?
  photo_url       String?
  
  // Relations
  resident_id     String
  resident        Resident       @relation(fields: [resident_id], references: [id])
  
  // Visit details
  visit_date      DateTime       @db.Date
  expected_time   DateTime?
  purpose         String?
  
  // Status
  status          VisitorStatus  @default(AUTHORIZED)
  
  // Relations
  logs            VisitorLog[]
  
  // Audit
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt
  
  @@index([resident_id])
  @@index([visit_date])
  @@map("visitors")
}

enum LogType {
  ENTRY
  EXIT
}

model VisitorLog {
  id            String   @id @default(uuid())
  
  // Relations
  visitor_id    String
  visitor       Visitor  @relation(fields: [visitor_id], references: [id], onDelete: Cascade)
  
  // Log details
  type          LogType
  timestamp     DateTime @default(now())
  
  // Guard info
  guard_id      String?
  guard_name    String?
  
  // Notes
  notes         String?  @db.Text
  
  // Audit
  created_at    DateTime @default(now())
  
  @@index([visitor_id])
  @@index([timestamp])
  @@map("visitor_logs")
}

// ========================================
// VEHICLES & PARKING
// ========================================

model Vehicle {
  id            String   @id @default(uuid())
  
  // Relations
  resident_id   String
  resident      Resident @relation(fields: [resident_id], references: [id], onDelete: Cascade)
  
  // Vehicle details
  plate         String   @unique
  brand         String?
  model         String?
  color         String?
  year          Int?
  
  // Status
  is_active     Boolean  @default(true)
  
  // Audit
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  @@index([resident_id])
  @@index([plate])
  @@map("vehicles")
}

enum ParkingType {
  ASSIGNED
  VISITOR
  DISABLED
}

model ParkingSpot {
  id            String      @id @default(uuid())
  number        String
  type          ParkingType @default(ASSIGNED)
  
  // Relations
  unit_id       String?
  unit          Unit?       @relation(fields: [unit_id], references: [id])
  
  // Status
  is_available  Boolean     @default(true)
  
  // Audit
  created_at    DateTime    @default(now())
  updated_at    DateTime    @updatedAt
  
  @@index([unit_id])
  @@map("parking_spots")
}

// ========================================
// COMMUNICATION
// ========================================

enum AnnouncementPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model Announcement {
  id            String               @id @default(uuid())
  title         String
  content       String               @db.Text
  priority      AnnouncementPriority @default(NORMAL)
  
  // Relations
  complex_id    String
  complex       Complex              @relation(fields: [complex_id], references: [id], onDelete: Cascade)
  
  // Targeting
  target_roles  Json?                // Array of roles to show to
  
  // Images
  image_url     String?
  
  // Publishing
  published_at  DateTime?
  expires_at    DateTime?
  
  // Author
  author_id     String
  author_name   String
  
  // Audit
  created_at    DateTime             @default(now())
  updated_at    DateTime             @updatedAt
  
  @@index([complex_id])
  @@index([published_at])
  @@map("announcements")
}

model Event {
  id            String   @id @default(uuid())
  title         String
  description   String   @db.Text
  
  // Relations
  complex_id    String
  complex       Complex  @relation(fields: [complex_id], references: [id], onDelete: Cascade)
  
  // Event details
  location      String?
  event_date    DateTime
  start_time    DateTime
  end_time      DateTime
  max_attendees Int?
  
  // Images
  image_url     String?
  
  // RSVP
  rsvps         EventRSVP[]
  
  // Author
  organizer_id  String
  organizer_name String
  
  // Audit
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  @@index([complex_id])
  @@index([event_date])
  @@map("events")
}

enum RSVPStatus {
  GOING
  NOT_GOING
  MAYBE
}

model EventRSVP {
  id          String     @id @default(uuid())
  
  // Relations
  event_id    String
  event       Event      @relation(fields: [event_id], references: [id], onDelete: Cascade)
  
  user_id     String
  status      RSVPStatus
  guests      Int        @default(0)
  
  // Audit
  created_at  DateTime   @default(now())
  updated_at  DateTime   @updatedAt
  
  @@unique([event_id, user_id])
  @@index([event_id])
  @@map("event_rsvps")
}

// ========================================
// INCIDENTS & REPORTS
// ========================================

enum IncidentCategory {
  MANTENIMIENTO
  SEGURIDAD
  CONVIVENCIA
  SERVICIOS
  OTROS
}

enum IncidentStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum IncidentPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Incident {
  id            String           @id @default(uuid())
  title         String
  description   String           @db.Text
  category      IncidentCategory
  priority      IncidentPriority @default(MEDIUM)
  status        IncidentStatus   @default(OPEN)
  
  // Relations
  resident_id   String
  resident      Resident         @relation(fields: [resident_id], references: [id])
  
  // Location
  location      String?
  
  // Evidence
  photos        String?          @db.Text // JSON array of S3 URLs
  
  // Assignment
  assigned_to   String?
  assigned_name String?
  
  // Resolution
  resolution    String?          @db.Text
  resolved_at   DateTime?
  
  // Comments
  comments      IncidentComment[]
  
  // Audit
  created_at    DateTime         @default(now())
  updated_at    DateTime         @updatedAt
  
  @@index([resident_id])
  @@index([status])
  @@index([category])
  @@map("incidents")
}

model IncidentComment {
  id            String   @id @default(uuid())
  
  // Relations
  incident_id   String
  incident      Incident @relation(fields: [incident_id], references: [id], onDelete: Cascade)
  
  // Comment
  comment       String   @db.Text
  
  // Author
  author_id     String
  author_name   String
  author_role   UserRole
  
  // Audit
  created_at    DateTime @default(now())
  
  @@index([incident_id])
  @@map("incident_comments")
}

// ========================================
// DOCUMENTS
// ========================================

enum DocumentCategory {
  REGLAMENTO
  POLITICAS
  ACTAS
  MANUALES
  CONTRATOS
  OTROS
}

model Document {
  id            String           @id @default(uuid())
  title         String
  category      DocumentCategory
  description   String?          @db.Text
  
  // Relations
  complex_id    String
  complex       Complex          @relation(fields: [complex_id], references: [id], onDelete: Cascade)
  
  // File
  file_url      String
  file_name     String
  file_size     Int              // bytes
  file_type     String           // PDF, DOCX, etc.
  
  // Version control
  version       String           @default("1.0")
  
  // Access control
  visible_to_residents Boolean   @default(true)
  
  // Upload info
  uploaded_by   String
  uploaded_name String
  
  // Audit
  created_at    DateTime         @default(now())
  updated_at    DateTime         @updatedAt
  
  @@index([complex_id])
  @@index([category])
  @@map("documents")
}

// ========================================
// SYSTEM & AUDIT
// ========================================

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
}

model AuditLog {
  id            String      @id @default(uuid())
  
  // User
  user_id       String
  user_email    String
  user_role     UserRole
  
  // Action
  action        AuditAction
  entity_type   String      // "User", "Invoice", etc.
  entity_id     String
  
  // Details
  changes       Json?       // Before/after values
  ip_address    String?
  user_agent    String?
  
  // Timestamp
  created_at    DateTime    @default(now())
  
  @@index([user_id])
  @@index([entity_type, entity_id])
  @@index([created_at])
  @@map("audit_logs")
}

model SystemSetting {
  id            String   @id @default(uuid())
  key           String   @unique
  value         String   @db.Text
  description   String?
  
  // Audit
  updated_at    DateTime @updatedAt
  updated_by    String
  
  @@map("system_settings")
}
```

---

## 📋 Índices y Optimizaciones

### Índices Principales
- Todas las foreign keys tienen índices
- Campos de búsqueda frecuente (email, status, dates)
- Campos de filtrado común

### Índices Compuestos Recomendados
```sql
CREATE INDEX idx_invoice_unit_status ON invoices(unit_id, status);
CREATE INDEX idx_reservation_amenity_date ON reservations(amenity_id, date);
CREATE INDEX idx_visitor_resident_date ON visitors(resident_id, visit_date);
```

---

## 🔄 Migraciones Importantes

### Crear usuario super admin inicial
```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@condomanager.com',
      password: hashedPassword,
      name: 'Super Administrador',
      role: UserRole.SUPER_ADMIN,
    },
  });
  
  console.log('Super admin created:', superAdmin.email);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.disconnect());
```

---

## 📊 Relaciones Clave

### User → Resident → Unit → Complex
Flujo principal de datos del sistema

### Invoice → InvoiceItem → (Service | Reservation)
Sistema de facturación

### Resident → Visitor → VisitorLog
Control de acceso

### Amenity → Reservation → Invoice
Reservas y cobro

---

**Versión**: 1.0
**Última Actualización**: [Fecha]

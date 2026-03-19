# API Endpoints Documentation - CondoManager Pro

## 🌐 Base URL

```
Development: http://localhost:3000/api
Production: https://condomanager.vercel.app/api
```

---

## 🔐 Authentication

La autenticación se maneja con **NextAuth session cookies** (httpOnly, secure en producción).
No se usa bearer token/JWT manual en headers para rutas internas.

Para endpoints que llaman servicios externos internos (ej. cron), se usa `Authorization: Bearer <secret>` solo cuando corresponde.

---

## 📋 API Endpoints por Módulo

### 1. Authentication

#### POST /api/auth/register
Registrar un nuevo usuario

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Juan Pérez",
  "phone": "+502 1234-5678",
  "role": "RESIDENT"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Juan Pérez",
      "role": "RESIDENT"
    }
  }
}
```

---

#### POST /api/auth/login
Iniciar sesión

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Juan Pérez",
      "role": "RESIDENT",
      "complex_id": "uuid"
    }
  }
}
```

---

#### GET /api/auth/me
Obtener usuario actual

**Headers:**
```http
Cookie: next-auth.session-token=<session-cookie>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Juan Pérez",
    "role": "RESIDENT",
    "complex": {
      "id": "uuid",
      "name": "Edificio Central"
    }
  }
}
```

---

### 2. Complexes (Complejos Habitacionales)

#### GET /api/complexes
Listar complejos

**Query Params:**
```
?page=1
&limit=10
&search=edificio
&type=EDIFICIO
&sort=name
&order=asc
```

**Permissions:** SUPER_ADMIN, ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "complexes": [
      {
        "id": "uuid",
        "name": "Edificio Central",
        "address": "5ta Avenida 10-50 Zona 1",
        "type": "EDIFICIO",
        "logo_url": "https://s3.../logo.png",
        "units_count": 45,
        "occupied_units": 40,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "total_pages": 10
    }
  }
}
```

---

#### GET /api/complexes/:id
Obtener detalle de complejo

**Permissions:** SUPER_ADMIN, ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Edificio Central",
    "address": "5ta Avenida 10-50 Zona 1",
    "type": "EDIFICIO",
    "logo_url": "https://s3.../logo.png",
    "description": "Edificio residencial en zona 1",
    "settings": {
      "timezone": "America/Guatemala",
      "currency": "GTQ"
    },
    "stats": {
      "total_units": 45,
      "occupied_units": 40,
      "total_residents": 98,
      "amenities_count": 5
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-20T15:30:00Z"
  }
}
```

---

#### POST /api/complexes
Crear complejo

**Permissions:** SUPER_ADMIN, ADMIN

**Body:**
```json
{
  "name": "Edificio Central",
  "address": "5ta Avenida 10-50 Zona 1",
  "type": "EDIFICIO",
  "description": "Edificio residencial en zona 1",
  "logo_url": "https://s3.../logo.png",
  "settings": {
    "timezone": "America/Guatemala",
    "currency": "GTQ"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Edificio Central",
    "address": "5ta Avenida 10-50 Zona 1",
    "type": "EDIFICIO",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Complejo creado exitosamente"
}
```

---

#### PUT /api/complexes/:id
Actualizar complejo

**Permissions:** SUPER_ADMIN, ADMIN

**Body:**
```json
{
  "name": "Edificio Central Renovado",
  "description": "Nueva descripción"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Edificio Central Renovado",
    "updated_at": "2024-01-20T15:30:00Z"
  },
  "message": "Complejo actualizado exitosamente"
}
```

---

#### DELETE /api/complexes/:id
Eliminar complejo

**Permissions:** SUPER_ADMIN

**Response 200:**
```json
{
  "success": true,
  "message": "Complejo eliminado exitosamente"
}
```

---

### 3. Units (Unidades Habitacionales)

#### GET /api/complexes/:complexId/units
Listar unidades de un complejo

**Query Params:**
```
?page=1
&limit=20
&status=OCCUPIED
&type=APARTAMENTO
&search=A-101
```

**Permissions:** SUPER_ADMIN, ADMIN, OPERATOR, RESIDENT (solo su unidad)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "units": [
      {
        "id": "uuid",
        "number": "A-101",
        "type": "APARTAMENTO",
        "status": "OCCUPIED",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 85.5,
        "floor": "1",
        "residents": [
          {
            "id": "uuid",
            "name": "Juan Pérez",
            "type": "OWNER"
          }
        ],
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "total_pages": 3
    }
  }
}
```

---

#### POST /api/complexes/:complexId/units
Crear unidad

**Permissions:** SUPER_ADMIN, ADMIN

**Body:**
```json
{
  "number": "A-101",
  "type": "APARTAMENTO",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 85.5,
  "floor": "1"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "number": "A-101",
    "type": "APARTAMENTO",
    "status": "VACANT",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Unidad creada exitosamente"
}
```

---

### 4. Residents (Residentes)

#### GET /api/residents
Listar residentes

**Query Params:**
```
?complex_id=uuid
&unit_id=uuid
&type=OWNER
&search=Juan
```

**Permissions:** SUPER_ADMIN, ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "residents": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "name": "Juan Pérez",
          "email": "juan@example.com",
          "phone": "+502 1234-5678",
          "avatar_url": "https://s3.../avatar.jpg"
        },
        "unit": {
          "id": "uuid",
          "number": "A-101"
        },
        "type": "OWNER",
        "identification": "1234567890101",
        "start_date": "2024-01-15",
        "emergency_contact": {
          "name": "María Pérez",
          "phone": "+502 9876-5432",
          "relation": "Esposa"
        }
      }
    ]
  }
}
```

---

#### POST /api/residents
Crear residente y asignar a unidad

**Permissions:** SUPER_ADMIN, ADMIN

**Body:**
```json
{
  "user_id": "uuid",
  "unit_id": "uuid",
  "type": "OWNER",
  "identification": "1234567890101",
  "start_date": "2024-01-15",
  "emergency_name": "María Pérez",
  "emergency_phone": "+502 9876-5432",
  "emergency_relation": "Esposa"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "unit_id": "uuid",
    "type": "OWNER",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Residente asignado exitosamente"
}
```

---

### 5. Services (Servicios)

#### GET /api/complexes/:complexId/services
Listar servicios de un complejo

**Permissions:** SUPER_ADMIN, ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "uuid",
        "name": "Mantenimiento General",
        "type": "MANTENIMIENTO",
        "description": "Mantenimiento de áreas comunes",
        "monthly_cost": 150.00,
        "is_mandatory": true,
        "is_active": true
      },
      {
        "id": "uuid",
        "name": "Servicio de Agua",
        "type": "AGUA",
        "monthly_cost": 75.00,
        "is_mandatory": true,
        "is_active": true
      }
    ]
  }
}
```

---

#### POST /api/services
Crear servicio

**Permissions:** SUPER_ADMIN, ADMIN

**Body:**
```json
{
  "complex_id": "uuid",
  "name": "Mantenimiento General",
  "type": "MANTENIMIENTO",
  "description": "Mantenimiento de áreas comunes",
  "monthly_cost": 150.00,
  "is_mandatory": true
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mantenimiento General",
    "monthly_cost": 150.00,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Servicio creado exitosamente"
}
```

---

### 6. Invoices (Facturas)

#### GET /api/invoices
Listar facturas

**Query Params:**
```
?unit_id=uuid
&status=PENDING
&from=2024-01-01
&to=2024-01-31
```

**Permissions:** 
- SUPER_ADMIN, ADMIN, OPERATOR: Todas las facturas
- RESIDENT: Solo sus facturas

**Response 200:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "uuid",
        "invoice_number": "INV-2024-001",
        "unit": {
          "id": "uuid",
          "number": "A-101"
        },
        "subtotal": 225.00,
        "tax": 0.00,
        "total": 225.00,
        "issue_date": "2024-01-01",
        "due_date": "2024-01-15",
        "status": "PENDING",
        "items": [
          {
            "type": "SERVICE",
            "description": "Mantenimiento General",
            "quantity": 1,
            "unit_price": 150.00,
            "total": 150.00
          },
          {
            "type": "SERVICE",
            "description": "Servicio de Agua",
            "quantity": 1,
            "unit_price": 75.00,
            "total": 75.00
          }
        ]
      }
    ]
  }
}
```

---

#### POST /api/invoices/generate
Generar facturas mensuales

**Permissions:** SUPER_ADMIN, ADMIN

**Body:**
```json
{
  "complex_id": "uuid",
  "month": 1,
  "year": 2024
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "generated": 45,
    "total_amount": 10125.00
  },
  "message": "Facturas generadas exitosamente"
}
```

---

#### GET /api/invoices/:id/pdf
Descargar factura en PDF

**Permissions:** SUPER_ADMIN, ADMIN, OPERATOR, RESIDENT (solo su factura)

**Response 200:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="INV-2024-001.pdf"

[PDF Binary Data]
```

---

### 7. Payments (Pagos)

#### POST /api/payments/checkout
Crear sesión de checkout (Recurrente)

**Permissions:** RESIDENT (solo sus facturas), ADMIN

**Body:**
```json
{
  "invoiceId": "uuid",
  "method": "CARD"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://app.recurrente.com/checkout/..."
  }
}
```

---

#### POST /api/payments/webhook
Webhook de Recurrente (Internal)

**Headers:**
```http
X-Signature: <signature>
X-Timestamp: <unix_timestamp> (opcional según proveedor)
```

**Body:** [Recurrente Event Object]

**Response 200:**
```json
{
  "success": true,
  "data": {
    "received": true,
    "processed": true
  }
}
```

---

#### GET /api/payments
Listar pagos

**Query Params:**
```
?invoice_id=uuid
&status=COMPLETED
&from=2024-01-01
&to=2024-01-31
```

**Permissions:** 
- SUPER_ADMIN, ADMIN: Todos los pagos
- RESIDENT: Solo sus pagos

**Response 200:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "invoice_id": "uuid",
        "amount": 225.00,
        "method": "CREDIT_CARD",
        "status": "COMPLETED",
        "provider_payment_id": "recurrente_checkout_or_payment_id",
        "confirmation_code": "ABC123",
        "receipt_url": "https://app.recurrente.com/...",
        "payment_date": "2024-01-10T14:30:00Z"
      }
    ]
  }
}
```

---

### 8. Amenities (Amenidades)

#### GET /api/complexes/:complexId/amenities
Listar amenidades

**Permissions:** ALL (públicas dentro del complejo)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "amenities": [
      {
        "id": "uuid",
        "name": "Piscina",
        "type": "PISCINA",
        "description": "Piscina techada climatizada",
        "capacity": 20,
        "operating_hours": {
          "monday": {"start": "08:00", "end": "20:00"},
          "tuesday": {"start": "08:00", "end": "20:00"}
        },
        "cost_per_day": 100.00,
        "cost_per_hour": 15.00,
        "images": ["https://s3.../pool1.jpg"],
        "status": "AVAILABLE"
      }
    ]
  }
}
```

---

#### POST /api/amenities
Crear amenidad

**Permissions:** SUPER_ADMIN, ADMIN

**Body:**
```json
{
  "complex_id": "uuid",
  "name": "Piscina",
  "type": "PISCINA",
  "description": "Piscina techada climatizada",
  "capacity": 20,
  "operating_hours": {
    "monday": {"start": "08:00", "end": "20:00"}
  },
  "cost_per_day": 100.00,
  "cost_per_hour": 15.00,
  "requires_approval": false
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Piscina",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Amenidad creada exitosamente"
}
```

---

### 9. Reservations (Reservas)

#### GET /api/amenities/:amenityId/availability
Consultar disponibilidad

**Query Params:**
```
?date=2024-01-20
&type=HOURLY
```

**Permissions:** ALL RESIDENTS

**Response 200:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "available_slots": [
      {
        "start_time": "08:00",
        "end_time": "10:00",
        "available": true
      },
      {
        "start_time": "10:00",
        "end_time": "12:00",
        "available": false,
        "reserved_by": "Unit A-101"
      }
    ]
  }
}
```

---

#### POST /api/reservations
Crear reserva

**Permissions:** RESIDENT

**Body:**
```json
{
  "amenity_id": "uuid",
  "type": "HOURLY",
  "date": "2024-01-20",
  "start_time": "2024-01-20T08:00:00Z",
  "end_time": "2024-01-20T10:00:00Z",
  "guests": 5,
  "notes": "Cumpleaños infantil"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amenity": {
      "name": "Piscina"
    },
    "date": "2024-01-20",
    "start_time": "2024-01-20T08:00:00Z",
    "end_time": "2024-01-20T10:00:00Z",
    "total_cost": 30.00,
    "status": "PENDING"
  },
  "message": "Reserva creada exitosamente. Pendiente de aprobación."
}
```

---

#### GET /api/reservations
Mis reservas

**Query Params:**
```
?status=CONFIRMED
&from=2024-01-01
&to=2024-12-31
```

**Permissions:** RESIDENT (sus reservas), ADMIN/OPERATOR (todas)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "uuid",
        "amenity": {
          "id": "uuid",
          "name": "Piscina"
        },
        "date": "2024-01-20",
        "start_time": "2024-01-20T08:00:00Z",
        "end_time": "2024-01-20T10:00:00Z",
        "total_cost": 30.00,
        "status": "CONFIRMED",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 10. Access Control

#### GET /api/units/:unitId/access-cards
Listar tarjetas de una unidad

**Permissions:** RESIDENT (su unidad), ADMIN, GUARD

**Response 200:**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "uuid",
        "card_number": "1234567890",
        "holder_name": "Juan Pérez",
        "status": "ACTIVE",
        "issued_date": "2024-01-15",
        "expiry_date": null
      }
    ],
    "limit": 4,
    "used": 2
  }
}
```

---

#### POST /api/access-cards
Solicitar tarjeta de acceso

**Permissions:** RESIDENT

**Body:**
```json
{
  "unit_id": "uuid",
  "holder_name": "Juan Pérez"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "card_number": "PENDING",
    "status": "INACTIVE",
    "message": "Solicitud creada. Pase por administración."
  }
}
```

---

#### POST /api/visitors/pre-register
Pre-registrar visitante

**Permissions:** RESIDENT

**Body:**
```json
{
  "name": "María López",
  "identification": "9876543210101",
  "phone": "+502 5555-5555",
  "vehicle_plate": "P-123ABC",
  "visit_date": "2024-01-20",
  "expected_time": "2024-01-20T15:00:00Z",
  "purpose": "Visita familiar"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "María López",
    "visit_date": "2024-01-20",
    "status": "AUTHORIZED",
    "authorization_code": "VIS-20240120-001"
  },
  "message": "Visitante pre-autorizado"
}
```

---

#### POST /api/visitors/:id/check-in
Registrar entrada (Guardia)

**Permissions:** GUARD, ADMIN

**Body:**
```json
{
  "guard_name": "Carlos Rodríguez",
  "notes": "Ingreso sin novedades"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "visitor_id": "uuid",
    "status": "CHECKED_IN",
    "entry_time": "2024-01-20T15:05:00Z"
  }
}
```

---

### 11. Communication

#### GET /api/complexes/:complexId/announcements
Listar avisos

**Query Params:**
```
?priority=HIGH
&limit=10
```

**Permissions:** ALL (del complejo)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "announcements": [
      {
        "id": "uuid",
        "title": "Mantenimiento programado",
        "content": "El día sábado 20 de enero...",
        "priority": "HIGH",
        "image_url": "https://s3.../announcement.jpg",
        "published_at": "2024-01-15T10:00:00Z",
        "expires_at": "2024-01-25T23:59:59Z",
        "author_name": "Administración"
      }
    ]
  }
}
```

---

#### POST /api/announcements
Crear aviso

**Permissions:** ADMIN, OPERATOR

**Body:**
```json
{
  "complex_id": "uuid",
  "title": "Mantenimiento programado",
  "content": "El día sábado 20 de enero...",
  "priority": "HIGH",
  "image_url": "https://s3.../announcement.jpg",
  "target_roles": ["RESIDENT", "GUARD"],
  "published_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-01-25T23:59:59Z"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Mantenimiento programado",
    "published_at": "2024-01-15T10:00:00Z"
  },
  "message": "Aviso publicado exitosamente"
}
```

---

### 12. Incidents (Reportes)

#### GET /api/incidents
Listar incidentes

**Query Params:**
```
?status=OPEN
&category=MANTENIMIENTO
&priority=HIGH
```

**Permissions:** 
- RESIDENT: Solo sus reportes
- ADMIN, OPERATOR: Todos

**Response 200:**
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "id": "uuid",
        "title": "Fuga de agua en baño",
        "description": "Hay una fuga de agua...",
        "category": "MANTENIMIENTO",
        "priority": "HIGH",
        "status": "IN_PROGRESS",
        "location": "Apartamento A-101",
        "photos": ["https://s3.../photo1.jpg"],
        "resident": {
          "name": "Juan Pérez",
          "unit": "A-101"
        },
        "assigned_to": "uuid",
        "assigned_name": "Pedro Técnico",
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T14:00:00Z"
      }
    ]
  }
}
```

---

#### POST /api/incidents
Crear reporte

**Permissions:** RESIDENT

**Body:**
```json
{
  "title": "Fuga de agua en baño",
  "description": "Hay una fuga de agua en el lavamanos...",
  "category": "MANTENIMIENTO",
  "priority": "HIGH",
  "location": "Baño principal",
  "photos": ["https://s3.../photo1.jpg", "https://s3.../photo2.jpg"]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Fuga de agua en baño",
    "status": "OPEN",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Reporte creado exitosamente"
}
```

---

#### POST /api/incidents/:id/comments
Agregar comentario

**Permissions:** RESIDENT (su reporte), ADMIN, OPERATOR

**Body:**
```json
{
  "comment": "Ya se asignó al técnico Pedro"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "comment": "Ya se asignó al técnico Pedro",
    "author_name": "Administración",
    "created_at": "2024-01-15T14:00:00Z"
  }
}
```

---

### 13. Documents

#### GET /api/complexes/:complexId/documents
Listar documentos

**Query Params:**
```
?category=REGLAMENTO
```

**Permissions:** ALL (del complejo)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "title": "Reglamento Interno 2024",
        "category": "REGLAMENTO",
        "description": "Reglamento actualizado",
        "file_url": "https://res.cloudinary.com/<cloud>/raw/upload/v.../reglamento.pdf",
        "file_name": "reglamento-2024.pdf",
        "file_size": 1048576,
        "file_type": "PDF",
        "version": "2.0",
        "uploaded_by": "Administración",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

#### POST /api/documents
Subir documento

**Permissions:** ADMIN, OPERATOR

**Body (multipart/form-data):**
```
title: Reglamento Interno 2024
category: REGLAMENTO
description: Reglamento actualizado
file: [file]
visible_to_residents: true
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Reglamento Interno 2024",
    "file_url": "https://res.cloudinary.com/<cloud>/raw/upload/v.../reglamento.pdf",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Documento subido exitosamente"
}
```

---

### 14. Reports (Reportería)

#### GET /api/reports/dashboard
Estadísticas del dashboard

**Permissions:** ADMIN, OPERATOR

**Query Params:**
```
?complex_id=uuid
&from=2024-01-01
&to=2024-01-31
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "stats": {
      "total_units": 45,
      "occupied_units": 40,
      "occupancy_rate": 88.89,
      "total_residents": 98,
      "total_revenue": 10125.00,
      "paid_invoices": 38,
      "pending_invoices": 7,
      "collection_rate": 84.44,
      "open_incidents": 3,
      "resolved_incidents": 12,
      "total_reservations": 25,
      "total_visitors": 156
    },
    "charts": {
      "revenue_by_month": [
        {"month": "Enero", "amount": 10125.00}
      ],
      "incidents_by_category": [
        {"category": "MANTENIMIENTO", "count": 8},
        {"category": "SEGURIDAD", "count": 4}
      ],
      "top_amenities": [
        {"name": "Piscina", "reservations": 12},
        {"name": "Gimnasio", "reservations": 8}
      ]
    }
  }
}
```

---

#### GET /api/reports/invoicing
Reporte de facturación

**Permissions:** ADMIN

**Query Params:**
```
?complex_id=uuid
&from=2024-01-01
&to=2024-01-31
&format=pdf
```

**Response 200 (JSON):**
```json
{
  "success": true,
  "data": {
    "period": "Enero 2024",
    "total_invoiced": 10125.00,
    "total_paid": 8550.00,
    "total_pending": 1575.00,
    "invoices_by_status": {
      "paid": 38,
      "pending": 7,
      "overdue": 0
    },
    "by_unit": [
      {
        "unit_number": "A-101",
        "resident_name": "Juan Pérez",
        "total": 225.00,
        "status": "PAID"
      }
    ]
  }
}
```

**Response 200 (PDF):**
```
Content-Type: application/pdf
[PDF Binary Data]
```

---

## 🔒 Authorization Matrix

| Endpoint | SUPER_ADMIN | ADMIN | OPERATOR | GUARD | RESIDENT |
|----------|-------------|-------|----------|-------|----------|
| POST /api/complexes | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/complexes/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /api/units | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/residents | ✅ | ✅ | ✅ | ❌ | Own |
| POST /api/invoices/generate | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/invoices | ✅ | ✅ | ✅ | ❌ | Own |
| POST /api/payments/checkout | ✅ | ✅ | ❌ | ❌ | Own |
| POST /api/reservations | ✅ | ✅ | ✅ | ❌ | ✅ |
| POST /api/visitors/pre-register | ✅ | ✅ | ❌ | ❌ | ✅ |
| POST /api/visitors/:id/check-in | ✅ | ✅ | ❌ | ✅ | ❌ |
| POST /api/incidents | ✅ | ✅ | ✅ | ❌ | ✅ |
| GET /api/reports/* | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa" // opcional
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "El email ya está registrado",
    "details": {
      "field": "email",
      "value": "user@example.com"
    }
  }
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Errores de validación",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      },
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 8 caracteres"
      }
    ]
  }
}
```

---

## 🚨 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTHENTICATION_REQUIRED | 401 | Token no proporcionado |
| INVALID_TOKEN | 401 | Token inválido o expirado |
| FORBIDDEN | 403 | Sin permisos para esta acción |
| NOT_FOUND | 404 | Recurso no encontrado |
| VALIDATION_ERROR | 422 | Errores de validación |
| DUPLICATE_ENTRY | 409 | Recurso ya existe |
| INTERNAL_ERROR | 500 | Error interno del servidor |

---

**Versión**: 1.0
**Última Actualización**: [Fecha]

# 🚍 TransitOps — Smart Transport Operations Platform

> A full-stack fleet management system with AI-powered insights, real-time KPIs, and comprehensive trip/vehicle/driver tracking — built for modern transit operators.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication & Roles](#authentication--roles)
- [AI Chatbot](#ai-chatbot)

---

## Overview

**TransitOps** is a production-ready, full-stack transport operations platform designed to give fleet managers complete visibility and control over their operations. It combines a React/TypeScript SPA with a Spring Boot REST API, backed by PostgreSQL, and enhanced with an AI chatbot powered by Mistral AI.

---

## Features

### 🎛️ Dashboard
- Live KPI cards: Active Vehicles, Available, In Maintenance, Active/Pending Trips, Drivers On Duty, Fleet Utilization %
- Interactive bar chart — completed trip distance per vehicle
- Recent trips feed with status badges
- Filter by vehicle **type**, **status**, and **region** — all KPIs update in real time

### 🚛 Fleet Management (Vehicles)
- Add, edit, and deactivate vehicles (Bus, Truck, Van, Car, etc.)
- Track status: **Available**, **On Trip**, **In Shop**, **Retired**
- Assign region, registration number, year, and acquisition cost

### 🗺️ Trip Management
- Create and manage trips with source, destination, planned distance
- Assign vehicles and drivers per trip
- Track trip status: **Pending → In Progress → Completed / Cancelled**
- Record fuel consumed per trip

### 👤 Driver Management
- Maintain driver profiles with license number and expiry date
- Track status: **Available**, **On Duty**, **On Leave**, **Suspended**
- Inline license-expiry warnings

### 🔧 Maintenance Logs
- Log maintenance events per vehicle
- Track status: **Pending**, **In Progress**, **Completed**
- Record cost and description of repairs

### 💰 Expenses
- Log operational expenses (Fuel, Maintenance, Miscellaneous, Toll, Insurance, Salary)
- Attach expenses to vehicles
- Date-range export to CSV

### 📊 Reports & Analytics
- **Fleet Efficiency** — km/litre per vehicle
- **Utilization** — trip count per vehicle
- **Expense Trends** — monthly cost breakdown by category (line chart)
- **ROI Table** — Revenue vs Fuel + Maintenance + Acquisition cost per vehicle
- **Cost Breakdown** — bar chart by expense category
- **AI Insights** — one-click AI-generated narrative summary of fleet performance
- Export all report tables to CSV

### 🤖 AI Fleet Assistant (ChatWidget)
- Floating chat bubble available on every authenticated page
- Powered by **Mistral AI** (`mistral-small-latest`)
- Two-stage pipeline: **Intent Classification → Data Fetch → Answer Phrasing**
- Supported queries:
  - Driver license expiry checks
  - Fuel/operational costs by region
  - Vehicle status counts
  - Driver availability
  - Vehicle ROI lookup

### 🔐 Authentication
- JWT-based login and registration
- Role-based access control: **ADMIN** and **USER**
- Protected routes — unauthenticated users are redirected to login

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Routing | TanStack Router (file-based) |
| State Management | TanStack Query + Zustand store |
| UI Components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | Sonner |

### Backend

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.3.4 |
| Language | Java 21 |
| Build Tool | Gradle |
| Database | PostgreSQL |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security + JWT (jjwt 0.11.5) |
| AI Integration | Mistral AI REST API |
| Validation | Spring Validation + Bean Validation |
| Utilities | Lombok |

---

## Architecture

```
┌─────────────────────────────────────┐
│           Browser (React SPA)        │
│  TanStack Router · shadcn/ui · Recharts │
└──────────────┬──────────────────────┘
               │ HTTP / REST JSON
               ▼
┌─────────────────────────────────────┐
│      Spring Boot REST API            │
│  Spring Security · JWT · Validation  │
│  Controllers → Services → Repos      │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────────┐
│  PostgreSQL  │   │  Mistral AI API  │
│  (JPA/Hiber) │   │  (chat+insights) │
└──────────────┘   └──────────────────┘
```

---

## Project Structure

```
TransitOps/
├── TransitOps-Backend/              # Spring Boot API
│   ├── src/main/java/com/transitops/
│   │   ├── config/                  # SecurityConfig, CorsConfig, DataSeeder
│   │   ├── controller/              # REST controllers
│   │   │   ├── AuthController.java
│   │   │   ├── VehicleController.java
│   │   │   ├── DriverController.java
│   │   │   ├── TripController.java
│   │   │   ├── MaintenanceController.java
│   │   │   ├── ExpenseController.java
│   │   │   ├── FuelController.java
│   │   │   ├── ReportController.java
│   │   │   └── ChatController.java
│   │   ├── dto/                     # Request / Response DTOs
│   │   ├── entity/                  # JPA Entities
│   │   │   ├── Vehicle.java
│   │   │   ├── Driver.java
│   │   │   ├── Trip.java
│   │   │   ├── FuelLog.java
│   │   │   ├── MaintenanceLog.java
│   │   │   ├── Expense.java
│   │   │   └── User.java
│   │   ├── enums/                   # VehicleStatus, DriverStatus, TripStatus, Role
│   │   ├── exception/               # Global exception handler
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── security/                # JWT filter, UserDetailsService
│   │   └── service/                 # Business logic
│   │       ├── ChatService.java      # Mistral AI integration
│   │       ├── ReportService.java    # Analytics & KPI computation
│   │       ├── TripService.java
│   │       ├── VehicleService.java
│   │       ├── DriverService.java
│   │       └── ...
│   └── src/main/resources/
│       └── application.yml
│
└── TransitOps-Frontend/             # React + Vite SPA
    └── src/
        ├── components/              # Reusable UI components
        │   ├── AppSidebar.tsx
        │   ├── ChatWidget.tsx        # AI floating chat
        │   ├── DataTable.tsx
        │   ├── ExportCSVButton.tsx
        │   ├── KPICard.tsx
        │   ├── RoleGuard.tsx
        │   ├── StatusBadge.tsx
        │   └── Topbar.tsx
        ├── hooks/                   # useAuth and custom hooks
        ├── lib/                     # Zustand store, utilities
        ├── routes/                  # File-based pages
        │   ├── login.tsx
        │   ├── register.tsx
        │   ├── _auth.dashboard.tsx
        │   ├── _auth.vehicles.tsx
        │   ├── _auth.drivers.tsx
        │   ├── _auth.trips.tsx
        │   ├── _auth.maintenance.tsx
        │   ├── _auth.expenses.tsx
        │   └── _auth.reports.tsx
        └── services/
            └── api.ts               # Centralised API layer
```

---

## Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Java JDK | 21 |
| Gradle | Wrapper included (`./gradlew`) |
| Node.js | 18 |
| Bun *(optional, faster)* | latest |
| PostgreSQL | 14 |

---

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd TransitOps/TransitOps-Backend
   ```

2. **Create the PostgreSQL database**
   ```sql
   CREATE DATABASE transitops;
   ```

3. **Configure environment variables**

   Create `TransitOps-Backend/.env`:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

   Update `src/main/resources/application.yml` if your Postgres credentials differ from the defaults:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/transitops
       username: postgres
       password: your_password
   ```

4. **Run the application**
   ```bash
   ./gradlew bootRun
   ```

   The API starts on **`http://localhost:8080`**.

   > **Note:** Seed data is automatically loaded on first startup via `DataSeeder`. This creates sample vehicles, drivers, trips, fuel logs, and maintenance records along with a default admin account.

---

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd TransitOps/TransitOps-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or, with Bun
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

   The app opens at **`http://localhost:5173`**.

---

## Environment Variables

### Backend — `TransitOps-Backend/.env`

| Variable | Description | Required |
|---|---|---|
| `MISTRAL_API_KEY` | API key from [console.mistral.ai](https://console.mistral.ai) | Yes (for AI features) |

### Backend — `application.yml` (defaults)

| Key | Default | Description |
|---|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/transitops` | PostgreSQL JDBC URL |
| `spring.datasource.username` | `postgres` | Database username |
| `spring.datasource.password` | `password` | Database password |
| `jwt.secret` | *(hex string)* | HS256 signing secret — **change in production** |
| `jwt.expiration` | `86400000` | Token TTL in ms (24 hours) |
| `mistral.api-key` | *(from .env)* | Mistral AI API key |

---

## API Reference

All endpoints are prefixed with `http://localhost:8080/api`.

Authenticated endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register a new user |
| `POST` | `/auth/login` | No | Login, returns JWT token |

### Vehicles

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/vehicles` | Yes | List all vehicles |
| `POST` | `/vehicles` | Yes | Create a vehicle |
| `PUT` | `/vehicles/{id}` | Yes | Update a vehicle |
| `DELETE` | `/vehicles/{id}` | Yes | Delete a vehicle |

### Drivers

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/drivers` | Yes | List drivers (optional `?status=AVAILABLE`) |
| `POST` | `/drivers` | Yes | Create a driver |
| `PUT` | `/drivers/{id}` | Yes | Update a driver |
| `DELETE` | `/drivers/{id}` | Yes | Delete a driver |

### Trips

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/trips` | Yes | List all trips |
| `POST` | `/trips` | Yes | Create a trip |
| `PUT` | `/trips/{id}` | Yes | Update a trip |
| `DELETE` | `/trips/{id}` | Yes | Delete a trip |

### Maintenance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/maintenance` | Yes | List maintenance logs |
| `POST` | `/maintenance` | Yes | Create a maintenance log |
| `PUT` | `/maintenance/{id}` | Yes | Update a maintenance log |
| `DELETE` | `/maintenance/{id}` | Yes | Delete a maintenance log |

### Expenses

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/expenses` | Yes | List all expenses |
| `POST` | `/expenses` | Yes | Create an expense |
| `DELETE` | `/expenses/{id}` | Yes | Delete an expense |

### Fuel

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/fuel` | Yes | List fuel logs |
| `POST` | `/fuel` | Yes | Add a fuel log entry |

### Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/reports/dashboard-kpis` | Yes | KPI summary (`?type=&status=&region=`) |
| `GET` | `/reports/vehicle-roi` | Yes | Vehicle ROI breakdown |
| `GET` | `/reports/cost-by-region` | Yes | Operational cost by region |
| `GET` | `/reports/insights` | Yes | AI-generated fleet insights |

### Chat (AI)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/chat` | Yes | Send a query to the AI fleet assistant |

**Request body:**
```json
{ "message": "Which drivers have licenses expiring soon?" }
```

**Response:**
```json
{ "answer": "3 drivers have licenses expiring within the next 30 days: ...", "intent": "license_expiry_check" }
```

---

## Authentication & Roles

TransitOps uses **JWT Bearer token** authentication with **stateless** sessions.

**Login flow:**
1. `POST /api/auth/login` with `{ "email": "...", "password": "..." }`
2. Receive `{ "token": "eyJ..." }`
3. Include in all subsequent requests: `Authorization: Bearer eyJ...`

### Roles

| Role | Description |
|---|---|
| `ADMIN` | Full CRUD access to all resources, including user management |
| `USER` | Can view data and create/update trips and expenses |

> The `DataSeeder` creates default seed accounts on first startup. Check `DataSeeder.java` for the seeded credentials.

---

## AI Chatbot

The **"Ask TransitOps"** floating chat bubble is available on every authenticated page. It uses a **three-stage Mistral AI pipeline**:

```
User Question
     │
     ▼
 Stage 1 ─ Intent Classification
   Mistral classifies into one of:
     • license_expiry_check    (params: withinDays)
     • fuel_cost_by_region     (params: region)
     • vehicle_status_count    (params: status)
     • driver_availability     (params: none)
     • vehicle_roi_lookup      (params: vehicleRegNo)
     • unknown
     │
     ▼
 Stage 2 ─ Live Data Fetch
   Spring service queries PostgreSQL
   based on the classified intent
     │
     ▼
 Stage 3 ─ Answer Phrasing
   Mistral converts raw JSON data
   into natural language (1–3 sentences)
     │
     ▼
  Answer rendered in chat widget
```

**Example questions:**
- *"Which drivers have licenses expiring soon?"*
- *"What are the operational costs for the North region?"*
- *"How many vehicles are currently in shop?"*
- *"Which drivers are currently available?"*
- *"What is the ROI for vehicle REG-001?"*

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License**.

---

<p align="center">Built with ❤️ using Spring Boot, React 19, and Mistral AI</p>

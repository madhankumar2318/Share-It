# 🤝 Share-It — Community Borrowing & Lending Platform

**Share-It** is a full-stack web application designed for peer-to-peer (P2P) resource sharing within local communities (neighborhoods, apartment complexes, campuses, clubs). It eliminates financial waste and environmental impact by allowing users to lend idle household items, tools, electronics, camping gear, and books to others who need them temporarily.

---

## 🌟 Key Features

* **Unified User Model:** Any user can seamlessly act as both a **Lender** and a **Borrower** with a single account.
* **Item Catalog & Discovery:** Real-time search across titles and descriptions, with category filter pills (`Electronics`, `Tools & DIY`, `Outdoors`, etc.).
* **Photo Uploading:** Direct multipart image uploads saved with secure UUID generation.
* **Borrowing Lifecycle Engine:** Full state machine (`PENDING` ➔ `ACCEPTED` / `REJECTED` ➔ `RETURNED` / `CANCELLED`).
* **Conflict & Overlap Prevention:** Mathematical date interval intersection logic prevents double-booking of any item.
* **In-App Messaging & Chat:** Direct, real-time message modal between borrower and lender for coordinating pickups and handoffs.
* **Community Ratings & Reviews:** 5-star ratings and written reviews unlocked once items are returned to build community trust.
* **Stateless Security:** Spring Security with JSON Web Tokens (JWT) and BCrypt password encryption.
* **Interactive API Documentation:** Built-in Swagger UI and OpenAPI 3.0 specification.

---

## 🛠️ Technology Stack

### Backend
* **Java 17 (LTS)**
* **Spring Boot 3.3.4**
* **Spring Security + JWT** (stateless authorization)
* **Spring Data JPA & Hibernate**
* **PostgreSQL 18** (relational database)
* **SpringDoc OpenAPI 2.6.0** (Swagger UI)
* **Dotenv Java** (safe environment variable externalization)
* **Maven** (dependency management & build)

### Frontend
* **React 18** (with Vite build tool)
* **Tailwind CSS** (modern responsive UI design)
* **Axios** (with automatic JWT request/response interceptors)
* **React Router DOM v6** (client-side routing)
* **Lucide React** (iconography)

---

## 🚀 Getting Started

### 1. Prerequisites
* **Java 17+** & **Maven 3.8+**
* **Node.js 18+** & **npm**
* **PostgreSQL 16+** installed and running on port `5432`

---

### 2. Database Configuration
1. Open PostgreSQL (via `psql` or `pgAdmin 4`) and create the database:
   ```sql
   CREATE DATABASE shareit_db;
   ```
2. In the `backend` folder, copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Update `backend/.env` with your PostgreSQL password:
   ```properties
   DB_URL=jdbc:postgresql://localhost:5432/shareit_db
   DB_USERNAME=postgres
   DB_PASSWORD=your_actual_password
   JWT_SECRET=your_super_secret_base64_jwt_key_here
   SERVER_PORT=8080
   ```

---

### 3. Running the Backend
In a terminal, run:
```bash
cd backend
mvn spring-boot:run
```
Backend will start on `http://localhost:8080`.
* **Swagger UI Documentation:** `http://localhost:8080/swagger-ui/index.html`

---

### 4. Running the Frontend
In a second terminal, run:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🔒 Security Notice
All sensitive database credentials, passwords, and JWT secret keys are externalized through environment variables and strictly ignored by `.gitignore`.

---

## 📄 License
This project is licensed under the MIT License.

# eLibrary

eLibrary is a library management system with a browser-based frontend and a Java Spring Boot backend connected to MongoDB Atlas.

## Architecture

```text
HTML/CSS/JavaScript frontend
        |
        | REST API on localhost:8080
        v
Java Spring Boot backend
        |
        v
MongoDB Atlas
```

The frontend is served separately on port `5500`. It communicates with the backend through the endpoints under `/api`.

## Project structure

```text
eLibrary/
├── Backend/
│   ├── pom.xml
│   ├── .env                 # Local MongoDB credentials; never commit this file
│   └── src/main/
│       ├── java/com/elibrary/backend/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── model/
│       │   └── service/
│       └── resources/application.properties
└── Frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js
        └── script.js
```

## Requirements

- Java 21
- Maven
- MongoDB Atlas account and running cluster
- A MongoDB database user with read/write access
- Current computer IP address allowed in MongoDB Atlas Network Access
- Python 3, or another simple static-file web server, for serving the frontend

## MongoDB configuration

Create `Backend/.env` with your private MongoDB Atlas connection string:

```properties
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/elibrary?retryWrites=true&w=majority
```

Do not commit or share `Backend/.env`. The backend loads it through `application.properties`:

```properties
spring.config.import=optional:file:.env[.properties]
spring.data.mongodb.uri=${MONGODB_URI}
spring.data.mongodb.database=elibrary
```

On the first successful connection, the backend creates sample data in these collections:

- `books`
- `members`
- `borrowings`

## Running the project

Open two terminals.

### Terminal 1: backend

```powershell
cd C:\Users\anto\Desktop\eLibrary\Backend
mvn spring-boot:run
```

The backend is available at `http://localhost:8080` when the console displays:

```text
Started ELibraryApplication
```

### Terminal 2: frontend

```powershell
cd C:\Users\anto\Desktop\eLibrary\Frontend
py -m http.server 5500
```

Open the website at:

```text
http://localhost:5500
```

Keep both terminals running while using the website.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend status |
| GET | `/api/dashboard` | Get dashboard counts |
| GET | `/api/books?search=` | Search or list books |
| GET | `/api/members?search=` | Search or list members |
| GET | `/api/members/{memberId}/borrowings` | Get a member's borrowing history |
| POST | `/api/borrowings` | Issue a book to a member |

Example health check:

```text
http://localhost:8080/api/health
```

Expected response:

```json
{"status":"UP"}
```

Example request for issuing a book:

```json
{
  "memberId": 101,
  "bookId": 1,
  "issueDate": "2026-10-29",
  "dueDate": "2026-11-12"
}
```

## Troubleshooting

### Backend does not start

Check that Java and Maven are installed:

```powershell
java -version
mvn -version
```

If Maven reports dependency download errors, check the internet connection and run:

```powershell
mvn -U clean package -DskipTests
```

### MongoDB connection timeout

In MongoDB Atlas, verify that the cluster is running and your current IP address is allowed. Also check VPN and firewall settings. A successful backend startup must reach `Started ELibraryApplication`.

### Frontend cannot reach the backend

Make sure the backend is running on port `8080` and the frontend is opened from `http://localhost:5500`, not directly from a file path.

## Security

Never commit database passwords, connection strings, or other secrets. The local `.env` file is ignored by Git.

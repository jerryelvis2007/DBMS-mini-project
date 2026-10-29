# MongoDB Atlas setup

## 1. Add the connection string

Open `src/main/resources/application.properties` and replace the value of
`spring.data.mongodb.uri` with the complete MongoDB Atlas connection string.

Example:

```properties
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/elibrary?retryWrites=true&w=majority
spring.data.mongodb.database=elibrary
```

Do not commit a real password to source control or share it in chat.

## 2. Check Atlas access

In MongoDB Atlas, verify that:

- The cluster is running.
- The database user exists and has read/write access.
- Your current IP address is allowed in Network Access.

## 3. Start the backend

From the `Backend` directory, run:

```powershell
mvn spring-boot:run
```

The service starts on `http://localhost:8080`.

On the first successful connection, the backend creates and seeds these
collections automatically:

- `books`
- `members`
- `borrowings`

The Oracle SQL file is not used by this MongoDB version.

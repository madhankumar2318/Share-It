# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Enable automatic retries on network blips and disable wagon connection pooling for cloud build stability
ENV MAVEN_OPTS="-Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.http.retryHandler.requestSentCount=5 -Dmaven.wagon.http.pool=false"

# Configure Google Maven Central mirror to prevent HTTP 429 rate limits on cloud providers
COPY settings.xml /root/.m2/settings.xml
COPY pom.xml .
RUN mvn dependency:resolve dependency:resolve-plugins -B

COPY src ./src
RUN mvn package -DskipTests -B

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-root user (Principle of Least Privilege / CIS Docker Benchmark)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /app/target/shareit-backend-0.0.1-SNAPSHOT.jar app.jar

USER appuser
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-8080} -Xmx384m -XX:+UseSerialGC -jar app.jar"]


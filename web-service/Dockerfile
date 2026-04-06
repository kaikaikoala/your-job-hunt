# Stage 1 — build
FROM gradle:8.7-jdk21 AS build
WORKDIR /workspace
COPY web-service/ ./web-service/
COPY database/ ./database/
WORKDIR /workspace/web-service
RUN gradle bootJar --no-daemon

# Stage 2 — runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/web-service/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

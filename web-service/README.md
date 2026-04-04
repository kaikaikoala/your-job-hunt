# web-service

Spring Boot REST API for The Digital Curator, built with Kotlin and Gradle.

## Prerequisites

### JDK 21 via SDKMAN

[SDKMAN](https://sdkman.io/) is the recommended way to manage JDK versions.

```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install JDK 21
sdk install java 21.0.7-tem
```

To verify:
```bash
java -version
# openjdk version "21.0.7" ...
```

A `.sdkmanrc` file is included in this directory pinning `java=21.0.7-tem`. With `sdkman_auto_env=true` set in `~/.sdkman/etc/config`, SDKMAN will switch to the correct JDK automatically on `cd`. To activate manually:
```bash
sdk env
```

## Running locally

PostgreSQL must be running before starting the service. From the repo root:
```bash
docker compose up -d db
```

Then start the web service:
```bash
./gradlew bootRun
```

The API will be available at `http://localhost:8080`.

```bash
curl http://localhost:8080/health
# → {"status":"ok"}
```

## Running tests

```bash
./gradlew test
```

## Building

```bash
./gradlew bootJar
```

The output JAR is written to `build/libs/`.

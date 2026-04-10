import com.google.protobuf.gradle.*

plugins {
    kotlin("jvm") version "1.9.23"
    kotlin("plugin.spring") version "1.9.23"
    kotlin("plugin.jpa") version "1.9.23"
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.5"
    id("com.google.protobuf") version "0.9.4"
}

group = "com.jobhunt"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_21

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.flywaydb:flyway-core")
    runtimeOnly("org.postgresql:postgresql")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("com.google.firebase:firebase-admin:9.4.1")

    // gRPC client (agent service)
    implementation("io.grpc:grpc-netty-shaded:1.68.0")
    implementation("io.grpc:grpc-protobuf:1.68.0")
    implementation("io.grpc:grpc-stub:1.68.0")
    implementation("com.google.protobuf:protobuf-java:4.28.3")
    compileOnly("jakarta.annotation:jakarta.annotation-api:3.0.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

// ─── Protobuf / gRPC code generation ──────────────────────────────────────────

protobuf {
    protoc { artifact = "com.google.protobuf:protoc:4.28.3" }
    plugins {
        id("grpc") { artifact = "io.grpc:protoc-gen-grpc-java:1.68.0" }
    }
    generateProtoTasks {
        all().forEach { it.plugins { id("grpc") } }
    }
}

// Copy proto files from the repo-root proto/ directory into the default
// src/main/proto/ location before the protobuf plugin runs code generation.
val copyProtoSources by tasks.registering(Copy::class) {
    from("../proto")
    into(layout.projectDirectory.dir("src/main/proto"))
}
tasks.matching { it.name.startsWith("generate") && it.name.contains("Proto") }
    .configureEach { dependsOn(copyProtoSources) }
tasks.named("processResources") { dependsOn(copyProtoSources) }

// ─── Other tasks ──────────────────────────────────────────────────────────────

tasks.withType<Test> {
    useJUnitPlatform()
}

// Bundle migrations from the repo-root database/ directory into the JAR classpath
tasks.processResources {
    from("../database/migrations") {
        into("db/migration")
    }
}

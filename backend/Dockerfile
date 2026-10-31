# syntax=docker/dockerfile:1

# ---------- Build: compile the API with the project's Maven wrapper ----------
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Dependencies first, so they stay cached while only the source code changes
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q dependency:go-offline

# Tests run in CI: the integration ones need Docker (Testcontainers)
COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q -DskipTests package \
    && cp target/entidad-financiera-*.jar application.jar \
    && java -Djarmode=tools -jar application.jar extract --layers --launcher --destination extracted

# ---------- Run: JRE only, non-root user, one layer per kind of content ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

# From least to most frequently changed, so a code change only rebuilds the last layer
COPY --from=build --chown=app:app /workspace/extracted/dependencies/ ./
COPY --from=build --chown=app:app /workspace/extracted/spring-boot-loader/ ./
COPY --from=build --chown=app:app /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build --chown=app:app /workspace/extracted/application/ ./

USER app

# Use up to 75 % of the container memory limit for the heap
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
ENV SERVER_PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=40s --retries=5 \
    CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]

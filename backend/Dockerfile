# Render (and any other container host) builds the backend from this file — Render's
# automatic language detection does not cover Java, so a Dockerfile is required.
#
# Two stages: Maven builds the fat jar, then only a JRE and that jar ship, which keeps
# the image around 250MB instead of 800MB.

# ---------- build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Dependencies resolve in their own layer so a source-only change does not re-download
# the world. Non-fatal: a partial warm-up still leaves the package step correct.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline -DskipTests || true

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- runtime ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Never run the app as root.
RUN addgroup -S oceancool && adduser -S oceancool -G oceancool
USER oceancool

COPY --from=build /build/target/*.jar app.jar

# Render's free instance has 512MB. MaxRAMPercentage lets the JVM size its heap from
# the container limit rather than a number hard-coded for one plan.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70.0 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"

# The host tells us which port to listen on; application.properties reads ${PORT}.
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

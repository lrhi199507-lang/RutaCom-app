#!/bin/sh

# Contenido base para ejecutar Gradle
# Este script permite que GitHub Actions compile tu APK

PROJECT_DIR=$(dirname "$0")
cd "$PROJECT_DIR"
exec ./gradlew assembleDebug "$@"


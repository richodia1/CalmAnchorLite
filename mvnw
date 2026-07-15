#!/usr/bin/env sh
set -eu

MAVEN_VERSION="3.9.9"
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
MAVEN_HOME_DIR="$PROJECT_DIR/.mvn/apache-maven-$MAVEN_VERSION"
MAVEN_ARCHIVE="$PROJECT_DIR/.mvn/apache-maven-$MAVEN_VERSION-bin.tar.gz"
MAVEN_URL="https://archive.apache.org/dist/maven/maven-3/$MAVEN_VERSION/binaries/apache-maven-$MAVEN_VERSION-bin.tar.gz"

if command -v /usr/libexec/java_home >/dev/null 2>&1; then
  JAVA_21_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || true)
  if [ -n "$JAVA_21_HOME" ]; then
    export JAVA_HOME="$JAVA_21_HOME"
  fi
fi

if [ ! -x "$MAVEN_HOME_DIR/bin/mvn" ]; then
  mkdir -p "$PROJECT_DIR/.mvn"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$MAVEN_URL" -o "$MAVEN_ARCHIVE"
  elif command -v wget >/dev/null 2>&1; then
    wget -q "$MAVEN_URL" -O "$MAVEN_ARCHIVE"
  else
    echo "curl or wget is required to download Maven $MAVEN_VERSION." >&2
    exit 1
  fi

  tar -xzf "$MAVEN_ARCHIVE" -C "$PROJECT_DIR/.mvn"
  rm -f "$MAVEN_ARCHIVE"
fi

exec "$MAVEN_HOME_DIR/bin/mvn" "$@"


#!/bin/bash

# SSL Certificate Generation Script for VTT Project
# Generates self-signed certificates for local HTTPS development

set -e

# Create certs directory in project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="$PROJECT_ROOT/certs"

echo "Creating certs directory at: $CERTS_DIR"
mkdir -p "$CERTS_DIR"

# Certificate configuration
CERT_DAYS=365
CERT_KEY="$CERTS_DIR/localhost-key.pem"
CERT_FILE="$CERTS_DIR/localhost.pem"

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "Error: OpenSSL is not installed. Please install OpenSSL first."
    exit 1
fi

echo "Generating self-signed SSL certificate..."
echo "Valid for: localhost, 127.0.0.1, *.local"

# Generate private key and certificate
# Use MSYS_NO_PATHCONV to prevent Git Bash path conversion on Windows
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -nodes \
    -sha256 \
    -days $CERT_DAYS \
    -keyout "$CERT_KEY" \
    -out "$CERT_FILE" \
    -subj "/C=US/ST=State/L=City/O=VTT/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1"

# Set appropriate permissions
chmod 600 "$CERT_KEY"
chmod 644 "$CERT_FILE"

echo ""
echo "✓ SSL certificates generated successfully!"
echo ""
echo "Certificate files:"
echo "  Private Key: $CERT_KEY"
echo "  Certificate: $CERT_FILE"
echo ""
echo "Valid for $CERT_DAYS days"
echo ""
echo "Note: These are self-signed certificates. Your browser will show a security warning."
echo "You can safely proceed by accepting the certificate for local development."

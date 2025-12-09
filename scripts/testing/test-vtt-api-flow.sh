#!/bin/bash

# VTT API Full Flow Test Script
# Tests the complete application flow via https://localhost/api/v1/

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://localhost/api/v1"
COOKIE_FILE="/tmp/vtt-test-cookies.txt"
TEST_EMAIL="testuser@vtt.local"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"

# Result tracking
declare -A RESULTS
declare -A IDS

# Clean up previous cookie file
rm -f "$COOKIE_FILE"

# Helper function for pretty printing
print_step() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Helper function to extract JSON value
extract_json() {
    echo "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed 's/.*: *"\(.*\)"/\1/'
}

# Helper function to extract numeric JSON value
extract_json_num() {
    echo "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*[0-9]*" | sed 's/.*: *\(.*\)/\1/'
}

# Step 1: Register a new user
print_step "Step 1: Register New User"
REGISTER_RESPONSE=$(curl -k -s -w "\n%{http_code}" \
    -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"name\":\"${TEST_NAME}\"}")

REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)
REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n 1)

if [ "$REGISTER_STATUS" -eq 201 ] || [ "$REGISTER_STATUS" -eq 200 ]; then
    USER_ID=$(extract_json "$REGISTER_BODY" "id")
    IDS[USER_ID]="$USER_ID"
    RESULTS[REGISTER]="SUCCESS"
    print_success "User registered successfully (Status: $REGISTER_STATUS)"
    echo "  User ID: $USER_ID"
elif [ "$REGISTER_STATUS" -eq 409 ]; then
    # User already exists, that's okay - we'll login
    RESULTS[REGISTER]="SKIPPED (User exists)"
    print_success "User already exists, will attempt login"
else
    RESULTS[REGISTER]="FAILED (Status: $REGISTER_STATUS)"
    print_error "Registration failed with status $REGISTER_STATUS"
    echo "$REGISTER_BODY"
fi

# Step 2: Login to get session cookie
print_step "Step 2: Login to Get Session"
LOGIN_RESPONSE=$(curl -k -s -w "\n%{http_code}" \
    -c "$COOKIE_FILE" \
    -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)

if [ "$LOGIN_STATUS" -eq 200 ]; then
    USER_ID=$(extract_json "$LOGIN_BODY" "id")
    IDS[USER_ID]="$USER_ID"
    RESULTS[LOGIN]="SUCCESS"
    print_success "Login successful (Status: $LOGIN_STATUS)"
    echo "  User ID: $USER_ID"

    # Check if we got a session cookie
    if [ -f "$COOKIE_FILE" ]; then
        print_success "Session cookie saved"
    else
        print_error "Warning: No session cookie saved"
    fi
else
    RESULTS[LOGIN]="FAILED (Status: $LOGIN_STATUS)"
    print_error "Login failed with status $LOGIN_STATUS"
    echo "$LOGIN_BODY"
    exit 1
fi

# Step 3: Create a campaign
print_step "Step 3: Create Campaign"
CAMPAIGN_RESPONSE=$(curl -k -s -w "\n%{http_code}" \
    -b "$COOKIE_FILE" \
    -X POST "${BASE_URL}/campaigns" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Campaign","description":"Testing all features"}')

CAMPAIGN_BODY=$(echo "$CAMPAIGN_RESPONSE" | head -n -1)
CAMPAIGN_STATUS=$(echo "$CAMPAIGN_RESPONSE" | tail -n 1)

if [ "$CAMPAIGN_STATUS" -eq 201 ] || [ "$CAMPAIGN_STATUS" -eq 200 ]; then
    CAMPAIGN_ID=$(extract_json "$CAMPAIGN_BODY" "id")
    IDS[CAMPAIGN_ID]="$CAMPAIGN_ID"
    RESULTS[CAMPAIGN]="SUCCESS"
    print_success "Campaign created successfully (Status: $CAMPAIGN_STATUS)"
    echo "  Campaign ID: $CAMPAIGN_ID"
else
    RESULTS[CAMPAIGN]="FAILED (Status: $CAMPAIGN_STATUS)"
    print_error "Campaign creation failed with status $CAMPAIGN_STATUS"
    echo "$CAMPAIGN_BODY"
    exit 1
fi

# Step 4: Create a scene in the campaign
print_step "Step 4: Create Scene"
SCENE_RESPONSE=$(curl -k -s -w "\n%{http_code}" \
    -b "$COOKIE_FILE" \
    -X POST "${BASE_URL}/campaigns/${CAMPAIGN_ID}/scenes" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Dungeon","gridSize":70,"width":2000,"height":2000}')

SCENE_BODY=$(echo "$SCENE_RESPONSE" | head -n -1)
SCENE_STATUS=$(echo "$SCENE_RESPONSE" | tail -n 1)

if [ "$SCENE_STATUS" -eq 201 ] || [ "$SCENE_STATUS" -eq 200 ]; then
    SCENE_ID=$(extract_json "$SCENE_BODY" "id")
    IDS[SCENE_ID]="$SCENE_ID"
    RESULTS[SCENE]="SUCCESS"
    print_success "Scene created successfully (Status: $SCENE_STATUS)"
    echo "  Scene ID: $SCENE_ID"
else
    RESULTS[SCENE]="FAILED (Status: $SCENE_STATUS)"
    print_error "Scene creation failed with status $SCENE_STATUS"
    echo "$SCENE_BODY"
    exit 1
fi

# Step 5: Create actors of each type
print_step "Step 5: Create Actors"

ACTOR_TYPES=("character" "npc" "monster" "vehicle")
declare -A ACTOR_IDS

for ACTOR_TYPE in "${ACTOR_TYPES[@]}"; do
    echo "  Creating ${ACTOR_TYPE}..."

    ACTOR_NAME="Test ${ACTOR_TYPE^}"
    ACTOR_RESPONSE=$(curl -k -s -w "\n%{http_code}" \
        -b "$COOKIE_FILE" \
        -X POST "${BASE_URL}/campaigns/${CAMPAIGN_ID}/actors" \
        -H "Content-Type: application/json" \
        -d "{\"campaignId\":\"${CAMPAIGN_ID}\",\"name\":\"${ACTOR_NAME}\",\"actorType\":\"${ACTOR_TYPE}\"}")

    ACTOR_BODY=$(echo "$ACTOR_RESPONSE" | head -n -1)
    ACTOR_STATUS=$(echo "$ACTOR_RESPONSE" | tail -n 1)

    if [ "$ACTOR_STATUS" -eq 201 ] || [ "$ACTOR_STATUS" -eq 200 ]; then
        ACTOR_ID=$(extract_json "$ACTOR_BODY" "id")
        ACTOR_IDS[$ACTOR_TYPE]="$ACTOR_ID"
        IDS[ACTOR_${ACTOR_TYPE^^}]="$ACTOR_ID"
        RESULTS[ACTOR_${ACTOR_TYPE^^}]="SUCCESS"
        print_success "${ACTOR_TYPE^} created (ID: $ACTOR_ID)"
    else
        RESULTS[ACTOR_${ACTOR_TYPE^^}]="FAILED (Status: $ACTOR_STATUS)"
        print_error "${ACTOR_TYPE^} creation failed with status $ACTOR_STATUS"
        echo "$ACTOR_BODY"
    fi
done

# Step 6: Add tokens for each actor to the scene
print_step "Step 6: Create Tokens on Scene"

TOKEN_POSITIONS=(
    "100:100"
    "300:100"
    "500:100"
    "700:100"
)

TOKEN_INDEX=0
declare -A TOKEN_IDS

for ACTOR_TYPE in "${ACTOR_TYPES[@]}"; do
    if [ -n "${ACTOR_IDS[$ACTOR_TYPE]}" ]; then
        echo "  Creating token for ${ACTOR_TYPE}..."

        POSITION="${TOKEN_POSITIONS[$TOKEN_INDEX]}"
        X_POS="${POSITION%%:*}"
        Y_POS="${POSITION##*:}"

        TOKEN_RESPONSE=$(curl -k -s -w "\n%{http_code}" \
            -b "$COOKIE_FILE" \
            -X POST "${BASE_URL}/campaigns/${CAMPAIGN_ID}/scenes/${SCENE_ID}/tokens" \
            -H "Content-Type: application/json" \
            -d "{\"actorId\":\"${ACTOR_IDS[$ACTOR_TYPE]}\",\"x\":${X_POS},\"y\":${Y_POS}}")

        TOKEN_BODY=$(echo "$TOKEN_RESPONSE" | head -n -1)
        TOKEN_STATUS=$(echo "$TOKEN_RESPONSE" | tail -n 1)

        if [ "$TOKEN_STATUS" -eq 201 ] || [ "$TOKEN_STATUS" -eq 200 ]; then
            TOKEN_ID=$(extract_json "$TOKEN_BODY" "id")
            TOKEN_IDS[$ACTOR_TYPE]="$TOKEN_ID"
            IDS[TOKEN_${ACTOR_TYPE^^}]="$TOKEN_ID"
            RESULTS[TOKEN_${ACTOR_TYPE^^}]="SUCCESS"
            print_success "${ACTOR_TYPE^} token created at (${X_POS}, ${Y_POS}) - ID: $TOKEN_ID"
        else
            RESULTS[TOKEN_${ACTOR_TYPE^^}]="FAILED (Status: $TOKEN_STATUS)"
            print_error "${ACTOR_TYPE^} token creation failed with status $TOKEN_STATUS"
            echo "$TOKEN_BODY"
        fi

        TOKEN_INDEX=$((TOKEN_INDEX + 1))
    fi
done

# Print summary
print_step "Test Summary"

echo -e "\n${YELLOW}Results by Step:${NC}"
for key in "${!RESULTS[@]}"; do
    result="${RESULTS[$key]}"
    if [[ "$result" == SUCCESS* ]]; then
        print_success "$key: $result"
    elif [[ "$result" == SKIPPED* ]]; then
        echo -e "${YELLOW}⊙ $key: $result${NC}"
    else
        print_error "$key: $result"
    fi
done

echo -e "\n${YELLOW}Created Resource IDs:${NC}"
echo "  Campaign ID: ${IDS[CAMPAIGN_ID]:-N/A}"
echo "  Scene ID: ${IDS[SCENE_ID]:-N/A}"
echo ""
echo "  Actor IDs:"
for ACTOR_TYPE in "${ACTOR_TYPES[@]}"; do
    ACTOR_KEY="ACTOR_${ACTOR_TYPE^^}"
    echo "    ${ACTOR_TYPE}: ${IDS[$ACTOR_KEY]:-N/A}"
done
echo ""
echo "  Token IDs:"
for ACTOR_TYPE in "${ACTOR_TYPES[@]}"; do
    TOKEN_KEY="TOKEN_${ACTOR_TYPE^^}"
    echo "    ${ACTOR_TYPE}: ${IDS[$TOKEN_KEY]:-N/A}"
done

# Clean up cookie file
rm -f "$COOKIE_FILE"

echo -e "\n${GREEN}Test completed!${NC}"

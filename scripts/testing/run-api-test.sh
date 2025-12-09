#!/bin/bash

# VTT API Test - Simple version
# Run from Git Bash or WSL on Windows

set -e

BASE_URL="https://localhost/api/v1"

echo "=== Step 1: Login ==="
LOGIN_RESP=$(curl -k -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@vtt.local","password":"TestPassword123!"}')

SESSION_ID=$(echo "$LOGIN_RESP" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Login successful"
echo "User ID: $USER_ID"
echo "Session ID: $SESSION_ID"

echo ""
echo "=== Step 2: Create Campaign ==="
CAMPAIGN_RESP=$(curl -k -s -X POST "$BASE_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d '{"name":"Test Campaign","description":"Testing all features"}')

CAMPAIGN_ID=$(echo "$CAMPAIGN_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Campaign created"
echo "Campaign ID: $CAMPAIGN_ID"

echo ""
echo "=== Step 3: Create Scene ==="
SCENE_RESP=$(curl -k -s -X POST "$BASE_URL/campaigns/$CAMPAIGN_ID/scenes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d '{"name":"Test Dungeon","gridSize":70,"width":2000,"height":2000}')

SCENE_ID=$(echo "$SCENE_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Scene created"
echo "Scene ID: $SCENE_ID"

echo ""
echo "=== Step 4: Create Actors ==="

# Character
CHAR_RESP=$(curl -k -s -X POST "$BASE_URL/campaigns/$CAMPAIGN_ID/actors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"campaignId\":\"$CAMPAIGN_ID\",\"name\":\"Test Character\",\"actorType\":\"character\"}")
CHAR_ID=$(echo "$CHAR_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Character created: $CHAR_ID"

# NPC
NPC_RESP=$(curl -k -s -X POST "$BASE_URL/campaigns/$CAMPAIGN_ID/actors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"campaignId\":\"$CAMPAIGN_ID\",\"name\":\"Test NPC\",\"actorType\":\"npc\"}")
NPC_ID=$(echo "$NPC_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "NPC created: $NPC_ID"

# Monster
MONSTER_RESP=$(curl -k -s -X POST "$BASE_URL/campaigns/$CAMPAIGN_ID/actors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"campaignId\":\"$CAMPAIGN_ID\",\"name\":\"Test Monster\",\"actorType\":\"monster\"}")
MONSTER_ID=$(echo "$MONSTER_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Monster created: $MONSTER_ID"

# Vehicle
VEHICLE_RESP=$(curl -k -s -X POST "$BASE_URL/campaigns/$CAMPAIGN_ID/actors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"campaignId\":\"$CAMPAIGN_ID\",\"name\":\"Test Vehicle\",\"actorType\":\"vehicle\"}")
VEHICLE_ID=$(echo "$VEHICLE_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Vehicle created: $VEHICLE_ID"

echo ""
echo "=== Step 5: Create Tokens ==="

# Character token
CHAR_TOKEN_RESP=$(curl -k -s -X POST "$BASE_URL/scenes/$SCENE_ID/tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"name\":\"Character Token\",\"actorId\":\"$CHAR_ID\",\"x\":100,\"y\":100}")
CHAR_TOKEN_ID=$(echo "$CHAR_TOKEN_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Character token created at (100,100): $CHAR_TOKEN_ID"

# NPC token
NPC_TOKEN_RESP=$(curl -k -s -X POST "$BASE_URL/scenes/$SCENE_ID/tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"name\":\"NPC Token\",\"actorId\":\"$NPC_ID\",\"x\":300,\"y\":100}")
NPC_TOKEN_ID=$(echo "$NPC_TOKEN_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "NPC token created at (300,100): $NPC_TOKEN_ID"

# Monster token
MONSTER_TOKEN_RESP=$(curl -k -s -X POST "$BASE_URL/scenes/$SCENE_ID/tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"name\":\"Monster Token\",\"actorId\":\"$MONSTER_ID\",\"x\":500,\"y\":100}")
MONSTER_TOKEN_ID=$(echo "$MONSTER_TOKEN_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Monster token created at (500,100): $MONSTER_TOKEN_ID"

# Vehicle token
VEHICLE_TOKEN_RESP=$(curl -k -s -X POST "$BASE_URL/scenes/$SCENE_ID/tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID" \
  -d "{\"name\":\"Vehicle Token\",\"actorId\":\"$VEHICLE_ID\",\"x\":700,\"y\":100}")
VEHICLE_TOKEN_ID=$(echo "$VEHICLE_TOKEN_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Vehicle token created at (700,100): $VEHICLE_TOKEN_ID"

echo ""
echo "=== SUMMARY ==="
echo ""
echo "All tests completed successfully!"
echo ""
echo "Campaign ID: $CAMPAIGN_ID"
echo "Scene ID: $SCENE_ID"
echo ""
echo "Actor IDs:"
echo "  - Character: $CHAR_ID"
echo "  - NPC: $NPC_ID"
echo "  - Monster: $MONSTER_ID"
echo "  - Vehicle: $VEHICLE_ID"
echo ""
echo "Token IDs:"
echo "  - Character: $CHAR_TOKEN_ID"
echo "  - NPC: $NPC_TOKEN_ID"
echo "  - Monster: $MONSTER_TOKEN_ID"
echo "  - Vehicle: $VEHICLE_TOKEN_ID"

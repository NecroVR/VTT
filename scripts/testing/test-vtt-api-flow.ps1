# VTT API Full Flow Test Script (PowerShell)
# Tests the complete application flow via https://localhost/api/v1/

# Configuration
$BaseUrl = "https://localhost/api/v1"
$TestEmail = "testuser@vtt.local"
$TestPassword = "TestPassword123!"
$TestName = "Test User"

# Skip SSL certificate validation
if (-not ([System.Management.Automation.PSTypeName]'ServerCertificateValidationCallback').Type) {
    $certCallback = @"
    using System;
    using System.Net;
    using System.Net.Security;
    using System.Security.Cryptography.X509Certificates;
    public class ServerCertificateValidationCallback
    {
        public static void Ignore()
        {
            if(ServicePointManager.ServerCertificateValidationCallback == null)
            {
                ServicePointManager.ServerCertificateValidationCallback +=
                    delegate
                    (
                        Object obj,
                        X509Certificate certificate,
                        X509Chain chain,
                        SslPolicyErrors errors
                    )
                    {
                        return true;
                    };
            }
        }
    }
"@
    Add-Type $certCallback
}
[ServerCertificateValidationCallback]::Ignore()

# Enable TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Result tracking
$Results = @{}
$IDs = @{}
$Session = $null

# Helper functions
function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession = $null
    )

    $params = @{
        Method = $Method
        Uri = $Url
        ContentType = "application/json"
    }

    if ($WebSession) {
        $params.WebSession = $WebSession
    } else {
        $params.SessionVariable = "newSession"
    }

    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-RestMethod @params
        if ($newSession) {
            return @{
                Response = $response
                Session = $newSession
                StatusCode = 200
            }
        }
        return @{
            Response = $response
            StatusCode = 200
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        return @{
            Response = $null
            Error = $_.Exception.Message
            StatusCode = $statusCode
        }
    }
}

# Step 1: Register a new user
Write-Step "Step 1: Register New User"
$registerBody = @{
    email = $TestEmail
    password = $TestPassword
    name = $TestName
}

$registerResult = Invoke-ApiRequest -Method POST -Url "$BaseUrl/auth/register" -Body $registerBody

if ($registerResult.StatusCode -eq 200 -or $registerResult.StatusCode -eq 201) {
    $userId = $registerResult.Response.user.id
    $IDs.USER_ID = $userId
    $Results.REGISTER = "SUCCESS"
    Write-Success "User registered successfully (Status: $($registerResult.StatusCode))"
    Write-Host "  User ID: $userId"
}
elseif ($registerResult.StatusCode -eq 409) {
    $Results.REGISTER = "SKIPPED (User exists)"
    Write-Success "User already exists, will attempt login"
}
else {
    $Results.REGISTER = "FAILED (Status: $($registerResult.StatusCode))"
    Write-Error "Registration failed with status $($registerResult.StatusCode)"
    Write-Host "  Error: $($registerResult.Error)"
}

# Step 2: Login to get session cookie
Write-Step "Step 2: Login to Get Session"
$loginBody = @{
    email = $TestEmail
    password = $TestPassword
}

$loginResult = Invoke-ApiRequest -Method POST -Url "$BaseUrl/auth/login" -Body $loginBody

if ($loginResult.StatusCode -eq 200) {
    $userId = $loginResult.Response.user.id
    $IDs.USER_ID = $userId
    $Session = $loginResult.Session
    $Results.LOGIN = "SUCCESS"
    Write-Success "Login successful (Status: $($loginResult.StatusCode))"
    Write-Host "  User ID: $userId"
    Write-Success "Session cookie saved"
}
else {
    $Results.LOGIN = "FAILED (Status: $($loginResult.StatusCode))"
    Write-Error "Login failed with status $($loginResult.StatusCode)"
    Write-Host "  Error: $($loginResult.Error)"
    exit 1
}

# Step 3: Create a campaign
Write-Step "Step 3: Create Campaign"
$campaignBody = @{
    name = "Test Campaign"
    description = "Testing all features"
}

$campaignResult = Invoke-ApiRequest -Method POST -Url "$BaseUrl/campaigns" -Body $campaignBody -WebSession $Session

if ($campaignResult.StatusCode -eq 200 -or $campaignResult.StatusCode -eq 201) {
    $campaignId = $campaignResult.Response.campaign.id
    $IDs.CAMPAIGN_ID = $campaignId
    $Results.CAMPAIGN = "SUCCESS"
    Write-Success "Campaign created successfully (Status: $($campaignResult.StatusCode))"
    Write-Host "  Campaign ID: $campaignId"
}
else {
    $Results.CAMPAIGN = "FAILED (Status: $($campaignResult.StatusCode))"
    Write-Error "Campaign creation failed with status $($campaignResult.StatusCode)"
    Write-Host "  Error: $($campaignResult.Error)"
    exit 1
}

# Step 4: Create a scene in the campaign
Write-Step "Step 4: Create Scene"
$sceneBody = @{
    name = "Test Dungeon"
    gridSize = 70
    width = 2000
    height = 2000
}

$sceneResult = Invoke-ApiRequest -Method POST -Url "$BaseUrl/campaigns/$campaignId/scenes" -Body $sceneBody -WebSession $Session

if ($sceneResult.StatusCode -eq 200 -or $sceneResult.StatusCode -eq 201) {
    $sceneId = $sceneResult.Response.scene.id
    $IDs.SCENE_ID = $sceneId
    $Results.SCENE = "SUCCESS"
    Write-Success "Scene created successfully (Status: $($sceneResult.StatusCode))"
    Write-Host "  Scene ID: $sceneId"
}
else {
    $Results.SCENE = "FAILED (Status: $($sceneResult.StatusCode))"
    Write-Error "Scene creation failed with status $($sceneResult.StatusCode)"
    Write-Host "  Error: $($sceneResult.Error)"
    exit 1
}

# Step 5: Create actors of each type
Write-Step "Step 5: Create Actors"

$actorTypes = @("character", "npc", "monster", "vehicle")
$actorIds = @{}

foreach ($actorType in $actorTypes) {
    Write-Host "  Creating $actorType..."

    $actorName = "Test $($actorType.Substring(0,1).ToUpper() + $actorType.Substring(1))"
    $actorBody = @{
        campaignId = $campaignId
        name = $actorName
        actorType = $actorType
    }

    $actorResult = Invoke-ApiRequest -Method POST -Url "$BaseUrl/campaigns/$campaignId/actors" -Body $actorBody -WebSession $Session

    if ($actorResult.StatusCode -eq 200 -or $actorResult.StatusCode -eq 201) {
        $actorId = $actorResult.Response.actor.id
        $actorIds[$actorType] = $actorId
        $IDs["ACTOR_$($actorType.ToUpper())"] = $actorId
        $Results["ACTOR_$($actorType.ToUpper())"] = "SUCCESS"
        Write-Success "$($actorType.Substring(0,1).ToUpper() + $actorType.Substring(1)) created (ID: $actorId)"
    }
    else {
        $Results["ACTOR_$($actorType.ToUpper())"] = "FAILED (Status: $($actorResult.StatusCode))"
        Write-Error "$($actorType.Substring(0,1).ToUpper() + $actorType.Substring(1)) creation failed with status $($actorResult.StatusCode)"
        Write-Host "  Error: $($actorResult.Error)"
    }
}

# Step 6: Add tokens for each actor to the scene
Write-Step "Step 6: Create Tokens on Scene"

$tokenPositions = @(
    @{x=100; y=100},
    @{x=300; y=100},
    @{x=500; y=100},
    @{x=700; y=100}
)

$tokenIndex = 0
$tokenIds = @{}

foreach ($actorType in $actorTypes) {
    if ($actorIds.ContainsKey($actorType)) {
        Write-Host "  Creating token for $actorType..."

        $position = $tokenPositions[$tokenIndex]
        $tokenBody = @{
            actorId = $actorIds[$actorType]
            x = $position.x
            y = $position.y
        }

        $tokenResult = Invoke-ApiRequest -Method POST -Url "$BaseUrl/campaigns/$campaignId/scenes/$sceneId/tokens" -Body $tokenBody -WebSession $Session

        if ($tokenResult.StatusCode -eq 200 -or $tokenResult.StatusCode -eq 201) {
            $tokenId = $tokenResult.Response.token.id
            $tokenIds[$actorType] = $tokenId
            $IDs["TOKEN_$($actorType.ToUpper())"] = $tokenId
            $Results["TOKEN_$($actorType.ToUpper())"] = "SUCCESS"
            Write-Success "$($actorType.Substring(0,1).ToUpper() + $actorType.Substring(1)) token created at ($($position.x), $($position.y)) - ID: $tokenId"
        }
        else {
            $Results["TOKEN_$($actorType.ToUpper())"] = "FAILED (Status: $($tokenResult.StatusCode))"
            Write-Error "$($actorType.Substring(0,1).ToUpper() + $actorType.Substring(1)) token creation failed with status $($tokenResult.StatusCode)"
            Write-Host "  Error: $($tokenResult.Error)"
        }

        $tokenIndex++
    }
}

# Print summary
Write-Step "Test Summary"

Write-Host "`nResults by Step:" -ForegroundColor Yellow
foreach ($key in $Results.Keys | Sort-Object) {
    $result = $Results[$key]
    if ($result -like "SUCCESS*") {
        Write-Success "${key}: $result"
    }
    elseif ($result -like "SKIPPED*") {
        Write-Host "⊙ ${key}: $result" -ForegroundColor Yellow
    }
    else {
        Write-Error "${key}: $result"
    }
}

Write-Host "`nCreated Resource IDs:" -ForegroundColor Yellow
Write-Host "  Campaign ID: $($IDs.CAMPAIGN_ID)"
Write-Host "  Scene ID: $($IDs.SCENE_ID)"
Write-Host ""
Write-Host "  Actor IDs:"
foreach ($actorType in $actorTypes) {
    $actorKey = "ACTOR_$($actorType.ToUpper())"
    Write-Host "    ${actorType}: $($IDs[$actorKey])"
}
Write-Host ""
Write-Host "  Token IDs:"
foreach ($actorType in $actorTypes) {
    $tokenKey = "TOKEN_$($actorType.ToUpper())"
    Write-Host "    ${actorType}: $($IDs[$tokenKey])"
}

Write-Host "`nTest completed!" -ForegroundColor Green

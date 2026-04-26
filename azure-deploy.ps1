#Requires -Version 5.1
$ErrorActionPreference = "Stop"

# ═══════════════════════════════════════════════════════════════
# AZURE DEPLOYMENT SCRIPT FOR GSMS (Single Container)
# Resource Group: PROJ  |  Region: eastus
# Run with: .\azure-deploy.ps1
# ═══════════════════════════════════════════════════════════════

# ── Configuration ────────────────────────────────────────────
$RG       = "PROJETS"
$LOCATION = "eastus"
$RAND     = -join ((1..6) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
$ACR_NAME = "projacr$RAND"
$APP_NAME = "gsms-app"
$ENV_NAME = "gsms-env"
$IMAGE_NAME   = "gsms"
$IMAGE_TAG    = "latest"
$STORAGE_RAND = -join ((1..6) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
$STORAGE_NAME = "projstore$STORAGE_RAND"
$FILE_SHARE   = "mongodata"
$VOLUME_NAME  = "mongodata"

# ── Secrets (set these as environment variables or edit below) ──
$JWT_SECRET              = if ($env:JWT_SECRET)              { $env:JWT_SECRET }              else { "your-default-secret-change-me" }
$DEFAULT_ADMIN_USERNAME  = if ($env:DEFAULT_ADMIN_USERNAME)  { $env:DEFAULT_ADMIN_USERNAME }  else { "admin" }
$DEFAULT_ADMIN_PASSWORD  = if ($env:DEFAULT_ADMIN_PASSWORD)  { $env:DEFAULT_ADMIN_PASSWORD }  else { "admin123" }

# ── Helper: Retry function for flaky network calls ───────────
function Invoke-Retry {
    param(
        [scriptblock]$ScriptBlock,
        [int]$MaxAttempts = 3,
        [int]$DelaySeconds = 10
    )
    $attempt = 1
    while ($attempt -le $MaxAttempts) {
        try {
            & $ScriptBlock
            return
        } catch {
            Write-Warning "Attempt $attempt failed: $_"
            if ($attempt -eq $MaxAttempts) { throw }
            Write-Host "Retrying in $DelaySeconds seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
            $attempt++
        }
    }
}

# ── Step 1: Resource Group ───────────────────────────────────
Write-Host ">>> Creating/Updating Resource Group: $RG ..." -ForegroundColor Cyan
az group create --name $RG --location $LOCATION --output none

# ── Step 2: Azure Container Registry ───────────────────────────
Write-Host ">>> Creating ACR: $ACR_NAME ..." -ForegroundColor Cyan
az acr create `
  --resource-group $RG `
  --name $ACR_NAME `
  --sku Basic `
  --location $LOCATION `
  --admin-enabled true `
  --output none

$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --resource-group $RG --query loginServer -o tsv
Write-Host "ACR Login Server: $ACR_LOGIN_SERVER"

# ── Step 3: Build & Push Docker Image ────────────────────────
Write-Host ">>> Building and pushing Docker image..." -ForegroundColor Cyan
az acr build `
  --registry $ACR_NAME `
  --image "$IMAGE_NAME`:$IMAGE_TAG" `
  --resource-group $RG `
  .

# ── Step 4: Create Log Analytics Workspace ───────────────────
Write-Host ">>> Creating Log Analytics Workspace..." -ForegroundColor Cyan
$LOG_WORKSPACE = "$APP_NAME-logs"
az monitor log-analytics workspace create `
  --resource-group $RG `
  --workspace-name $LOG_WORKSPACE `
  --location $LOCATION `
  --output none

$WORKSPACE_ID = az monitor log-analytics workspace show `
  --resource-group $RG `
  --workspace-name $LOG_WORKSPACE `
  --query customerId -o tsv

$WORKSPACE_KEY = az monitor log-analytics workspace get-shared-keys `
  --resource-group $RG `
  --workspace-name $LOG_WORKSPACE `
  --query primarySharedKey -o tsv

# ── Step 5: Storage Account for MongoDB persistence ──────────
Write-Host ">>> Creating Storage Account for MongoDB data..." -ForegroundColor Cyan
az storage account create `
  --name $STORAGE_NAME `
  --resource-group $RG `
  --location $LOCATION `
  --sku Standard_LRS `
  --kind StorageV2 `
  --min-tls-version TLS1_2 `
  --output none

$STORAGE_KEY = az storage account keys list `
  --account-name $STORAGE_NAME `
  --resource-group $RG `
  --query '[0].value' -o tsv

az storage share create `
  --account-name $STORAGE_NAME `
  --name $FILE_SHARE `
  --account-key $STORAGE_KEY `
  --output none

# ── Step 6: Container Apps Environment ───────────────────────
Write-Host ">>> Creating Container Apps Environment..." -ForegroundColor Cyan
Invoke-Retry -ScriptBlock {
    az containerapp env create `
      --name $ENV_NAME `
      --resource-group $RG `
      --location $LOCATION `
      --logs-workspace-id $WORKSPACE_ID `
      --logs-workspace-key $WORKSPACE_KEY `
      --output none
} -MaxAttempts 3 -DelaySeconds 15

# ── Step 7: Deploy Container App (WITHOUT storage mount first) ─
Write-Host ">>> Deploying Container App..." -ForegroundColor Cyan

$FULL_IMAGE = "$ACR_LOGIN_SERVER/$IMAGE_NAME`:$IMAGE_TAG"

az containerapp create `
  --name $APP_NAME `
  --resource-group $RG `
  --environment $ENV_NAME `
  --image $FULL_IMAGE `
  --registry-server $ACR_LOGIN_SERVER `
  --target-port 80 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 1 `
  --cpu 1.0 `
  --memory 2.0Gi `
  --env-vars `
    "PORT=5000" `
    "MONGO_URI=mongodb://127.0.0.1:27017/gsms" `
    "VITE_API_BASE_URL=/api/" `
    "DEFAULT_ADMIN_USERNAME=$DEFAULT_ADMIN_USERNAME" `
    "DEFAULT_ADMIN_PASSWORD=secretref:admin-password" `
    "JWT_SECRET=secretref:jwt-secret" `
  --secrets `
    "admin-password=$DEFAULT_ADMIN_PASSWORD" `
    "jwt-secret=$JWT_SECRET" `
  --output none

# # ── Step 8: Attach Azure Files storage to Environment ────────
# Write-Host ">>> Attaching Azure Files to Container App Environment..." -ForegroundColor Cyan
# Invoke-Retry -ScriptBlock {
#     az containerapp env storage set `
#       --name $ENV_NAME `
#       --resource-group $RG `
#       --storage-name $VOLUME_NAME `
#       --azure-file-account-name $STORAGE_NAME `
#       --azure-file-account-key $STORAGE_KEY `
#       --azure-file-share-name $FILE_SHARE `
#       --access-mode ReadWrite `
#       --output none
# } -MaxAttempts 3 -DelaySeconds 10

# # ── Step 9: Mount volume into Container App ──────────────────
# Write-Host ">>> Mounting volume into Container App..." -ForegroundColor Cyan
# az containerapp update `
#   --name $APP_NAME `
#   --resource-group $RG `
#   --set "properties.template.volumes=[{name:'$VOLUME_NAME',storageType:'AzureFile',storageName:'$VOLUME_NAME'}]" `
#   --set "properties.template.containers[0].volumeMounts=[{name:'$VOLUME_NAME',mountPath:'/data/db'}]" `
#   --output none

# ── Step 10: Print Results ────────────────────────────────────
$APP_URL = az containerapp show --name $APP_NAME --resource-group $RG --query properties.configuration.ingress.fqdn -o tsv

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Resource Group   : $RG"
Write-Host "  Container App    : $APP_NAME"
Write-Host "  ACR              : $ACR_LOGIN_SERVER"
Write-Host "  Storage Account  : $STORAGE_NAME"
Write-Host "  MongoDB Data     : Ephemeral (Local Container Storage - LOST ON RESTART)"
Write-Host ""
Write-Host "  Application URL  : https://$APP_URL" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
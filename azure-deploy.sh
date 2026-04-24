#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# AZURE DEPLOYMENT SCRIPT FOR GSMS (Single Container)
# Resource Group: PROJECTS  |  Region: eastus
# ═══════════════════════════════════════════════════════════════

# ── Configuration ────────────────────────────────────────────
RG="PROJECTS"
LOCATION="eastus"
ACR_NAME="projacr$(openssl rand -hex 3)"   # Random suffix to ensure uniqueness
APP_NAME="gsms-app"
ENV_NAME="gsms-env"
IMAGE_NAME="gsms"
IMAGE_TAG="latest"
STORAGE_NAME="projstore$(openssl rand -hex 3)"
FILE_SHARE="mongodata"

# ── Secrets (set these or export beforehand) ──────────────────
JWT_SECRET="${JWT_SECRET:-your-default-secret-change-me}"
DEFAULT_ADMIN_USERNAME="${DEFAULT_ADMIN_USERNAME:-admin}"
DEFAULT_ADMIN_PASSWORD="${DEFAULT_ADMIN_PASSWORD:-admin123}"

# ── Step 1: Resource Group ───────────────────────────────────
echo ">>> Creating Resource Group: $RG ..."
az group create --name "$RG" --location "$LOCATION" --output none

# ── Step 2: Azure Container Registry ───────────────────────────
echo ">>> Creating ACR: $ACR_NAME ..."
az acr create \
  --resource-group "$RG" \
  --name "$ACR_NAME" \
  --sku Basic \
  --location "$LOCATION" \
  --admin-enabled true \
  --output none

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RG" --query loginServer -o tsv)

# ── Step 3: Build & Push Docker Image ────────────────────────
echo ">>> Building and pushing Docker image..."
az acr build \
  --registry "$ACR_NAME" \
  --image "$IMAGE_NAME:$IMAGE_TAG" \
  --resource-group "$RG" \
  .

# ── Step 4: Create Log Analytics Workspace ───────────────────
echo ">>> Creating Log Analytics Workspace..."
az monitor log-analytics workspace create \
  --resource-group "$RG" \
  --workspace-name "${APP_NAME}-logs" \
  --location "$LOCATION" \
  --output none

WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RG" \
  --workspace-name "${APP_NAME}-logs" \
  --query customerId -o tsv)

WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys \
  --resource-group "$RG" \
  --workspace-name "${APP_NAME}-logs" \
  --query primarySharedKey -o tsv)

# ── Step 5: Storage Account for MongoDB persistence ──────────
echo ">>> Creating Storage Account for MongoDB data..."
az storage account create \
  --name "$STORAGE_NAME" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --output none

STORAGE_KEY=$(az storage account keys list \
  --account-name "$STORAGE_NAME" \
  --resource-group "$RG" \
  --query '[0].value' -o tsv)

az storage share create \
  --account-name "$STORAGE_NAME" \
  --name "$FILE_SHARE" \
  --account-key "$STORAGE_KEY" \
  --output none

# ── Step 6: Container Apps Environment ───────────────────────
echo ">>> Creating Container Apps Environment..."
az containerapp env create \
  --name "$ENV_NAME" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --logs-workspace-id "$WORKSPACE_ID" \
  --logs-workspace-key "$WORKSPACE_KEY" \
  --output none

# ── Step 7: Deploy Container App ─────────────────────────────
echo ">>> Deploying Container App..."

az containerapp create \
  --name "$APP_NAME" \
  --resource-group "$RG" \
  --environment "$ENV_NAME" \
  --image "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 1.0 \
  --memory 2.0Gi \
  --env-vars \
    "PORT=5000" \
    "MONGO_URI=mongodb://127.0.0.1:27017/gsms" \
    "VITE_API_BASE_URL=/api/" \
    "DEFAULT_ADMIN_USERNAME=${DEFAULT_ADMIN_USERNAME}" \
    "DEFAULT_ADMIN_PASSWORD=secretref:admin-password" \
    "JWT_SECRET=secretref:jwt-secret" \
  --secrets \
    "admin-password=${DEFAULT_ADMIN_PASSWORD}" \
    "jwt-secret=${JWT_SECRET}" \
  --azure-file-volume-name mongodata \
  --azure-file-volume-account-name "$STORAGE_NAME" \
  --azure-file-volume-account-key "$STORAGE_KEY" \
  --azure-file-volume-share-name "$FILE_SHARE" \
  --azure-file-volume-mount-path /data/db \
  --output none

# ── Step 8: Print Results ────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════"
echo "  Resource Group   : $RG"
echo "  Container App    : $APP_NAME"
echo "  ACR              : $ACR_LOGIN_SERVER"
echo "  Storage Account  : $STORAGE_NAME"
echo "  MongoDB Data     : $FILE_SHARE (mounted to /data/db)"
echo ""
APP_URL=$(az containerapp show --name "$APP_NAME" --resource-group "$RG" --query properties.configuration.ingress.fqdn -o tsv)
echo "  Application URL  : https://$APP_URL"
echo "═══════════════════════════════════════════════"
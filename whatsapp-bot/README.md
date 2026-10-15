# WhatsApp Bot (Baileys + Fly.io)

Completely free WhatsApp bot running on [Fly.io](https://fly.io) with persistent session storage.

## Features
- **Zero Cost**: Runs on Fly.io's free tier with 1 persistent volume.
- **No Meta Approval Required**: Connects to any standard WhatsApp phone number (personal or business).
- **Persistent Login**: Keeps credentials stored in `/data/auth_info` via Fly.io Volume mounts, so you don't need to re-scan the QR code across restarts or updates.
- **Pairing Code & QR Code Support**: Supports standard QR code scanning in the terminal or 8-digit WhatsApp pairing codes.

---

## 1. Local Testing

1. Install dependencies:
   ```bash
   cd whatsapp-bot
   npm install
   ```

2. Run the bot locally:
   ```bash
   npm start
   ```
   A QR code will be displayed in your terminal. Open WhatsApp on your phone -> **Settings / Linked Devices -> Link a Device** and scan the terminal QR code.

---

## 2. Deploy to Fly.io

### Step 1: Install & Login to Flyctl
If you haven't installed `flyctl`:
- **Windows (PowerShell)**: `pwsh -c "iwr https://fly.io/install.ps1 -useb | iex"`
- **Mac/Linux**: `curl -L https://fly.io/install.sh | sh`

Log in:
```bash
fly auth login
```

### Step 2: Create App & Persistent Volume
```bash
cd whatsapp-bot

# 1. Launch / register the app name
fly launch --no-deploy

# 2. Create the persistent volume in London (lhr) (1GB is within the free tier)
fly volumes create bot_data --size 1 --region lhr
```

### Step 3: Option A - Link via Pairing Code (Recommended for Cloud/Headless)
Set your school phone number with international country code (e.g. `2348037098816`):
```bash
fly secrets set PHONE_NUMBER=2348037098816
```

### Step 4: Deploy
```bash
fly deploy --remote-only
```

### Step 5: Check Logs & Link Device
```bash
fly logs
```
- If you set `PHONE_NUMBER`, you will see an 8-digit **PAIRING CODE** in the logs:
  `KEY: XXXX-XXXX`
  Go to WhatsApp -> **Linked Devices -> Link with phone number instead** and enter the code.
- If you didn't set a phone number, view `fly logs` and scan the terminal QR code.

Once connected, your session will be saved to the persistent volume `/data`, and the bot will stay connected 24/7!

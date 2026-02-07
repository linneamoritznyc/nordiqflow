# NordiqFlow Dashboard - Setup Guide

Private project management portal that syncs with your Google Sheets planning spreadsheet.

## Step 1: Google Cloud (Sheets API credentials)

1. Go to https://console.cloud.google.com/
2. Create a new project (or use an existing one), name it e.g. "nordiqflow-dashboard"
3. In the search bar, search **"Google Sheets API"** and click **Enable**
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > Service Account**
   - Name: `dashboard` (or anything)
   - Click **Done** (skip the optional steps)
6. Click on the service account you just created
7. Go to **Keys** tab > **Add Key > Create New Key > JSON**
8. A JSON file will download -- keep this safe, you'll need it

## Step 2: Share Your Spreadsheet

1. Open your planning spreadsheet in Google Sheets
2. Click **Share**
3. Paste the service account email (it looks like `dashboard@your-project.iam.gserviceaccount.com` -- you can find it in the JSON file under `client_email`)
4. Give it **Editor** access
5. Click **Send**

## Step 3: Deploy on Vercel

1. Go to https://vercel.com/new
2. Import the **same GitHub repo** (linneamoritznyc/nordiqflow)
3. **IMPORTANT**: Set the **Root Directory** to `dashboard`
4. Vercel will auto-detect Next.js
5. Before deploying, add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `GOOGLE_SPREADSHEET_ID` | `1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Paste the **entire contents** of the JSON key file from Step 1 |

6. Click **Deploy**

## Step 4: Done!

Your dashboard will be live at a random Vercel URL like `nordiqflow-xxxxx.vercel.app`.

### What you get

- **Timeline** (`/`) -- Your full year planning sheet, grouped by week with alternating colors, auto-scrolls to today
- **Daily Log** (`/log`) -- Pick a day, edit game plan / events / deadlines, saves directly back to your Google Sheet
- **Funding** (`/funding`) -- All rows with funding deadlines, sorted by urgency with countdown badges

### Quick links

- Planning spreadsheet: https://docs.google.com/spreadsheets/d/1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4/edit
- Google Cloud Console: https://console.cloud.google.com/
- Vercel Dashboard: https://vercel.com/dashboard

## Troubleshooting

**"Could not load spreadsheet" error:**
- Check that the environment variables are set correctly in Vercel
- Make sure you shared the spreadsheet with the service account email
- The JSON key must be pasted as a single line (Vercel handles this fine)

**Changes not appearing in the sheet:**
- Make sure the service account has **Editor** access, not just Viewer
- Check the Vercel function logs for errors (Vercel dashboard > your project > Logs)

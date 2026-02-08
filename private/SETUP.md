# NordiqFlow Private Dashboard - Complete Setup Guide

Private project management portal that syncs with your Google Sheets planning spreadsheet.

## Step 1: Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click the project dropdown at the top > **New Project**
3. Name it (e.g. `privatenordiqflow`)
4. Under Organization, select your account (e.g. `minerva.edu`)
5. Click **Create**
6. Make sure the new project is selected in the top dropdown

## Step 2: Enable the Google Sheets API

1. In the left sidebar, click **APIs & Services**
2. Click **+ ENABLE APIS AND SERVICES** at the top
3. Search for **"Google Sheets API"**
4. Click on it, then click **Enable**

## Step 3: Create a Service Account

A service account is like a robot email -- it has no access to your personal data, only what you explicitly share with it.

1. After enabling the API, click **Create Credentials**
2. For "Which API are you using?" -- select **Google Sheets API**
3. For "What data will you be accessing?" -- select **Application data**
4. Click **Next**
5. Give it a name (e.g. `privatenordiqflow`) and click **Create and Continue**
6. **Skip** the "Permissions" step (optional) -- just click **Continue**
7. **Skip** the "Principals with access" step (optional) -- just click **Done**

## Step 4: Download the JSON Key

1. Go to **APIs & Services > Credentials** (left sidebar)
2. Under **Service Accounts**, click on the email address you just created
   (e.g. `privatenordiqflow@privatenordiqflow.iam.gserviceaccount.com`)
3. Click the **Keys** tab at the top
4. Click **Add Key** > **Create new key**
5. Select **JSON** and click **Create**
6. A `.json` file will automatically download to your computer
7. Keep this file safe -- you'll need it for Vercel

## Step 5: Share Your Spreadsheet with the Service Account

1. Open the downloaded JSON file in a text editor (TextEdit, Notepad, VS Code)
2. Find the `"client_email"` field -- copy that email address
3. Open your planning spreadsheet: https://docs.google.com/spreadsheets/d/1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4/edit
4. Click **Share** (top right)
5. Paste the service account email
6. Set permission to **Editor**
7. Uncheck "Notify people" (it's a robot, not a person)
8. Click **Send** or **Share**

This gives the service account access to ONLY this spreadsheet -- nothing else in your Drive.

## Step 6: Add Credentials to Vercel

1. Go to https://vercel.com/dashboard
2. Click on your private dashboard project
3. Go to **Settings** > **Environment Variables**
4. Add these two variables:

| Name | Value |
|------|-------|
| `GOOGLE_SPREADSHEET_ID` | `1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Open the downloaded JSON file, select ALL the text, and paste it here |

5. Click **Save** for each
6. Go to **Deployments** tab
7. Click the **...** menu on the latest deployment > **Redeploy**

## Step 7: Done!

After redeployment, your dashboard will show your spreadsheet data.

### What you get

- **Timeline** (`/`) -- Your full year planning sheet, grouped by week with alternating colors, auto-scrolls to today
- **Daily Log** (`/log`) -- Pick a day, edit game plan / events / deadlines, saves directly back to your Google Sheet
- **Funding** (`/funding`) -- All rows with funding deadlines, sorted by urgency with countdown badges

### How syncing works

- **Edit in the portal** --> spreadsheet updates immediately
- **Edit in Google Sheets directly** --> portal shows the changes next time you load it

### Quick links

- Planning spreadsheet: https://docs.google.com/spreadsheets/d/1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4/edit
- Google Cloud Console: https://console.cloud.google.com/
- Vercel Dashboard: https://vercel.com/dashboard

## Troubleshooting

**"Could not load spreadsheet" error:**
- Check that both environment variables are set correctly in Vercel
- Make sure you shared the spreadsheet with the service account email
- Make sure you redeployed after adding the environment variables

**Changes not appearing in the sheet:**
- Make sure the service account has **Editor** access, not just Viewer
- Check the Vercel function logs for errors (Vercel dashboard > your project > Logs)

**Service account creation blocked:**
- If "No organization" doesn't work, try selecting your university/org account
- You need a Google account that has permission to create Cloud projects

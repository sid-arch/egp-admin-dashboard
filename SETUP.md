# EGP Attendance Dashboard — Setup

## What is included

- Full responsive attendance dashboard
- Participant search
- Present / Late / Absent controls
- Mark-all-present and clear-all controls
- Date selection beginning August 6, 2026
- Live summary counters
- Existing attendance loaded when a date is opened
- Updates instead of duplicate entries for the same participant/date
- Mobile layout
- Demo mode before the Google Apps Script URL is connected

## 1. Upload the dashboard to GitHub

Upload everything in this folder to the repository root:

- `index.html`
- `style.css`
- `config.js`
- `api.js`
- `attendance.js`
- `assets/`

You do **not** need to upload `Code.gs` to GitHub. It belongs in Google Apps Script.

Enable GitHub Pages from:

**Settings → Pages → Deploy from a branch → main / root**

## 2. Add your assets

Put your files here:

- `assets/logo.png`
- `assets/favicon.png`

The page still works before those files are added.

## 3. Connect the Google Sheet

1. Open the spreadsheet receiving registration submissions.
2. Check the registration tab name.
3. Open **Extensions → Apps Script**.
4. Delete the starter code.
5. Paste the contents of `Code.gs`.
6. At the top of `Code.gs`, change this only when needed:

```javascript
const REGISTRATION_SHEET_NAME = "Registrations";
```

The script automatically recognizes headers such as:

- Child First Name
- Child Last Name
- Participant ID (optional)

If there is no Participant ID column, it generates IDs based on the registration row.

## 4. Deploy the Apps Script

1. Click **Deploy → New deployment**.
2. Select **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Deploy and authorize it.
6. Copy the URL ending in `/exec`.

Google Apps Script web apps use `doGet`/`doPost` entry points and can return JSON through ContentService.

## 5. Paste the URL into config.js

```javascript
const CONFIG = {
  API_URL: "PASTE_THE_EXEC_URL_HERE",
  STUDY_START_DATE: "2026-08-06",
  TOTAL_SESSIONS: 12
};
```

Commit the change to GitHub. Refresh the live site.

## Attendance sheet created automatically

The script creates an `Attendance` tab with:

| Date | Participant ID | First Name | Last Name | Status | Time Marked |
|---|---|---|---|---|---|

Reopening a date loads its saved attendance. Saving again updates existing rows for that date instead of adding duplicates.

## Demo mode

Until `API_URL` is filled in, the dashboard uses five demo students and stores demo attendance in the browser. This lets you inspect the full UI immediately.

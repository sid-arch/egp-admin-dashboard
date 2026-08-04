# EGP Admin Dashboard v2 — Setup

## What this version adds

- Two admin tabs: Attendance and Leaderboard
- Daily score entry
- Cumulative totals across all days
- Score updates for the same participant/date instead of duplicates
- Delete incorrect daily scores
- Read-only parent/participant leaderboard page
- Public names displayed as `Aarush V.`
- Copy-public-link button
- Automatic public refresh every 60 seconds

---

# A. GitHub files

Upload these website files to your repository root:

- `index.html`
- `leaderboard-view.html`
- `style.css`
- `config.js`
- `api.js`
- `app.js`
- `public-leaderboard.js`
- `assets/`

Do not upload the `.gs` files to GitHub. They go into Apps Script.

Put your branding files inside:

- `assets/logo.png`
- `assets/favicon.png`

---

# B. Apps Script changes

Your existing `Code.gs` continues to handle registration.

## 1. Replace only doGet

Open `DOGET-REPLACEMENT.txt`.

In your current `Code.gs`, replace only:

```javascript
function doGet(e) {
  return jsonResponse(getStatus_());
}
```

with the function inside `DOGET-REPLACEMENT.txt`.

Do not touch `doPost(e)`.

## 2. Add three new script files

Click the `+` beside Files and choose **Script** three times.

Create:

- `Attendance.gs`
- `Leaderboard.gs`
- `Shared.gs`

Paste the matching code from this ZIP into each file.

Your Apps Script project should look like:

```text
Code.gs
Attendance.gs
Leaderboard.gs
Shared.gs
```

## 3. Save and redeploy

1. Click Save.
2. Deploy → Manage deployments.
3. Click the pencil icon on the existing web app.
4. Select **New version**.
5. Deploy.
6. Keep the same `/exec` Web App URL.

---

# C. Connect GitHub to Apps Script

Open `config.js`.

Paste the Apps Script Web App URL here:

```javascript
API_URL: "https://script.google.com/macros/s/YOUR_ID/exec"
```

Commit the change.

---

# D. Public leaderboard link

The admin dashboard automatically creates the link to:

```text
leaderboard-view.html
```

Example:

```text
https://YOUR-USERNAME.github.io/YOUR-REPO/leaderboard-view.html
```

Parents can only view it. They cannot enter attendance or scores.

---

# E. Google Sheet tabs

The script automatically creates:

## Attendance

```text
Date | Participant ID | First Name | Last Name | Status | Time Marked
```

## Leaderboard

```text
Date | Participant ID | First Name | Last Name | Digits Recalled | Time Updated
```

Example cumulative result:

- Day 1: 50
- Day 2: 40
- Overall total: 90

Saving another score for the same person and date updates that day's score.

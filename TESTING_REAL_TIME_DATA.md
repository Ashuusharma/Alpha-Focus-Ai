# Real-Time Data System - Testing Guide

## Quick Start Testing

### 1. Start the Dev Server
```bash
npm run dev
```
Server runs on http://localhost:3000

### 2. Test Assessment Saving

**Step 1: Complete an Assessment**
- Navigate to http://localhost:3000
- Select "Skincare" category
- Answer 3-5 questions (choose any options)
- You should see progress bar increase
- Click "See My Recommendations" button

**Expected Result:**
- Assessment is saved to localStorage
- Activity log is updated
- Application navigates to /result page

**Step 2: Verify Save in Browser**
- Open DevTools: Press F12
- Go to "Application" tab → "Local Storage" → "http://localhost:3000"
- Check `oneman_assessments` key
- Should contain object with your answers

### 3. Test Dashboard Real-Time Updates

**Step 1: Navigate to Dashboard**
- Click the profile icon (👤) in the top right
- Click "Dashboard" from the menu

**Expected Results:**
- Dashboard shows your real assessment
- Progress percentage is calculated from your answers
- Assessment appears in the list with date
- Recent activity shows your submission

**Step 2: Add Another Assessment**
- Go back to home page (/)
- Answer questions in a different category
- Submit again
- Refresh dashboard

**Expected Results:**
- Dashboard shows both assessments
- Activity log shows 2 entries
- Progress percentage is updated
- Stats reflect total questions answered

### 4. Test Saved Scans

**Step 1: Upload an Image (Optional)**
- Go to "Image Analyzer" (from home page)
- Upload a photo of skin/hair
- Wait for analysis to complete

**Step 2: Check Saved Scans**
- Click profile icon → "Saved Scans"
- If you uploaded an image, it should appear
- Click to expand and see details

**Expected Results:**
- Scan count shows number of analyses
- Each scan displays date, type, and confidence
- Details can be expanded to see findings

### 5. Test Compare Results

**Step 1: Complete Multiple Assessments**
- Ensure you have at least 2 assessments saved
- Can test by completing assessment twice

**Step 2: Navigate to Compare Results**
- Click profile icon → "Compare Results"

**Expected Results:**
- If 2+ assessments exist:
  - Shows latest vs previous assessment dates
  - Displays progress change percentage
  - Shows improvement trend
- If less than 2:
  - Shows "Not enough data to compare"

### 6. Test Settings Persistence

**Step 1: Change Settings**
- Click profile icon → "Settings"
- Toggle "Push Notifications" ON/OFF
- Toggle "Email Updates" ON/OFF
- Change "Language" to "Spanish"
- Change "Timezone" to "EST"

**Step 2: Save Settings**
- Click "Save Changes" button
- Should show "✓ Saved to localStorage" message

**Step 3: Verify Persistence**
- Refresh the page (Ctrl+R)
- Go back to Settings
- All your changes should still be there

**Step 4: Check localStorage**
- Open DevTools → Application → Local Storage
- Find `oneman_preferences` key
- Should contain your settings as JSON

### 7. Test Activity Logging

**Step 1: Perform Various Actions**
- Complete an assessment
- Upload an image
- Change settings
- Navigate between pages

**Step 2: Check Dashboard Activity**
- Go to Dashboard
- Scroll to "Recent Activity" section
- Should see all actions with timestamps

**Expected Results:**
- "Assessment completed" when you submit answers
- "Image uploaded" when you analyze photo
- "Settings updated" when you save preferences
- Timestamps show when each action occurred

## Advanced Testing

### Test localStorage Export
```javascript
// Copy this to DevTools Console (F12)
const allData = {};
for (let key in localStorage) {
  if (key.startsWith('oneman_')) {
    allData[key] = JSON.parse(localStorage[key]);
  }
}
console.log(JSON.stringify(allData, null, 2));
// Copy output to analyze your data
```

### Test Data Clearing
```javascript
// WARNING: This will delete all data
// Only run if you want to reset everything
localStorage.removeItem('oneman_user_data');
localStorage.removeItem('oneman_assessments');
localStorage.removeItem('oneman_scans');
localStorage.removeItem('oneman_activity_log');
localStorage.removeItem('oneman_preferences');
localStorage.removeItem('oneman_progress');
// Refresh page to create fresh user
location.reload();
```

### Test Specific Data Access
```javascript
// View all assessments
const assessments = JSON.parse(localStorage.getItem('oneman_assessments') || '[]');
console.table(assessments);

// View activity log
const activities = JSON.parse(localStorage.getItem('oneman_activity_log') || '[]');
console.table(activities);

// View user preferences
const prefs = JSON.parse(localStorage.getItem('oneman_preferences') || '{}');
console.log('Preferences:', prefs);
```

## Troubleshooting

### Issue: Data Not Appearing in Dashboard
1. Check localStorage has data:
   - DevTools → Application → Local Storage
   - Should see `oneman_assessments` key
2. Check browser console for errors (F12)
3. Clear browser cache and refresh
4. Make sure you completed assessment on home page

### Issue: Settings Not Saving
1. Check "Save Changes" button was clicked
2. Look for "✓ Saved to localStorage" message
3. Check localStorage has `oneman_preferences` key
4. Make sure JavaScript is enabled in browser

### Issue: Activity Log Empty
1. Make sure you've completed at least one action
2. Check `oneman_activity_log` exists in localStorage
3. Activities only appear after submitting assessment
4. Refresh dashboard to see latest activities

### Issue: Compare Results Shows "Not Enough Data"
1. Need at least 2 assessments
2. Go back to home page (/)
3. Complete a new assessment
4. Go to Compare Results again

## Expected localStorage Size

### After 1 Assessment
```
Total: ~2KB
- oneman_user_data: ~0.3KB
- oneman_assessments: ~1KB
- oneman_activity_log: ~0.3KB
```

### After 5 Assessments
```
Total: ~5KB
- oneman_assessments: ~3.5KB
- oneman_activity_log: ~1KB
```

### With Image Scans
```
Each scan (without image): ~0.5KB
Each scan (with base64 image): ~50-200KB
Recommend keeping last 5 scans
```

## Test Checklist

Use this to verify all features work:

- [ ] Can complete assessment on home page
- [ ] Assessment saves to localStorage
- [ ] Dashboard displays real assessment data
- [ ] Activity log shows completed assessment
- [ ] Can navigate between pages without losing data
- [ ] Saved Scans page works (even if empty)
- [ ] Compare Results shows appropriate message
- [ ] Settings can be changed and saved
- [ ] Settings persist after page refresh
- [ ] Multiple assessments stack correctly
- [ ] Progress percentage updates accurately
- [ ] All dates and timestamps are correct
- [ ] No console errors when navigating pages

## Next Steps After Testing

1. **Verify all features work** - Use checklist above
2. **Review localStorage data** - Ensure it matches expectations
3. **Test performance** - App should be snappy with localStorage
4. **Mobile testing** - Try on mobile browser if available
5. **Report issues** - Document any bugs found

## Notes

- localStorage persists across browser sessions
- Clearing browser data will delete all progress
- Each user has separate localStorage (browser-specific)
- Maximum ~5-10MB available per origin
- For cloud integration, data will sync to backend database

---

**Last Updated:** January 2024

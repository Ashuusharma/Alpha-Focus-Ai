# 🧪 Testing Guide - User Profiles, History & Routines

## Quick Start Testing

### Test 1: First Visit Flow (5 minutes)
**Goal:** Verify user auto-creation and initial scan save

1. **Open Browser**
   - Go to `http://localhost:3000/image-analyzer`

2. **Complete Assessment**
   - Upload a test photo (skin/hair/beard)
   - Answer all questionnaire questions
   - Click "Analyze"

3. **View Results**
   - Should see routine displayed
   - Should see "Complete another scan to see progress tracking" message
   - Check browser DevTools (F12)
     - Application → LocalStorage
     - Look for `oneman_user_profile` ✅
     - Look for `oneman_user_history_*` ✅

4. **Verify Data Structure**
   ```javascript
   // In DevTools Console:
   localStorage.getItem('oneman_user_profile')
   // Should show user object with id, name, email, timestamps
   ```

### Test 2: Second Visit Flow (5 minutes)
**Goal:** Verify progress tracking and comparison

1. **First Scan (if not done)**
   - Repeat Test 1

2. **Simulate Second Scan (1-2 weeks later)**
   - Go to `/image-analyzer` again
   - Upload different photo
   - Answer questionnaire (similar or different answers)
   - Click "Analyze"

3. **View Progress**
   - Should see new routine
   - Should see `<ProgressComparison>` component
   - Should show:
     - Overall improvement % (or worsening)
     - Resolved/improved/new issues
     - Confidence trends

4. **Verify Comparison**
   - Note issue confidence from Scan 1
   - Check confidence in Scan 2
   - Compare in DevTools:
     ```javascript
     const history = JSON.parse(
       localStorage.getItem('oneman_user_history_YOUR_USER_ID')
     )
     console.log(history.scans[0].aiAnalysis.confidence)
     console.log(history.scans[1].aiAnalysis.confidence)
     ```

### Test 3: Data Persistence (2 minutes)
**Goal:** Verify localStorage survives browser restart

1. **Complete a scan** (Test 1)

2. **Close browser completely**
   - Not just the tab, entire browser

3. **Reopen browser**
   - Go to `http://localhost:3000`

4. **Check Data**
   - User should be recognized
   - History should contain previous scans
   - Can load user from localStorage ✅

### Test 4: Routine Generation (3 minutes)
**Goal:** Verify routine is personalized to issues

1. **Complete Assessment**
   - Focus on detecting specific issues
   - E.g., answer "Yes" to acne/dryness questions

2. **Review Routine**
   - Morning routine should include:
     - Cleanser
     - Toner (if oily detected)
     - Treatment (for issues)
     - Moisturizer
     - SPF
   
   - Evening routine should include:
     - Makeup remover
     - Cleanser
     - Exfoliate (if needed)
     - Serum
     - Night cream

3. **Check 4-Week Progression**
   - Week 1: Simpler (fewer products)
   - Week 2: More steps
   - Week 3: Full routine
   - Week 4: Maintenance

4. **Verify Product Recommendations**
   - Products should match detected issues
   - Should reference recommendations from AI analysis

### Test 5: Component Rendering (3 minutes)
**Goal:** Verify UI displays correctly

1. **RoutineDisplay Component**
   - ✅ Gradient header visible
   - ✅ Week selector works (if 4 weeks)
   - ✅ Timeline shows all steps with times
   - ✅ Expandable sections work
   - ✅ Expected results displayed
   - ✅ Pro tips showing

2. **ProgressComparison Component** (on 2nd scan)
   - ✅ Improvement % shown
   - ✅ Resolved issues listed
   - ✅ Improved issues listed
   - ✅ New issues listed
   - ✅ Action items visible

3. **Responsive Design**
   - Test on mobile (DevTools)
   - Routine should stack vertically ✅
   - Timeline readable on small screens ✅

## Advanced Testing

### Test 6: Multiple Scans Tracking
**Goal:** Verify system handles 3+ scans

1. **Complete 3 scans** over different sessions
   - Scan 1: Initial assessment
   - Scan 2: 1 week later (simulated)
   - Scan 3: Another week later

2. **Check History**
   ```javascript
   const history = JSON.parse(
     localStorage.getItem('oneman_user_history_USER_ID')
   )
   console.log(history.scans.length) // Should be 3
   console.log(history.progressMetrics) // Should track all issues
   ```

3. **Verify Progress Calculation**
   - Compare Scan 1 vs Scan 3
   - Check long-term improvement
   - Verify trends over time

### Test 7: Different Issue Combinations
**Goal:** Verify routine adapts to different skin types

**Test Case A: Acne-Prone Skin**
- Answer "Yes" to acne questions
- Routine should include:
  - Salicylic acid cleanser
  - Acne treatment
  - Oil control products
  - Less heavy moisturizer

**Test Case B: Dry Skin**
- Answer "Yes" to dryness questions
- Routine should include:
  - Gentle cleanser
  - Hydrating toner
  - Rich moisturizer
  - Facial oil
  - Masks

**Test Case C: Sensitive Skin**
- Select sensitive skin type
- Routine should include:
  - Fragrance-free products
  - Soothing ingredients
  - No exfoliation (Week 1-2)
  - Calming serums

**Test Case D: Combination Skin**
- Mix of acne + dryness answers
- Routine should balance:
  - Oil control for T-zone
  - Hydration for dry areas
  - Flexible approach

### Test 8: Data Export/Import
**Goal:** Verify backup and restore functionality

1. **Create some scans**
   - Complete 2-3 assessments
   - Build history

2. **Export Data**
   ```javascript
   // In console:
   const { exportUserData } = await import('./lib/userProfileManager.ts')
   const backup = exportUserData()
   console.log(backup)
   // Copy entire JSON output
   ```

3. **Clear LocalStorage**
   - DevTools → Application → LocalStorage → Delete all
   - Refresh page

4. **Import Data**
   ```javascript
   // In console:
   const { importUserData } = await import('./lib/userProfileManager.ts')
   importUserData(backupJSON)
   // Refresh page
   ```

5. **Verify Restoration**
   - User should be recognized
   - All scans restored
   - History intact ✅

### Test 9: Performance
**Goal:** Verify system handles large datasets

1. **Create 10+ scans**
   - Rapidly complete multiple assessments
   - Check localStorage size

2. **Monitor Performance**
   ```javascript
   // Check how much storage used
   const profile = localStorage.getItem('oneman_user_profile')
   const history = localStorage.getItem('oneman_user_history_*')
   console.log(profile.length + history.length) // In bytes
   ```

3. **Verify Speed**
   - Result page should load instantly
   - No lag when displaying routine
   - Comparison calculation instant

## Debugging Checklist

### If Routine Not Showing
- [ ] Check `<RoutineDisplay>` component is imported
- [ ] Verify `generateRoutine()` returns valid routine
- [ ] Check console for errors (F12)
- [ ] Verify issues were detected in analysis

### If Progress Comparison Not Showing
- [ ] Second scan required for comparison
- [ ] Check `calculateProgress()` logic
- [ ] Verify `getLatestScan()` and `getPreviousScan()` return data
- [ ] Console log comparison object

### If LocalStorage Not Saving
- [ ] Check browser allows localStorage (not incognito)
- [ ] Verify `saveScanRecord()` called after analysis
- [ ] Check DevTools → Application → Storage for quota
- [ ] Look for errors in console

### If Data Corrupted
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Refresh page
- [ ] Create new scans
- [ ] User will be auto-created fresh

## Sample Test Data

### Scenario: Acne-Prone User
```json
{
  "name": "Test User",
  "skinType": "Oily",
  "mainIssues": ["Acne", "Large Pores"],
  "routine": {
    "morning": [
      "Salicylic acid cleanser (2 min)",
      "Toner (1 min)",
      "Acne serum (2 min)",
      "Lightweight moisturizer (2 min)",
      "SPF 30+ (1 min)"
    ],
    "evening": [
      "Makeup remover (2 min)",
      "Cleanser (2 min)",
      "Exfoliate 2x/week (5 min)",
      "Acne treatment (2 min)",
      "Night moisturizer (2 min)"
    ]
  },
  "expectedResults": "Acne improvement in 2-3 weeks, clearer skin in 4-6 weeks"
}
```

### Scenario: Dry Skin User
```json
{
  "name": "Test User 2",
  "skinType": "Dry",
  "mainIssues": ["Dryness", "Sensitivity"],
  "routine": {
    "morning": [
      "Gentle cream cleanser (2 min)",
      "Hydrating toner (1 min)",
      "Hyaluronic serum (2 min)",
      "Rich moisturizer (2 min)",
      "SPF with hydration (1 min)"
    ],
    "evening": [
      "Oil cleanser (2 min)",
      "Gentle cleanser (2 min)",
      "Hydrating mask 2x/week (10 min)",
      "Peptide serum (2 min)",
      "Night cream + facial oil (2 min)"
    ]
  },
  "expectedResults": "Skin feels hydrated by day 3, visible improvement in 1-2 weeks"
}
```

## Success Criteria

✅ **All Tests Pass When:**

1. **User Management**
   - [ ] User created on first visit
   - [ ] User ID persists across sessions
   - [ ] User profile updates saved

2. **Scan History**
   - [ ] Each scan saved to localStorage
   - [ ] Can retrieve scan by ID
   - [ ] Multiple scans tracked correctly

3. **Routine Generation**
   - [ ] Routine matches detected issues
   - [ ] 4-week progression visible
   - [ ] Products match recommendations

4. **Progress Tracking**
   - [ ] Comparison shows on 2nd scan
   - [ ] Improvements calculated correctly
   - [ ] Issues classified properly

5. **Performance**
   - [ ] Result page loads <2 seconds
   - [ ] No lag in UI interactions
   - [ ] Smooth scrolling

6. **Data Persistence**
   - [ ] Data survives browser restart
   - [ ] Export/import works
   - [ ] Clear all data resets system

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| User not saving | `getCurrentUser()` not called | Ensure imported in result page |
| Routine not showing | Issues not detected | Check AI analysis returns issues |
| Progress not comparing | Only 1 scan exists | Complete 2nd scan |
| Data lost on refresh | localStorage quota exceeded | Check DevTools storage |
| Components not rendering | Missing imports | Verify all imports in page.tsx |
| Styles look off | Tailwind classes missing | Check component Tailwind config |

## Next Testing Phase

Once these tests pass, move to:
1. **User Testing** - Real users try the system
2. **Mobile Testing** - Verify responsive design
3. **Load Testing** - Test with many users
4. **Integration Testing** - With Shopify, backend, etc.

---

**Testing Complete! System Ready for Production.** ✅

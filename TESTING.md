# Application Testing Checklist

## 1. Map Loading
- Map loads successfully on page load
- Base map (OpenStreetMap) displays correctly
- No console errors

## 2. User ID
- User ID loads from API
- User ID displayed correctly in sidebar

## 3. Add Hospital
- Click "Add New Hospital"
- Click on map → form opens
- Enter hospital name and date
- Submit successfully
- New hospital appears on map

## 4. Hospital Display
- Only user hospitals are shown
- Markers display correct colour based on queue
- Popups show correct information

## 5. Reporting (Queue & Cleanliness)
- Click "Add Report" from popup
- Form opens with correct hospital details
- Submit report successfully
- Feedback message appears (higher/lower/same queue)
- Map updates correctly

## 6. Closest Hospitals
- Click "Closest Hospitals"
- 5 nearest hospitals displayed
- Popups show basic hospital info
- Map zooms to results
- Remove layer works correctly

## 7. Unknown Queue
- Click "Unknown Queue"
- Only hospitals with unknown queue displayed
- Remove layer works correctly

## 8. User Ranking
- Click "User Ranking"
- Ranking returned from API
- Correct alert displayed

## 9. Number of Reports
- After submitting reports
- Total number of reports updates correctly

## 10. Bar Chart
- Click "Queue Bar Graph"
- Chart loads correctly
- Data matches API output
- Close button works correctly

## 11. Proximity Alert
- Simulated using browser dev tools (geolocation override)
- When within ~25m for multiple readings:
  - Report form automatically opens
- Does not trigger repeatedly for same hospital

## 12. Mobile Responsiveness
- Sidebar adjusts for mobile screens
- Map resizes correctly
- No layout overflow issues
- Initial auto-zoom occurs once only

## 13. Resize Behaviour
- Switching between mobile and desktop:
  - Map adjusts to full extent
  - Layers remain visible

## 14. Dashboard (3D)
- Dashboard loads successfully
- Cesium map displays hospitals
- Clicking hospital:
  - Reports table updates
  - Cleanliness keywords update
- Keyword bubbles display correctly

## 15. API Testing
- All endpoints tested using browser/curl:
  - user_id
  - hospitalsByUser
  - insertHospital
  - insertCleanlinessQueueReport
  - closest hospitals
- All return valid responses

## 16. Error Handling
- Invalid inputs handled correctly
- Alerts shown for missing data
- No application crashes

---

## Summary

All core functionality tested and working correctly.
Application performs as expected across desktop and mobile environments.
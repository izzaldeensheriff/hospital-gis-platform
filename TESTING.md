# API Testing Checklist

## Server
- Server starts successfully on port 4480
- Root endpoint returns expected message

## CRUD API

### /user_id
- Returns valid integer user ID

### /insertHospital
- Accepts valid JSON input
- Inserts hospital into database
- Geometry correctly stored as POINT

### /insertCleanlinessQueueReport
- Accepts valid inputs
- Inserts report correctly
- Links hospital_id and queue_length_id correctly

## GeoJSON API

### /getQueueLengths
- Returns valid FeatureCollection
- Queue descriptions correct

### /hospitalsByUser/:user_id
- Returns only user hospitals
- Geometry valid
- Properties correct

### /fiveClosestHospitals/:lat/:lng
- Returns 5 hospitals
- Ordered by distance
- Valid GeoJSON

### /numCleanlinessQueueReports/:user_id
- Returns correct count

### /userCleanlinessQueueRanking/:user_id
- Returns correct ranking

### /hospitalsByQueueLength
- Returns grouped counts
- Data matches database

### /hospitalsQueueLengthUnknown/:user_id
- Returns only unknown queue hospitals

## Error Handling
- Invalid requests handled without crashing server
- API returns appropriate responses

---

## Summary
All endpoints tested and returning correct data.
GeoJSON structure valid and usable by frontend.
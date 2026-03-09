# Student Management System - Testing Guide

## 🧪 Manual Testing Checklist

### Prerequisites

Before testing, ensure:
- ✅ Development server is running (`npm run dev`)
- ✅ Database is set up with schema from `SCHEMA.sql`
- ✅ At least one course exists in the database
- ✅ At least one class exists for testing enrollment

---

## Test Suite 1: Add New Student

### Test 1.1: Basic Student Creation

**Steps:**
1. Navigate to Students page
2. Click "Add Student" button
3. Fill in required fields:
   - Index Number: `TEST001`
   - National ID: `123456789V`
   - Full Name: `Test Student One`
   - Email: `test1@example.com`
   - WhatsApp: `+94771234567`
   - District: Select any district
4. Click "Add Student"

**Expected Result:**
- ✅ Success toast appears
- ✅ Dialog closes
- ✅ Student appears in table
- ✅ Student list refreshes

**Status:** [ ]

---

### Test 1.2: Student with Course Enrollment

**Steps:**
1. Click "Add Student"
2. Fill required personal/contact info
3. Select a district
4. Select a course (should appear after district selection)
5. Select course levels (checkboxes should appear)
6. Select classes (should appear after level selection)
7. Click "Add Student"

**Expected Result:**
- ✅ Student created
- ✅ Enrollments created for selected classes
- ✅ Success toast appears

**Status:** [ ]

---

### Test 1.3: Duplicate Email Validation

**Steps:**
1. Create a student with email `duplicate@test.com`
2. Try to create another student with same email

**Expected Result:**
- ✅ Error toast: "A student with this email address already exists"
- ✅ Form remains open
- ✅ No student created

**Status:** [ ]

---

### Test 1.4: Duplicate Index Number Validation

**Steps:**
1. Create a student with index `DUP001`
2. Try to create another student with same index

**Expected Result:**
- ✅ Error toast: "A student with this index number already exists"
- ✅ Form remains open

**Status:** [ ]

---

### Test 1.5: Duplicate National ID Validation

**Steps:**
1. Create a student with NIC `987654321V`
2. Try to create another student with same NIC

**Expected Result:**
- ✅ Error toast: "A student with this national ID already exists"
- ✅ Form remains open

**Status:** [ ]

---

### Test 1.6: Required Field Validation

**Steps:**
1. Click "Add Student"
2. Leave required fields empty
3. Click "Add Student"

**Expected Result:**
- ✅ Error toast: "Please fill in all required fields"
- ✅ Form remains open

**Status:** [ ]

---

### Test 1.7: District-Course Filtering

**Steps:**
1. Click "Add Student"
2. Select District "14. Colombo"
3. Observe course dropdown

**Expected Result:**
- ✅ Only courses with classes in Colombo or "All Island" appear
- ✅ Other courses are filtered out

**Status:** [ ]

---

### Test 1.8: Course-Level Filtering

**Steps:**
1. Select a course
2. Observe levels section

**Expected Result:**
- ✅ Levels from selected course appear as checkboxes
- ✅ Each level shows name and description

**Status:** [ ]

---

### Test 1.9: Level-Class Filtering

**Steps:**
1. Select course levels
2. Observe classes section

**Expected Result:**
- ✅ Only classes matching selected course, district, and levels appear
- ✅ Only "Active" classes are shown

**Status:** [ ]

---

### Test 1.10: Cancel Button

**Steps:**
1. Click "Add Student"
2. Fill some fields
3. Click "Cancel"

**Expected Result:**
- ✅ Dialog closes
- ✅ No student created
- ✅ Form resets

**Status:** [ ]

---

## Test Suite 2: View Student

### Test 2.1: View Student Details

**Steps:**
1. Click eye icon on any student
2. Review all fields

**Expected Result:**
- ✅ Dialog opens with student data
- ✅ All fields are read-only
- ✅ Personal file URL shows as link (if present)
- ✅ "Close" button appears (not "Cancel")

**Status:** [ ]

---

### Test 2.2: View Mode - No Edit Allowed

**Steps:**
1. Open view dialog
2. Try to modify fields

**Expected Result:**
- ✅ All inputs are disabled/read-only
- ✅ No "Update" button visible
- ✅ Only "Close" button available

**Status:** [ ]

---

## Test Suite 3: Edit Student

### Test 3.1: Edit Basic Information

**Steps:**
1. Click edit icon (pencil) on a student
2. Modify name to "Updated Name"
3. Click "Update Student"

**Expected Result:**
- ✅ Success toast appears
- ✅ Dialog closes
- ✅ Table shows updated name
- ✅ Student list refreshes

**Status:** [ ]

---

### Test 3.2: Edit with Enrollment Changes

**Steps:**
1. Edit a student
2. Change selected levels
3. Change selected classes
4. Click "Update Student"

**Expected Result:**
- ✅ Student updated
- ✅ Old enrollments deleted
- ✅ New enrollments created
- ✅ Success toast appears

**Status:** [ ]

---

### Test 3.3: Edit - Duplicate Email Prevention

**Steps:**
1. Create Student A with email `a@test.com`
2. Create Student B with email `b@test.com`
3. Edit Student B and change email to `a@test.com`

**Expected Result:**
- ✅ Error toast: "Email already exists"
- ✅ Update prevented
- ✅ Form remains open

**Status:** [ ]

---

### Test 3.4: Edit - Keep Same Email

**Steps:**
1. Edit a student
2. Keep the same email
3. Update other fields
4. Click "Update Student"

**Expected Result:**
- ✅ Update succeeds (email validation excludes current student)
- ✅ No duplicate error

**Status:** [ ]

---

## Test Suite 4: Delete Student

### Test 4.1: Delete Student

**Steps:**
1. Click delete icon (trash) on a student
2. Observe confirmation dialog
3. Click "Delete"

**Expected Result:**
- ✅ Confirmation dialog shows student name
- ✅ Warning message appears
- ✅ Student deleted from database
- ✅ Enrollments cascade deleted
- ✅ Success toast appears
- ✅ Student removed from table

**Status:** [ ]

---

### Test 4.2: Cancel Delete

**Steps:**
1. Click delete icon
2. Click "Cancel" in confirmation dialog

**Expected Result:**
- ✅ Dialog closes
- ✅ Student NOT deleted
- ✅ Student remains in table

**Status:** [ ]

---

## Test Suite 5: Search Functionality

### Test 5.1: Search All Fields

**Steps:**
1. Set search type to "All Fields"
2. Enter search term matching a student name
3. Observe results

**Expected Result:**
- ✅ Only matching students appear
- ✅ Search is case-insensitive
- ✅ Pagination updates

**Status:** [ ]

---

### Test 5.2: Search by Index Number

**Steps:**
1. Set search type to "Index Number"
2. Enter an index number
3. Observe results

**Expected Result:**
- ✅ Only students with matching index appear
- ✅ Other fields are not searched

**Status:** [ ]

---

### Test 5.3: Search by Name

**Steps:**
1. Set search type to "Name"
2. Enter partial name
3. Observe results

**Expected Result:**
- ✅ Only students with matching names appear
- ✅ Partial matches work

**Status:** [ ]

---

### Test 5.4: Search by Email

**Steps:**
1. Set search type to "Email"
2. Enter email or part of email
3. Observe results

**Expected Result:**
- ✅ Only students with matching emails appear

**Status:** [ ]

---

### Test 5.5: Search by District

**Steps:**
1. Set search type to "District"
2. Enter district name
3. Observe results

**Expected Result:**
- ✅ Only students from matching district appear

**Status:** [ ]

---

## Test Suite 6: Filter Functionality

### Test 6.1: Filter by Status

**Steps:**
1. Set status filter to "Active"
2. Observe results

**Expected Result:**
- ✅ Only active students appear
- ✅ Inactive/Completed students hidden

**Status:** [ ]

---

### Test 6.2: Filter by District

**Steps:**
1. Select a specific district from filter
2. Observe results

**Expected Result:**
- ✅ Only students from selected district appear

**Status:** [ ]

---

### Test 6.3: Filter by Course

**Steps:**
1. Select a course from filter
2. Observe results

**Expected Result:**
- ✅ Only students enrolled in that course appear

**Status:** [ ]

---

### Test 6.4: Filter by Participation Type

**Steps:**
1. Select "Physical" from participation filter
2. Observe results

**Expected Result:**
- ✅ Only physical participation students appear

**Status:** [ ]

---

### Test 6.5: Filter by Theology Project

**Steps:**
1. Select "Completed" from theology filter
2. Observe results

**Expected Result:**
- ✅ Only students with completed theology project appear

**Status:** [ ]

---

### Test 6.6: Combined Filters

**Steps:**
1. Set status to "Active"
2. Set district to "14. Colombo"
3. Set participation to "Physical"
4. Observe results

**Expected Result:**
- ✅ Only students matching ALL filters appear
- ✅ Filters work in combination

**Status:** [ ]

---

### Test 6.7: Reset Filters

**Steps:**
1. Apply multiple filters
2. Enter search term
3. Click "Reset Filters"

**Expected Result:**
- ✅ All filters reset to "all"
- ✅ Search term cleared
- ✅ All students appear
- ✅ Page resets to 1

**Status:** [ ]

---

## Test Suite 7: Pagination

### Test 7.1: Change Rows Per Page

**Steps:**
1. Set rows per page to 10
2. Observe table
3. Change to 25
4. Observe table

**Expected Result:**
- ✅ Table shows correct number of rows
- ✅ Pagination controls update
- ✅ Page resets to 1

**Status:** [ ]

---

### Test 7.2: Navigate Pages

**Steps:**
1. Click "Next" button
2. Observe page number
3. Click "Previous" button
4. Click specific page number

**Expected Result:**
- ✅ Correct students displayed for each page
- ✅ Page number updates
- ✅ Previous/Next buttons enable/disable correctly

**Status:** [ ]

---

### Test 7.3: Pagination with Filters

**Steps:**
1. Apply filter that reduces results
2. Observe pagination

**Expected Result:**
- ✅ Total pages recalculated
- ✅ Page numbers update
- ✅ Current page adjusts if necessary

**Status:** [ ]

---

## Test Suite 8: Export Functionality

### Test 8.1: Export All Students

**Steps:**
1. Clear all filters
2. Click "Export" button
3. Check downloaded CSV file

**Expected Result:**
- ✅ CSV file downloads
- ✅ Filename includes date
- ✅ All students included
- ✅ All columns present
- ✅ Data properly formatted

**Status:** [ ]

---

### Test 8.2: Export Filtered Students

**Steps:**
1. Apply filters to reduce results
2. Click "Export"
3. Check CSV file

**Expected Result:**
- ✅ Only filtered students in CSV
- ✅ File downloads successfully

**Status:** [ ]

---

## Test Suite 9: Responsive Design

### Test 9.1: Mobile View (< 768px)

**Steps:**
1. Resize browser to mobile width
2. Navigate Students page
3. Try all operations

**Expected Result:**
- ✅ Table scrolls horizontally
- ✅ Filters stack vertically
- ✅ Dialogs fit screen
- ✅ Form fields stack in single column
- ✅ Buttons remain accessible

**Status:** [ ]

---

### Test 9.2: Tablet View (768px - 1024px)

**Steps:**
1. Resize to tablet width
2. Test all features

**Expected Result:**
- ✅ Form shows 2 columns
- ✅ Table visible without scroll
- ✅ Filters partially stacked

**Status:** [ ]

---

### Test 9.3: Desktop View (> 1024px)

**Steps:**
1. View on desktop width
2. Test all features

**Expected Result:**
- ✅ Full layout visible
- ✅ All filters in one row
- ✅ Form in 2 columns
- ✅ Table fully visible

**Status:** [ ]

---

## Test Suite 10: Error Handling

### Test 10.1: Network Error

**Steps:**
1. Disconnect internet
2. Try to add student

**Expected Result:**
- ✅ Error toast with network message
- ✅ Form remains open
- ✅ No data corruption

**Status:** [ ]

---

### Test 10.2: Database Constraint Violation

**Steps:**
1. Manually trigger constraint violation
2. Observe error handling

**Expected Result:**
- ✅ User-friendly error message
- ✅ No technical jargon exposed
- ✅ Form remains usable

**Status:** [ ]

---

## Test Suite 11: Performance

### Test 11.1: Large Dataset (100+ students)

**Steps:**
1. Add 100+ students to database
2. Navigate to Students page
3. Test search and filters

**Expected Result:**
- ✅ Page loads quickly (< 2 seconds)
- ✅ Search is responsive
- ✅ Filters apply quickly
- ✅ No lag in UI

**Status:** [ ]

---

### Test 11.2: Rapid Filter Changes

**Steps:**
1. Quickly change multiple filters
2. Observe performance

**Expected Result:**
- ✅ No lag or freezing
- ✅ Results update smoothly
- ✅ useMemo prevents unnecessary recalculations

**Status:** [ ]

---

## Test Suite 12: Data Integrity

### Test 12.1: Cascade Delete

**Steps:**
1. Create student with enrollments
2. Delete student
3. Check enrollments table

**Expected Result:**
- ✅ Student deleted
- ✅ All enrollments deleted
- ✅ No orphaned records

**Status:** [ ]

---

### Test 12.2: Enrollment Update

**Steps:**
1. Create student with 2 class enrollments
2. Edit student and change to 3 different classes
3. Check database

**Expected Result:**
- ✅ Old 2 enrollments deleted
- ✅ New 3 enrollments created
- ✅ No duplicate enrollments

**Status:** [ ]

---

## Test Suite 13: Edge Cases

### Test 13.1: Empty State

**Steps:**
1. Delete all students
2. View Students page

**Expected Result:**
- ✅ "No students found" message appears
- ✅ No errors
- ✅ Add button still works

**Status:** [ ]

---

### Test 13.2: No Courses Available

**Steps:**
1. Delete all courses
2. Try to add student

**Expected Result:**
- ✅ Message: "No courses available"
- ✅ Form still functional for personal info
- ✅ No errors

**Status:** [ ]

---

### Test 13.3: No Classes Available

**Steps:**
1. Select course with no active classes
2. Select levels

**Expected Result:**
- ✅ Message: "No active classes available"
- ✅ Can still save student without classes
- ✅ No errors

**Status:** [ ]

---

### Test 13.4: Special Characters in Input

**Steps:**
1. Enter special characters in name: `O'Brien-Smith`
2. Enter email with plus: `test+tag@example.com`
3. Save student

**Expected Result:**
- ✅ Special characters saved correctly
- ✅ No SQL injection
- ✅ Data retrieved correctly

**Status:** [ ]

---

### Test 13.5: Very Long Input

**Steps:**
1. Enter very long name (200+ characters)
2. Enter very long address
3. Try to save

**Expected Result:**
- ✅ Database handles long text
- ✅ UI doesn't break
- ✅ Data truncated if necessary

**Status:** [ ]

---

## Test Results Summary

| Test Suite | Total Tests | Passed | Failed | Skipped |
|------------|-------------|--------|--------|---------|
| Add Student | 10 | | | |
| View Student | 2 | | | |
| Edit Student | 4 | | | |
| Delete Student | 2 | | | |
| Search | 5 | | | |
| Filter | 7 | | | |
| Pagination | 3 | | | |
| Export | 2 | | | |
| Responsive | 3 | | | |
| Error Handling | 2 | | | |
| Performance | 2 | | | |
| Data Integrity | 2 | | | |
| Edge Cases | 5 | | | |
| **TOTAL** | **49** | | | |

---

## Automated Testing (Future)

### Recommended Test Framework

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Sample Test Cases

```typescript
// Example: Test student creation
describe('AddStudentForm', () => {
  it('should create student with valid data', async () => {
    // Test implementation
  });

  it('should show error for duplicate email', async () => {
    // Test implementation
  });
});
```

---

## Bug Report Template

```markdown
**Bug Title:** [Short description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots:**


**Environment:**
- Browser: 
- OS: 
- Screen Size: 

**Additional Notes:**

```

---

**Testing Guide Version**: 1.0  
**Last Updated**: February 14, 2026  
**Total Test Cases**: 49  
**Estimated Testing Time**: 2-3 hours

# Phase 4: Development — Single User ID Consolidation

**Project:** OHC-AHC Single User ID Consolidation
**Date:** 2026-05-16
**Status:** Complete

---

## Progress Bar

```
[████████████████████████████████] Phase 1: Planning (Complete)
[████████████████████████████████] Phase 2: Requirements (Complete)
[████████████████████████████████] Phase 3: Design (Complete)
[████████████████████████████████] Phase 4: Development (Complete)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Implementation Summary

### Code Changes

#### 1. BaseModel Update
**File:** `myproject/myproject/common_models.py`

```python
class BaseModel(models.Model):
    # REMOVED: uuid field - consolidating to single id (Django default)
    # uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

**Status:** ✅ Complete

---

### Migration Files Created

| App | Migration File | Tables Affected | UUID Column Removed |
|-----|---------------|----------------|-------------------|
| accounts | `0005_remove_uuid_from_profiles.py` | accounts_employeeprofile, accounts_doctorprofile | ✅ |
| ohc | `0002_remove_uuid_from_ohc.py` | ohc_diagnosis, ohc_ohcvisit, ohc_prescription, ohc_medicaltest | ✅ |
| ahc | `0002_remove_uuid_from_ahc.py` | ahc_hospital, ahc_referral, ahc_medicalreport | ✅ |
| payments | `0002_remove_uuid_from_payments.py` | payments_invoice, payments_payment | ✅ |
| reports | `0002_remove_uuid_from_reports.py` | reports_auditlog, reports_notification | ✅ |

**Total Tables Modified:** 11 tables

---

### Files Modified/Created

| File | Type | Status |
|------|------|--------|
| `myproject/myproject/common_models.py` | Modified | ✅ |
| `myproject/accounts/migrations/0005_remove_uuid_from_profiles.py` | Created | ✅ |
| `myproject/ohc/migrations/0002_remove_uuid_from_ohc.py` | Created | ✅ |
| `myproject/ahc/migrations/0002_remove_uuid_from_ahc.py` | Created | ✅ |
| `myproject/payments/migrations/0002_remove_uuid_from_payments.py` | Created | ✅ |
| `myproject/reports/migrations/0002_remove_uuid_from_reports.py` | Created | ✅ |

---

## API Changes

### v2 API Response Format

**Before (v1):**
```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "employee_code": "EMP001",
  ...
}
```

**After (v2):**
```json
{
  "id": 1,
  "employee_code": "EMP001",
  ...
}
```

**Changes:**
- ❌ Removed: `uuid` field from all API responses
- ✅ Kept: `id` as the single source of truth
- ✅ Kept: `employee_code` for display purposes

---

## Database Migration Plan

### Prerequisites
1. All development changes committed
2. Staging environment available
3. Production backup created before migration

### Migration Steps

#### Step 1: Staging Deployment
```bash
# Pull latest changes
git pull origin main

# Check for pending migrations
python manage.py showmigrations

# Run migrations on staging
python manage.py migrate

# Verify database schema
python manage.py dbshell
```

#### Step 2: Testing on Staging
- Test all API endpoints
- Verify data integrity
- Check foreign key relationships
- Run test suite

#### Step 3: Production Migration
```bash
# Create backup
pg_dump -d ohc_ahc_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Deploy code changes
git pull origin main

# Run migrations
python manage.py migrate

# Verify
python manage.py check --deploy
```

---

## Rollback Plan

### If Migration Fails

#### Option 1: Code Rollback
```bash
git revert <commit-hash>
git push origin main
```

#### Option 2: Database Rollback
```bash
python manage.py migrate <app_name> <previous_migration_number>
```

#### Option 3: Restore from Backup
```bash
pg_restore -d ohc_ahc_production backup_file.sql
```

---

## Known Limitations

1. **AuditLog.target_object_uuid** - This field references object UUIDs. After migration, it may need to be updated to reference object IDs instead.

2. **Notification.related_object_uuid** - Similar to AuditLog, this field references object UUIDs and may need updates.

3. **Frontend Compatibility** - Frontend code needs to be updated to remove UUID references and use only ID.

---

## Next Steps (Phase 5)

1. Write unit tests for all affected models
2. Write integration tests for API endpoints
3. Test migration rollback procedures
4. Verify foreign key constraints
5. Generate test coverage report

---

## Developer Notes

- All models now inherit from `BaseModel` without the `uuid` field
- The `id` field (Django's default AutoField) is the single source of truth
- Serializers using `fields = "__all__"` will automatically exclude `uuid`
- Foreign key relationships remain intact, now referencing `id` instead of `uuid`

---

**Phase 4 completed on:** 2026-05-16
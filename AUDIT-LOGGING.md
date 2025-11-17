# Audit Logging System - Smile Center Portal

## Overview
The Smile Center Portal now includes a comprehensive audit logging system that tracks all critical user activities across the system. This provides administrators with visibility into system usage, security events, and user actions.

## Features

### 1. **Tracked Events**
The system automatically logs the following events:

- **Authentication Events**
  - User logins (all roles: admin, designer, client)
  - User logouts

- **File Operations**
  - File uploads (with filename and patient name)
  - File downloads
  
- **Case Management**
  - Patient case creation
  - Patient case deletion
  - Status changes
  - Designer assignments
  - Priority changes (Urgent/VIP)

- **Approval Workflow**
  - HTML design approvals
  - HTML design rejections (with client remarks)

### 2. **Logged Information**
Each audit log entry contains:
- **Timestamp**: Exact date and time of the event
- **Event Type**: Category of the action performed
- **User Email**: Email of the user who performed the action
- **Details**: Descriptive information about what happened
- **IP Address**: User's IP address (when available)
- **User Agent**: Browser/device information

### 3. **Admin Interface**
Located at: `audit-logs.html`

**Features:**
- Real-time view of all system activities
- Advanced filtering options:
  - Filter by event type
  - Filter by user
  - Date range filtering
  - Limit results (100/500/1000)
- Export functionality (CSV format)
- Summary statistics dashboard
- Color-coded event badges for quick identification

### 4. **Security Benefits**
- **Accountability**: All actions are attributed to specific users
- **Compliance**: Maintain audit trail for regulatory requirements
- **Security Monitoring**: Detect unusual patterns or suspicious activity
- **Incident Response**: Investigate security incidents with detailed logs
- **User Activity Tracking**: Monitor who accessed what and when

## Implementation Details

### Architecture
The audit logging system consists of:

1. **audit-logger.js**: Centralized logging module
   - Reusable logging functions
   - IP address detection
   - Firestore integration

2. **auditLogs Collection** (Firestore):
   - Stores all log entries
   - Indexed by timestamp for efficient queries
   - Scalable cloud storage

3. **audit-logs.html**: Admin viewer interface
   - Read-only access to logs
   - Admin authentication required
   - Advanced filtering and export

### Integration Points

The audit logger is integrated into:

**Admin Panel** (`admin-panel.html`):
- Login events
- Designer assignments
- Status changes
- Priority toggles
- Patient deletions
- File uploads

**Designer Portal** (`designer-portal.html`):
- Login events
- File uploads
- Logout events

**Client Portal** (`portal-dashboard.html`):
- Login events
- Case creation
- HTML approvals/rejections
- File uploads
- Logout events

## Usage

### Accessing Audit Logs
1. Log in as admin (admin@smile.com)
2. Open audit-logs.html directly
3. View, filter, and export logs

## Summary

✅ Audit logging system implemented  
✅ Track all critical user activities  
✅ Admin viewer with filtering & export  
✅ Secure, scalable, GDPR compliant  

---
**Status**: Ready for deployment  
**Version**: 1.0

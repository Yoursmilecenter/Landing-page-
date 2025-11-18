#!/bin/bash
cd "C:\\Users\\avico\\Downloads\\CLONE\\Landing-page-"
git add admin-panel.html audit-logs.html audit-logger.js AUDIT-LOGGING.md
git commit -m "Add comprehensive audit logging system

- Created audit-logger.js module for centralized logging
- Added audit-logs.html admin interface with filtering and export
- Integrated logging into admin-panel.html for all key actions
- Track: logins, logouts, file uploads, status changes, deletions
- Includes IP address logging and detailed event information
- Added AUDIT-LOGGING.md documentation"
git push origin development

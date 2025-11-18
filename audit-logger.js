// audit-logger.js - Centralized audit logging for Smile Center Portal
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let db = null;

// Initialize the audit logger with Firestore instance
export function initAuditLogger(firestoreInstance) {
    db = firestoreInstance;
}

// Get user's IP address (best effort)
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return null;
    }
}

// Log an audit event
export async function logAuditEvent(eventType, userEmail, details = null) {
    if (!db) {
        console.error('Audit logger not initialized');
        return;
    }

    try {
        const ipAddress = await getUserIP();
        
        await addDoc(collection(db, 'auditLogs'), {
            eventType,
            userEmail,
            details,
            ipAddress,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
}

// Convenience functions for specific events
export const AuditLogger = {
    login: (userEmail) => logAuditEvent('login', userEmail, 'User logged in'),
    
    logout: (userEmail) => logAuditEvent('logout', userEmail, 'User logged out'),
    
    fileUpload: (userEmail, fileName, patientName) => 
        logAuditEvent('file-upload', userEmail, `Uploaded file "${fileName}" to patient "${patientName}"`),
    
    fileDownload: (userEmail, fileName, patientName) => 
        logAuditEvent('file-download', userEmail, `Downloaded file "${fileName}" from patient "${patientName}"`),
    
    statusChange: (userEmail, patientName, oldStatus, newStatus) => 
        logAuditEvent('status-change', userEmail, `Changed patient "${patientName}" status from "${oldStatus}" to "${newStatus}"`),
    
    htmlApproval: (userEmail, patientName) => 
        logAuditEvent('html-approval', userEmail, `Approved HTML design for patient "${patientName}"`),
    
    htmlRejection: (userEmail, patientName, remarks) => 
        logAuditEvent('html-rejection', userEmail, `Rejected HTML for patient "${patientName}" - Remarks: "${remarks}"`),
    
    caseCreated: (userEmail, patientName) => 
        logAuditEvent('case-created', userEmail, `Created new patient case "${patientName}"`),
    
    caseDeleted: (userEmail, patientName) => 
        logAuditEvent('case-deleted', userEmail, `Deleted patient case "${patientName}"`),
    
    designerAssigned: (adminEmail, patientName, designerEmail) => 
        logAuditEvent('status-change', adminEmail, `Assigned designer "${designerEmail}" to patient "${patientName}"`),
    
    priorityChange: (adminEmail, patientName, priorityType, enabled) => 
        logAuditEvent('status-change', adminEmail, `${enabled ? 'Enabled' : 'Disabled'} ${priorityType} priority for patient "${patientName}"`)
};

export default AuditLogger;

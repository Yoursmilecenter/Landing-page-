// Shared translations for all portal pages
window.portalTranslations = {
    en: {
        // Common
        logout: 'Logout',
        login: 'Login',
        english: 'English',
        hebrew: 'עברית',
        
        // Admin Panel
        adminPanel: 'Admin Panel',
        managePatients: 'Manage all patients and assignments',
        auditLogs: 'Audit Logs',
        inviteClient: 'Invite Client',
        addClient: 'Add Client',
        
        // Stats
        total: 'Total',
        pending: 'Pending',
        inProgress: 'In Progress',
        completed: 'Completed',
        vip: 'VIP',
        urgent: 'Urgent',
        
        // Table Headers
        patient: 'Patient',
        client: 'Client',
        designer: 'Designer',
        status: 'Status',
        priority: 'Priority',
        files: 'Files',
        date: 'Date',
        actions: 'Actions',
        
        // Filters
        allStatus: 'All Status',
        allDesigners: 'All Designers',
        unassigned: 'Unassigned',
        allClients: 'All Clients',
        allPriorities: 'All Priorities',
        vipOnly: '⭐ VIP Only',
        normalOnly: 'Normal Only',
        urgentOnly: '⚡ Urgent Only',
        
        // Sorting
        dateNewest: 'Date (Newest)',
        dateOldest: 'Date (Oldest)',
        nameAZ: 'Name (A-Z)',
        nameZA: 'Name (Z-A)',
        clientAZ: 'Client (A-Z)',
        
        // Pagination
        showing: 'Showing',
        of: 'of',
        perPage: 'per page',
        page: 'Page',
        previous: 'Previous',
        next: 'Next',
        
        // Messages
        noPatients: 'No patients found',
        
        // Designer Portal
        designerPanel: 'Designer Panel',
        myCases: 'My assigned cases',
        
        // Client Dashboard  
        myProjects: 'My Projects',
        doctorPortal: 'Doctor portal',
        npTitle: 'New patient',
        npSubtitle: 'Create a patient and optionally add scan files',
        npSecPatient: 'Patient details',
        npName: 'Patient name (required)',
        npDesc: 'Description (required)',
        npDue: 'Due date (optional)',
        npSecFiles: 'Scan files (optional)',
        npDrop: 'Drop files here or choose files',
        npDropHelp: 'Attach scans while opening the patient',
        npBrowse: 'Browse files',
        npAddMore: 'Add more files',
        npCancel: 'Cancel',
        npSubmit: 'Create patient',
        npClose: 'Close',
        npRemoveFile: 'Remove file',
        npFilesSelected: 'file(s) will be uploaded with the patient',
        npRequired: 'Please fill in the patient name and description.',
        npPartialFail: 'The patient was created, but some files were not uploaded. Try again to upload the remaining files.',
        doctorAccount: 'Doctor account',
        myProjectsSubtitle: 'Manage patient design requests and files',
        patientProjects: 'Patient projects',
        noProjectsFound: 'No projects found',
        uploadFile: 'Upload file',
        downloadStl: 'Download STL',
        mainNavigation: 'Main navigation',
        moreOptions: 'More options',
        viewProjects: 'View and manage your dental design projects',
        totalPatients: 'Total Patients',
        awaitingApproval: 'Awaiting Approval',
        stlReady: 'STL Ready',
        totalFiles: 'Total Files',
        newPatient: 'New Patient',
        searchPatients: 'Search patients by name, status, or date',
        description: 'Description',
        view: 'View',
        upload: 'Upload',
        noPatientsYet: 'No Patients Yet',
        patientsAppearHere: 'Your patients will appear here once they are created',
        delete: 'Delete',
        deleteThisPatient: 'Delete this patient?',
        deleteFailed: 'Delete failed',
        couldNotDelete: 'Could not delete.',

        // New Patient modal
        createNewPatient: 'Create New Patient',
        patientName: 'Patient Name',
        enterPatientName: 'Enter patient name',
        enterPatientDescription: 'Enter patient description',
        uploadFilesOptional: 'Upload Files (Optional)',
        dragDropFiles: 'Drag & drop files here',
        orClickBrowse: 'or click to browse',
        createPatient: 'Create Patient',
        uploadFilesToPatient: 'Upload Files to Patient',
        uploadFiles: 'Upload Files',
        uploading: 'Uploading...',
        startingUpload: 'Starting upload...',
        selectAtLeastOneFile: 'Please select at least one file.',
        filesUploadedSuccess: 'Files uploaded successfully!',
        patientCreatedUploading: 'Patient created! Uploading files...',
        patientCreatedSuccess: 'Patient created successfully!',
        errorPrefix: 'Error: ',

        // Status translations
        statusPending: 'PENDING',
        statusInProgress: 'IN PROGRESS',
        statusAwaitingApproval: 'AWAITING CLIENT APPROVAL',
        statusApproved: 'APPROVED',
        statusChangesRequested: 'CHANGES REQUESTED',
        statusStlReady: 'STL READY',
        statusCompleted: 'COMPLETED',
        statusCanceled: 'CANCELED'
    },
    he: {
        // Common
        logout: 'התנתק',
        login: 'כניסה',
        english: 'English',
        hebrew: 'עברית',
        
        // Admin Panel
        adminPanel: 'פאנל מנהל',
        managePatients: 'ניהול מטופלים ושיבוצים',
        auditLogs: 'יומן ביקורת',
        inviteClient: 'הזמן לקוח',
        addClient: 'הוסף לקוח',
        
        // Stats
        total: 'סה"כ',
        pending: 'ממתין',
        inProgress: 'בביצוע',
        completed: 'הושלם',
        vip: 'VIP',
        
        // Table Headers
        patient: 'מטופל',
        client: 'לקוח',
        designer: 'מעצב',
        status: 'סטטוס',
        priority: 'עדיפות',
        files: 'קבצים',
        date: 'תאריך',
        actions: 'פעולות',
        
        // Filters
        allStatus: 'כל הסטטוסים',
        allDesigners: 'כל המעצבים',
        unassigned: 'ללא שיבוץ',
        allClients: 'כל הלקוחות',
        allPriorities: 'כל העדיפויות',
        vipOnly: '⭐ VIP בלבד',
        normalOnly: 'רגיל בלבד',
        
        // Sorting
        dateNewest: 'תאריך (חדש)',
        dateOldest: 'תאריך (ישן)',
        nameAZ: 'שם (א-ת)',
        nameZA: 'שם (ת-א)',
        clientAZ: 'לקוח (א-ת)',
        
        // Pagination
        showing: 'מציג',
        of: 'מתוך',
        perPage: 'בעמוד',
        page: 'עמוד',
        previous: 'הקודם',
        next: 'הבא',
        
        // Messages
        noPatients: 'לא נמצאו מטופלים',
        
        // Designer Portal
        designerPanel: 'פאנל מעצב',
        myCases: 'המקרים שלי',
        
        // Common
        logout: 'התנתק',
        login: 'כניסה',
        english: 'English',
        hebrew: 'עברית',
        
        // Admin Panel
        adminPanel: 'פאנל מנהל',
        managePatients: 'ניהול מטופלים ושיבוצים',
        auditLogs: 'יומן ביקורת',
        inviteClient: 'הזמן לקוח',
        addClient: 'הוסף לקוח',
        
        // Stats
        total: 'סה"כ',
        pending: 'ממתין',
        inProgress: 'בביצוע',
        completed: 'הושלם',
        vip: 'VIP',
        urgent: 'דחוף',
        
        // Table Headers
        patient: 'מטופל',
        client: 'לקוח',
        designer: 'מעצב',
        status: 'סטטוס',
        priority: 'עדיפות',
        files: 'קבצים',
        date: 'תאריך',
        actions: 'פעולות',
        
        // Filters
        allStatus: 'כל הסטטוסים',
        allDesigners: 'כל המעצבים',
        unassigned: 'ללא שיבוץ',
        allClients: 'כל הלקוחות',
        allPriorities: 'כל העדיפויות',
        vipOnly: '⭐ VIP בלבד',
        normalOnly: 'רגיל בלבד',
        urgentOnly: '⚡ דחוף בלבד',
        
        // Sorting
        dateNewest: 'תאריך (חדש)',
        dateOldest: 'תאריך (ישן)',
        nameAZ: 'שם (א-ת)',
        nameZA: 'שם (ת-א)',
        clientAZ: 'לקוח (א-ת)',
        
        // Pagination
        showing: 'מציג',
        of: 'מתוך',
        perPage: 'בעמוד',
        page: 'עמוד',
        previous: 'הקודם',
        next: 'הבא',
        
        // Messages
        noPatients: 'לא נמצאו מטופלים',
        
        // Designer Portal
        designerPanel: 'פאנל מעצב',
        myCases: 'המקרים שלי',
        
        // Client Dashboard
        myProjects: 'הפרויקטים שלי',
        doctorPortal: 'אזור רופאים',
        npTitle: 'מטופל חדש',
        npSubtitle: 'יצירת מטופל עם אפשרות לצירוף קובצי סריקה',
        npSecPatient: 'פרטי המטופל',
        npName: 'שם המטופל (חובה)',
        npDesc: 'תיאור (חובה)',
        npDue: 'תאריך יעד (אופציונלי)',
        npSecFiles: 'קובצי סריקה (אופציונלי)',
        npDrop: 'גרירת קבצים לכאן או בחירת קבצים',
        npDropHelp: 'צירוף סריקות בזמן פתיחת המטופל',
        npBrowse: 'בחירת קבצים',
        npAddMore: 'הוספת קבצים נוספים',
        npCancel: 'ביטול',
        npSubmit: 'יצירת מטופל',
        npClose: 'סגירה',
        npRemoveFile: 'הסרת קובץ',
        npFilesSelected: 'קבצים יועלו יחד עם המטופל',
        npRequired: 'נא למלא שם מטופל ותיאור.',
        npPartialFail: 'המטופל נוצר, אך חלק מהקבצים לא הועלו. נסה שוב להעלאת הקבצים שנותרו.',
        doctorAccount: 'חשבון רופא',
        myProjectsSubtitle: 'ניהול בקשות העיצוב והקבצים של המטופלים',
        patientProjects: 'פרויקטים של מטופלים',
        noProjectsFound: 'לא נמצאו פרויקטים',
        uploadFile: 'העלאת קובץ',
        downloadStl: 'הורדת STL',
        mainNavigation: 'ניווט ראשי',
        moreOptions: 'אפשרויות נוספות',
        viewProjects: 'צפה ונהל את פרויקטי העיצוב השיניים שלך',
        totalPatients: 'סה"כ מטופלים',
        awaitingApproval: 'ממתין לאישור',
        stlReady: 'STL מוכן',
        totalFiles: 'סה"כ קבצים',
        newPatient: 'מטופל חדש',
        searchPatients: 'חפש מטופלים לפי שם, סטטוס או תאריך',
        description: 'תיאור',
        view: 'צפה',
        upload: 'העלה',
        noPatientsYet: 'אין מטופלים עדיין',
        patientsAppearHere: 'המטופלים שלך יופיעו כאן לאחר יצירתם',
        delete: 'מחק',
        deleteThisPatient: 'למחוק את המטופל?',
        deleteFailed: 'המחיקה נכשלה',
        couldNotDelete: 'לא ניתן היה למחוק.',

        // New Patient modal
        createNewPatient: 'יצירת מטופל חדש',
        patientName: 'שם המטופל',
        enterPatientName: 'הזן שם מטופל',
        enterPatientDescription: 'הזן תיאור מטופל',
        uploadFilesOptional: 'העלאת קבצים (אופציונלי)',
        dragDropFiles: 'גרור ושחרר קבצים כאן',
        orClickBrowse: 'או לחץ לבחירה',
        createPatient: 'צור מטופל',
        uploadFilesToPatient: 'העלאת קבצים למטופל',
        uploadFiles: 'העלה קבצים',
        uploading: 'מעלה...',
        startingUpload: 'מתחיל העלאה...',
        selectAtLeastOneFile: 'נא לבחור לפחות קובץ אחד.',
        filesUploadedSuccess: 'הקבצים הועלו בהצלחה!',
        patientCreatedUploading: 'המטופל נוצר! מעלה קבצים...',
        patientCreatedSuccess: 'המטופל נוצר בהצלחה!',
        errorPrefix: 'שגיאה: ',

        // Status translations
        statusPending: 'ממתין',
        statusInProgress: 'בביצוע',
        statusAwaitingApproval: 'ממתין לאישור לקוח',
        statusApproved: 'אושר',
        statusChangesRequested: 'נדרשים שינויים',
        statusStlReady: 'STL מוכן',
        statusCompleted: 'הושלם',
        statusCanceled: 'בוטל'
    }
};

// Translation helper
window.t = function(key) {
    const lang = localStorage.getItem('lang') || 'en';
    return window.portalTranslations[lang][key] || key;
};

// Language switcher
window.switchLang = function(lang) {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    localStorage.setItem('lang', lang);
    
    // Close menu
    const menu = document.getElementById('langMenu');
    if (menu) menu.classList.remove('active');
    
    // Reload page to apply language
    window.location.reload();
};

// Toggle language menu
window.toggleLangMenu = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('langMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
};

// Close menu when clicking outside
document.addEventListener('click', function() {
    const menu = document.getElementById('langMenu');
    if (menu) menu.classList.remove('active');
});

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('lang') || 'en';
    const html = document.documentElement;
    html.setAttribute('lang', savedLang);
    html.setAttribute('dir', savedLang === 'he' ? 'rtl' : 'ltr');
});
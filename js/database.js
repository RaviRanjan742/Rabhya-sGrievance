// Database operations using localStorage
class GrievanceDB {
    constructor() {
        this.init();
    }

    // Initialize database
    init() {
        if (!localStorage.getItem('grievances')) {
            localStorage.setItem('grievances', JSON.stringify([]));
        }
        if (!localStorage.getItem('users')) {
            // In a real app, passwords would be hashed
            const users = [{
                username: 'rani',
                password: 'rani123',
                name: 'Rani'
            }];
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    // User authentication
    authenticateUser(username, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => 
            user.username.toLowerCase() === username.toLowerCase() && 
            user.password === password
        );
    }

    // Save grievance
    saveGrievance(grievanceData) {
        const grievances = this.getAllGrievances();
        const grievance = {
            id: Date.now(),
            ...grievanceData,
            timestamp: new Date().toLocaleString(),
            status: 'pending'
        };
        
        grievances.push(grievance);
        localStorage.setItem('grievances', JSON.stringify(grievances));
        return grievance;
    }

    // Get all grievances
    getAllGrievances() {
        return JSON.parse(localStorage.getItem('grievances') || '[]');
    }

    // Get grievance by ID
    getGrievanceById(id) {
        const grievances = this.getAllGrievances();
        return grievances.find(grievance => grievance.id === id);
    }

    // Update grievance status
    updateGrievanceStatus(id, status) {
        const grievances = this.getAllGrievances();
        const grievanceIndex = grievances.findIndex(grievance => grievance.id === id);
        
        if (grievanceIndex !== -1) {
            grievances[grievanceIndex].status = status;
            grievances[grievanceIndex].updatedAt = new Date().toLocaleString();
            localStorage.setItem('grievances', JSON.stringify(grievances));
            return grievances[grievanceIndex];
        }
        return null;
    }

    // Delete grievance
    deleteGrievance(id) {
        const grievances = this.getAllGrievances();
        const filteredGrievances = grievances.filter(grievance => grievance.id !== id);
        localStorage.setItem('grievances', JSON.stringify(filteredGrievances));
        return true;
    }

    // Clear all grievances
    clearAllGrievances() {
        localStorage.setItem('grievances', JSON.stringify([]));
        return true;
    }

    // Get grievances by status
    getGrievancesByStatus(status) {
        const grievances = this.getAllGrievances();
        return grievances.filter(grievance => grievance.status === status);
    }

    // Get grievances count
    getGrievancesCount() {
        return this.getAllGrievances().length;
    }

    // Export grievances (for backup)
    exportGrievances() {
        const grievances = this.getAllGrievances();
        const dataStr = JSON.stringify(grievances, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `grievances_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize database instance
const db = new GrievanceDB();
// Main application logic
class GrievancePortal {
    constructor() {
        this.currentUser = null;
        this.selectedMood = '';
        this.init();
    }

    init() {
        // Initialize app when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Add any additional event listeners here if needed
        console.log('Grievance Portal initialized');
    }

    // Navigation between pages
    goToPage(pageNum) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(`page${pageNum}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Add background class to body for full screen background on pages 3 and 4
        document.body.classList.remove('page3-active', 'page4-active');
        
        if (pageNum === 3) {
            document.body.classList.add('page3-active');
        } else if (pageNum === 4) {
            document.body.classList.add('page4-active');
        }
        
        // Clear any error messages
        this.clearErrorMessages();
    }

    // Clear error messages
    clearErrorMessages() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.classList.add('hidden');
        });
    }

    // Handle login
    handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Simple authentication - you can modify this
        if (username && password) {
            // Create a simple user object
            this.currentUser = { username: username, name: username };
            this.goToPage(3);
            this.clearLoginForm();
            console.log(`User ${username} logged in successfully`);
        } else {
            // Show error
            const errorElement = document.getElementById('loginError');
            if (errorElement) {
                errorElement.classList.remove('hidden');
            }
        }
    }

    // Clear login form
    clearLoginForm() {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    // Handle emoji selection
    selectEmoji(element) {
        // Remove selection from all emojis
        document.querySelectorAll('.emoji-option').forEach(emoji => {
            emoji.classList.remove('selected');
        });
        
        // Add selection to clicked emoji
        element.classList.add('selected');
        this.selectedMood = element.dataset.emoji;
    }

    // Handle grievance submission
    handleGrievance(event) {
        event.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const complaint = document.getElementById('complaint').value.trim();
        const severity = document.getElementById('severity').value;
        
        // Validate required fields
        if (!title || !complaint || !severity) {
            alert('Please fill in all required fields');
            return;
        }

        // Create grievance object
        const grievanceData = {
            id: Date.now(),
            title: title,
            complaint: complaint,
            mood: this.selectedMood || '😐',
            severity: severity,
            submittedBy: this.currentUser ? this.currentUser.username : 'anonymous',
            timestamp: new Date().toLocaleString(),
            status: 'pending'
        };
        
        // Save to localStorage (simple storage solution)
        this.saveGrievance(grievanceData);
        console.log('Grievance saved:', grievanceData);
        
        // Clear form
        this.clearGrievanceForm();
        
        // Go to thank you page
        this.goToPage(4);
    }

    // Save grievance to localStorage
    saveGrievance(grievanceData) {
        let grievances = JSON.parse(localStorage.getItem('grievances') || '[]');
        grievances.push(grievanceData);
        localStorage.setItem('grievances', JSON.stringify(grievances));
    }

    // Get all grievances from localStorage
    getAllGrievances() {
        return JSON.parse(localStorage.getItem('grievances') || '[]');
    }

    // Clear grievance form
    clearGrievanceForm() {
        document.getElementById('title').value = '';
        document.getElementById('complaint').value = '';
        document.getElementById('severity').value = '';
        
        // Clear emoji selection
        document.querySelectorAll('.emoji-option').forEach(emoji => {
            emoji.classList.remove('selected');
        });
        this.selectedMood = '';
    }

    // Show all grievances
    showGrievances() {
        const grievances = this.getAllGrievances();
        const grievancesList = document.getElementById('grievancesList');
        
        if (!grievancesList) return;
        
        if (grievances.length === 0) {
            grievancesList.innerHTML = '<p style="text-align: center; color: #718096;">No grievances submitted yet!</p>';
        } else {
            grievancesList.innerHTML = grievances.map(grievance => this.createGrievanceHTML(grievance))
                .reverse()
                .join('');
        }
        
        // Hide all pages and show grievances page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('grievancesPage').classList.add('active');
        
        // Remove background classes from body
        document.body.classList.remove('page3-active', 'page4-active');
    }

    // Create HTML for a single grievance
    createGrievanceHTML(grievance) {
        return `
            <div class="grievance-item" data-id="${grievance.id}">
                <div class="grievance-title">${this.escapeHtml(grievance.title)}</div>
                <div class="grievance-content">${this.escapeHtml(grievance.complaint)}</div>
                <div class="grievance-meta">
                    <span>${grievance.mood} | Solution: ${this.escapeHtml(grievance.severity)}</span>
                    <span>${grievance.timestamp}</span>
                </div>
            </div>
        `;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Clear all grievances
    clearGrievances() {
        if (confirm('Are you sure you want to clear all grievances? This action cannot be undone.')) {
            localStorage.removeItem('grievances');
            this.showGrievances();
            console.log('All grievances cleared');
        }
    }
}

// Initialize the application
const app = new GrievancePortal();

// Global functions for HTML onclick events
function goToPage(pageNum) {
    app.goToPage(pageNum);
}

function handleLogin(event) {
    app.handleLogin(event);
}

function selectEmoji(element) {
    app.selectEmoji(element);
}

function handleGrievance(event) {
    app.handleGrievance(event);
}

function showGrievances() {
    app.showGrievances();
}

function clearGrievances() {
    app.clearGrievances();
}

// Console commands for debugging
window.grievanceApp = app;
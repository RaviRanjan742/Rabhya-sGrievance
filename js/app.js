// Main application logic
class GrievancePortal {
    constructor() {
        this.currentUser = null;
        this.selectedMood = '';
        this.db = new GrievanceDB(); // Initialize database
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
        
        // Use database authentication
        const user = this.db.authenticateUser(username, password);
        
        if (user) {
            this.currentUser = user;
            this.goToPage(3);
            this.clearLoginForm();
            console.log(`User ${user.name} logged in successfully`);
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

    // Handle grievance submission with EmailJS
    async handleGrievance(event) {
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
            title: title,
            complaint: complaint,
            mood: this.selectedMood || '😐',
            severity: severity,
            submittedBy: this.currentUser ? this.currentUser.username : 'anonymous',
            submittedByName: this.currentUser ? this.currentUser.name : 'Anonymous'
        };
        
        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        // Always save to database first
        const savedGrievance = this.db.saveGrievance(grievanceData);
        console.log('Grievance saved locally:', savedGrievance);
        
        // Try to send email
        try {
            await this.sendGrievanceEmail(savedGrievance);
            console.log('Email sent successfully');
            
            // Success - clear form and go to thank you page
            this.clearGrievanceForm();
            this.goToPage(4);
            
        } catch (error) {
            console.error('Failed to send grievance email:', error);
            
            // Email failed but grievance is already saved
            alert('Your grievance has been saved successfully! However, we couldn\'t send the email notification to Ravi right now. Don\'t worry, your grievance is safe and you can try again later.');
            
            // Still proceed to thank you page since grievance is saved
            this.clearGrievanceForm();
            this.goToPage(4);
            
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    // Send grievance via EmailJS - FIXED to match your template
    async sendGrievanceEmail(grievanceData) {
        // EmailJS configuration
        const SERVICE_ID = 'service_9940f7p';
        const TEMPLATE_ID = 'template_wfljobv';
        
        // Create formatted message matching your template requirements
        const formattedMessage = `
🔸 NEW GRIEVANCE SUBMITTED 🔸

📋 Title: ${grievanceData.title}
😔 Mood: ${grievanceData.mood}
👤 From: ${grievanceData.submittedByName || grievanceData.submittedBy}

📝 COMPLAINT:
${grievanceData.complaint}

💡 WHAT WOULD HELP:
${grievanceData.severity}

🕒 Submitted: ${grievanceData.timestamp}
🆔 Grievance ID: #${grievanceData.id}
        `.trim();
        
        // Prepare email parameters to match your template exactly
        const emailParams = {
            Rabhya: grievanceData.submittedByName || grievanceData.submittedBy || 'Anonymous User',
            message: formattedMessage,
            time: new Date().toLocaleString()
        };
        
        console.log('Sending email with params:', emailParams);
        
        // Send email via EmailJS
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, emailParams);
        console.log('Email sent successfully:', response);
        return response;
    }

    // Save grievance to database (using GrievanceDB)
    saveGrievance(grievanceData) {
        return this.db.saveGrievance(grievanceData);
    }

    // Get all grievances from database
    getAllGrievances() {
        return this.db.getAllGrievances();
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

    // Clear all grievances using database
    clearGrievances() {
        if (confirm('Are you sure you want to clear all grievances? This action cannot be undone.')) {
            this.db.clearAllGrievances();
            this.showGrievances();
            console.log('All grievances cleared');
        }
    }

    // Test email functionality (for debugging)
    async testEmail() {
        console.log('Testing EmailJS with your template...');
        
        const testParams = {
            Rabhya: 'Test User',
            message: 'This is a test message to verify the email system is working correctly.',
            time: new Date().toLocaleString()
        };
        
        try {
            const response = await emailjs.send('service_9940f7p', 'template_wfljobv', testParams);
            console.log('✅ Test email sent successfully:', response);
            alert('Test email sent successfully! Check Ravi\'s inbox.');
            return true;
        } catch (error) {
            console.error('❌ Test email failed:', error);
            
            // Common error diagnostics
            if (error.status === 422) {
                console.error('Template variables don\'t match. Check your EmailJS template.');
            } else if (error.status === 400) {
                console.error('Invalid service ID or template ID. Check your EmailJS dashboard.');
            } else if (error.status === 401) {
                console.error('Invalid public key. Check your EmailJS account settings.');
            } else if (error.text) {
                console.error('Error details:', error.text);
            }
            
            alert('Test email failed. Check browser console for details.');
            return false;
        }
    }

    // Additional utility methods using database
    getGrievanceStats() {
        return {
            total: this.db.getGrievancesCount(),
            pending: this.db.getGrievancesByStatus('pending').length,
            resolved: this.db.getGrievancesByStatus('resolved').length
        };
    }

    exportGrievances() {
        this.db.exportGrievances();
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

// Add test email function to window for debugging
window.testEmail = () => app.testEmail();
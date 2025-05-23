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

    // Enhanced EmailJS send method with detailed debugging
    async sendGrievanceEmail(grievanceData) {
        console.log('🔍 Starting email send process...');
        
        // Check if EmailJS is loaded
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS library not loaded');
        }
        console.log('✅ EmailJS library loaded');
        
        // EmailJS configuration
        const SERVICE_ID = 'service_9940f7p';
        const TEMPLATE_ID = 'template_wfljobv';
        
        console.log('📧 Using Service ID:', SERVICE_ID);
        console.log('📋 Using Template ID:', TEMPLATE_ID);
        
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
        
        console.log('📤 Email parameters:', emailParams);
        console.log('🔑 Public Key configured:', '6aN6bauWpZH4EqUEF');
        
        try {
            // Send email via EmailJS with detailed logging
            console.log('📡 Attempting to send email...');
            const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, emailParams);
            console.log('✅ Email sent successfully!', response);
            return response;
            
        } catch (error) {
            console.error('❌ Email send failed:', error);
            
            // Detailed error diagnosis
            if (error.status) {
                console.error('HTTP Status:', error.status);
                
                switch (error.status) {
                    case 400:
                        console.error('🚨 Bad Request - Check your Service ID and Template ID');
                        break;
                    case 401:
                        console.error('🚨 Unauthorized - Check your Public Key');
                        break;
                    case 402:
                        console.error('🚨 Payment Required - Check your EmailJS quota');
                        break;
                    case 422:
                        console.error('🚨 Template Error - Check template variable names');
                        console.error('Expected variables: Rabhya, message, time');
                        console.error('Sent variables:', Object.keys(emailParams));
                        break;
                    case 429:
                        console.error('🚨 Rate Limited - Too many requests');
                        break;
                    default:
                        console.error('🚨 Unknown error status:', error.status);
                }
            }
            
            if (error.text) {
                console.error('Error details:', error.text);
            }
            
            // Re-throw the error so it's caught by the calling function
            throw error;
        }
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

    // Enhanced test function with comprehensive diagnostics
    async testEmailJS() {
        console.log('🧪 Running comprehensive EmailJS test...');
        console.log('==========================================');
        
        // Step 1: Check library
        console.log('1️⃣ Checking EmailJS library...');
        if (typeof emailjs === 'undefined') {
            console.error('❌ EmailJS library not found!');
            alert('EmailJS library not loaded. Check your script tag.');
            return false;
        }
        console.log('✅ EmailJS library loaded');
        
        // Step 2: Check configuration
        console.log('2️⃣ Checking configuration...');
        console.log('Service ID: service_9940f7p');
        console.log('Template ID: template_wfljobv');
        console.log('Public Key: 6aN6bauWpZH4EqUEF');
        
        // Step 3: Test with minimal parameters
        console.log('3️⃣ Testing with minimal parameters...');
        const testParams = {
            Rabhya: 'Test User',
            message: 'This is a test message to verify the email system is working correctly.',
            time: new Date().toLocaleString()
        };
        
        console.log('Test parameters:', testParams);
        
        try {
            console.log('📡 Sending test email...');
            const response = await emailjs.send('service_9940f7p', 'template_wfljobv', testParams);
            console.log('✅ SUCCESS! Test email sent:', response);
            alert('✅ Test email sent successfully! Check the recipient inbox.');
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            
            // Provide specific guidance based on error
            let errorMsg = 'Test email failed. ';
            
            if (error.status === 422) {
                errorMsg += 'Template variable mismatch. Check your EmailJS template has variables: {{Rabhya}}, {{message}}, {{time}}';
            } else if (error.status === 400) {
                errorMsg += 'Invalid Service ID or Template ID. Double-check these in your EmailJS dashboard.';
            } else if (error.status === 401) {
                errorMsg += 'Invalid Public Key. Check your EmailJS account settings.';
            } else if (error.status === 402) {
                errorMsg += 'EmailJS quota exceeded. Check your account limits.';
            } else {
                errorMsg += `HTTP ${error.status}: ${error.text || 'Unknown error'}`;
            }
            
            alert(errorMsg);
            console.error('Full error details:', error);
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

    // Quick checklist function
    emailJSChecklist() {
        console.log('📋 EmailJS Setup Checklist:');
        console.log('==========================================');
        console.log('1. ✅ EmailJS script loaded in HTML');
        console.log('2. ✅ Public key initialized: 6aN6bauWpZH4EqUEF');
        console.log('3. ❓ Service connected (Gmail/Outlook/etc)?');
        console.log('4. ❓ Template created with variables: {{Rabhya}}, {{message}}, {{time}}?');
        console.log('5. ❓ Service ID correct: service_9940f7p?');
        console.log('6. ❓ Template ID correct: template_wfljobv?');
        console.log('7. ❓ EmailJS account active and not over quota?');
        console.log('');
        console.log('💡 Run window.testEmailJS() to test your setup');
        console.log('💡 Run window.quickEmailTest() for a simple test');
    }

    // Simple quick test
    async quickEmailTest() {
        console.log('🚀 Quick Email Test...');
        try {
            const response = await emailjs.send('service_9940f7p', 'template_wfljobv', {
                Rabhya: 'Quick Test',
                message: 'This is a quick test message.',
                time: new Date().toLocaleString()
            });
            console.log('✅ Quick test SUCCESS!', response);
            alert('✅ Quick test email sent successfully!');
            return true;
        } catch (error) {
            console.error('❌ Quick test FAILED:', error);
            alert(`❌ Quick test failed: ${error.text || error.message}`);
            return false;
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

// Add debugging functions to window for easy access
window.testEmailJS = () => app.testEmailJS();
window.emailJSChecklist = () => app.emailJSChecklist();
window.quickEmailTest = () => app.quickEmailTest();

// Auto-run checklist on load for debugging
console.log('🔧 Grievance Portal loaded with debugging enabled');
console.log('💡 Available debug commands:');
console.log('   - window.testEmailJS() - Full EmailJS test');
console.log('   - window.quickEmailTest() - Quick email test');
console.log('   - window.emailJSChecklist() - Setup checklist');
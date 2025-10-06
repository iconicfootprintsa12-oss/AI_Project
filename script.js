// Application State for this page
        const state = {
            currentUser: null,
            users: JSON.parse(localStorage.getItem('users')) || []
        };

        // Initialize the page
        function initPage() {
            // Check if user is logged in
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                setupSidebar();
                showFlash(`Welcome, ${state.currentUser.name}!`, 'success');
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
                return;
            }

            // Check if user has permission to add staff (client admin only)
            if (state.currentUser.role !== 'client_admin') {
                showFlash('Access denied. Only client administrators can add staff members.', 'danger');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                return;
            }

            // Set up event listeners
            document.getElementById('add-staff-form').addEventListener('submit', handleAddStaff);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Password strength indicator
            document.getElementById('staff-password').addEventListener('input', updatePasswordStrength);
            
            // Confirm password validation
            document.getElementById('staff-confirm-password').addEventListener('input', validatePasswordMatch);
        }

        // Setup sidebar navigation
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            if (!sidebarNav) return;
            
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { icon: 'tachometer-alt', text: 'Dashboard', action: () => window.location.href = 'dashboard.html' },
                    { icon: 'building', text: 'Manage Clients', action: () => window.location.href = 'clients.html' },
                    { icon: 'chart-line', text: 'Platform Analytics', action: () => window.location.href = 'analytics.html' },
                    { icon: 'file-alt', text: 'System Reports', action: () => window.location.href = 'system_reports.html' }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { icon: 'tachometer-alt', text: 'Dashboard', action: () => window.location.href = 'dashboard.html' },
                    { icon: 'upload', text: 'Upload Data', action: () => window.location.href = 'upload.html' },
                    { icon: 'file-alt', text: 'Reports', action: () => window.location.href = 'reports.html' },
                    { icon: 'users', text: 'Manage Staff', action: () => window.location.href = 'staff.html' }
                ];
            } else {
                // Staff role
                navItems = [
                    { icon: 'tachometer-alt', text: 'Dashboard', action: () => window.location.href = 'dashboard.html' },
                    { icon: 'upload', text: 'Upload Data', action: () => window.location.href = 'upload.html' },
                    { icon: 'file-alt', text: 'Reports', action: () => window.location.href = 'reports.html' }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
            
            // Update user info
            document.getElementById('user-info').textContent = state.currentUser.name;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
        }

        // Handle add staff form submission
        function handleAddStaff(e) {
            e.preventDefault();
            
            // Get form values
            const firstName = document.getElementById('staff-first-name').value.trim();
            const lastName = document.getElementById('staff-last-name').value.trim();
            const email = document.getElementById('staff-email').value.trim();
            const password = document.getElementById('staff-password').value;
            const confirmPassword = document.getElementById('staff-confirm-password').value;
            const department = document.getElementById('staff-department').value;
            const position = document.getElementById('staff-position').value.trim();

            // Basic validation
            if (!firstName || !lastName || !email || !password || !confirmPassword) {
                showFlash('Please fill in all required fields', 'danger');
                return;
            }

            if (password !== confirmPassword) {
                showFlash('Passwords do not match', 'danger');
                return;
            }

            if (password.length < 8) {
                showFlash('Password must be at least 8 characters long', 'danger');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showFlash('Please enter a valid email address', 'danger');
                return;
            }

            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email address.', 'danger');
                return;
            }

            // Get permissions
            const permissions = {
                dashboard: document.getElementById('permission-dashboard').checked,
                upload: document.getElementById('permission-upload').checked,
                reports: document.getElementById('permission-reports').checked,
                export: document.getElementById('permission-export').checked
            };

            // Create new staff user
            const newUserId = Math.max(0, ...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: `${firstName} ${lastName}`,
                role: 'staff',
                client_id: state.currentUser.client_id,
                department: department,
                position: position,
                permissions: permissions,
                is_approved: true,
                last_login: null,
                created_date: new Date().toISOString().split('T')[0],
                status: 'active'
            };
            
            // Add to state and save to localStorage
            state.users.push(newUser);
            localStorage.setItem('users', JSON.stringify(state.users));
            
            // Show success message
            showFlash(`Staff member ${firstName} ${lastName} added successfully! They can now login with the provided credentials.`, 'success');
            
            // Reset form
            document.getElementById('add-staff-form').reset();
            document.getElementById('password-strength').innerHTML = '';
            document.getElementById('confirm-indicator').innerHTML = '';
            
            // Redirect back to staff management page after 3 seconds
            setTimeout(() => {
                window.location.href = 'staff.html';
            }, 3000);
        }

        // Update password strength indicator
        function updatePasswordStrength() {
            const password = this.value;
            const strengthIndicator = document.getElementById('password-strength');
            
            let strength = 'Weak';
            let color = 'text-danger';
            
            if (password.length >= 8) {
                strength = 'Medium';
                color = 'text-warning';
            }
            if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
                strength = 'Strong';
                color = 'text-success';
            }
            
            strengthIndicator.innerHTML = `Password strength: <span class="${color} fw-semibold">${strength}</span>`;
        }

        // Validate password match
        function validatePasswordMatch() {
            const password = document.getElementById('staff-password').value;
            const confirmPassword = this.value;
            const confirmIndicator = document.getElementById('confirm-indicator');
            
            if (confirmPassword === '') {
                confirmIndicator.innerHTML = '';
            } else if (password === confirmPassword) {
                confirmIndicator.innerHTML = '<span class="text-success"><i class="fas fa-check me-1"></i>Passwords match</span>';
            } else {
                confirmIndicator.innerHTML = '<span class="text-danger"><i class="fas fa-times me-1"></i>Passwords do not match</span>';
            }
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I can help you with staff management questions.",
                    "Make sure to set strong passwords for new staff members.",
                    "Staff members will have access to dashboard, uploads, and reports based on their permissions.",
                    "You can always modify staff permissions later from the staff management page.",
                    "New staff members will receive login instructions via email."
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show`;
            alert.style.position = 'fixed';
            alert.style.top = '20px';
            alert.style.right = '20px';
            alert.style.zIndex = '1050';
            alert.style.minWidth = '300px';
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }

        // Initialize the page when DOM is loaded
        document.addEventListener('DOMContentLoaded', initPage);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                const fraudScoreClass = transaction.fraud_score < 0.3 ? 'low' : 
                                                                        transaction.fraud_score < 0.7 ? 'medium' : 'high';
                                                return `
                                                    <tr class="transaction-row">
                                                        <td>${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${fraudScoreClass}">
                                                                ${(transaction.fraud_score * 100).toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="text-center mt-3">
                                    <button class="btn btn-primary" onclick="loadPlatformAnalytics()">View All Transactions</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Client Registrations</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="mr-3">
                                            <div class="icon-circle bg-primary">
                                                <i class="fas fa-building text-white"></i>
                                            </div>
                                        </div>
                                        <div>
                                            <div class="small text-gray-500">${client.registration_date}</div>
                                            <div class="font-weight-bold">${client.name}</div>
                                            <div class="small">
                                                ${client.is_approved ? 
                                                    '<span class="text-success">Approved</span>' : 
                                                    '<span class="text-warning">Pending</span>'}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                                <div class="text-center mt-3">
                                    <button class="btn btn-outline-primary btn-sm" onclick="loadManageClients()">View All Clients</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            const clientTransactions = state.transactions.filter(t => t.client_id === state.currentUser.client_id);
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exchange-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Total Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${totalAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Fraud Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-money-bill-wave fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const fraudScoreClass = transaction.fraud_score < 0.3 ? 'low' : 
                                                                        transaction.fraud_score < 0.7 ? 'medium' : 'high';
                                                return `
                                                    <tr class="transaction-row">
                                                        <td>${transaction.id}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>${transaction.description}</td>
                                                        <td>
                                                            <span class="fraud-score ${fraudScoreClass}">
                                                                ${(transaction.fraud_score * 100).toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="text-center mt-3">
                                    <button class="btn btn-primary" onclick="loadUploadData()">Upload More Data</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Detection Chart</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Initialize chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Legitimate', 'Fraud'],
                        datasets: [{
                            data: [totalTransactions - fraudTransactions, fraudTransactions],
                            backgroundColor: ['#1cc88a', '#e74a3b'],
                            hoverBackgroundColor: ['#17a673', '#be2617'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }, 100);
        }

        // Load manage clients page
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve and manage client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">Client Organizations</h6>
                        <button class="btn btn-primary btn-sm" onclick="showAddClientForm()">
                            <i class="fas fa-plus me-1"></i> Add Client
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization Name</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>${client.id}</td>
                                            <td>${client.name}</td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${!client.is_approved ? 
                                                    `<button class="btn btn-success btn-sm me-1" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check"></i> Approve
                                                    </button>` : ''}
                                                <button class="btn btn-info btn-sm me-1" onclick="viewClientDetails(${client.id})">
                                                    <i class="fas fa-eye"></i> View
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="deleteClient(${client.id})">
                                                    <i class="fas fa-trash"></i> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive analytics across all clients';
            
            const content = `
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Transaction Volume by Client</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="clientVolumeChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Detection Summary</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudSummaryChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card shadow mb-4">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary">All Transactions</h6>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Client</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Fraud Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.transactions.map(transaction => {
                                        const client = state.clients.find(c => c.id === transaction.client_id);
                                        const fraudScoreClass = transaction.fraud_score < 0.3 ? 'low' : 
                                                                transaction.fraud_score < 0.7 ? 'medium' : 'high';
                                        return `
                                            <tr class="transaction-row">
                                                <td>${transaction.id}</td>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                                <td>${transaction.date}</td>
                                                <td>${transaction.description}</td>
                                                <td>
                                                    <span class="fraud-score ${fraudScoreClass}">
                                                        ${(transaction.fraud_score * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td>
                                                    ${transaction.is_fraud ? 
                                                        '<span class="badge bg-danger">Fraud</span>' : 
                                                        '<span class="badge bg-success">Legitimate</span>'}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Initialize charts
            setTimeout(() => {
                // Client Volume Chart
                const clientVolumeCtx = document.getElementById('clientVolumeChart').getContext('2d');
                const clientNames = state.clients.map(c => c.name);
                const clientTransactions = state.clients.map(client => 
                    state.transactions.filter(t => t.client_id === client.id).length
                );
                
                new Chart(clientVolumeCtx, {
                    type: 'bar',
                    data: {
                        labels: clientNames,
                        datasets: [{
                            label: 'Transaction Count',
                            data: clientTransactions,
                            backgroundColor: '#4e73df',
                            borderColor: '#2e59d9',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                });
                
                // Fraud Summary Chart
                const fraudSummaryCtx = document.getElementById('fraudSummaryChart').getContext('2d');
                const fraudCount = state.transactions.filter(t => t.is_fraud).length;
                const legitimateCount = state.transactions.length - fraudCount;
                
                new Chart(fraudSummaryCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Legitimate', 'Fraud'],
                        datasets: [{
                            data: [legitimateCount, fraudCount],
                            backgroundColor: ['#1cc88a', '#e74a3b'],
                            hoverBackgroundColor: ['#17a673', '#be2617'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }, 100);
        }

        // Load system reports
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Generated reports and analytics';
            
            const content = `
                <div class="row">
                    ${state.reports.map(report => {
                        const client = state.clients.find(c => c.id === report.client_id);
                        return `
                            <div class="col-lg-4 col-md-6 mb-4">
                                <div class="card report-card shadow h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h5 class="card-title">${report.name}</h5>
                                                <p class="card-text text-muted">${report.type.replace('_', ' ')}</p>
                                            </div>
                                            <span class="badge bg-primary">${report.date}</span>
                                        </div>
                                        <p class="card-text">
                                            ${client ? `Client: ${client.name}` : 'Platform-wide report'}
                                        </p>
                                        <div class="d-flex justify-content-between mt-auto">
                                            <button class="btn btn-primary btn-sm">
                                                <i class="fas fa-download me-1"></i> Download
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm">
                                                <i class="fas fa-share-alt me-1"></i> Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="card shadow mt-4">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary">Generate New Report</h6>
                    </div>
                    <div class="card-body">
                        <form id="report-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="report-type" class="form-label">Report Type</label>
                                    <select class="form-select" id="report-type" required>
                                        <option value="">Select Report Type</option>
                                        <option value="fraud_analysis">Fraud Analysis</option>
                                        <option value="transaction_summary">Transaction Summary</option>
                                        <option value="risk_assessment">Risk Assessment</option>
                                        <option value="performance">Platform Performance</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="report-client" class="form-label">Client (Optional)</label>
                                    <select class="form-select" id="report-client">
                                        <option value="">All Clients</option>
                                        ${state.clients.filter(c => c.is_approved).map(client => 
                                            `<option value="${client.id}">${client.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="report-start-date" class="form-label">Start Date</label>
                                    <input type="date" class="form-control" id="report-start-date" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="report-end-date" class="form-label">End Date</label>
                                    <input type="date" class="form-control" id="report-end-date" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-chart-bar me-1"></i> Generate Report
                            </button>
                        </form>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            document.getElementById('report-form').addEventListener('submit', function(e) {
                e.preventDefault();
                showFlash('Report generation started. You will be notified when it is ready.', 'success');
            });
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div id="upload-dropzone" class="upload-dropzone">
                                    <div class="text-center">
                                        <i class="fas fa-cloud-upload-alt fa-3x text-gray-400 mb-3"></i>
                                        <h5 class="font-weight-bold text-gray-700">Drag & Drop Files Here</h5>
                                        <p class="text-gray-500 mb-3">or click to browse your files</p>
                                        <p class="small text-gray-500">Supported formats: CSV, Excel, JSON (Max 10MB)</p>
                                    </div>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls,.json">
                                </div>
                                
                                <div class="mt-4">
                                    <h6 class="font-weight-bold text-gray-700 mb-3">Upload History</h6>
                                    <div class="list-group">
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <i class="fas fa-file-csv text-success me-2"></i>
                                                <span>transactions_june_2023.csv</span>
                                            </div>
                                            <div>
                                                <span class="badge bg-success me-2">Processed</span>
                                                <small class="text-muted">2023-06-15</small>
                                            </div>
                                        </div>
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <i class="fas fa-file-excel text-primary me-2"></i>
                                                <span>vendor_payments.xlsx</span>
                                            </div>
                                            <div>
                                                <span class="badge bg-warning me-2">Processing</span>
                                                <small class="text-muted">2023-06-18</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Data Requirements</h6>
                            </div>
                            <div class="card-body">
                                <h6 class="font-weight-bold text-gray-700">Required Fields:</h6>
                                <ul class="list-unstyled small">
                                    <li><i class="fas fa-check text-success me-2"></i>Transaction ID</li>
                                    <li><i class="fas fa-check text-success me-2"></i>Amount</li>
                                    <li><i class="fas fa-check text-success me-2"></i>Date</li>
                                    <li><i class="fas fa-check text-success me-2"></i>Description</li>
                                </ul>
                                
                                <h6 class="font-weight-bold text-gray-700 mt-3">Optional Fields:</h6>
                                <ul class="list-unstyled small">
                                    <li><i class="fas fa-info text-primary me-2"></i>Merchant Name</li>
                                    <li><i class="fas fa-info text-primary me-2"></i>Category</li>
                                    <li><i class="fas fa-info text-primary me-2"></i>Payment Method</li>
                                </ul>
                                
                                <div class="mt-4">
                                    <button class="btn btn-outline-primary btn-sm w-100">
                                        <i class="fas fa-download me-1"></i> Download Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Setup file upload functionality
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            
            dropzone.addEventListener('click', () => fileInput.click());
            
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('active');
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('active');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('active');
                
                if (e.dataTransfer.files.length) {
                    handleFileUpload(e.dataTransfer.files[0]);
                }
            });
            
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length) {
                    handleFileUpload(fileInput.files[0]);
                }
            });
        }

        // Handle file upload
        function handleFileUpload(file) {
            const dropzone = document.getElementById('upload-dropzone');
            
            // Validate file type
            const validTypes = ['text/csv', 'application/vnd.ms-excel', 
                               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                               'application/json'];
            
            if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|json)$/)) {
                showFlash('Invalid file type. Please upload CSV, Excel, or JSON files.', 'danger');
                return;
            }
            
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                showFlash('File size exceeds 10MB limit.', 'danger');
                return;
            }
            
            // Show upload progress
            dropzone.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                    <h5 class="font-weight-bold text-gray-700">Processing ${file.name}</h5>
                    <div class="progress mt-3">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" style="width: 100%"></div>
                    </div>
                </div>
            `;
            
            // Simulate upload and processing
            setTimeout(() => {
                showFlash(`File "${file.name}" uploaded and processed successfully!`, 'success');
                loadUploadData(); // Reload the page to show the new file in history
            }, 2000);
        }

        // Load reports page
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'View and generate fraud detection reports';
            
            const clientReports = state.reports.filter(r => 
                r.client_id === state.currentUser.client_id || state.currentUser.role === 'super_admin'
            );
            
            const content = `
                <div class="row">
                    ${clientReports.map(report => {
                        const client = state.clients.find(c => c.id === report.client_id);
                        return `
                            <div class="col-lg-4 col-md-6 mb-4">
                                <div class="card report-card shadow h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h5 class="card-title">${report.name}</h5>
                                                <p class="card-text text-muted">${report.type.replace('_', ' ')}</p>
                                            </div>
                                            <span class="badge bg-primary">${report.date}</span>
                                        </div>
                                        <p class="card-text">
                                            ${client && state.currentUser.role === 'super_admin' ? 
                                                `Client: ${client.name}` : 'Your organization report'}
                                        </p>
                                        <div class="d-flex justify-content-between mt-auto">
                                            <button class="btn btn-primary btn-sm">
                                                <i class="fas fa-download me-1"></i> Download
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm">
                                                <i class="fas fa-share-alt me-1"></i> Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="card shadow mt-4">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary">Generate New Report</h6>
                    </div>
                    <div class="card-body">
                        <form id="client-report-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="client-report-type" class="form-label">Report Type</label>
                                    <select class="form-select" id="client-report-type" required>
                                        <option value="">Select Report Type</option>
                                        <option value="fraud_analysis">Fraud Analysis</option>
                                        <option value="transaction_summary">Transaction Summary</option>
                                        <option value="risk_assessment">Risk Assessment</option>
                                        <option value="compliance">Compliance Report</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="client-report-period" class="form-label">Time Period</label>
                                    <select class="form-select" id="client-report-period" required>
                                        <option value="">Select Period</option>
                                        <option value="last_7_days">Last 7 Days</option>
                                        <option value="last_30_days">Last 30 Days</option>
                                        <option value="last_quarter">Last Quarter</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                            </div>
                            <div id="custom-date-range" style="display: none;">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="client-report-start-date" class="form-label">Start Date</label>
                                        <input type="date" class="form-control" id="client-report-start-date">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="client-report-end-date" class="form-label">End Date</label>
                                        <input type="date" class="form-control" id="client-report-end-date">
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-chart-bar me-1"></i> Generate Report
                            </button>
                        </form>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Show/hide custom date range
            document.getElementById('client-report-period').addEventListener('change', function() {
                const customRange = document.getElementById('custom-date-range');
                customRange.style.display = this.value === 'custom' ? 'block' : 'none';
            });
            
            document.getElementById('client-report-form').addEventListener('submit', function(e) {
                e.preventDefault();
                showFlash('Report generation started. You will be notified when it is ready.', 'success');
            });
        }

        // Load manage staff page
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Manage staff members for your organization';
            
            // Get staff members for current client
            const staffMembers = state.users.filter(u => 
                u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                        <button class="btn btn-primary btn-sm" onclick="showAddStaffForm()">
                            <i class="fas fa-plus me-1"></i> Add Staff Member
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Last Login</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${staffMembers.map(staff => `
                                        <tr>
                                            <td>${staff.id}</td>
                                            <td>${staff.name}</td>
                                            <td>${staff.email}</td>
                                            <td>${staff.last_login || 'Never'}</td>
                                            <td>
                                                ${staff.is_approved ? 
                                                    '<span class="badge bg-success">Active</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                <button class="btn btn-info btn-sm me-1" onclick="editStaff(${staff.id})">
                                                    <i class="fas fa-edit"></i> Edit
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="deleteStaff(${staff.id})">
                                                    <i class="fas fa-trash"></i> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Edit staff member (placeholder function)
        function editStaff(staffId) {
            showFlash('Edit staff functionality would be implemented here', 'info');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            const staff = state.users.find(u => u.id === staffId);
            if (!staff) return;
            
            if (confirm(`Are you sure you want to delete staff member ${staff.name}?`)) {
                state.users = state.users.filter(u => u.id !== staffId);
                showFlash(`Staff member ${staff.name} deleted successfully!`, 'success');
                loadManageStaff();
            }
        }

        // Show add staff form
        function showAddStaffForm() {
            document.getElementById('page-title').textContent = 'Add Staff Member';
            document.getElementById('page-subtitle').textContent = 'Add a new staff member to your organization';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">Add New Staff Member</h6>
                        <button class="btn btn-secondary" onclick="loadManageStaff()">
                            <i class="fas fa-arrow-left me-1"></i> Back to Manage Staff
                        </button>
                    </div>
                    <div class="card-body">
                        <form id="add-staff-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="staff-name" class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="staff-name" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="staff-email" class="form-label">Email Address</label>
                                    <input type="email" class="form-control" id="staff-email" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="staff-password" class="form-label">Password</label>
                                    <input type="password" class="form-control" id="staff-password" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="staff-confirm-password" class="form-label">Confirm Password</label>
                                    <input type="password" class="form-control" id="staff-confirm-password" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="staff-permissions" class="form-label">Permissions</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="permission-upload" checked>
                                    <label class="form-check-label" for="permission-upload">
                                        Upload Data
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="permission-view-reports" checked>
                                    <label class="form-check-label" for="permission-view-reports">
                                        View Reports
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="permission-generate-reports">
                                    <label class="form-check-label" for="permission-generate-reports">
                                        Generate Reports
                                    </label>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-user-plus me-1"></i> Add Staff Member
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="loadManageStaff()">
                                    <i class="fas fa-times me-1"></i> Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            document.getElementById('add-staff-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = document.getElementById('staff-name').value;
                const email = document.getElementById('staff-email').value;
                const password = document.getElementById('staff-password').value;
                const confirmPassword = document.getElementById('staff-confirm-password').value;
                
                // Validation
                if (password !== confirmPassword) {
                    showFlash('Passwords do not match', 'danger');
                    return;
                }
                
                // Check if email already exists
                if (state.users.some(u => u.email === email)) {
                    showFlash('Email already registered', 'danger');
                    return;
                }
                
                // Create new staff user
                const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
                const newUser = {
                    id: newUserId,
                    email: email,
                    name: name,
                    role: 'staff',
                    client_id: state.currentUser.client_id,
                    is_approved: true,
                    last_login: null
                };
                
                state.users.push(newUser);
                showFlash(`Staff member ${name} added successfully!`, 'success');
                loadManageStaff();
            });
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                showFlash(`Client ${client.name} approved successfully!`, 'success');
                loadManageClients();
            }
        }

        // View client details
        function viewClientDetails(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (!client) return;
            
            const clientUsers = state.users.filter(u => u.client_id === clientId);
            const clientTransactions = state.transactions.filter(t => t.client_id === clientId);
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">Client Details</h6>
                        <button class="btn btn-secondary" onclick="loadManageClients()">
                            <i class="fas fa-arrow-left me-1"></i> Back to Clients
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h5 class="mb-3">Organization Information</h5>
                                <div class="mb-3">
                                    <strong>Name:</strong> ${client.name}
                                </div>
                                <div class="mb-3">
                                    <strong>Industry:</strong> ${client.industry}
                                </div>
                                <div class="mb-3">
                                    <strong>Registration Date:</strong> ${client.registration_date}
                                </div>
                                <div class="mb-3">
                                    <strong>Status:</strong> 
                                    ${client.is_approved ? 
                                        '<span class="badge bg-success">Approved</span>' : 
                                        '<span class="badge bg-warning">Pending Approval</span>'}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h5 class="mb-3">Activity Summary</h5>
                                <div class="mb-3">
                                    <strong>Users:</strong> ${clientUsers.length}
                                </div>
                                <div class="mb-3">
                                    <strong>Transactions:</strong> ${clientTransactions.length}
                                </div>
                                <div class="mb-3">
                                    <strong>Fraud Cases:</strong> ${fraudTransactions}
                                </div>
                                <div class="mb-3">
                                    <strong>Fraud Rate:</strong> 
                                    ${clientTransactions.length > 0 ? 
                                        (fraudTransactions / clientTransactions.length * 100).toFixed(2) + '%' : 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <h5 class="mb-3">Users</h5>
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${clientUsers.map(user => `
                                            <tr>
                                                <td>${user.name}</td>
                                                <td>${user.email}</td>
                                                <td>${user.role.replace('_', ' ')}</td>
                                                <td>
                                                    ${user.is_approved ? 
                                                        '<span class="badge bg-success">Active</span>' : 
                                                        '<span class="badge bg-warning">Pending</span>'}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            ${!client.is_approved ? 
                                `<button class="btn btn-success me-2" onclick="approveClient(${client.id})">
                                    <i class="fas fa-check me-1"></i> Approve Client
                                </button>` : ''}
                            <button class="btn btn-danger" onclick="deleteClient(${client.id})">
                                <i class="fas fa-trash me-1"></i> Delete Client
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Delete client
        function deleteClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (!client) return;
            
            if (confirm(`Are you sure you want to delete client ${client.name}? This will also delete all associated users and data.`)) {
                state.clients = state.clients.filter(c => c.id !== clientId);
                state.users = state.users.filter(u => u.client_id !== clientId);
                state.transactions = state.transactions.filter(t => t.client_id !== clientId);
                showFlash(`Client ${client.name} deleted successfully!`, 'success');
                loadManageClients();
            }
        }

        // Show add client form
        function showAddClientForm() {
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">Add New Client</h6>
                        <button class="btn btn-secondary" onclick="loadManageClients()">
                            <i class="fas fa-arrow-left me-1"></i> Back to Clients
                        </button>
                    </div>
                    <div class="card-body">
                        <form id="add-client-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="client-name" class="form-label">Organization Name</label>
                                    <input type="text" class="form-control" id="client-name" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="client-industry" class="form-label">Industry</label>
                                    <select class="form-select" id="client-industry" required>
                                        <option value="">Select Industry</option>
                                        <option value="Banking">Banking & Finance</option>
                                        <option value="E-commerce">E-commerce & Retail</option>
                                        <option value="Government">Government</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="admin-name" class="form-label">Admin Name</label>
                                    <input type="text" class="form-control" id="admin-name" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="admin-email" class="form-label">Admin Email</label>
                                    <input type="email" class="form-control" id="admin-email" required>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-plus me-1"></i> Add Client
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="loadManageClients()">
                                    <i class="fas fa-times me-1"></i> Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            document.getElementById('add-client-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const clientName = document.getElementById('client-name').value;
                const industry = document.getElementById('client-industry').value;
                const adminName = document.getElementById('admin-name').value;
                const adminEmail = document.getElementById('admin-email').value;
                
                // Check if client already exists
                if (state.clients.some(c => c.name === clientName)) {
                    showFlash('Client organization already exists', 'danger');
                    return;
                }
                
                // Check if email already exists
                if (state.users.some(u => u.email === adminEmail)) {
                    showFlash('Email already registered', 'danger');
                    return;
                }
                
                // Create new client and admin user
                const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
                state.clients.push({
                    id: newClientId,
                    name: clientName,
                    industry: industry,
                    is_approved: true,
                    registration_date: new Date().toISOString().split('T')[0]
                });
                
                const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
                state.users.push({
                    id: newUserId,
                    email: adminEmail,
                    name: adminName,
                    role: 'client_admin',
                    client_id: newClientId,
                    is_approved: true,
                    last_login: null
                });
                
                showFlash(`Client ${clientName} added successfully!`, 'success');
                loadManageClients();
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "Based on your transaction data, I've detected some anomalies that might indicate fraudulent activity.",
                    "I recommend reviewing transactions from the last 7 days with fraud scores above 80%.",
                    "Your overall fraud rate is 2.3%, which is below the industry average of 3.1%.",
                    "I've identified 3 high-risk transactions that require immediate attention.",
                    "The pattern in your data suggests potential account takeover attempts. Consider implementing multi-factor authentication."
                ];
                
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const messagesContainer = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 d-flex ${sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`;
            
            messageDiv.innerHTML = `
                <div class="card ${sender === 'user' ? 'bg-primary text-white' : 'bg-light'}">
                    <div class="card-body p-2">
                        <div class="d-flex align-items-center">
                            ${sender === 'ai' ? '<i class="fas fa-robot me-2"></i>' : ''}
                            <div>${message}</div>
                            ${sender === 'user' ? '<i class="fas fa-user ms-2"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const toggleIcon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                toggleIcon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                toggleIcon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const flashId = 'flash-' + Date.now();
            
            const flashHTML = `
                <div id="${flashId}" class="alert alert-${type} alert-dismissible fade show flash-message shadow" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            
            flashContainer.innerHTML = flashHTML;
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                const flashElement = document.getElementById(flashId);
                if (flashElement) {
                    flashElement.remove();
                }
            }, 5000);
        }

        // Logout user
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State (for this page)
        const state = {
            currentUser: null,
            users: [],
            clients: []
        };

        // Load sample data (in a real app, this would come from an API)
        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21', department: 'Finance', position: 'Fraud Analyst' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18', department: 'IT', position: 'Security Analyst' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' },
            { id: 7, email: 'lisa@globalbank.com', name: 'Lisa Chen', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-15', department: 'Compliance', position: 'Auditor' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        function initStaffPage() {
            // Load data
            state.users = sampleUsers;
            state.clients = sampleClients;

            // Check authentication
            const savedUser = localStorage.getItem('currentUser');
            if (!savedUser) {
                window.location.href = 'login.html';
                return;
            }

            state.currentUser = JSON.parse(savedUser);

            // Only client admins can access this page
            if (state.currentUser.role !== 'client_admin') {
                showFlash('Access denied. Only client administrators can manage staff.', 'danger');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                return;
            }

            // Setup sidebar and user info
            setupSidebar();
            loadStaffData();
        }

        function loadStaffData() {
            // Get staff for current client
            const clientStaff = state.users.filter(u => 
                u.client_id === state.currentUser.client_id && u.role === 'staff'
            );

            // Update stats
            document.getElementById('total-staff').textContent = clientStaff.length;
            document.getElementById('active-staff').textContent = clientStaff.filter(s => s.is_approved).length;
            
            const departments = [...new Set(clientStaff.map(s => s.department).filter(Boolean))];
            document.getElementById('total-departments').textContent = departments.length;
            
            const recentLogins = clientStaff.filter(s => s.last_login && new Date(s.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
            document.getElementById('recent-logins').textContent = recentLogins;
            
            document.getElementById('staff-count').textContent = `${clientStaff.length} Staff`;

            // Load staff table
            const staffTableBody = document.getElementById('staff-table-body');
            staffTableBody.innerHTML = clientStaff.map(staff => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                                ${staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-semibold">${staff.name}</div>
                                <small class="text-muted">${staff.position || 'No position specified'}</small>
                            </div>
                        </div>
                    </td>
                    <td>${staff.email}</td>
                    <td>
                        <span class="badge bg-light text-dark">${staff.department || 'Not assigned'}</span>
                    </td>
                    <td>${staff.position || '-'}</td>
                    <td>${staff.last_login || 'Never'}</td>
                    <td>
                        <span class="badge ${staff.is_approved ? 'bg-success' : 'bg-warning'}">
                            ${staff.is_approved ? 'Active' : 'Pending'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="viewStaffDetails(${staff.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-warning" onclick="editStaff(${staff.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteStaff(${staff.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function viewStaffDetails(staffId) {
            const staff = state.users.find(u => u.id === staffId);
            if (staff) {
                const modalHTML = `
                    <div class="modal fade" id="staffDetailsModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Staff Details - ${staff.name}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6>Personal Information</h6>
                                            <table class="table table-sm">
                                                <tr><th>Name:</th><td>${staff.name}</td></tr>
                                                <tr><th>Email:</th><td>${staff.email}</td></tr>
                                                <tr><th>Department:</th><td>${staff.department || 'Not specified'}</td></tr>
                                                <tr><th>Position:</th><td>${staff.position || 'Not specified'}</td></tr>
                                                <tr><th>Role:</th><td>${staff.role.replace('_', ' ')}</td></tr>
                                            </table>
                                        </div>
                                        <div class="col-md-6">
                                            <h6>Account Information</h6>
                                            <table class="table table-sm">
                                                <tr><th>Status:</th><td>${staff.is_approved ? 'Active' : 'Inactive'}</td></tr>
                                                <tr><th>Last Login:</th><td>${staff.last_login || 'Never'}</td></tr>
                                                <tr><th>Client:</th><td>${getClientName(staff.client_id)}</td></tr>
                                                <tr><th>User ID:</th><td>#${staff.id}</td></tr>
                                            </table>
                                        </div>
                                    </div>
                                    ${staff.permissions ? `
                                    <div class="mt-4">
                                        <h6>Permissions</h6>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <ul class="list-unstyled">
                                                    <li><i class="fas ${staff.permissions.dashboard ? 'fa-check text-success' : 'fa-times text-danger'} me-2"></i> Dashboard Access</li>
                                                    <li><i class="fas ${staff.permissions.upload ? 'fa-check text-success' : 'fa-times text-danger'} me-2"></i> Upload Data</li>
                                                </ul>
                                            </div>
                                            <div class="col-md-6">
                                                <ul class="list-unstyled">
                                                    <li><i class="fas ${staff.permissions.reports ? 'fa-check text-success' : 'fa-times text-danger'} me-2"></i> View Reports</li>
                                                    <li><i class="fas ${staff.permissions.export ? 'fa-check text-success' : 'fa-times text-danger'} me-2"></i> Export Data</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary" onclick="editStaff(${staff.id})">
                                        <i class="fas fa-edit me-1"></i>Edit Staff
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                if (!document.getElementById('staffDetailsModal')) {
                    document.body.insertAdjacentHTML('beforeend', modalHTML);
                }
                
                const modal = new bootstrap.Modal(document.getElementById('staffDetailsModal'));
                modal.show();
            }
        }

        function editStaff(staffId) {
            showFlash('Edit staff functionality would open here', 'info');
            // In a real application, this would open an edit form
        }

        function deleteStaff(staffId) {
            const staff = state.users.find(u => u.id === staffId);
            if (staff && confirm(`Are you sure you want to delete ${staff.name}? This action cannot be undone.`)) {
                // Remove from state
                state.users = state.users.filter(u => u.id !== staffId);
                
                // Show success message
                showFlash(`Staff member ${staff.name} deleted successfully!`, 'success');
                
                // Reload the table
                loadStaffData();
            }
        }

        function getClientName(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            return client ? client.name : 'Unknown';
        }

        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            if (!sidebarNav) return;
            
            sidebarNav.innerHTML = '';
            
            const navItems = [
                { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => window.location.href = 'dashboard.html' },
                { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => window.location.href = 'upload.html' },
                { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => window.location.href = 'reports.html' },
                { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => window.location.href = 'staff.html' }
            ];
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
            
            // Update user info
            if (document.getElementById('user-info')) {
                document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            }
            if (document.getElementById('user-role-badge')) {
                document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            }
        }

        // Chat functionality
        document.getElementById('chat-form')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I can help you manage your staff members. You can add new staff, view their details, or remove inactive accounts.",
                    "Staff management allows you to control who has access to your organization's fraud analytics data.",
                    "Remember to set appropriate permissions for each staff member based on their role and responsibilities.",
                    "You can track staff activity and login history to monitor platform usage.",
                    "Need help with staff permissions or access levels? I can guide you through the best practices."
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        });

        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        document.getElementById('chatboard-toggle')?.addEventListener('click', function() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        });

        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        function logout() {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }

        // Initialize the page when DOM is loaded
        document.addEventListener('DOMContentLoaded', initStaffPage);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

// Application State
        const state = {
            currentUser: null,
            currentPage: 'landing-page',
            transactions: [],
            clients: [],
            users: [],
            reports: []
        };

        // Enhanced sample data for demonstration
        const sampleTransactions = [
            { id: 1, client_id: 1, amount: 1250.00, date: '2023-06-15', description: 'Office supplies procurement', is_fraud: false, fraud_score: 0.15, category: 'Operations' },
            { id: 2, client_id: 1, amount: 9850.00, date: '2023-06-16', description: 'Software license renewal', is_fraud: false, fraud_score: 0.28, category: 'Technology' },
            { id: 3, client_id: 1, amount: 45500.00, date: '2023-06-17', description: 'Vendor payment - International', is_fraud: true, fraud_score: 0.92, category: 'Vendor' },
            { id: 4, client_id: 2, amount: 3200.00, date: '2023-06-18', description: 'Marketing services', is_fraud: false, fraud_score: 0.12, category: 'Marketing' },
            { id: 5, client_id: 2, amount: 12500.00, date: '2023-06-19', description: 'Consulting fees', is_fraud: true, fraud_score: 0.87, category: 'Consulting' },
            { id: 6, client_id: 1, amount: 780.00, date: '2023-06-20', description: 'Team lunch', is_fraud: false, fraud_score: 0.08, category: 'Operations' },
            { id: 7, client_id: 2, amount: 25600.00, date: '2023-06-21', description: 'Equipment purchase', is_fraud: false, fraud_score: 0.22, category: 'Technology' }
        ];

        const sampleClients = [
            { id: 1, name: 'Global Bank Corporation', industry: 'Banking', is_approved: true, registration_date: '2023-01-15' },
            { id: 2, name: 'Tech Solutions Inc', industry: 'Technology', is_approved: true, registration_date: '2023-02-20' },
            { id: 3, name: 'City Government Services', industry: 'Government', is_approved: false, registration_date: '2023-03-10' },
            { id: 4, name: 'MediCare Providers', industry: 'Healthcare', is_approved: true, registration_date: '2023-04-05' }
        ];

        const sampleUsers = [
            { id: 1, email: 'admin@fraudplatform.com', name: 'Super Admin', role: 'super_admin', client_id: null, is_approved: true, last_login: '2023-06-21' },
            { id: 2, email: 'john@globalbank.com', name: 'John Smith', role: 'client_admin', client_id: 1, is_approved: true, last_login: '2023-06-20' },
            { id: 3, email: 'sara@globalbank.com', name: 'Sara Johnson', role: 'staff', client_id: 1, is_approved: true, last_login: '2023-06-21' },
            { id: 4, email: 'mike@techsolutions.com', name: 'Mike Brown', role: 'client_admin', client_id: 2, is_approved: true, last_login: '2023-06-19' },
            { id: 5, email: 'emma@techsolutions.com', name: 'Emma Wilson', role: 'staff', client_id: 2, is_approved: true, last_login: '2023-06-18' },
            { id: 6, email: 'david@medicare.com', name: 'David Lee', role: 'client_admin', client_id: 4, is_approved: true, last_login: '2023-06-17' }
        ];

        const sampleReports = [
            { id: 1, name: 'Monthly Fraud Analysis', type: 'fraud_analysis', date: '2023-06-01', client_id: 1 },
            { id: 2, name: 'Transaction Summary Q2', type: 'transaction_summary', date: '2023-06-15', client_id: 1 },
            { id: 3, name: 'High-Risk Transactions', type: 'risk_assessment', date: '2023-06-20', client_id: 2 },
            { id: 4, name: 'Platform Performance', type: 'performance', date: '2023-06-10', client_id: null }
        ];

        // Initialize the application
        function initApp() {
            // Load sample data
            state.transactions = sampleTransactions;
            state.clients = sampleClients;
            state.users = sampleUsers;
            state.reports = sampleReports;

            // Set up event listeners
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
            document.getElementById('chatboard-toggle').addEventListener('click', toggleChatboard);

            // Check if user is already logged in (from localStorage)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                state.currentUser = JSON.parse(savedUser);
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${state.currentUser.name}!`, 'success');
            }
        }

        // Show a specific section
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show the requested section
            document.getElementById(sectionId).classList.add('active');
            state.currentPage = sectionId;
        }

        // Handle login form submission
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation
            if (!email || !password) {
                showFlash('Please enter both email and password', 'danger');
                return;
            }

            // Find user (in a real app, this would be an API call)
            const user = state.users.find(u => u.email === email);

            if (user && user.is_approved) {
                // In a real app, we would verify the password
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showAuthenticatedPages();
                loadDashboard();
                showFlash(`Welcome back, ${user.name}!`, 'success');
            } else if (user && !user.is_approved) {
                showFlash('Your account is pending approval from administrator', 'warning');
            } else {
                showFlash('Invalid email or password', 'danger');
            }
        }

        // Handle registration form submission
        function handleRegister(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const clientName = document.getElementById('register-client-name').value;
            const industry = document.getElementById('register-industry').value;

            // Simple validation
            if (!email || !name || !password || !clientName || !industry) {
                showFlash('Please fill all required fields', 'danger');
                return;
            }

            // Check if user already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered. Please use a different email.', 'danger');
                return;
            }

            // Create new client and user (in a real app, this would be an API call)
            const newClientId = Math.max(...state.clients.map(c => c.id)) + 1;
            state.clients.push({
                id: newClientId,
                name: clientName,
                industry: industry,
                is_approved: false,
                registration_date: new Date().toISOString().split('T')[0]
            });

            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'client_admin',
                client_id: newClientId,
                is_approved: false,
                last_login: null
            };
            
            state.users.push(newUser);
            
            showFlash('Registration successful! Your organization account is pending approval.', 'success');
            setTimeout(() => showSection('login-page'), 2000);
        }

        // Show authenticated pages
        function showAuthenticatedPages() {
            document.getElementById('public-pages').style.display = 'none';
            document.getElementById('authenticated-pages').style.display = 'block';
            
            // Update user info
            document.getElementById('user-info').textContent = `${state.currentUser.name}`;
            document.getElementById('user-role-badge').textContent = state.currentUser.role.replace('_', ' ');
            
            // Setup sidebar based on user role
            setupSidebar();
        }

        // Setup sidebar navigation based on user role
        function setupSidebar() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = '';
            
            let navItems = [];
            
            if (state.currentUser.role === 'super_admin') {
                navItems = [
                    { id: 'super-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadSuperAdminDashboard() },
                    { id: 'manage-clients', icon: 'building', text: 'Manage Clients', action: () => loadManageClients() },
                    { id: 'platform-analytics', icon: 'chart-line', text: 'Platform Analytics', action: () => loadPlatformAnalytics() },
                    { id: 'system-reports', icon: 'file-alt', text: 'System Reports', action: () => loadSystemReports() }
                ];
            } else if (state.currentUser.role === 'client_admin') {
                navItems = [
                    { id: 'client-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() },
                    { id: 'manage-staff', icon: 'users', text: 'Manage Staff', action: () => loadManageStaff() }
                ];
            } else {
                // Staff role
                navItems = [
                    { id: 'staff-dashboard', icon: 'tachometer-alt', text: 'Dashboard', action: () => loadDashboard() },
                    { id: 'upload-data', icon: 'upload', text: 'Upload Data', action: () => loadUploadData() },
                    { id: 'reports', icon: 'file-alt', text: 'Reports', action: () => loadReports() }
                ];
            }
            
            // Create nav items
            navItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const a = document.createElement('a');
                a.className = 'nav-link';
                a.href = '#';
                a.innerHTML = `<i class="fas fa-${item.icon} me-2"></i> ${item.text}`;
                a.addEventListener('click', item.action);
                
                li.appendChild(a);
                sidebarNav.appendChild(li);
            });
            
            // Add logout at the bottom
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mt-auto';
            const logoutLink = document.createElement('a');
            logoutLink.className = 'nav-link text-danger';
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Logout';
            logoutLink.addEventListener('click', logout);
            logoutLi.appendChild(logoutLink);
            sidebarNav.appendChild(logoutLi);
        }

        // Load dashboard based on user role
        function loadDashboard() {
            document.getElementById('page-title').textContent = 'Dashboard';
            document.getElementById('page-subtitle').textContent = 'Overview of your fraud analytics';
            
            if (state.currentUser.role === 'super_admin') {
                loadSuperAdminDashboard();
            } else {
                loadClientDashboard();
            }
        }

        // Load super admin dashboard
        function loadSuperAdminDashboard() {
            const totalClients = state.clients.length;
            const pendingClients = state.clients.filter(c => !c.is_approved).length;
            const approvedClients = state.clients.filter(c => c.is_approved).length;
            const totalTransactions = state.transactions.length;
            const fraudTransactions = state.transactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            
            const recentTransactions = state.transactions.slice(0, 5);
            const recentClients = state.clients.slice(0, 3);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-building fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Approval</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${pendingClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Active Clients</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${approvedClients}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Client</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => {
                                                const client = state.clients.find(c => c.id === transaction.client_id);
                                                return `
                                                    <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                        <td>#${transaction.id}</td>
                                                        <td>${client ? client.name : 'Unknown'}</td>
                                                        <td>$${transaction.amount.toFixed(2)}</td>
                                                        <td>${transaction.date}</td>
                                                        <td>
                                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                                ${Math.round(transaction.fraud_score * 100)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${transaction.is_fraud ? 
                                                                '<span class="badge bg-danger">Fraud</span>' : 
                                                                '<span class="badge bg-success">Legitimate</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Clients</h6>
                            </div>
                            <div class="card-body">
                                ${recentClients.map(client => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="flex-shrink-0">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                <i class="fas fa-building"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${client.name}</h6>
                                            <small class="text-muted">${client.industry}</small>
                                        </div>
                                        <div>
                                            ${client.is_approved ? 
                                                '<span class="badge bg-success">Approved</span>' : 
                                                '<span class="badge bg-warning">Pending</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load client dashboard
        function loadClientDashboard() {
            // Filter transactions for current client
            const clientTransactions = state.transactions.filter(
                t => t.client_id === state.currentUser.client_id
            );
            
            const totalTransactions = clientTransactions.length;
            const fraudTransactions = clientTransactions.filter(t => t.is_fraud).length;
            const fraudRate = totalTransactions > 0 ? (fraudTransactions / totalTransactions * 100) : 0;
            const totalAmount = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const fraudAmount = clientTransactions.filter(t => t.is_fraud).reduce((sum, t) => sum + t.amount, 0);
            
            const recentTransactions = clientTransactions.slice(0, 5);
            
            const content = `
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${totalTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-list-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Fraud Transactions</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudTransactions}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Fraud Rate</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${fraudRate.toFixed(2)}%</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Protected Amount</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">$${fraudAmount.toFixed(2)}</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Fraud Distribution</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="fraudChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg-6">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Recent Transactions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Fraud Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentTransactions.map(transaction => `
                                                <tr class="transaction-row" onclick="viewTransaction(${transaction.id})">
                                                    <td>#${transaction.id}</td>
                                                    <td>$${transaction.amount.toFixed(2)}</td>
                                                    <td>${transaction.date}</td>
                                                    <td>
                                                        <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}">
                                                            ${Math.round(transaction.fraud_score * 100)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${transaction.is_fraud ? 
                                                            '<span class="badge bg-danger">Fraud</span>' : 
                                                            '<span class="badge bg-success">Legitimate</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render fraud chart
            setTimeout(() => {
                const ctx = document.getElementById('fraudChart').getContext('2d');
                renderFraudChart(ctx, fraudRate, 100 - fraudRate);
            }, 100);
        }

        // Load manage clients page (super admin only)
        function loadManageClients() {
            document.getElementById('page-title').textContent = 'Manage Clients';
            document.getElementById('page-subtitle').textContent = 'Approve or disapprove client organizations';
            
            const content = `
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">All Client Organizations</h6>
                        <span class="badge bg-primary">${state.clients.length} Total</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Organization</th>
                                        <th>Industry</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.clients.map(client => `
                                        <tr>
                                            <td>#${client.id}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-shrink-0">
                                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 ms-3">
                                                        <h6 class="mb-0">${client.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${client.industry}</td>
                                            <td>${client.registration_date}</td>
                                            <td>
                                                ${client.is_approved ? 
                                                    '<span class="badge bg-success">Approved</span>' : 
                                                    '<span class="badge bg-warning">Pending</span>'}
                                            </td>
                                            <td>
                                                ${client.is_approved ? 
                                                    `<button class="btn btn-sm btn-warning" onclick="disapproveClient(${client.id})">
                                                        <i class="fas fa-times me-1"></i>Disapprove
                                                    </button>` : 
                                                    `<button class="btn btn-sm btn-success" onclick="approveClient(${client.id})">
                                                        <i class="fas fa-check me-1"></i>Approve
                                                    </button>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load upload data page
        function loadUploadData() {
            document.getElementById('page-title').textContent = 'Upload Data';
            document.getElementById('page-subtitle').textContent = 'Upload transaction data for fraud analysis';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Upload Transaction Data</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>File Requirements</h6>
                                    <p class="mb-0">Upload CSV or Excel files with transaction data. Ensure your file includes these columns:</p>
                                    <ul class="mb-0 mt-2">
                                        <li><strong>amount</strong> (required): Transaction amount</li>
                                        <li><strong>date</strong> (required): Transaction date (YYYY-MM-DD)</li>
                                        <li><strong>description</strong> (optional): Transaction description</li>
                                        <li><strong>category</strong> (optional): Transaction category</li>
                                    </ul>
                                </div>
                                
                                <div class="upload-dropzone" id="upload-dropzone">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>Drag and drop your file here</h5>
                                    <p class="text-muted">or click to browse files</p>
                                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls">
                                    <button class="btn btn-primary mt-2" onclick="document.getElementById('file-input').click()">
                                        <i class="fas fa-folder-open me-2"></i>Select File
                                    </button>
                                </div>
                                
                                <div class="mt-4" id="file-info"></div>
                                
                                <div class="mt-4">
                                    <button class="btn btn-primary btn-lg" id="upload-button" disabled>
                                        <i class="fas fa-cogs me-2"></i>Process File for Fraud Detection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Set up file upload handling
            const dropzone = document.getElementById('upload-dropzone');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const uploadButton = document.getElementById('upload-button');
            
            // Drag and drop handling
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropzone.classList.add('active');
            }
            
            function unhighlight() {
                dropzone.classList.remove('active');
            }
            
            dropzone.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });
            
            function handleFiles(files) {
                if (files.length > 0) {
                    const file = files[0];
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-file me-2"></i>File Selected</h6>
                            <p class="mb-1"><strong>File:</strong> ${file.name}</p>
                            <p class="mb-0"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                    uploadButton.disabled = false;
                    
                    uploadButton.onclick = function() {
                        processFile(file);
                    };
                }
            }
            
            function processFile(file) {
                // Simulate file processing
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                
                setTimeout(() => {
                    // Add new transactions
                    const newTransactionId = Math.max(...state.transactions.map(t => t.id)) + 1;
                    const newTransactions = [
                        {
                            id: newTransactionId,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 15000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Vendor payment',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Vendor'
                        },
                        {
                            id: newTransactionId + 1,
                            client_id: state.currentUser.client_id,
                            amount: Math.random() * 8000,
                            date: new Date().toISOString().split('T')[0],
                            description: 'Uploaded transaction - Service fee',
                            is_fraud: Math.random() > 0.8,
                            fraud_score: Math.random(),
                            category: 'Services'
                        }
                    ];
                    
                    state.transactions.push(...newTransactions);
                    
                    fileInfo.innerHTML = `
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle me-2"></i>File Processed Successfully!</h6>
                            <p class="mb-1"><strong>Transactions Added:</strong> ${newTransactions.length}</p>
                            <p class="mb-0"><strong>Potential Fraud Detected:</strong> ${newTransactions.filter(t => t.is_fraud).length}</p>
                        </div>
                    `;
                    
                    uploadButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Process File for Fraud Detection';
                    uploadButton.disabled = true;
                    
                    showFlash('File processed successfully! New transactions added for analysis.', 'success');
                }, 2000);
            }
        }

        // Load reports page (available to all authenticated users)
        function loadReports() {
            document.getElementById('page-title').textContent = 'Reports';
            document.getElementById('page-subtitle').textContent = 'Generate and download fraud analysis reports';
            
            // Filter reports based on user role
            let userReports = [];
            if (state.currentUser.role === 'super_admin') {
                userReports = state.reports;
            } else {
                userReports = state.reports.filter(r => 
                    r.client_id === state.currentUser.client_id || r.client_id === null
                );
            }
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Available Reports</h6>
                                <button class="btn btn-primary" onclick="generateNewReport()">
                                    <i class="fas fa-plus me-2"></i>Generate New Report
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${userReports.map(report => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <div class="card report-card h-100">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center mb-3">
                                                        <div class="flex-shrink-0">
                                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                                <i class="fas fa-file-alt"></i>
                                                            </div>
                                                        </div>
                                                        <div class="flex-grow-1 ms-3">
                                                            <h6 class="mb-0">${report.name}</h6>
                                                            <small class="text-muted">${report.type.replace('_', ' ')}</small>
                                                        </div>
                                                    </div>
                                                    <p class="card-text text-muted small">Generated on ${report.date}</p>
                                                    <div class="d-grid gap-2">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="downloadReport(${report.id})">
                                                            <i class="fas fa-download me-1"></i>Download PDF
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="viewReport(${report.id})">
                                                            <i class="fas fa-eye me-1"></i>Preview
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load manage staff page (client admin only)
        function loadManageStaff() {
            document.getElementById('page-title').textContent = 'Manage Staff';
            document.getElementById('page-subtitle').textContent = 'Add and manage staff members for your organization';
            
            // Filter staff for current client
            const clientStaff = state.users.filter(
                u => u.client_id === state.currentUser.client_id && u.role === 'staff'
            );
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-primary">Staff Members</h6>
                                <button class="btn btn-primary" onclick="showAddStaffModal()">
                                    <i class="fas fa-plus me-2"></i>Add Staff Member
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clientStaff.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-3">
                                                                <h6 class="mb-0">${user.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>${user.email}</td>
                                                    <td>${user.last_login || 'Never'}</td>
                                                    <td>
                                                        ${user.is_approved ? 
                                                            '<span class="badge bg-success">Active</span>' : 
                                                            '<span class="badge bg-warning">Pending</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${user.id})">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Load platform analytics (super admin only)
        function loadPlatformAnalytics() {
            document.getElementById('page-title').textContent = 'Platform Analytics';
            document.getElementById('page-subtitle').textContent = 'Comprehensive platform-wide analytics and insights';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Platform Overview</h6>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="platformChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
            
            // Render platform chart
            setTimeout(() => {
                const ctx = document.getElementById('platformChart').getContext('2d');
                renderPlatformChart(ctx);
            }, 100);
        }

        // Load system reports (super admin only)
        function loadSystemReports() {
            document.getElementById('page-title').textContent = 'System Reports';
            document.getElementById('page-subtitle').textContent = 'Platform-wide system reports and analytics';
            
            const content = `
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">System Reports</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>System Reports</h6>
                                    <p class="mb-0">Comprehensive system-wide reports for platform administration and monitoring.</p>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-chart-bar fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Platform Performance</h5>
                                                <p class="card-text">Overall platform performance metrics and usage statistics</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('performance')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-users fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">User Activity</h5>
                                                <p class="card-text">Detailed user activity logs and access patterns</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('user_activity')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4 mb-4">
                                        <div class="card report-card h-100">
                                            <div class="card-body text-center">
                                                <div class="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 64px; height: 64px;">
                                                    <i class="fas fa-shield-alt fa-2x"></i>
                                                </div>
                                                <h5 class="card-title">Security Audit</h5>
                                                <p class="card-text">Security audit report and compliance status</p>
                                                <button class="btn btn-primary" onclick="downloadSystemReport('security_audit')">
                                                    <i class="fas fa-download me-2"></i>Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('page-content').innerHTML = content;
        }

        // Show add staff modal
        function showAddStaffModal() {
            const modalHTML = `
                <div class="modal fade" id="addStaffModal" tabindex="-1" aria-labelledby="addStaffModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="addStaffModalLabel">Add New Staff Member</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-staff-form">
                                    <div class="mb-3">
                                        <label for="staff-name" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="staff-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="staff-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="staff-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="staff-password" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="addStaff()">Add Staff</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('addStaffModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
            modal.show();
        }

        // Add new staff member
        function addStaff() {
            const name = document.getElementById('staff-name').value;
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            
            if (!name || !email || !password) {
                showFlash('Please fill all fields', 'danger');
                return;
            }
            
            // Check if email already exists
            if (state.users.some(u => u.email === email)) {
                showFlash('Email already registered', 'danger');
                return;
            }
            
            // Create new staff user
            const newUserId = Math.max(...state.users.map(u => u.id)) + 1;
            const newUser = {
                id: newUserId,
                email: email,
                name: name,
                role: 'staff',
                client_id: state.currentUser.client_id,
                is_approved: true,
                last_login: null
            };
            
            state.users.push(newUser);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
            modal.hide();
            
            // Reload manage staff page
            loadManageStaff();
            showFlash('Staff member added successfully!', 'success');
        }

        // Delete staff member
        function deleteStaff(staffId) {
            if (confirm('Are you sure you want to delete this staff member?')) {
                state.users = state.users.filter(u => u.id !== staffId);
                loadManageStaff();
                showFlash('Staff member deleted successfully!', 'success');
            }
        }

        // Approve client
        function approveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = true;
                
                // Also approve any pending users for this client
                state.users.forEach(u => {
                    if (u.client_id === clientId) {
                        u.is_approved = true;
                    }
                });
                
                loadManageClients();
                showFlash('Client approved successfully!', 'success');
            }
        }

        // Disapprove client
        function disapproveClient(clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client) {
                client.is_approved = false;
                loadManageClients();
                showFlash('Client disapproved successfully!', 'success');
            }
        }

        // View transaction details
        function viewTransaction(transactionId) {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            const client = state.clients.find(c => c.id === transaction.client_id);
            
            const modalHTML = `
                <div class="modal fade" id="transactionModal" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="transactionModalLabel">Transaction Details #${transaction.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Transaction Information</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <th width="40%">Transaction ID:</th>
                                                <td>#${transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Client:</th>
                                                <td>${client ? client.name : 'Unknown'}</td>
                                            </tr>
                                            <tr>
                                                <th>Amount:</th>
                                                <td>$${transaction.amount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <th>Date:</th>
                                                <td>${transaction.date}</td>
                                            </tr>
                                            <tr>
                                                <th>Description:</th>
                                                <td>${transaction.description}</td>
                                            </tr>
                                            <tr>
                                                <th>Category:</th>
                                                <td>${transaction.category || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-3">Fraud Analysis</h6>
                                        <div class="text-center mb-4">
                                            <span class="fraud-score ${getFraudScoreClass(transaction.fraud_score)}" style="font-size: 1.2rem;">
                                                ${Math.round(transaction.fraud_score * 100)}% Fraud Score
                                            </span>
                                        </div>
                                        <div class="text-center">
                                            ${transaction.is_fraud ? 
                                                '<span class="badge bg-danger p-2" style="font-size: 1rem;">Confirmed Fraud</span>' : 
                                                '<span class="badge bg-success p-2" style="font-size: 1rem;">Legitimate Transaction</span>'}
                                        </div>
                                        <div class="mt-4">
                                            <h6>Risk Factors:</h6>
                                            <ul class="list-unstyled">
                                                ${transaction.amount > 10000 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>High transaction amount</li>' : ''}
                                                ${transaction.fraud_score > 0.7 ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Multiple suspicious patterns detected</li>' : ''}
                                                ${!transaction.category ? '<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>Missing transaction category</li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="downloadTransactionReport(${transaction.id})">
                                    <i class="fas fa-download me-2"></i>Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page if it doesn't exist
            if (!document.getElementById('transactionModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        }

        // Generate new report
        function generateNewReport() {
            showFlash('Generating new report...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                const newReportId = Math.max(...state.reports.map(r => r.id)) + 1;
                const reportTypes = ['fraud_analysis', 'transaction_summary', 'risk_assessment'];
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                
                const newReport = {
                    id: newReportId,
                    name: `Custom Report ${new Date().toLocaleDateString()}`,
                    type: reportType,
                    date: new Date().toISOString().split('T')[0],
                    client_id: state.currentUser.role === 'super_admin' ? null : state.currentUser.client_id
                };
                
                state.reports.push(newReport);
                loadReports();
                showFlash('New report generated successfully!', 'success');
            }, 2000);
        }

        // Download report
        function downloadReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Downloading ${report.name}...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download system report
        function downloadSystemReport(reportType) {
            showFlash(`Downloading ${reportType.replace('_', ' ')} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `system_${reportType}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('System report downloaded successfully!', 'success');
            }, 1500);
        }

        // Download transaction report
        function downloadTransactionReport(transactionId) {
            showFlash(`Downloading transaction #${transactionId} report...`, 'info');
            
            // Simulate download
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDM1IDAgUi9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERi9UZXh0XT4+L01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolRU9GCg==';
                link.download = `transaction_${transactionId}_report.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showFlash('Transaction report downloaded successfully!', 'success');
            }, 1500);
        }

        // View report
        function viewReport(reportId) {
            const report = state.reports.find(r => r.id === reportId);
            if (!report) return;
            
            showFlash(`Opening preview for ${report.name}...`, 'info');
            // In a real application, this would open a preview modal or page
        }

        // Get fraud score class for styling
        function getFraudScoreClass(score) {
            if (score < 0.3) return 'low';
            if (score < 0.7) return 'medium';
            return 'high';
        }

        // Render fraud chart
        function renderFraudChart(ctx, fraudRate, legitimateRate) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Fraud', 'Legitimate'],
                    datasets: [{
                        data: [fraudRate, legitimateRate],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#e02d1b', '#17a673'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Render platform chart
        function renderPlatformChart(ctx) {
            const industries = [...new Set(state.clients.map(c => c.industry))];
            const industryCounts = industries.map(industry => 
                state.clients.filter(c => c.industry === industry).length
            );
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: industries,
                    datasets: [{
                        label: 'Clients by Industry',
                        data: industryCounts,
                        backgroundColor: '#4e73df',
                        borderColor: '#4e73df',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        // Handle chat submission
        function handleChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "I've analyzed your transaction data and found 3 potential fraud cases in the last week.",
                    "The fraud detection model is currently running with 94% accuracy across all clients.",
                    "Would you like me to generate a custom report of suspicious transactions?",
                    "I notice a pattern of high-value transactions from new vendors. Would you like to investigate further?",
                    "Based on recent activity, I recommend reviewing transactions above $10,000 from the past 7 days.",
                    "The AI model has detected an unusual pattern in vendor payments. Should I flag these for review?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('ai', randomResponse);
            }, 1000);
        }

        // Add chat message
        function addChatMessage(sender, message) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-3 ${sender === 'user' ? 'text-end' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `d-inline-block p-3 rounded-3 ${sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`;
            bubble.style.maxWidth = '80%';
            bubble.innerHTML = `<div class="fw-semibold small mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>${message}`;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Toggle chatboard
        function toggleChatboard() {
            const chatboardBody = document.getElementById('chatboard-body');
            const icon = document.querySelector('#chatboard-toggle i');
            
            if (chatboardBody.style.display === 'none') {
                chatboardBody.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                chatboardBody.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }

        // Show flash message
        function showFlash(message, type) {
            const flashContainer = document.getElementById('flash-messages');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show flash-message`;
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            flashContainer.appendChild(alert);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }

        // Logout
        function logout() {
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authenticated-pages').style.display = 'none';
            document.getElementById('public-pages').style.display = 'block';
            showSection('landing-page');
            showFlash('You have been logged out successfully.', 'info');
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);
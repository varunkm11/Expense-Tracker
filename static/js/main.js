// AI-Enhanced Student Expense Tracker - Advanced Interactive Experience

// Global AI State
let aiContext = {
    isActive: false,
    insights: [],
    userBehavior: {
        clickCount: 0,
        timeSpent: 0,
        lastAction: null
    }
};

// Neural Network Visualization
class NeuralNetwork {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.init();
    }

    init() {
        // Create nodes
        for (let i = 0; i < 20; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                pulse: Math.random() * Math.PI * 2
            });
        }
        this.animate();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw nodes
        this.nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;
            node.pulse += 0.1;

            // Bounce off edges
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

            // Draw node
            const alpha = 0.3 + Math.sin(node.pulse) * 0.2;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
            this.ctx.fill();
        });

        // Draw connections
        this.nodes.forEach((node1, i) => {
            this.nodes.slice(i + 1).forEach(node2 => {
                const distance = Math.sqrt(
                    Math.pow(node1.x - node2.x, 2) + 
                    Math.pow(node1.y - node2.y, 2)
                );
                
                if (distance < 100) {
                    const alpha = (100 - distance) / 100 * 0.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(node1.x, node1.y);
                    this.ctx.lineTo(node2.x, node2.y);
                    this.ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            });
        });

        requestAnimationFrame(() => this.animate());
    }
}

// AI-Powered Smart Insights
class AIInsightEngine {
    constructor() {
        this.insights = [
            {
                type: 'spending',
                icon: '📊',
                title: 'Smart Spending Analysis',
                message: 'Your food expenses are trending 15% higher this week. Consider meal prep to save ₹400-600.',
                action: 'Set Meal Budget'
            },
            {
                type: 'prediction',
                icon: '🎯',
                title: 'AI Prediction',
                message: 'Based on current patterns, you\'ll save ₹800 this month by optimizing transport costs.',
                action: 'View Transport Tips'
            },
            {
                type: 'achievement',
                icon: '🏆',
                title: 'Achievement Unlocked',
                message: 'You\'ve maintained budget discipline for 7 days straight! Keep it up!',
                action: 'Share Achievement'
            },
            {
                type: 'warning',
                icon: '⚠️',
                title: 'Smart Alert',
                message: 'High spending detected today. You\'re ₹200 above your daily average.',
                action: 'Review Expenses'
            }
        ];
    }

    generateInsight() {
        const randomInsight = this.insights[Math.floor(Math.random() * this.insights.length)];
        return {
            ...randomInsight,
            timestamp: new Date(),
            id: Date.now()
        };
    }

    displayInsight(insight) {
        const notification = document.createElement('div');
        notification.className = 'smart-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.5rem;">${insight.icon}</span>
                <strong style="color: var(--neon-blue);">${insight.title}</strong>
            </div>
            <p style="margin: 0.5rem 0; color: var(--medium-grey);">${insight.message}</p>
            <button onclick="dismissNotification(this)" 
                    style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--neon-purple); 
                           border: none; border-radius: 8px; color: white; cursor: pointer;">
                ${insight.action}
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto dismiss after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize neural network background
    const neuralCanvas = document.createElement('canvas');
    neuralCanvas.style.position = 'fixed';
    neuralCanvas.style.top = '0';
    neuralCanvas.style.left = '0';
    neuralCanvas.style.width = '100%';
    neuralCanvas.style.height = '100%';
    neuralCanvas.style.pointerEvents = 'none';
    neuralCanvas.style.zIndex = '-1';
    neuralCanvas.style.opacity = '0.3';
    neuralCanvas.width = window.innerWidth;
    neuralCanvas.height = window.innerHeight;
    document.body.appendChild(neuralCanvas);
    
    new NeuralNetwork(neuralCanvas);
    
    // Initialize AI insight engine
    const aiEngine = new AIInsightEngine();
    
    // Show random insights
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every interval
            const insight = aiEngine.generateInsight();
            aiEngine.displayInsight(insight);
        }
    }, 15000); // Every 15 seconds
    
    // Add floating action button
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.innerHTML = '🤖';
    fab.title = 'AI Assistant';
    fab.onclick = activateAIAssistant;
    document.body.appendChild(fab);
    
    // Initialize animations
    initAnimations();
    
    // Auto-hide messages
    autoHideMessages();
    
    // Form enhancements
    enhanceForms();
    
    // Chart initialization
    initCharts();
    
    // Add smooth scrolling
    addSmoothScrolling();
    
    // Enhance existing elements
    enhanceExistingElements();
    
    // Initialize smart animations
    initializeSmartAnimations();
});

// Animation Initialization
function initAnimations() {
    // Fade in elements on page load
    const fadeElements = document.querySelectorAll('.card, .stat-card, .category-item');
    fadeElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Animate navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Auto-hide messages after 5 seconds
function autoHideMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        setTimeout(() => {
            message.style.transform = 'translateX(100%)';
            message.style.opacity = '0';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    });
}

// Form enhancements
function enhanceForms() {
    // Add floating label effect
    const formInputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
    formInputs.forEach(input => {
        // Add focus effects
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        // Add input validation visual feedback
        input.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
    
    // Enhance buttons with loading states
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.type === 'submit') {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
                
                // Add loading state
                const originalText = this.textContent;
                this.innerHTML = '<span class="loading"></span> Processing...';
                this.disabled = true;
                
                // Re-enable after form submission (this is handled by page redirect usually)
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                }, 3000);
            }
        });
    });
}

// Chart initialization
function initCharts() {
    // Monthly spending chart
    const monthlyChart = document.getElementById('monthlyChart');
    if (monthlyChart) {
        createMonthlyChart(monthlyChart);
    }
    
    // Category chart
    const categoryChart = document.getElementById('categoryChart');
    if (categoryChart) {
        createCategoryChart(categoryChart);
    }
    
    // Daily expenses chart
    const dailyChart = document.getElementById('dailyChart');
    if (dailyChart) {
        createDailyChart(dailyChart);
    }
}

// Create monthly spending chart
function createMonthlyChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Get data from data attributes or default values
    const data = JSON.parse(canvas.dataset.chartData || '{}');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Expenses (₹)',
                data: data.values || [3000, 2500, 4000, 3500, 2800, 4200],
                borderColor: '#000000',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#000000',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e0e0e0'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        color: '#e0e0e0'
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutCubic'
            }
        }
    });
}

// Create category chart
function createCategoryChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Get data from data attributes
    const data = JSON.parse(canvas.dataset.chartData || '{}');
    
    const colors = [
        'rgba(0, 0, 0, 0.8)',
        'rgba(102, 102, 102, 0.8)',
        'rgba(46, 204, 113, 0.8)',
        'rgba(52, 152, 219, 0.8)',
        'rgba(243, 156, 18, 0.8)',
        'rgba(231, 76, 60, 0.8)'
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels || ['Food', 'Transport', 'Books', 'Entertainment', 'Others'],
            datasets: [{
                data: data.values || [1500, 500, 800, 400, 300],
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 2000
            }
        }
    });
}

// Create daily expenses chart
function createDailyChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Get data from data attributes
    const data = JSON.parse(canvas.dataset.chartData || '{}');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels || Array.from({length: 30}, (_, i) => i + 1),
            datasets: [{
                label: 'Daily Expenses (₹)',
                data: data.values || Array.from({length: 30}, () => Math.floor(Math.random() * 500) + 50),
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#000000',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e0e0e0'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutBounce'
            }
        }
    });
}

// Add smooth scrolling for anchor links
function addSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Budget progress animation
function animateBudgetProgress() {
    const progressBars = document.querySelectorAll('.budget-progress-bar');
    progressBars.forEach(bar => {
        const percentage = bar.dataset.percentage || 0;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = percentage + '%';
        }, 500);
    });
}

// Call budget progress animation if elements exist
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateBudgetProgress, 1000);
});

// Add number formatting for Indian currency
function formatIndianCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Add hover effects to table rows
document.addEventListener('DOMContentLoaded', function() {
    const tableRows = document.querySelectorAll('.table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.01)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });
});

// Add loading animation for async operations
function showLoading(element) {
    element.innerHTML = '<span class="loading"></span>';
    element.disabled = true;
}

function hideLoading(element, originalText) {
    element.innerHTML = originalText;
    element.disabled = false;
}

// Expense form auto-calculation
document.addEventListener('DOMContentLoaded', function() {
    const amountInput = document.querySelector('input[name="amount"]');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value > 0) {
                this.style.borderColor = '#2ecc71';
                this.style.color = '#2ecc71';
            } else {
                this.style.borderColor = '#e74c3c';
                this.style.color = '#e74c3c';
            }
        });
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + N for new expense
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const addExpenseLink = document.querySelector('a[href*="add"]');
        if (addExpenseLink) {
            addExpenseLink.click();
        }
    }
    
    // Escape to close messages
    if (e.key === 'Escape') {
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => message.remove());
    }
});

// Enhanced interactive functions for AI features
function toggleAIInsights() {
    const panel = document.getElementById('aiInsightsPanel');
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            panel.style.animation = 'slideInRight 0.5s ease-out';
            // Add typing effect to AI insights
            const insights = panel.querySelectorAll('.ai-insight');
            insights.forEach((insight, index) => {
                insight.style.opacity = '0';
                setTimeout(() => {
                    insight.style.opacity = '1';
                    insight.style.animation = 'slideInRight 0.3s ease-out';
                }, index * 200);
            });
        }
    }
}

function closeAIInsights() {
    const panel = document.getElementById('aiInsightsPanel');
    if (panel) {
        panel.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => panel.style.display = 'none', 300);
    }
}

function toggleBudgetAI() {
    const budgetAI = document.getElementById('budgetAI');
    if (budgetAI) {
        const isVisible = budgetAI.style.display !== 'none';
        budgetAI.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            budgetAI.style.animation = 'fadeIn 0.5s ease-out';
        }
    }
}

function toggleCategoryAI() {
    const categoryAI = document.getElementById('categoryAI');
    if (categoryAI) {
        const isVisible = categoryAI.style.display !== 'none';
        categoryAI.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            categoryAI.style.animation = 'fadeIn 0.5s ease-out';
        }
    }
}

function activateAIAssistant() {
    const aiEngine = new AIInsightEngine();
    const insight = aiEngine.generateInsight();
    aiEngine.displayInsight(insight);
    
    // Add voice effect (if available)
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`AI Assistant activated. ${insight.message}`);
        utterance.rate = 0.8;
        utterance.pitch = 1.2;
        speechSynthesis.speak(utterance);
    }
}

function dismissNotification(button) {
    const notification = button.closest('.smart-notification');
    if (notification) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }
}

function enhanceExistingElements() {
    // Convert regular cards to smart cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('smart-card');
    });
    
    // Add neural effects to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.classList.add('neural-stat');
    });
    
    // Enhance buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        if (button.textContent.includes('AI') || button.textContent.includes('🤖')) {
            button.classList.add('btn-ai');
        }
    });
    
    // Add holographic text to titles
    const titles = document.querySelectorAll('h1, h2');
    titles.forEach(title => {
        if (title.textContent.includes('AI') || title.textContent.includes('Smart')) {
            title.classList.add('holo-text');
        }
    });
}

function initializeSmartAnimations() {
    // Add stagger animation to cards
    const cards = document.querySelectorAll('.smart-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'fadeInUp 0.6s ease-out forwards';
    });
    
    // Add pulse effect to important numbers
    const numbers = document.querySelectorAll('.stat-number');
    numbers.forEach(number => {
        number.style.animation = 'neural-pulse 3s ease-in-out infinite';
    });
    
    // Create data streams
    createDataStreams();
}

function createDataStreams() {
    setInterval(() => {
        const stream = document.createElement('div');
        stream.style.cssText = `
            position: fixed;
            top: ${Math.random() * 100}vh;
            left: -20px;
            width: 20px;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
            z-index: -1;
            animation: data-stream 3s linear;
            pointer-events: none;
        `;
        
        document.body.appendChild(stream);
        
        setTimeout(() => stream.remove(), 3000);
    }, 2000);
}

function refreshActivity() {
    const feed = document.getElementById('activityFeed');
    if (feed) {
        feed.style.animation = 'hologram-flicker 0.5s ease-in-out';
        setTimeout(() => {
            feed.style.animation = '';
        }, 500);
    }
}

// Advanced Chart Animations
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = start + (end - start) * progress;
        element.textContent = `₹${Math.floor(currentValue).toLocaleString()}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Initialize value animations on load
setTimeout(() => {
    const valueElements = document.querySelectorAll('.stat-number');
    valueElements.forEach(element => {
        const value = parseInt(element.textContent.replace(/[₹,]/g, ''));
        if (!isNaN(value)) {
            element.textContent = '₹0';
            setTimeout(() => animateValue(element, 0, value, 2000), 500);
        }
    });
}, 1000);

// Responsive neural network
window.addEventListener('resize', function() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// Export for global access
window.aiContext = aiContext;
window.AIInsightEngine = AIInsightEngine;

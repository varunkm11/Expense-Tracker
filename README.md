# 💰 Student Expense Tracker

A minimalist expense tracking application designed specifically for Indian students. Built with Django, featuring a black and light grey color scheme with smooth animations.

## 🎯 Features

### Core Features
- **Daily Expense Tracking**: Add, edit, and delete expenses with ease
- **Smart Categories**: Pre-defined categories tailored for Indian students
- **Monthly Budgets**: Set and track monthly spending limits
- **Visual Analytics**: Beautiful charts and graphs for expense analysis
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### Student-Focused Features
- **Indian Currency (₹)**: All amounts displayed in Indian Rupees
- **Student Categories**: Food, Transport, Books, Entertainment, Health, etc.
- **Budget Suggestions**: Pre-defined budget templates for different student lifestyles
- **Money-Saving Tips**: Contextual tips to help students save money
- **Quick Add**: Common expense shortcuts for faster data entry

### Design Features
- **Minimalist UI**: Clean black and light grey design
- **Smooth Animations**: Subtle animations that bring the app to life
- **Dark Theme**: Easy on the eyes for extended use
- **Intuitive Navigation**: Simple and clean interface

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Django 5.2+
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/expense-tracker.git
   cd expense-tracker
   ```

2. **Create virtual environment** (recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install django pillow
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create default categories**
   ```bash
   python manage.py create_default_categories
   ```

6. **Create superuser** (optional, for admin access)
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the development server**
   ```bash
   python manage.py runserver
   ```

8. **Open your browser** and navigate to `http://127.0.0.1:8000`

## 📱 Usage Guide

### Getting Started
1. **Sign Up**: Create a new account with your details
2. **Set Budget**: Go to Budget Management and set your monthly budget
3. **Add Categories**: Default categories are pre-loaded, but you can customize them
4. **Start Tracking**: Begin adding your daily expenses

### Daily Workflow
1. **Quick Add**: Use the dashboard quick-add suggestions for common expenses
2. **Categorize**: Choose appropriate categories for better tracking
3. **Review**: Check your daily spending on the dashboard
4. **Budget Check**: Monitor your budget progress throughout the month

### Monthly Review
1. **Summary**: View detailed monthly summaries with charts
2. **Analytics**: Analyze spending patterns by category
3. **Budget Analysis**: See how well you stayed within budget
4. **Plan Ahead**: Use insights to plan next month's budget

## 📊 Default Categories

The application comes with pre-configured categories perfect for Indian students:

- 🍽️ **Food** - Meals, snacks, canteen expenses
- 🚌 **Transport** - Bus fare, auto, train tickets
- 📚 **Books** - Textbooks, notebooks, stationery
- 🎬 **Entertainment** - Movies, games, outings
- 🏥 **Health** - Medical expenses, medicines
- 🛒 **Shopping** - Clothes, personal items
- 🎓 **Education** - Course fees, online courses
- 📱 **Mobile/Internet** - Recharge, data plans
- 📦 **Miscellaneous** - Other expenses
- 💰 **Savings** - Money saved or invested

## 💡 Budget Suggestions

### Basic Student (₹2,000/month)
- Food: ₹800 (40%)
- Transport: ₹300 (15%)
- Books: ₹400 (20%)
- Entertainment: ₹300 (15%)
- Savings: ₹200 (10%)

### Regular Student (₹3,500/month)
- Food: ₹1,400 (40%)
- Transport: ₹525 (15%)
- Books: ₹700 (20%)
- Entertainment: ₹525 (15%)
- Savings: ₹350 (10%)

### Comfortable (₹5,000/month)
- Food: ₹2,000 (40%)
- Transport: ₹750 (15%)
- Books: ₹1,000 (20%)
- Entertainment: ₹750 (15%)
- Savings: ₹500 (10%)

## 🎨 Design Philosophy

### Minimalist Approach
- Clean, uncluttered interface
- Focus on essential features
- Intuitive navigation and workflows

### Color Scheme
- **Primary**: Black (#000000) for text and primary elements
- **Secondary**: Light grey (#f5f5f5) for backgrounds
- **Accents**: Green for positive actions, red for warnings
- **Animations**: Subtle hover effects and transitions

### User Experience
- **Fast Loading**: Optimized for quick access
- **Mobile First**: Responsive design that works on all devices
- **Accessibility**: High contrast and readable fonts
- **Progressive Enhancement**: Works with or without JavaScript

## 🔧 Technical Details

### Built With
- **Backend**: Django 5.2 (Python web framework)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: SQLite (can be changed to PostgreSQL/MySQL)
- **Charts**: Chart.js for beautiful visualizations
- **Fonts**: Inter (Google Fonts)

### Architecture
- **Models**: Category, Expense, Budget
- **Views**: Function-based views for simplicity
- **Templates**: Django template system with inheritance
- **Static Files**: CSS and JavaScript for styling and interactivity

### Security Features
- CSRF protection on all forms
- User authentication and session management
- SQL injection protection through Django ORM
- XSS protection through template escaping

## 🛠️ Customization

### Adding New Categories
```python
# In Django admin or through code
from expenses.models import Category

Category.objects.create(
    name="Custom Category",
    icon="🎯",
    color="#3498db"
)
```

### Modifying Budget Rules
You can customize the budget calculation logic in `templates/expenses/budget_management.html` in the JavaScript section.

### Changing Color Scheme
Modify the CSS variables in `static/css/style.css`:
```css
:root {
    --primary-black: #your-color;
    --light-grey: #your-color;
    /* ... other variables ... */
}
```

## 📈 Future Enhancements

### Planned Features
- [ ] Export data to CSV/PDF
- [ ] Expense splitting with friends
- [ ] SMS/Email notifications for budget alerts
- [ ] Machine learning for expense prediction
- [ ] Integration with bank SMS for automatic expense detection
- [ ] Multi-currency support
- [ ] Expense photography and receipts
- [ ] Goals and challenges

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Built with ❤️ for Indian students

## 🐛 Bug Reports

If you find any bugs or have suggestions for improvements, please open an issue on GitHub.

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

---

**Happy Expense Tracking! 💰📊**

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal
from datetime import date

class Category(models.Model):
    """Expense categories tailored for Indian students"""
    name = models.CharField(max_length=50, unique=True)
    icon = models.CharField(max_length=20, default='💰')  # Emoji icons
    color = models.CharField(max_length=7, default='#666666')  # Hex color
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.icon} {self.name}"

class Expense(models.Model):
    """Individual expense record"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=100)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    date = models.DateField(default=date.today)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"₹{self.amount} - {self.title}"

class Budget(models.Model):
    """Monthly budget for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    month = models.DateField()  # First day of the month
    total_budget = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'month']
        ordering = ['-month']
    
    def __str__(self):
        return f"₹{self.total_budget} - {self.month.strftime('%B %Y')}"
    
    def get_spent_amount(self):
        """Calculate total spent in this month"""
        return self.user.expenses.filter(
            date__year=self.month.year,
            date__month=self.month.month
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
    
    def get_remaining_budget(self):
        """Calculate remaining budget"""
        return self.total_budget - self.get_spent_amount()
    
    def get_budget_percentage(self):
        """Get percentage of budget used"""
        spent = self.get_spent_amount()
        if self.total_budget > 0:
            return (spent / self.total_budget) * 100
        return 0

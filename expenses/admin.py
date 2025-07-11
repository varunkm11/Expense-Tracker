from django.contrib import admin
from .models import Category, Expense, Budget

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color']
    list_editable = ['icon', 'color']
    search_fields = ['name']

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'category', 'user', 'date', 'created_at']
    list_filter = ['category', 'date', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'total_budget', 'get_spent_amount', 'get_remaining_budget']
    list_filter = ['month']
    search_fields = ['user__username']
    readonly_fields = ['created_at']

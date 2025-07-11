from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Q
from django.http import JsonResponse
from django.core.paginator import Paginator
from datetime import date, datetime
from calendar import monthrange
import json
from .models import Expense, Category, Budget
from .forms import ExpenseForm, BudgetForm

@login_required
def dashboard(request):
    """Main dashboard showing expense overview"""
    current_date = date.today()
    current_month = current_date.replace(day=1)
    
    # Get current month expenses
    monthly_expenses = Expense.objects.filter(
        user=request.user,
        date__year=current_date.year,
        date__month=current_date.month
    )
    
    # Calculate totals
    total_monthly = monthly_expenses.aggregate(total=Sum('amount'))['total'] or 0
    total_today = monthly_expenses.filter(date=current_date).aggregate(total=Sum('amount'))['total'] or 0
    
    # Get budget for current month
    try:
        current_budget = Budget.objects.get(user=request.user, month=current_month)
        remaining_budget = current_budget.get_remaining_budget()
        budget_percentage = current_budget.get_budget_percentage()
    except Budget.DoesNotExist:
        current_budget = None
        remaining_budget = 0
        budget_percentage = 0
    
    # Get category-wise expenses for current month
    category_expenses = monthly_expenses.values('category__name', 'category__icon', 'category__color').annotate(
        total=Sum('amount')
    ).order_by('-total')
    
    # Get recent expenses
    recent_expenses = Expense.objects.filter(user=request.user).order_by('-date', '-created_at')[:5]
    
    context = {
        'total_monthly': total_monthly,
        'total_today': total_today,
        'current_budget': current_budget,
        'remaining_budget': remaining_budget,
        'budget_percentage': budget_percentage,
        'category_expenses': category_expenses,
        'recent_expenses': recent_expenses,
        'current_month': current_date.strftime('%B %Y'),
    }
    
    return render(request, 'expenses/dashboard.html', context)

@login_required
def add_expense(request):
    """Add new expense"""
    if request.method == 'POST':
        form = ExpenseForm(request.POST)
        if form.is_valid():
            expense = form.save(commit=False)
            expense.user = request.user
            expense.save()
            messages.success(request, f'Expense ₹{expense.amount} added successfully!')
            return redirect('dashboard')
    else:
        form = ExpenseForm()
    
    return render(request, 'expenses/add_expense.html', {'form': form})

@login_required
def expense_list(request):
    """List all expenses with filtering"""
    expenses = Expense.objects.filter(user=request.user)
    
    # Filtering
    category_filter = request.GET.get('category')
    month_filter = request.GET.get('month')
    search_query = request.GET.get('search')
    
    if category_filter:
        expenses = expenses.filter(category_id=category_filter)
    
    if month_filter:
        try:
            month_date = datetime.strptime(month_filter, '%Y-%m').date()
            expenses = expenses.filter(
                date__year=month_date.year,
                date__month=month_date.month
            )
        except ValueError:
            pass
    
    if search_query:
        expenses = expenses.filter(
            Q(title__icontains=search_query) | 
            Q(description__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(expenses, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get categories for filter dropdown
    categories = Category.objects.all()
    
    context = {
        'page_obj': page_obj,
        'categories': categories,
        'current_category': category_filter,
        'current_month': month_filter,
        'search_query': search_query,
    }
    
    return render(request, 'expenses/expense_list.html', context)

@login_required
def edit_expense(request, expense_id):
    """Edit existing expense"""
    expense = get_object_or_404(Expense, id=expense_id, user=request.user)
    
    if request.method == 'POST':
        form = ExpenseForm(request.POST, instance=expense)
        if form.is_valid():
            form.save()
            messages.success(request, 'Expense updated successfully!')
            return redirect('expense_list')
    else:
        form = ExpenseForm(instance=expense)
    
    return render(request, 'expenses/edit_expense.html', {'form': form, 'expense': expense})

@login_required
def delete_expense(request, expense_id):
    """Delete expense"""
    expense = get_object_or_404(Expense, id=expense_id, user=request.user)
    
    if request.method == 'POST':
        expense.delete()
        messages.success(request, 'Expense deleted successfully!')
        return redirect('expense_list')
    
    return render(request, 'expenses/confirm_delete.html', {'expense': expense})

@login_required
def monthly_summary(request):
    """Monthly summary view"""
    year = int(request.GET.get('year', date.today().year))
    month = int(request.GET.get('month', date.today().month))
    
    selected_date = date(year, month, 1)
    
    # Get expenses for the month
    monthly_expenses = Expense.objects.filter(
        user=request.user,
        date__year=year,
        date__month=month
    )
    
    # Calculate totals
    total_amount = monthly_expenses.aggregate(total=Sum('amount'))['total'] or 0
    
    # Category-wise breakdown
    category_breakdown = monthly_expenses.values(
        'category__name', 'category__icon', 'category__color'
    ).annotate(total=Sum('amount')).order_by('-total')
    
    # Daily expenses for chart
    daily_expenses = {}
    days_in_month = monthrange(year, month)[1]
    
    for day in range(1, days_in_month + 1):
        day_total = monthly_expenses.filter(date__day=day).aggregate(
            total=Sum('amount')
        )['total'] or 0
        daily_expenses[day] = float(day_total)
    
    # Get budget
    try:
        budget = Budget.objects.get(user=request.user, month=selected_date)
    except Budget.DoesNotExist:
        budget = None
    
    context = {
        'selected_date': selected_date,
        'total_amount': total_amount,
        'category_breakdown': category_breakdown,
        'daily_expenses': daily_expenses,
        'budget': budget,
        'year': year,
        'month': month,
    }
    
    return render(request, 'expenses/monthly_summary.html', context)

@login_required
def budget_management(request):
    """Manage monthly budgets"""
    if request.method == 'POST':
        form = BudgetForm(request.POST)
        if form.is_valid():
            budget = form.save(commit=False)
            budget.user = request.user
            # Set to first day of the month
            budget.month = budget.month.replace(day=1)
            try:
                budget.save()
                messages.success(request, 'Budget saved successfully!')
            except:
                messages.error(request, 'Budget for this month already exists!')
            return redirect('budget_management')
    else:
        form = BudgetForm()
    
    # Get all budgets
    budgets = Budget.objects.filter(user=request.user)
    
    context = {
        'form': form,
        'budgets': budgets,
    }
    
    return render(request, 'expenses/budget_management.html', context)

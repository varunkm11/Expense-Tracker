import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { MonthlySummaryData, Expense, Income, Budget } from '@shared/api';

interface PDFOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm' | 'pt' | 'in';
  format?: string | number[];
}

export class PDFGenerator {
  private doc: jsPDF;

  constructor(options: PDFOptions = {}) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: options.unit || 'mm',
      format: options.format || 'a4'
    });
  }

  generateMonthlySummaryPDF(data: MonthlySummaryData): void {
    // Set up fonts and colors
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.doc.setTextColor(51, 51, 51);

    // Title
    this.doc.text('Monthly Financial Summary', 20, 20);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.period.month, 20, 30);

    // Summary cards
    this.addSummaryCards(data);

    // Category breakdown
    this.addCategoryBreakdown(data);

    // Expenses table
    this.addExpensesTable(data.expenses);

    // Income table
    if (data.incomes.length > 0) {
      this.addIncomeTable(data.incomes);
    }

    // Budget overview
    if (data.budgets.length > 0) {
      this.addBudgetOverview(data.budgets);
    }

    // Insights
    this.addInsights(data.insights);

    // Footer
    this.addFooter();
  }

  private addSummaryCards(data: MonthlySummaryData): void {
    const startY = 45;
    const cardHeight = 20;
    const cardWidth = 45;

    // Income card
    this.doc.setFillColor(240, 253, 244); // Green background
    this.doc.rect(20, startY, cardWidth, cardHeight, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('Total Income', 22, startY + 8);
    this.doc.setFontSize(14);
    this.doc.text(`₹${data.totals.income.toLocaleString()}`, 22, startY + 16);

    // Expenses card
    this.doc.setFillColor(254, 242, 242); // Red background
    this.doc.rect(70, startY, cardWidth, cardHeight, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('Total Expenses', 72, startY + 8);
    this.doc.setFontSize(14);
    this.doc.text(`₹${data.totals.expenses.toLocaleString()}`, 72, startY + 16);

    // Savings card
    const savingsColor = data.totals.savings >= 0 ? [240, 253, 244] : [254, 242, 242];
    this.doc.setFillColor(savingsColor[0], savingsColor[1], savingsColor[2]);
    this.doc.rect(120, startY, cardWidth, cardHeight, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('Net Savings', 122, startY + 8);
    this.doc.setFontSize(14);
    this.doc.text(`₹${data.totals.savings.toLocaleString()}`, 122, startY + 16);

    // Savings rate
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Savings Rate: ${data.totals.savingsRate.toFixed(1)}%`, 122, startY + 25);
  }

  private addCategoryBreakdown(data: MonthlySummaryData): void {
    const startY = 85;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Category Breakdown', 20, startY);

    const tableData = data.categoryExpenses.map(cat => [
      cat._id,
      `₹${cat.total.toLocaleString()}`,
      cat.count.toString(),
      `${((cat.total / data.totals.expenses) * 100).toFixed(1)}%`
    ]);

    autoTable(this.doc, {
      startY: startY + 5,
      head: [['Category', 'Amount', 'Transactions', 'Percentage']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 147, 70] },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'right' }
      }
    });
  }

  private addExpensesTable(expenses: Expense[]): void {
    const finalY = (this.doc as any).lastAutoTable?.finalY || 120;
    const startY = finalY + 15;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Recent Expenses', 20, startY);

    // Show only top 15 expenses to fit on page
    const recentExpenses = expenses.slice(0, 15);
    
    const tableData = recentExpenses.map(expense => [
      format(new Date(expense.date), 'MMM dd'),
      expense.category,
      expense.description.length > 30 
        ? expense.description.substring(0, 30) + '...' 
        : expense.description,
      `₹${expense.amount.toLocaleString()}`,
      expense.paidBy
    ]);

    autoTable(this.doc, {
      startY: startY + 5,
      head: [['Date', 'Category', 'Description', 'Amount', 'Paid By']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [255, 147, 70] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 60 },
        3: { halign: 'right', cellWidth: 25 },
        4: { cellWidth: 25 }
      }
    });

    if (expenses.length > 15) {
      const tableEndY = (this.doc as any).lastAutoTable?.finalY || startY + 50;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(`... and ${expenses.length - 15} more expenses`, 20, tableEndY + 10);
    }
  }

  private addIncomeTable(incomes: Income[]): void {
    const finalY = (this.doc as any).lastAutoTable?.finalY || 180;
    const startY = finalY + 15;

    // Check if we need a new page
    if (startY > 250) {
      this.doc.addPage();
      this.addIncomeTable(incomes);
      return;
    }

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Income Sources', 20, startY);

    const tableData = incomes.map(income => [
      format(new Date(income.date), 'MMM dd'),
      income.source,
      income.description.length > 40 
        ? income.description.substring(0, 40) + '...' 
        : income.description,
      `₹${income.amount.toLocaleString()}`,
      income.taxable ? 'Yes' : 'No'
    ]);

    autoTable(this.doc, {
      startY: startY + 5,
      head: [['Date', 'Source', 'Description', 'Amount', 'Taxable']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 70 },
        3: { halign: 'right', cellWidth: 25 },
        4: { cellWidth: 20 }
      }
    });
  }

  private addBudgetOverview(budgets: Budget[]): void {
    const finalY = (this.doc as any).lastAutoTable?.finalY || 200;
    let startY = finalY + 15;

    // Check if we need a new page
    if (startY > 230) {
      this.doc.addPage();
      startY = 20;
    }

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Budget Overview', 20, startY);

    const tableData = budgets.map(budget => [
      budget.category,
      `₹${budget.limit.toLocaleString()}`,
      `₹${budget.spent.toLocaleString()}`,
      `₹${budget.remaining?.toLocaleString() || '0'}`,
      `${budget.progress?.toFixed(1) || '0'}%`,
      budget.status || 'safe'
    ]);

    autoTable(this.doc, {
      startY: startY + 5,
      head: [['Category', 'Budget', 'Spent', 'Remaining', 'Progress', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [139, 69, 19] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const status = data.cell.text[0];
          switch (status) {
            case 'exceeded':
              data.cell.styles.textColor = [220, 38, 38];
              break;
            case 'warning':
              data.cell.styles.textColor = [245, 158, 11];
              break;
            case 'caution':
              data.cell.styles.textColor = [249, 115, 22];
              break;
            default:
              data.cell.styles.textColor = [34, 197, 94];
          }
        }
      }
    });
  }

  private addInsights(insights: string[]): void {
    const finalY = (this.doc as any).lastAutoTable?.finalY || 220;
    let startY = finalY + 15;

    // Check if we need a new page
    if (startY > 240) {
      this.doc.addPage();
      startY = 20;
    }

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Financial Insights', 20, startY);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    let currentY = startY + 10;
    insights.forEach((insight, index) => {
      if (currentY > 270) {
        this.doc.addPage();
        currentY = 20;
      }

      // Add bullet point
      this.doc.text(`• ${insight}`, 20, currentY);
      currentY += 8;
    });
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Add page number
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.doc.internal.pageSize.getWidth() - 30,
        this.doc.internal.pageSize.getHeight() - 10
      );

      // Add generation date
      this.doc.text(
        `Generated on ${format(new Date(), 'PPP')}`,
        20,
        this.doc.internal.pageSize.getHeight() - 10
      );
    }
  }

  save(filename: string): void {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }

  getDataUrl(): string {
    return this.doc.output('dataurlstring');
  }
}

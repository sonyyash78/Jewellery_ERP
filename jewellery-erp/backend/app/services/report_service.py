"""
Report Service - Unified financial reporting using CalculationService.
All reports use historical transaction rates, not current live rates.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime
from typing import Dict, List, Optional
from app.services.calculation_service import CalculationService
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.models.expense import Expense
from app.models.gold_calculation import GoldCalculation
from app.models.silver_calculation import SilverCalculation

class ReportService:
    """Unified report service using CalculationService for all calculations."""
    
    @staticmethod
    def get_sales_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, any]:
        """
        Generate sales report using actual database values.
        No recalculation - uses stored transaction values.
        """
        query = db.query(Invoice)
        
        if start_date:
            query = query.filter(func.date(Invoice.invoice_date) >= start_date)
        if end_date:
            query = query.filter(func.date(Invoice.invoice_date) <= end_date)
        
        invoices = query.all()
        
        total_sales = Decimal('0')
        total_taxable = Decimal('0')
        total_gst = Decimal('0')
        total_discount = Decimal('0')
        
        for invoice in invoices:
            # Use actual stored values from database
            grand_total = Decimal(str(invoice.grand_total))
            subtotal = Decimal(str(invoice.subtotal))
            discount = Decimal(str(invoice.discount_amount))
            tax_amount = Decimal(str(invoice.tax_amount))
            
            total_sales += grand_total
            total_taxable += subtotal
            total_discount += discount
            total_gst += tax_amount
        
        # Split GST into components (assuming 3% = 1.5% CGST + 1.5% SGST)
        # This is an approximation - ideally store CGST/SGST separately
        total_cgst = total_gst / Decimal('2')
        total_sgst = total_gst / Decimal('2')
        total_igst = Decimal('0')
        
        return {
            'total_sales': float(CalculationService._round_final(total_sales)),
            'total_taxable': float(CalculationService._round_final(total_taxable)),
            'total_gst': float(CalculationService._round_final(total_gst)),
            'total_cgst': float(CalculationService._round_final(total_cgst)),
            'total_sgst': float(CalculationService._round_final(total_sgst)),
            'total_igst': float(CalculationService._round_final(total_igst)),
            'output_gst': float(CalculationService._round_final(total_gst)),
            'total_discount': float(CalculationService._round_final(total_discount)),
            'invoice_count': len(invoices)
        }
    
    @staticmethod
    def get_purchase_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, any]:
        """
        Generate purchase report using actual database values.
        No recalculation - uses stored transaction values.
        """
        query = db.query(Purchase)
        
        if start_date:
            query = query.filter(func.date(Purchase.created_at) >= start_date)
        if end_date:
            query = query.filter(func.date(Purchase.created_at) <= end_date)
        
        purchases = query.all()
        
        total_purchases = Decimal('0')
        total_taxable = Decimal('0')
        total_cgst = Decimal('0')
        total_sgst = Decimal('0')
        total_igst = Decimal('0')
        
        for purchase in purchases:
            # Use actual stored values from database
            total_purchases += Decimal(str(purchase.grand_total))
            total_taxable += Decimal(str(purchase.total_taxable))
            total_cgst += Decimal(str(purchase.cgst))
            total_sgst += Decimal(str(purchase.sgst))
            total_igst += Decimal(str(purchase.igst))
        
        # Validate: Grand Total = Taxable + CGST + SGST + IGST
        input_gst = total_cgst + total_sgst + total_igst
        calculated_grand_total = total_taxable + input_gst
        
        # Use actual grand total from database, but log if mismatch
        if abs(calculated_grand_total - total_purchases) > Decimal('1.00'):
            print(f"WARNING: Purchase total mismatch. DB: {total_purchases}, Calculated: {calculated_grand_total}")
        
        return {
            'total_purchases': float(CalculationService._round_final(total_purchases)),
            'total_taxable': float(CalculationService._round_final(total_taxable)),
            'total_cgst': float(CalculationService._round_final(total_cgst)),
            'total_sgst': float(CalculationService._round_final(total_sgst)),
            'total_igst': float(CalculationService._round_final(total_igst)),
            'input_gst': float(CalculationService._round_final(input_gst)),
            'purchase_count': len(purchases)
        }
    
    @staticmethod
    def get_gst_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, any]:
        """
        Generate GST report with Input Tax Credit calculation.
        Uses actual database values, no recalculation.
        
        GST = CGST + SGST + IGST
        Output GST = Sum(Sales GST)
        Input GST = Sum(Purchase GST)
        Net GST = Output GST - Input GST (ITC)
        """
        sales_report = ReportService.get_sales_report(db, start_date, end_date)
        purchase_report = ReportService.get_purchase_report(db, start_date, end_date)
        
        # Use actual GST values from database
        output_gst = Decimal(str(sales_report['output_gst']))
        input_gst = Decimal(str(purchase_report['input_gst']))
        
        # Validate: GST = CGST + SGST + IGST
        output_gst_calculated = (
            Decimal(str(sales_report['total_cgst'])) +
            Decimal(str(sales_report['total_sgst'])) +
            Decimal(str(sales_report['total_igst']))
        )
        
        input_gst_calculated = (
            Decimal(str(purchase_report['total_cgst'])) +
            Decimal(str(purchase_report['total_sgst'])) +
            Decimal(str(purchase_report['total_igst']))
        )
        
        if abs(output_gst - output_gst_calculated) > Decimal('0.01'):
            print(f"WARNING: Output GST mismatch. Reported: {output_gst}, Calculated: {output_gst_calculated}")
        
        if abs(input_gst - input_gst_calculated) > Decimal('0.01'):
            print(f"WARNING: Input GST mismatch. Reported: {input_gst}, Calculated: {input_gst_calculated}")
        
        # Net GST = Output - Input (ITC)
        net_gst = output_gst - input_gst
        
        return {
            'output_gst': float(CalculationService._round_final(output_gst)),
            'output_cgst': sales_report['total_cgst'],
            'output_sgst': sales_report['total_sgst'],
            'output_igst': sales_report['total_igst'],
            'input_gst': float(CalculationService._round_final(input_gst)),
            'input_cgst': purchase_report['total_cgst'],
            'input_sgst': purchase_report['total_sgst'],
            'input_igst': purchase_report['total_igst'],
            'net_gst_payable': float(CalculationService._round_final(net_gst))
        }
    
    @staticmethod
    def get_profit_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, any]:
        """
        Generate profit report with correct formulas.
        
        COGS = Purchase Cost + Making + Labour + Hallmark + Stone + Other
        Gross Profit = Sales - COGS
        Net Profit = Gross Profit - Expenses
        
        Note: GST is NOT included in profit calculations
        """
        # Get sales (excluding GST from profit)
        sales_report = ReportService.get_sales_report(db, start_date, end_date)
        sales_taxable = Decimal(str(sales_report['total_taxable']))
        
        # Get purchases for COGS (excluding GST from profit)
        purchase_report = ReportService.get_purchase_report(db, start_date, end_date)
        purchase_taxable = Decimal(str(purchase_report['total_taxable']))
        
        # Get expenses
        expense_query = db.query(Expense)
        if start_date:
            expense_query = expense_query.filter(func.date(Expense.expense_date) >= start_date)
        if end_date:
            expense_query = expense_query.filter(func.date(Expense.expense_date) <= end_date)
        
        expenses = expense_query.all()
        total_expenses = sum([Decimal(str(e.amount)) for e in expenses], Decimal('0'))
        
        # Calculate COGS (purchase_taxable already includes all charges)
        cogs = purchase_taxable
        
        # Calculate profits using CalculationService
        gross_profit_result = CalculationService.calculate_gross_profit(
            sales=sales_taxable,
            cogs=cogs
        )
        
        net_profit_result = CalculationService.calculate_net_profit(
            gross_profit=gross_profit_result['gross_profit'],
            expenses=total_expenses
        )
        
        return {
            'sales': float(CalculationService._round_final(sales_taxable)),
            'cogs': float(CalculationService._round_final(cogs)),
            'gross_profit': float(gross_profit_result['gross_profit']),
            'expenses': float(CalculationService._round_final(total_expenses)),
            'net_profit': float(net_profit_result['net_profit']),
            'gross_profit_margin': float((gross_profit_result['gross_profit'] / sales_taxable * Decimal('100')).quantize(Decimal('0.01'))) if sales_taxable > 0 else 0,
            'net_profit_margin': float((net_profit_result['net_profit'] / sales_taxable * Decimal('100')).quantize(Decimal('0.01'))) if sales_taxable > 0 else 0
        }
    
    @staticmethod
    def get_inventory_report(
        db: Session
    ) -> Dict[str, any]:
        """
        Generate inventory report.
        Uses purchase cost (historical rates), not current live rates.
        """
        # For now, we'll use a simplified approach
        # In production, you'd track purchase cost per item in inventory
        from app.models.inventory import Inventory, ItemStatus
        
        inventory_items = db.query(Inventory).filter(Inventory.status == ItemStatus.AVAILABLE).all()
        
        total_weight = Decimal('0')
        total_items = 0
        
        for item in inventory_items:
            total_weight += Decimal(str(item.net_weight))
            total_items += 1
        
        # Note: Inventory valuation should use purchase cost, not current rates
        # This requires storing purchase cost per inventory item
        # For now, we return weight and count
        
        return {
            'total_items': total_items,
            'total_weight': float(CalculationService._round_final(total_weight, CalculationService.WEIGHT_PLACES)),
            'note': 'Inventory valuation requires purchase cost tracking per item'
        }
    
    @staticmethod
    def get_dashboard_metrics(
        db: Session
    ) -> Dict[str, any]:
        """
        Generate dashboard metrics.
        Uses actual transaction data with correct formulas.
        """
        today = date.today()
        
        # Today's sales
        today_sales_report = ReportService.get_sales_report(db, start_date=today, end_date=today)
        
        # Today's purchases
        today_purchase_report = ReportService.get_purchase_report(db, start_date=today, end_date=today)
        
        # Today's profit (using correct formula)
        today_profit_report = ReportService.get_profit_report(db, start_date=today, end_date=today)
        
        # Total customers
        from app.models.customer import Customer
        total_customers = db.query(Customer).count()
        
        # Inventory value (using purchase cost approach)
        inventory_report = ReportService.get_inventory_report(db)
        
        return {
            'today_sales': today_sales_report['total_sales'],
            'today_bills': today_sales_report['invoice_count'],
            'today_purchases': today_purchase_report['total_purchases'],
            'today_profit': today_profit_report['net_profit'],
            'total_customers': total_customers,
            'inventory_items': inventory_report['total_items'],
            'inventory_weight': inventory_report['total_weight'],
            'low_stock_count': 0  # TODO: Implement low stock threshold
        }

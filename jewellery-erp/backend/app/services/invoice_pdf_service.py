"""
Invoice PDF Generation Service
Generates professional PDF invoices with company details, items, and calculations.
"""
from decimal import Decimal
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.gold_calculation import GoldCalculation
from app.models.silver_calculation import SilverCalculation
from app.services.calculation_service import CalculationService


class InvoicePDFService:
    """Service to generate invoice PDF data for frontend rendering."""
    
    COMPANY_NAME = "JEWELLERY ERP"
    COMPANY_ADDRESS = "Your Address Here"
    COMPANY_PHONE = "+91 1234567890"
    COMPANY_EMAIL = "info@jewelleryerp.com"
    COMPANY_GSTIN = "22AAAAA0000A1Z5"
    
    @staticmethod
    def get_invoice_pdf_data(invoice_id: int, db: Session) -> Dict[str, Any]:
        """
        Get complete invoice data formatted for PDF generation.
        
        Returns:
        {
            'invoice': {...},
            'customer': {...},
            'items': [{...}],
            'company': {...},
            'totals': {...}
        }
        """
        # Fetch invoice with relationships
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        # Company details
        company = {
            'name': InvoicePDFService.COMPANY_NAME,
            'address': InvoicePDFService.COMPANY_ADDRESS,
            'phone': InvoicePDFService.COMPANY_PHONE,
            'email': InvoicePDFService.COMPANY_EMAIL,
            'gstin': InvoicePDFService.COMPANY_GSTIN
        }
        
        # Invoice details
        invoice_data = {
            'invoice_number': invoice.invoice_number,
            'invoice_date': invoice.invoice_date.strftime('%d-%m-%Y'),
            'status': invoice.status.value,
            'subtotal': float(invoice.subtotal),
            'tax_amount': float(invoice.tax_amount),
            'discount_amount': float(invoice.discount_amount),
            'grand_total': float(invoice.grand_total)
        }
        
        # Customer details
        customer_data = {
            'name': invoice.customer.name if invoice.customer else 'Walk-in Customer',
            'phone': invoice.customer.phone if invoice.customer else '',
            'email': invoice.customer.email if invoice.customer else '',
            'address': invoice.customer.address if invoice.customer else ''
        }
        
        # Items details
        items_data = []
        for item in invoice.items:
            item_dict = {
                'item_name': item.item_name,
                'item_type': item.item_type,
                'final_price': float(item.final_price)
            }
            
            # Add gold calculation details if present
            gold_calc = db.query(GoldCalculation).filter(
                GoldCalculation.invoice_item_id == item.id
            ).first()
            
            if gold_calc:
                item_dict.update({
                    'metal_type': 'GOLD',
                    'gross_weight': float(gold_calc.gross_weight),
                    'stone_weight': float(gold_calc.stone_weight),
                    'net_weight': float(gold_calc.net_weight),
                    'making_charges': float(gold_calc.making_charges_amount),
                    'hallmark_charges': float(gold_calc.hallmark_charges),
                    'metal_value': float(gold_calc.total_gold_value)
                })
            
            # Add silver calculation details if present
            silver_calc = db.query(SilverCalculation).filter(
                SilverCalculation.invoice_item_id == item.id
            ).first()
            
            if silver_calc:
                item_dict.update({
                    'metal_type': 'SILVER',
                    'gross_weight': float(silver_calc.gross_weight),
                    'pure_weight': float(silver_calc.pure_weight),
                    'tanch_percentage': float(silver_calc.tanch_percentage),
                    'making_charges': float(silver_calc.making_charges_amount),
                    'metal_value': float(silver_calc.total_silver_value)
                })
            
            items_data.append(item_dict)
        
        # Calculate totals
        total_items = len(items_data)
        total_weight = sum(
            item.get('net_weight', item.get('pure_weight', 0)) 
            for item in items_data
        )
        
        totals = {
            'total_items': total_items,
            'total_weight': float(CalculationService._round_final(
                Decimal(str(total_weight)),
                CalculationService.WEIGHT_PLACES
            )),
            'subtotal': float(invoice.subtotal),
            'tax_amount': float(invoice.tax_amount),
            'discount_amount': float(invoice.discount_amount),
            'grand_total': float(invoice.grand_total)
        }
        
        return {
            'invoice': invoice_data,
            'customer': customer_data,
            'items': items_data,
            'company': company,
            'totals': totals
        }

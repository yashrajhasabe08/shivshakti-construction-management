import React from 'react';
import { Receipt, Plus, Download, ArrowUpRight } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function PurchasePaymentsView({ data, onAddNew, onDelete }) {
  const purchasePayments = data.purchasePayments || [];

  const handleExport = () => {
    const exportData = purchasePayments.map(pp => ({
      'Payment Voucher ID': pp.id,
      'Supplier Name': pp.supplierName,
      'Bill ID Ref': pp.billId,
      'Amount Paid (INR)': pp.amountPaid,
      'Payment Date': pp.paymentDate,
      'Payment Mode': pp.paymentMode,
      'Bank Ref / UTR No': pp.bankRefNo,
      'Remarks': pp.remarks
    }));
    exportToExcel(exportData, 'Shivshakti_Purchase_Payments_Ledger.xlsx', 'Purchase Payments');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Purchase Payments & Supplier Vouchers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Outgoing payments log to material suppliers and vendors.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Payments Excel</span>
          </button>
          <button
            onClick={() => onAddNew('purchasePayments')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Make Supplier Payment</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Voucher ID & Date</th>
                <th>Supplier Name</th>
                <th>Bill Reference</th>
                <th>Amount Paid (INR)</th>
                <th>Mode & UTR No</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {purchasePayments.map((pp) => (
                <tr key={pp.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-slate-900 font-mono text-xs">{pp.id}</span>
                      <span className="block text-[11px] text-slate-400">{pp.paymentDate}</span>
                    </div>
                  </td>
                  <td className="font-medium text-slate-900">{pp.supplierName}</td>
                  <td>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {pp.billId}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900 text-sm flex items-center space-x-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatCurrency(pp.amountPaid)}</span>
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-xs">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px] font-medium">
                          {pp.paymentMode}
                        </span>
                        <span className="block text-[11px] font-mono text-slate-400 mt-0.5">{pp.bankRefNo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDelete(pp.id)}
                        className="self-start text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                  <td className="text-xs text-slate-500 max-w-xs">{pp.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

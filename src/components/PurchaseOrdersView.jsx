import React from 'react';
import { ShoppingCart, Plus, Download, Truck, Calendar, PhoneCall, Building } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function PurchaseOrdersView({ data, selectedPartner, onAddNew, onDelete, onNavigateTo }) {
  const purchaseOrders = (data.purchaseOrders || []).filter(po => {
    if (selectedPartner === 'ALL') return true;
    const proj = (data.projects || []).find(p => p.id === po.projectId);
    return proj && proj.partnerId === selectedPartner;
  });

  const handleExport = () => {
    const exportData = purchaseOrders.map(po => ({
      'PO Number': po.poNumber,
      'Supplier Name': po.supplierName,
      'Destination Site': po.projectName,
      'Order Date': po.orderDate,
      'Expected Delivery': po.expectedDelivery,
      'Total Amount (INR)': po.totalAmount,
      'Driver Name': po.driverName,
      'Driver Mobile': po.driverMobile,
      'Vehicle Number': po.vehicleNumber,
      'Delivery Status': po.deliveryStatus,
      'Dispatch Notes': po.dispatchNotes
    }));
    exportToExcel(exportData, 'Shivshakti_Purchase_Orders.xlsx', 'Purchase Orders');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Purchase Orders (PO) & Requisitions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Material purchase orders issued to vendors with assigned truck drivers & delivery tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export POs Excel</span>
          </button>
          <button
            onClick={() => onAddNew('purchaseOrders')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create New PO</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>PO Ref & Date</th>
                <th>Supplier Vendor</th>
                <th>Project Site</th>
                <th>Materials Ordered</th>
                <th>Total Value</th>
                <th>Driver & Vehicle</th>
                <th>Delivery Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-slate-900 font-mono text-xs">{po.poNumber}</span>
                      <span className="block text-[11px] text-slate-400">{po.orderDate}</span>
                    </div>
                  </td>
                  <td className="font-medium text-slate-900">{po.supplierName}</td>
                  <td className="text-slate-600 font-medium">{po.projectName}</td>
                  <td>
                    <div className="text-xs space-y-0.5">
                      {po.items?.map((item, i) => (
                        <div key={i} className="text-slate-700">
                          {item.quantity} {item.unit} - <span className="text-slate-400">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="font-semibold text-slate-900">{formatCurrency(po.totalAmount)}</td>
                  <td>
                    <div className="text-xs space-y-0.5">
                      <span className="font-medium text-slate-800 block">{po.vehicleNumber}</span>
                      <a 
                        href={`tel:${po.driverMobile}`}
                        className="text-[#2563EB] hover:underline flex items-center space-x-1 text-[11px]"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>{po.driverName}</span>
                      </a>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigateTo('deliveryTracker')}
                        className={`badge cursor-pointer transition-colors ${
                          po.deliveryStatus === 'Delivered' || po.deliveryStatus === 'Verified'
                            ? 'badge-success'
                            : po.deliveryStatus === 'In-Transit'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {po.deliveryStatus}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(po.id)}
                        className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

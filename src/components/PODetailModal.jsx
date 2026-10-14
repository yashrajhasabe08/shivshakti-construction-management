import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  FileText, 
  Truck, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Building,
  PhoneCall
} from 'lucide-react';

export default function PODetailModal({ 
  po, 
  purchaseBills = [], 
  onClose, 
  onSaveItems,
  onNavigateTo
}) {
  if (!po) return null;

  const [activeSubTab, setActiveSubTab] = useState('materials'); // 'materials' | 'bills' | 'delivery'
  const [items, setItems] = useState(po.items || []);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: 'Bags',
    rate: '',
    deliveryStatus: 'Pending'
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Find linked bills matching this PO by poNumber or id
  const linkedBills = purchaseBills.filter(
    b => b.poRef === po.poNumber || b.poRef === po.id || (po.linkedBills && po.linkedBills.includes(b.billNumber))
  );

  const totalBilled = linkedBills.reduce((sum, b) => sum + (b.totalBillAmount || b.amount || 0), 0);
  const totalPaid = linkedBills
    .filter(b => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (b.totalBillAmount || b.amount || 0), 0);
  const pendingPayment = Math.max(0, totalBilled - totalPaid);

  const totalMaterialsAmount = items.reduce((sum, i) => sum + (Number(i.amount) || Number(i.quantity * i.rate) || 0), 0);
  const poAmount = po.totalAmount || totalMaterialsAmount;
  const isBilledMatching = Math.abs(totalBilled - poAmount) < 1000;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity || !newItem.rate) return;

    const qty = parseFloat(newItem.quantity) || 0;
    const rate = parseFloat(newItem.rate) || 0;
    const added = {
      name: newItem.name,
      materialName: newItem.name,
      description: newItem.description || `${qty} ${newItem.unit} ordered`,
      quantity: qty,
      unit: newItem.unit,
      rate: rate,
      ratePerUnit: rate,
      amount: qty * rate,
      totalAmount: qty * rate,
      deliveryStatus: newItem.deliveryStatus || 'Pending'
    };

    const updated = [...items, added];
    setItems(updated);
    if (onSaveItems) {
      onSaveItems(po.id, updated);
    }
    setNewItem({
      name: '',
      description: '',
      quantity: '',
      unit: 'Bags',
      rate: '',
      deliveryStatus: 'Pending'
    });
    setShowAddItem(false);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    if (onSaveItems) {
      onSaveItems(po.id, updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">{po.poNumber}</h3>
                <span className={`badge ${
                  po.deliveryStatus === 'Delivered' || po.deliveryStatus === 'Verified'
                    ? 'badge-success'
                    : po.deliveryStatus === 'In-Transit'
                    ? 'badge-warning'
                    : 'badge-info'
                }`}>
                  {po.deliveryStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor: <strong className="text-slate-800">{po.supplierName}</strong> &bull; Site: <strong className="text-slate-800">{po.projectName}</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total PO Value</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(poAmount)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Billed</span>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(totalBilled)}</span>
              {isBilledMatching && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Paid</span>
            <span className="font-bold text-emerald-600 font-mono text-sm">{formatCurrency(totalPaid)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pending Payment</span>
            <span className="font-bold text-amber-600 font-mono text-sm">{formatCurrency(pendingPayment)}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-5 pt-3 border-b border-slate-100 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('materials')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeSubTab === 'materials'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Itemized Materials ({items.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('bills')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeSubTab === 'bills'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Linked Purchase Bills ({linkedBills.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('delivery')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeSubTab === 'delivery'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Logistics & Vehicle Status</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: MATERIALS BREAKDOWN (FEATURE 1) */}
          {activeSubTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Separated Material Descriptions & Quantities
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Each material item specified with unit rate, packing description, and delivery status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddItem(prev => !prev)}
                  className="btn-secondary text-xs flex items-center space-x-1.5 py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>{showAddItem ? 'Cancel' : 'Add Material Item'}</span>
                </button>
              </div>

              {/* Add Material Form */}
              {showAddItem && (
                <form onSubmit={handleAddItem} className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-3">
                  <h5 className="text-xs font-bold text-slate-900">Add New Material to PO</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Material Name *</label>
                      <input 
                        required 
                        placeholder="e.g. OPC 53 Grade Cement" 
                        value={newItem.name}
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Material Description</label>
                      <input 
                        placeholder="e.g. 50kg bags, delivered in bags" 
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                        className="form-input text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Quantity *</label>
                      <input 
                        type="number"
                        required 
                        placeholder="400" 
                        value={newItem.quantity}
                        onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Unit *</label>
                      <select
                        value={newItem.unit}
                        onChange={e => setNewItem({...newItem, unit: e.target.value})}
                        className="form-select text-xs"
                      >
                        <option value="Bag">Bag / Bags</option>
                        <option value="MT">MT (Metric Tonnes)</option>
                        <option value="Tons">Tons</option>
                        <option value="CUM">CUM (Cubic Meter)</option>
                        <option value="Liter">Liter</option>
                        <option value="Sq.Ft">Sq.Ft</option>
                        <option value="Brass">Brass</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Rate Per Unit (₹) *</label>
                      <input 
                        type="number"
                        required 
                        placeholder="500" 
                        value={newItem.rate}
                        onChange={e => setNewItem({...newItem, rate: e.target.value})}
                        className="form-input text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="submit" className="btn-primary text-xs py-1.5 px-4">
                      Add Item
                    </button>
                  </div>
                </form>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Material & Description</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Rate / Unit</th>
                      <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                      <th className="py-2.5 px-3 text-center">Delivery Progress</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">
                          No items added yet. Click &quot;Add Material Item&quot; to describe materials.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const itemAmount = Number(item.amount) || (Number(item.quantity) * Number(item.rate)) || 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-3 text-slate-400 font-mono font-bold">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{item.name || item.materialName}</span>
                              <span className="text-[11px] text-slate-500">{item.description || 'Standard bulk delivery'}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 font-mono">
                              {formatCurrency(item.rate || item.ratePerUnit)} / {item.unit}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                              {formatCurrency(itemAmount)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="badge badge-info text-[10px]">
                                {item.deliveryStatus || 'Received'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                      <td colSpan={4} className="py-3 px-3 uppercase tracking-wider text-[11px]">
                        TOTAL SUM OF MATERIALS
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-blue-600">
                        {formatCurrency(totalMaterialsAmount)}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-slate-500 font-normal text-[11px]">
                        {items.length} Distinct Materials
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LINKED BILLS (FEATURE 4) */}
          {activeSubTab === 'bills' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Linked Supplier Invoices & Purchase Bills
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    GST tax invoices raised against this PO with payment status & item descriptions.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Matching Status:</span>
                  <span className={`badge ${isBilledMatching ? 'badge-success' : 'badge-warning'}`}>
                    {isBilledMatching ? '✓ Billed Amount Matches PO' : `Pending Invoices: ${formatCurrency(Math.abs(poAmount - totalBilled))}`}
                  </span>
                </div>
              </div>

              {linkedBills.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 p-6">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No supplier invoices recorded for this PO yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Navigate to Purchase Bills tab to record supplier bills.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                        <th className="py-2.5 px-3">Bill Number & Date</th>
                        <th className="py-2.5 px-3">Bill Description</th>
                        <th className="py-2.5 px-3 text-right">Base Amount</th>
                        <th className="py-2.5 px-3 text-right">Total Payable</th>
                        <th className="py-2.5 px-3 text-center">Approval</th>
                        <th className="py-2.5 px-3 text-center">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {linkedBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 font-mono block">{bill.billNumber}</span>
                            <span className="text-[11px] text-slate-400">{bill.billDate}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-700 font-medium block">
                              {bill.billDescription || `Materials supplied for ${po.projectName}`}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700 font-mono">
                            {formatCurrency(bill.baseAmount || bill.amount)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                            {formatCurrency(bill.totalBillAmount || bill.amount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="badge badge-success text-[10px]">
                              {bill.approvalStatus || 'Approved'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`badge text-[10px] ${
                              bill.paymentStatus === 'Paid' ? 'badge-success' : bill.paymentStatus === 'Partially Paid' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {bill.paymentStatus || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                        <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-[11px]">
                          TOTAL BILLED AMOUNT
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm text-blue-600">
                          {formatCurrency(totalBilled)}
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-right text-[11px] text-emerald-600 font-semibold">
                          Total Paid: {formatCurrency(totalPaid)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOGISTICS & DELIVERY */}
          {activeSubTab === 'delivery' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Assigned Vehicle & Logistics</span>
                  </h5>
                  <div className="space-y-1 pt-1 text-slate-600">
                    <p><span className="text-slate-400">Vehicle:</span> <strong className="text-slate-800">{po.vehicleNumber || 'MH 12 QG 4821'}</strong></p>
                    <p><span className="text-slate-400">Assigned Driver:</span> <strong className="text-slate-800">{po.driverName || 'Site Transporter'}</strong></p>
                    <p><span className="text-slate-400">Driver Mobile:</span> <a href={`tel:${po.driverMobile}`} className="text-blue-600 font-semibold underline">{po.driverMobile || '+91 97654 32109'}</a></p>
                    <p><span className="text-slate-400">Expected Delivery:</span> <strong className="text-slate-800">{po.expectedDelivery || po.orderDate}</strong></p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Gate Notes & Site Receiving</span>
                  </h5>
                  <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    &quot;{po.dispatchNotes || 'Gate security receipt signed upon inspection of consignment quality.'}&quot;
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Overall Consignment Status: <strong className="text-slate-700">{po.deliveryStatus}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/40 text-xs">
          <span className="text-slate-500">
            Total Materials: <strong>{items.length} items</strong> &bull; Total Value: <strong>{formatCurrency(poAmount)}</strong>
          </span>
          <button
            onClick={onClose}
            className="btn-primary py-2 px-5 text-xs"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

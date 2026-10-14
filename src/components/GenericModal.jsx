import React, { useState } from 'react';
import { PlusCircle, Edit3, X } from 'lucide-react';

export default function GenericModal({ 
  moduleName, 
  editItem = null, 
  onClose, 
  onSave, 
  projects = [], 
  suppliers = [], 
  clients = [], 
  partners = [] 
}) {
  const isEdit = Boolean(editItem);

  const [formData, setFormData] = useState(() => {
    if (editItem) {
      return { ...editItem };
    }
    return {
      id: `${moduleName.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      status: 'In Progress',
      receiptStatus: 'Verified',
      approvalStatus: 'Approved',
      paymentStatus: 'Pending',
      deliveryStatus: 'Ordered'
    };
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData };

    if (moduleName === 'purchaseOrders') {
      if (finalData.materialName) {
        const qty = parseFloat(finalData.quantity) || 1;
        const rate = parseFloat(finalData.ratePerUnit) || 0;
        finalData.items = [
          {
            name: finalData.materialName,
            materialName: finalData.materialName,
            description: finalData.materialDescription || `${qty} ${finalData.unit || 'Bag'} ordered`,
            quantity: qty,
            unit: finalData.unit || 'Bag',
            rate: rate,
            ratePerUnit: rate,
            amount: qty * rate,
            totalAmount: qty * rate,
            deliveryStatus: finalData.deliveryStatus || 'Pending'
          }
        ];
        if (!finalData.totalAmount || finalData.totalAmount === 0) {
          finalData.totalAmount = qty * rate;
        }
      }
    }

    if (moduleName === 'purchaseBills') {
      if (!finalData.billDescription) {
        finalData.billDescription = `Supplies for ${finalData.poRef || 'project site'}`;
      }
    }

    if (moduleName === 'projects') {
      const budgetVal = parseFloat(finalData.budget) || 0;
      if (budgetVal <= 0) {
        alert('Project budget must be greater than ₹0.');
        return;
      }
      if (budgetVal > 5000000) {
        alert('Project budget cannot exceed ₹50,00,000 (50 Lakhs) as per ERP policy limit.');
        return;
      }
    }

    if (moduleName === 'clients') {
      const contractVal = parseFloat(finalData.totalContractValue) || 0;
      if (contractVal > 5000000) {
        alert('Client contract value cannot exceed ₹50,00,000 (50 Lakhs) as per ERP policy limit.');
        return;
      }
    }

    if (moduleName === 'subcontractors') {
      const contractVal = parseFloat(finalData.contractValue) || 0;
      if (contractVal > 5000000) {
        alert('Subcontractor contract value cannot exceed ₹50,00,000 (50 Lakhs) as per ERP policy limit.');
        return;
      }
    }

    onSave(moduleName, finalData);
    onClose();
  };

  const renderFields = () => {
    switch (moduleName) {
      case 'projects':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Project Site Name</label>
              <input 
                required 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                placeholder="e.g. Shivshakti Heights Phase 2" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">District</label>
                <input 
                  required 
                  name="district" 
                  value={formData.district || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Kolhapur, Pune" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Taluka / Division</label>
                <input 
                  required 
                  name="division" 
                  value={formData.division || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Karveer, Haveli" 
                  className="form-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Specific Location / Landmark</label>
              <input 
                required 
                name="location" 
                value={formData.location || ''} 
                onChange={handleChange} 
                placeholder="e.g. Near Rankala, Karveer" 
                className="form-input" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Partner In-Charge</label>
              <select 
                name="partnerName" 
                value={formData.partnerName || 'Rajesh Patel'} 
                onChange={handleChange} 
                className="form-select"
              >
                <option value="Rajesh Patel">Rajesh Patel (Pune)</option>
                <option value="Suresh Sharma">Suresh Sharma (Mumbai)</option>
                <option value="Vikram Deshmukh">Vikram Deshmukh (Nagpur)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Client Name</label>
              <input 
                required 
                name="clientName" 
                value={formData.clientName || ''} 
                onChange={handleChange} 
                placeholder="e.g. Apex Infrastructures" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Sanctioned Budget (INR - Max ₹50L)</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max="5000000" 
                  name="budget" 
                  value={formData.budget !== undefined ? formData.budget : ''} 
                  onChange={handleChange} 
                  placeholder="e.g. 4500000 (Max ₹50 Lakh)" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Completion %</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  name="completionPercent" 
                  value={formData.completionPercent !== undefined ? formData.completionPercent : 0} 
                  onChange={handleChange} 
                  placeholder="25" 
                  className="form-input" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Actual Spent (INR)</label>
                <input 
                  type="number" 
                  name="actualCost" 
                  value={formData.actualCost !== undefined ? formData.actualCost : ''} 
                  onChange={handleChange} 
                  placeholder="2850000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                <select 
                  name="status" 
                  value={formData.status || 'In Progress'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
          </>
        );

      case 'partners':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Partner Name</label>
              <input 
                required 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                placeholder="e.g. Rajesh Patel" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Location / Base City</label>
                <input 
                  required 
                  name="location" 
                  value={formData.location || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Pune, Mumbai, Nagpur" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mobile Phone</label>
                <input 
                  name="mobile" 
                  value={formData.mobile || ''} 
                  onChange={handleChange} 
                  placeholder="+91 98220 11223" 
                  className="form-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Role & Responsibility</label>
              <input 
                name="role" 
                value={formData.role || ''} 
                onChange={handleChange} 
                placeholder="e.g. Managing Partner - Commercial Projects" 
                className="form-input" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Capital Invested (INR)</label>
              <input 
                type="number" 
                name="capitalInvested" 
                value={formData.capitalInvested !== undefined ? formData.capitalInvested : ''} 
                onChange={handleChange} 
                placeholder="4500000" 
                className="form-input" 
              />
            </div>
          </>
        );

      case 'clients':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Client / Firm Name</label>
              <input 
                required 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                placeholder="e.g. Apex Infrastructures Ltd" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Person</label>
                <input 
                  required 
                  name="contactPerson" 
                  value={formData.contactPerson || ''} 
                  onChange={handleChange} 
                  placeholder="Mr. Suresh Mehta" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mobile Phone</label>
                <input 
                  required 
                  name="mobile" 
                  value={formData.mobile || ''} 
                  onChange={handleChange} 
                  placeholder="+91 98220 11223" 
                  className="form-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email || ''} 
                onChange={handleChange} 
                placeholder="contact@clientfirm.com" 
                className="form-input" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Assigned Project</label>
              <select 
                name="projectAssigned" 
                value={formData.projectAssigned || ''} 
                onChange={handleChange} 
                className="form-select"
              >
                <option value="">Select a Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Contract Value (INR - Max ₹50L)</label>
                <input 
                  type="number" 
                  required 
                  max="5000000" 
                  name="totalContractValue" 
                  value={formData.totalContractValue !== undefined ? formData.totalContractValue : ''} 
                  onChange={handleChange} 
                  placeholder="4800000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Received (INR)</label>
                <input 
                  type="number" 
                  name="totalReceived" 
                  value={formData.totalReceived !== undefined ? formData.totalReceived : 0} 
                  onChange={handleChange} 
                  placeholder="3200000" 
                  className="form-input" 
                />
              </div>
            </div>
          </>
        );

      case 'clientPayments':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Client Organization</label>
              <select 
                required 
                name="clientId" 
                value={formData.clientId || ''} 
                onChange={(e) => {
                  const sel = clients.find(c => c.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    clientId: e.target.value,
                    clientName: sel ? sel.name : prev.clientName,
                    projectName: sel ? sel.projectAssigned : prev.projectName
                  }));
                }} 
                className="form-select"
              >
                <option value="">Select Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount Received (INR)</label>
                <input 
                  type="number" 
                  required 
                  name="amount" 
                  value={formData.amount !== undefined ? formData.amount : ''} 
                  onChange={handleChange} 
                  placeholder="500000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Date</label>
                <input 
                  type="date" 
                  required 
                  name="date" 
                  value={formData.date || new Date().toISOString().slice(0, 10)} 
                  onChange={handleChange} 
                  className="form-input" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Mode</label>
                <select 
                  name="mode" 
                  value={formData.mode || 'RTGS'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="RTGS">RTGS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Bank / Ref No</label>
                <input 
                  name="refNo" 
                  value={formData.refNo || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. HDFC-RTGS-9921" 
                  className="form-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Milestone Description</label>
              <input 
                name="milestone" 
                value={formData.milestone || ''} 
                onChange={handleChange} 
                placeholder="e.g. 5th Floor Slab Casting Complete" 
                className="form-input" 
              />
            </div>
          </>
        );

      case 'suppliers':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Supplier / Agency Name</label>
              <input 
                required 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                placeholder="e.g. UltraTech Cement Depot" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Material Category</label>
                <select 
                  name="category" 
                  value={formData.category || 'Cement & Concrete'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="Cement & Concrete">Cement & Concrete</option>
                  <option value="Steel & TMT Bars">Steel & TMT Bars</option>
                  <option value="Sand & Aggregates">Sand & Aggregates</option>
                  <option value="Bricks & Blocks">Bricks & Blocks</option>
                  <option value="Electrical & Plumbing">Electrical & Plumbing</option>
                  <option value="Hardware & Safety">Hardware & Safety</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Person</label>
                <input 
                  required 
                  name="contactPerson" 
                  value={formData.contactPerson || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Ramesh Kulkarni" 
                  className="form-input" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mobile Phone</label>
                <input 
                  required 
                  name="mobile" 
                  value={formData.mobile || ''} 
                  onChange={handleChange} 
                  placeholder="+91 98230 44556" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Depot Location / City</label>
                <input 
                  name="location" 
                  value={formData.location || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Kolhapur Yard" 
                  className="form-input" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">GSTIN Number</label>
                <input 
                  name="gstin" 
                  value={formData.gstin || ''} 
                  onChange={handleChange} 
                  placeholder="27AABCU9603R1ZM" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Outstanding Balance (INR)</label>
                <input 
                  type="number" 
                  name="outstandingBalance" 
                  value={formData.outstandingBalance !== undefined ? formData.outstandingBalance : 0} 
                  onChange={handleChange} 
                  placeholder="150000" 
                  className="form-input" 
                />
              </div>
            </div>
          </>
        );

      case 'purchaseOrders':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">PO Number</label>
                <input 
                  required 
                  name="poNumber" 
                  value={formData.poNumber || `PO-2026-${Math.floor(100 + Math.random() * 900)}`} 
                  onChange={handleChange} 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Order Date</label>
                <input 
                  type="date" 
                  required 
                  name="orderDate" 
                  value={formData.orderDate || new Date().toISOString().slice(0, 10)} 
                  onChange={handleChange} 
                  className="form-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Supplier Name</label>
              <select 
                required 
                name="supplierName" 
                value={formData.supplierName || ''} 
                onChange={handleChange} 
                className="form-select"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Project Destination Site</label>
              <select 
                required 
                name="projectName" 
                value={formData.projectName || ''} 
                onChange={(e) => {
                  const sel = projects.find(p => p.name === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    projectName: e.target.value,
                    projectId: sel ? sel.id : prev.projectId
                  }));
                }} 
                className="form-select"
              >
                <option value="">Select Project Site</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.district})</option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Ordered Material Item</span>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  required 
                  name="materialName" 
                  value={formData.materialName || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. OPC 53 Grade Cement" 
                  className="form-input text-xs" 
                />
                <input 
                  type="number" 
                  required 
                  name="quantity" 
                  value={formData.quantity !== undefined ? formData.quantity : ''} 
                  onChange={handleChange} 
                  placeholder="Quantity (e.g. 200)" 
                  className="form-input text-xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  name="unit" 
                  value={formData.unit || 'Bags'} 
                  onChange={handleChange} 
                  placeholder="Unit (Bags, MT, Cum)" 
                  className="form-input text-xs" 
                />
                <input 
                  type="number" 
                  required 
                  name="ratePerUnit" 
                  value={formData.ratePerUnit !== undefined ? formData.ratePerUnit : ''} 
                  onChange={handleChange} 
                  placeholder="Rate/Unit INR" 
                  className="form-input text-xs" 
                />
              </div>
            </div>
          </>
        );

      case 'purchaseBills':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Supplier Bill No</label>
                <input 
                  required 
                  name="billNumber" 
                  value={formData.billNumber || ''} 
                  onChange={handleChange} 
                  placeholder="INV-2026-401" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Linked PO Ref</label>
                <input 
                  name="poRef" 
                  value={formData.poRef || ''} 
                  onChange={handleChange} 
                  placeholder="PO-2026-089" 
                  className="form-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Supplier / Vendor</label>
              <select 
                required 
                name="supplierName" 
                value={formData.supplierName || ''} 
                onChange={handleChange} 
                className="form-select"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Base Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  name="baseAmount" 
                  value={formData.baseAmount !== undefined ? formData.baseAmount : ''} 
                  onChange={(e) => {
                    const base = parseFloat(e.target.value) || 0;
                    const gst = parseFloat(formData.gstAmount) || 0;
                    setFormData(prev => ({ ...prev, baseAmount: base, totalBillAmount: base + gst }));
                  }} 
                  placeholder="150000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">GST (18% ₹)</label>
                <input 
                  type="number" 
                  name="gstAmount" 
                  value={formData.gstAmount !== undefined ? formData.gstAmount : ''} 
                  onChange={(e) => {
                    const gst = parseFloat(e.target.value) || 0;
                    const base = parseFloat(formData.baseAmount) || 0;
                    setFormData(prev => ({ ...prev, gstAmount: gst, totalBillAmount: base + gst }));
                  }} 
                  placeholder="27000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Bill (₹)</label>
                <input 
                  type="number" 
                  required 
                  name="totalBillAmount" 
                  value={formData.totalBillAmount !== undefined ? formData.totalBillAmount : ''} 
                  onChange={handleChange} 
                  placeholder="177000" 
                  className="form-input" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Status</label>
                <select 
                  name="paymentStatus" 
                  value={formData.paymentStatus || 'Pending'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Verification</label>
                <select 
                  name="approvalStatus" 
                  value={formData.approvalStatus || 'Approved'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="Approved">Approved</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </>
        );

      case 'labourWages':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Project Site</label>
              <select 
                required 
                name="projectName" 
                value={formData.projectName || ''} 
                onChange={(e) => {
                  const sel = projects.find(p => p.name === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    projectName: e.target.value,
                    projectId: sel ? sel.id : prev.projectId
                  }));
                }} 
                className="form-select"
              >
                <option value="">Select Project Site</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.district})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Muster Roll / Gang Head</label>
                <input 
                  required 
                  name="headMason" 
                  value={formData.headMason || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Tukaram Kamble Gang" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Trade Category</label>
                <select 
                  name="tradeType" 
                  value={formData.tradeType || 'Masonry'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="Masonry">Masonry</option>
                  <option value="Carpentry & Shuttering">Carpentry & Shuttering</option>
                  <option value="Bar Bending & Steel">Bar Bending & Steel</option>
                  <option value="Excavation & Helpers">Excavation & Helpers</option>
                  <option value="Painting & Plaster">Painting & Plaster</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Workers Count</label>
                <input 
                  type="number" 
                  name="workerCount" 
                  value={formData.workerCount !== undefined ? formData.workerCount : ''} 
                  onChange={handleChange} 
                  placeholder="15" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Payout (INR)</label>
                <input 
                  type="number" 
                  required 
                  name="totalWeeklyWage" 
                  value={formData.totalWeeklyWage !== undefined ? formData.totalWeeklyWage : ''} 
                  onChange={handleChange} 
                  placeholder="45000" 
                  className="form-input" 
                />
              </div>
            </div>
          </>
        );

      case 'subcontractors':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Subcontractor / Agency Name</label>
              <input 
                required 
                name="firmName" 
                value={formData.firmName || formData.name || ''} 
                onChange={handleChange} 
                placeholder="e.g. Mahavir Electricals Turnkey" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Trade Scope / Work Type</label>
                <input 
                  required 
                  name="tradeScope" 
                  value={formData.tradeScope || formData.workType || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Electrical Conduiting & Wiring" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Assigned Project</label>
                <select 
                  name="projectName" 
                  value={formData.projectName || ''} 
                  onChange={(e) => {
                    const sel = projects.find(p => p.name === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      projectName: e.target.value,
                      projectId: sel ? sel.id : prev.projectId
                    }));
                  }} 
                  className="form-select"
                >
                  <option value="">Select Site</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Contract Value (INR - Max ₹50L)</label>
                <input 
                  type="number" 
                  required 
                  max="5000000" 
                  name="contractValue" 
                  value={formData.contractValue !== undefined ? formData.contractValue : ''} 
                  onChange={handleChange} 
                  placeholder="320000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Paid Amount (INR)</label>
                <input 
                  type="number" 
                  name="paidAmount" 
                  value={formData.paidAmount !== undefined ? formData.paidAmount : 0} 
                  onChange={handleChange} 
                  placeholder="180000" 
                  className="form-input" 
                />
              </div>
            </div>
          </>
        );

      case 'assetsAndDeposits':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Asset / Equipment Name</label>
              <input 
                required 
                name="assetName" 
                value={formData.assetName || ''} 
                onChange={handleChange} 
                placeholder="e.g. JCB 3DX Excavator" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                <select 
                  name="category" 
                  value={formData.category || 'Heavy Machinery'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="Heavy Machinery">Heavy Machinery</option>
                  <option value="Site Equipment">Site Equipment</option>
                  <option value="Vehicle & Transport">Vehicle & Transport</option>
                  <option value="Security Deposit">Security Deposit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Assigned Site</label>
                <select 
                  name="projectName" 
                  value={formData.projectName || ''} 
                  onChange={(e) => {
                    const sel = projects.find(p => p.name === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      projectName: e.target.value,
                      projectId: sel ? sel.id : prev.projectId
                    }));
                  }} 
                  className="form-select"
                >
                  <option value="">Select Project Site</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Purchase Value (INR)</label>
                <input 
                  type="number" 
                  required 
                  name="purchaseValue" 
                  value={formData.purchaseValue !== undefined ? formData.purchaseValue : ''} 
                  onChange={handleChange} 
                  placeholder="1200000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Current Valuation (INR)</label>
                <input 
                  type="number" 
                  name="valuationCurrent" 
                  value={formData.valuationCurrent !== undefined ? formData.valuationCurrent : ''} 
                  onChange={handleChange} 
                  placeholder="950000" 
                  className="form-input" 
                />
              </div>
            </div>
          </>
        );

      case 'otherExpenses':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Title / Item</label>
              <input 
                required 
                name="expenseTitle" 
                value={formData.expenseTitle || formData.title || ''} 
                onChange={handleChange} 
                placeholder="e.g. Diesel for Batching Plant (500L)" 
                className="form-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                <select 
                  name="category" 
                  value={formData.category || 'Diesel & Machinery Fuel'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="Diesel & Machinery Fuel">Diesel & Machinery Fuel</option>
                  <option value="Police & Municipal NOC">Police & Municipal NOC</option>
                  <option value="Site Petty Cash">Site Petty Cash</option>
                  <option value="Electricity & Water">Electricity & Water</option>
                  <option value="Safety & First Aid">Safety & First Aid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Assigned Project</label>
                <select 
                  required 
                  name="projectName" 
                  value={formData.projectName || ''} 
                  onChange={(e) => {
                    const sel = projects.find(p => p.name === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      projectName: e.target.value,
                      projectId: sel ? sel.id : prev.projectId
                    }));
                  }} 
                  className="form-select"
                >
                  <option value="">Select Project Site</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (INR)</label>
                <input 
                  type="number" 
                  required 
                  name="amount" 
                  value={formData.amount !== undefined ? formData.amount : ''} 
                  onChange={handleChange} 
                  placeholder="35000" 
                  className="form-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Date</label>
                <input 
                  type="date" 
                  required 
                  name="date" 
                  value={formData.date || new Date().toISOString().slice(0, 10)} 
                  onChange={handleChange} 
                  className="form-input" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Paid By (Partner / Site)</label>
                <select 
                  name="paidBy" 
                  value={formData.paidBy || 'Rajesh Patel'} 
                  onChange={handleChange} 
                  className="form-select"
                >
                  <option value="Rajesh Patel">Rajesh Patel (Pune / Kolhapur)</option>
                  <option value="Suresh Sharma">Suresh Sharma (Mumbai)</option>
                  <option value="Vikram Deshmukh">Vikram Deshmukh (Nagpur)</option>
                  <option value="Site Supervisor Cash Box">Site Supervisor Cash Box</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Receipt / Voucher No</label>
                <input 
                  name="receiptNo" 
                  value={formData.receiptNo || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. PET-KOL-882" 
                  className="form-input" 
                />
              </div>
            </div>
          </>
        );

      default:
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Title / Description</label>
              <input 
                required 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                placeholder="Enter title" 
                className="form-input" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (INR)</label>
              <input 
                type="number" 
                required 
                name="amount" 
                value={formData.amount !== undefined ? formData.amount : ''} 
                onChange={handleChange} 
                placeholder="10000" 
                className="form-input" 
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            {isEdit ? (
              <>
                <Edit3 className="w-5 h-5 text-amber-600" />
                <span>Edit <strong className="text-slate-900 capitalize">{moduleName}</strong> Record <span className="text-xs text-slate-400 font-mono">({formData.id})</span></span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 text-[#2563EB]" />
                <span>Add Entry: <strong className="text-[#2563EB] font-bold capitalize">{moduleName}</strong></span>
              </>
            )}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFields()}

          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors ${
                isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
              }`}
            >
              {isEdit ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

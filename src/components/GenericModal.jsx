import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

export default function GenericModal({ moduleName, onClose, onSave, projects, suppliers, clients, partners }) {
  const [formData, setFormData] = useState({
    id: `${moduleName.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().slice(0, 10),
    status: 'In Progress',
    receiptStatus: 'Verified',
    approvalStatus: 'Approved',
    paymentStatus: 'Pending',
    deliveryStatus: 'Ordered'
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
    onSave(moduleName, formData);
    onClose();
  };

  const renderFields = () => {
    switch (moduleName) {
      case 'projects':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Project Site Name</label>
              <input required name="name" onChange={handleChange} placeholder="e.g. Shivshakti Heights Phase 2" className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">District</label>
                <input required name="district" onChange={handleChange} placeholder="e.g. Kolhapur, Pune" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Taluka / Division</label>
                <input required name="division" onChange={handleChange} placeholder="e.g. Karveer, Haveli" className="form-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Specific Location / Landmark</label>
              <input required name="location" onChange={handleChange} placeholder="e.g. Near Rankala, Karveer" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Partner In-Charge</label>
              <select name="partnerName" onChange={handleChange} className="form-select">
                <option value="Rajesh Patel">Rajesh Patel (Pune)</option>
                <option value="Suresh Sharma">Suresh Sharma (Mumbai)</option>
                <option value="Vikram Deshmukh">Vikram Deshmukh (Nagpur)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Client Name</label>
              <input required name="clientName" onChange={handleChange} placeholder="e.g. Apex Infrastructures" className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Sanctioned Budget (INR)</label>
                <input type="number" required name="budget" onChange={handleChange} placeholder="5000000" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Completion %</label>
                <input type="number" name="completionPercent" onChange={handleChange} placeholder="25" className="form-input" />
              </div>
            </div>
          </>
        );

      case 'clients':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Client Company Name</label>
              <input required name="name" onChange={handleChange} placeholder="e.g. Mahindra Lifespaces" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Person</label>
              <input required name="contactPerson" onChange={handleChange} placeholder="e.g. Rajesh Shah" className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mobile</label>
                <input required name="mobile" onChange={handleChange} placeholder="+91 98220 00000" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" name="email" onChange={handleChange} placeholder="info@client.com" className="form-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Contract Value (INR)</label>
              <input type="number" required name="totalContractValue" onChange={handleChange} placeholder="10000000" className="form-input" />
            </div>
          </>
        );

      case 'clientPayments':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Client Name</label>
              <input required name="clientName" onChange={handleChange} placeholder="Client Name" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Project Site</label>
              <select name="projectName" onChange={handleChange} className="form-select">
                {projects?.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount Received (INR)</label>
                <input type="number" required name="amount" onChange={handleChange} placeholder="500000" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Mode</label>
                <select name="mode" onChange={handleChange} className="form-select">
                  <option value="RTGS">RTGS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Milestone Description</label>
              <input name="milestone" onChange={handleChange} placeholder="e.g. 5th Floor Slab Casted" className="form-input" />
            </div>
          </>
        );

      case 'suppliers':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Supplier Company Name</label>
              <input required name="name" onChange={handleChange} placeholder="e.g. Cement Supplier" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" onChange={handleChange} className="form-select">
                <option value="Cement Supplier">Cement Supplier</option>
                <option value="TMT Steel Supplier">TMT Steel Supplier</option>
                <option value="Crushed Sand & Aggregate">Crushed Sand & Aggregate</option>
                <option value="ReadyMix Concrete (RMC)">ReadyMix Concrete (RMC)</option>
                <option value="Hardware & Cables">Hardware & Cables</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Person</label>
                <input required name="contactPerson" onChange={handleChange} placeholder="Contact Person" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mobile</label>
                <input required name="mobile" onChange={handleChange} placeholder="+91 98000 00000" className="form-input" />
              </div>
            </div>
          </>
        );

      case 'purchaseOrders':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">PO Number</label>
              <input required name="poNumber" onChange={handleChange} defaultValue={`PO/SS/2026/${Math.floor(100+Math.random()*900)}`} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Supplier</label>
              <select name="supplierName" onChange={handleChange} className="form-select">
                {suppliers?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Target Project Site</label>
              <select name="projectName" onChange={handleChange} className="form-select">
                {projects?.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Order Value (INR)</label>
                <input type="number" required name="totalAmount" onChange={handleChange} placeholder="250000" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Vehicle Registration No</label>
                <input required name="vehicleNumber" onChange={handleChange} placeholder="MH 12 AB 1234" className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Driver Name</label>
                <input required name="driverName" onChange={handleChange} placeholder="Driver Full Name" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Driver Mobile</label>
                <input required name="driverMobile" onChange={handleChange} placeholder="+91 97000 00000" className="form-input" />
              </div>
            </div>
          </>
        );

      case 'labourWages':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Project Site</label>
              <select name="projectName" onChange={handleChange} className="form-select">
                {projects?.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mason Count</label>
                <input type="number" required name="masonCount" onChange={handleChange} placeholder="15" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Helper Count</label>
                <input type="number" required name="helperCount" onChange={handleChange} placeholder="30" className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mason Rate (INR/day)</label>
                <input type="number" required name="masonRate" onChange={handleChange} defaultValue="950" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Helper Rate (INR/day)</label>
                <input type="number" required name="helperRate" onChange={handleChange} defaultValue="550" className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Days Worked</label>
                <input type="number" required name="daysWorked" onChange={handleChange} defaultValue="6" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Weekly Wage (INR)</label>
                <input type="number" required name="totalWeeklyWage" onChange={handleChange} placeholder="185000" className="form-input" />
              </div>
            </div>
          </>
        );

      case 'otherExpenses':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Project Site</label>
              <select 
                required 
                name="projectId" 
                onChange={(e) => {
                  const selectedProj = (projects || []).find(p => p.id === e.target.value);
                  handleChange(e);
                  setFormData(prev => ({
                    ...prev,
                    projectId: e.target.value,
                    projectName: selectedProj ? selectedProj.name : prev.projectName,
                    paidBy: selectedProj ? selectedProj.partnerName : prev.paidBy
                  }));
                }} 
                className="form-select"
              >
                <option value="">-- Select Active Site --</option>
                {(projects || []).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.district || p.location})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Category</label>
              <select required name="category" onChange={handleChange} className="form-select">
                <option value="Diesel & Machinery Fuel">Diesel & Machinery Fuel</option>
                <option value="Municipal & Police NOC">Municipal & Police NOC</option>
                <option value="Site Petty Cash & Sundry">Site Petty Cash & Sundry</option>
                <option value="Worker Refreshments & Tea">Worker Refreshments & Tea</option>
                <option value="Material Testing & Lab Fees">Material Testing & Lab Fees</option>
                <option value="Crane & Machinery Transport">Crane & Machinery Transport</option>
                <option value="Site Safety & PPE">Site Safety & PPE</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Title / Description</label>
              <input required name="expenseTitle" onChange={handleChange} placeholder="e.g. Bulk Diesel 400L for Genset & Excavator" className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (INR)</label>
                <input type="number" required name="amount" onChange={handleChange} placeholder="35000" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Date</label>
                <input type="date" required name="date" defaultValue={new Date().toISOString().slice(0, 10)} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Paid By (Partner / Site)</label>
                <select name="paidBy" onChange={handleChange} className="form-select">
                  <option value="Rajesh Patel">Rajesh Patel (Pune / Kolhapur)</option>
                  <option value="Suresh Sharma">Suresh Sharma (Mumbai)</option>
                  <option value="Vikram Deshmukh">Vikram Deshmukh (Nagpur)</option>
                  <option value="Site Supervisor Cash Box">Site Supervisor Cash Box</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Receipt / Voucher No</label>
                <input name="receiptNo" onChange={handleChange} placeholder="e.g. PET-KOL-882" className="form-input" />
              </div>
            </div>
          </>
        );

      default:
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Title / Description</label>
              <input required name="name" onChange={handleChange} placeholder="Enter title" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (INR)</label>
              <input type="number" required name="amount" onChange={handleChange} placeholder="10000" className="form-input" />
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-[#2563EB]" />
            <span>Add Entry: <strong className="text-[#2563EB] font-bold capitalize">{moduleName}</strong></span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
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
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

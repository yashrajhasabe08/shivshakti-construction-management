import React, { useState } from 'react';
import { 
  Truck, 
  PhoneCall, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Edit3, 
  Search, 
  Building, 
  PackageCheck,
  ShieldCheck
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function DeliveryTrackerView({ data, onUpdateStatus, selectedPartner }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [editingPO, setEditingPO] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Filter Purchase Orders with Vehicle/Delivery information
  const deliveryOrders = (data.purchaseOrders || []).filter(po => {
    if (selectedPartner !== 'ALL') {
      const proj = data.projects.find(p => p.id === po.projectId);
      if (proj && proj.partnerId !== selectedPartner) return false;
    }
    if (filterStatus !== 'ALL' && po.deliveryStatus !== filterStatus) return false;
    return true;
  });

  const handleOpenUpdateModal = (po) => {
    setEditingPO(po);
    setNewStatus(po.deliveryStatus || 'In-Transit');
    setNewNotes(po.dispatchNotes || '');
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    if (editingPO) {
      onUpdateStatus(editingPO.id, newStatus, newNotes);
      setEditingPO(null);
    }
  };

  const handleExportExcel = () => {
    const excelData = deliveryOrders.map(po => ({
      'PO Number': po.poNumber,
      'Supplier': po.supplierName,
      'Destination Site': po.projectName,
      'Order Date': po.orderDate,
      'Driver Name': po.driverName,
      'Driver Mobile': po.driverMobile,
      'Vehicle Number': po.vehicleNumber,
      'Status': po.deliveryStatus,
      'Dispatch / Gate Notes': po.dispatchNotes,
      'Total Value (INR)': po.totalAmount
    }));
    exportToExcel(excelData, 'Shivshakti_Material_Delivery_Logs.xlsx', 'Delivery Logs');
  };

  const statusSteps = ['Ordered', 'Dispatched', 'In-Transit', 'Delivered', 'Verified'];

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#2563EB]">
            <Truck className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Vehicle & Material Delivery Tracker</h2>
              <span className="badge badge-success text-[10px] font-semibold uppercase tracking-wide">
                Zero-Phone Call Logistics
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live material dispatch status board for remote partners across Pune, Mumbai & Nagpur.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
            {['ALL', 'Dispatched', 'In-Transit', 'Delivered', 'Verified'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                  filterStatus === status 
                    ? 'bg-[#2563EB] text-white font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportExcel}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Delivery Sheet</span>
          </button>
        </div>
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deliveryOrders.map((po) => {
          const currentStepIndex = statusSteps.indexOf(po.deliveryStatus);

          return (
            <div key={po.id} className="bg-white border border-slate-200/80 hover:border-slate-300 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 transition-all">
              {/* Top Row: PO & Supplier Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="badge badge-info text-xs font-mono font-bold">
                      {po.poNumber}
                    </span>
                    <span className="text-xs text-slate-400">Order: {po.orderDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{po.supplierName}</h3>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Destination: <strong className="text-slate-800 font-semibold">{po.projectName}</strong></span>
                  </p>
                </div>

                <button
                  onClick={() => handleOpenUpdateModal(po)}
                  className="bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2563EB] px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5 text-xs font-medium shadow-xs"
                  title="Update Material Delivery Status"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>

              {/* Items List */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 text-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Materials Cargo:</span>
                {po.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between font-medium text-slate-800">
                    <span>{item.name}</span>
                    <span className="text-[#2563EB] font-bold tabular-nums">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>

              {/* Interactive Status Stepper Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Dispatch Stepper</span>
                  <span className="text-[#2563EB] font-bold">{po.deliveryStatus}</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 relative">
                  {statusSteps.map((step, idx) => {
                    const isPassed = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step} className="flex flex-col items-center space-y-1">
                        <div className={`w-full h-1.5 rounded-full transition-all ${
                          isCurrent 
                            ? 'bg-[#2563EB]' 
                            : isPassed 
                            ? 'bg-emerald-500' 
                            : 'bg-slate-200'
                        }`} />
                        <span className={`text-[10px] font-medium truncate ${
                          isCurrent ? 'text-[#2563EB] font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Driver & Vehicle Card */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
                    <Truck className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{po.vehicleNumber || 'Vehicle Assigned'}</h5>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <span>Driver: <strong className="text-slate-800 font-semibold">{po.driverName}</strong></span>
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${po.driverMobile}`}
                  className="bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/70 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Driver</span>
                </a>
              </div>

              {/* Dispatch Notes / Gate Check-in */}
              {po.dispatchNotes && (
                <div className="text-xs text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 flex items-start space-x-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong className="text-amber-900 font-semibold">Live Note:</strong> {po.dispatchNotes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Update Status Modal */}
      {editingPO && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#2563EB]" />
                <span>Update Delivery: {editingPO.poNumber}</span>
              </h3>
              <button 
                onClick={() => setEditingPO(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material Delivery Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="Ordered">Ordered (Material Booked)</option>
                  <option value="Dispatched">Dispatched from Depot</option>
                  <option value="In-Transit">In-Transit (On Road)</option>
                  <option value="Delivered">Delivered at Gate</option>
                  <option value="Verified">Verified by Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Note / Toll / Gate Check-in
                </label>
                <textarea
                  rows="3"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Driver crossed Talegaon Toll booth at 4:30 PM..."
                  className="form-input"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPO(null)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

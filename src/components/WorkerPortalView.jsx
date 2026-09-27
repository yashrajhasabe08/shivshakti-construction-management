import React, { useState } from 'react';
import { Truck, HardHat, CheckCircle2, Clock, MapPin, PhoneCall, Send, ShieldCheck, DollarSign } from 'lucide-react';

export default function WorkerPortalView({ user, data, onUpdateStatus }) {
  // Find driver PO assignment by driver name or vehicle number
  const driverName = user.name || "Dnyaneshwar More";
  const driverPO = (data.purchaseOrders || []).find(
    po => po.driverName?.toLowerCase() === driverName.toLowerCase() || po.vehicleNumber === user.driverVehicleNo
  ) || data.purchaseOrders[0];

  const [notesInput, setNotesInput] = useState(driverPO?.dispatchNotes || '');

  const statusSteps = ['Ordered', 'Dispatched', 'In-Transit', 'Delivered', 'Verified'];

  const handleStepClick = (newStatus) => {
    if (driverPO) {
      onUpdateStatus(driverPO.id, newStatus, notesInput);
      alert(`Updated delivery status to '${newStatus}'! All partners can see this status now.`);
    }
  };

  const handleNotesSave = (e) => {
    e.preventDefault();
    if (driverPO) {
      onUpdateStatus(driverPO.id, driverPO.deliveryStatus, notesInput);
      alert('Location note saved successfully!');
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto font-sans">
      {/* Driver Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
            <HardHat className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge badge-info text-[10px] font-semibold uppercase tracking-wider">
                Site Worker & Driver Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">Vehicle: {user.driverVehicleNo || 'MH 12 QG 4821'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{driverName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Senior Truck Driver & Concrete Transport Operator • Shivshakti Logistics
            </p>
          </div>
        </div>
      </div>

      {/* Driver Active Delivery Task Card */}
      {driverPO && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="badge badge-info text-xs font-mono font-bold">
                Active Requisition: {driverPO.poNumber}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-2">{driverPO.supplierName}</h2>
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>Destination Site: <strong className="text-slate-800 font-semibold">{driverPO.projectName}</strong></span>
              </p>
            </div>

            <span className="badge badge-info text-xs px-2.5 py-1">
              Current Status: {driverPO.deliveryStatus}
            </span>
          </div>

          {/* Cargo Materials List */}
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Truck Cargo:</span>
            {driverPO.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between font-medium text-sm text-slate-800">
                <span>{item.name}</span>
                <span className="text-[#2563EB] font-bold tabular-nums">{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>

          {/* 1-Click Status Update Buttons */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              1-Click Status Dispatch Updater (No Calls Needed):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Dispatched', 'In-Transit', 'Delivered', 'Verified'].map((step) => {
                const isActive = driverPO.deliveryStatus === step;

                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleStepClick(step)}
                    className={`py-2.5 px-3.5 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 ${
                      isActive
                        ? 'bg-[#2563EB] text-white font-semibold'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{step}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toll Plaza / Gate Note Form */}
          <form onSubmit={handleNotesSave} className="space-y-2.5 pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Location Note / Gate Check-in Note (Visible to Partners):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Reached Talegaon Toll plaza. Site arrival in 30 mins."
                className="form-input flex-1"
              />
              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Driver / Worker Attendance & Wage Summary */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-[#2563EB]" />
          <span>Worker Muster Roll Attendance & Wage Slip Preview</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Muster Working Days:</span>
            <p className="text-base font-bold text-slate-900">6 Days / Week</p>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Daily Driver Rate:</span>
            <p className="text-base font-bold text-emerald-600 tabular-nums">₹ 950 / Day</p>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Weekly Payout Status:</span>
            <p className="text-base font-bold text-[#2563EB]">Approved (Paid on Sat)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  HardHat, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  PhoneCall, 
  Send, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  ListTodo,
  UserCheck,
  AlertTriangle,
  Package,
  Plus
} from 'lucide-react';
import { api } from '../services/api';

export default function WorkerPortalView({ user, data, onUpdateStatus }) {
  const [workerData, setWorkerData] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'delivery' | 'attendance' | 'report'
  const [toastMsg, setToastMsg] = useState(null);

  // Notes state
  const [notesInput, setNotesInput] = useState('');

  // Site update form state
  const [updateType, setUpdateType] = useState('DAILY_PROGRESS');
  const [updateDescription, setUpdateDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg, isErr = false) => {
    setToastMsg({ msg, isErr });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadWorkerData = async () => {
    try {
      const serverData = await api.getWorkerPortalData();
      if (serverData) {
        setWorkerData(serverData);
      }
    } catch (e) {
      console.warn('Fallback to props worker data:', e);
    }
  };

  useEffect(() => {
    loadWorkerData();
  }, [user]);

  const driverName = workerData?.worker?.name || user.name || "Dnyaneshwar More";
  const assignedPOs = workerData?.assignedPOs || (data?.purchaseOrders || []).filter(
    po => po.driverName?.toLowerCase() === driverName.toLowerCase() || po.vehicleNumber === user.driverVehicleNo
  );
  const currentPO = assignedPOs[0] || (data?.purchaseOrders || [])[0];
  const tasksList = workerData?.tasks || data?.workerTasks || [];
  const attendanceRecord = workerData?.attendance || { status: 'NOT_MARKED', date: new Date().toISOString().slice(0, 10) };
  const assignedSite = workerData?.worker?.assignedSite || 'Shivshakti Commercial Tower';

  const statusSteps = ['Ordered', 'Dispatched', 'In-Transit', 'Delivered', 'Verified'];

  const handleStepClick = async (newStatus) => {
    if (!currentPO) return;
    try {
      await api.updateWorkerDeliveryStatus(currentPO.id, newStatus, notesInput || currentPO.dispatchNotes);
      showToast(`Delivery status updated to '${newStatus}'!`);
      loadWorkerData();
      if (onUpdateStatus) onUpdateStatus(currentPO.id, newStatus, notesInput);
    } catch (err) {
      showToast(err.message || 'Failed to update status.', true);
    }
  };

  const handleNotesSave = async (e) => {
    e.preventDefault();
    if (!currentPO) return;
    try {
      await api.updateWorkerDeliveryStatus(currentPO.id, currentPO.deliveryStatus, notesInput);
      showToast('Location note saved and transmitted to site managers!');
      loadWorkerData();
    } catch (err) {
      showToast(err.message || 'Failed to save note.', true);
    }
  };

  const handleTaskStatusChange = async (taskId, nextStatus) => {
    try {
      await api.updateWorkerTaskStatus(taskId, nextStatus);
      showToast(`Task updated to ${nextStatus}!`);
      loadWorkerData();
    } catch (err) {
      showToast(err.message || 'Failed to update task status.', true);
    }
  };

  const handlePunchAttendance = async () => {
    try {
      const res = await api.punchWorkerAttendance();
      showToast(res.message || 'Attendance marked successfully!');
      loadWorkerData();
    } catch (err) {
      showToast(err.message || 'Failed to mark attendance.', true);
    }
  };

  const handleSiteUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateDescription.trim()) return;
    setIsSubmitting(true);
    try {
      await api.submitWorkerSiteUpdate({
        type: updateType,
        description: updateDescription,
        siteName: assignedSite
      });
      showToast('Site update submitted to project supervisors!');
      setUpdateDescription('');
      loadWorkerData();
    } catch (err) {
      showToast(err.message || 'Failed to submit update.', true);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-xs font-semibold ${
          toastMsg.isErr ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        } animate-in fade-in duration-200`}>
          {toastMsg.isErr ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.msg}</span>
        </div>
      )}

      {/* Driver / Worker Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
            <HardHat className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge badge-info text-[10px] font-semibold uppercase tracking-wider">
                Site Staff & Driver Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">Vehicle: {user.driverVehicleNo || 'MH 12 QG 4821'}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{driverName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Site: <strong className="text-slate-800 font-semibold">{assignedSite}</strong>
            </p>
          </div>
        </div>

        {/* Quick Attendance Pill */}
        <div className="flex items-center space-x-2">
          {attendanceRecord.status === 'PRESENT' ? (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Marked Present ({attendanceRecord.punchInTime || 'Today'})</span>
            </span>
          ) : (
            <button
              onClick={handlePunchAttendance}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Punch In Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile-Friendly Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'tasks' 
              ? 'bg-[#2563EB] text-white border-blue-600 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Assigned Tasks ({tasksList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'delivery' 
              ? 'bg-[#2563EB] text-white border-blue-600 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vehicle Dispatch</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'attendance' 
              ? 'bg-[#2563EB] text-white border-blue-600 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance & Shifts</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'report' 
              ? 'bg-[#2563EB] text-white border-blue-600 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Site Daily Update</span>
        </button>
      </div>

      {/* TAB 1: ASSIGNED TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ListTodo className="w-4 h-4 text-[#2563EB]" />
              <span>Today's Work Orders & Checklists</span>
            </h3>
            <span className="text-xs text-slate-400">Date: {new Date().toLocaleDateString('en-IN')}</span>
          </div>

          <div className="space-y-3">
            {tasksList.map((task) => (
              <div key={task.id} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 text-[11px]">Due: {task.dueDate || 'Today'}</span>
                  <div className="flex space-x-1.5">
                    {task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleTaskStatusChange(task.id, 'IN_PROGRESS')}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-semibold"
                      >
                        Start Task
                      </button>
                    )}
                    {task.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleTaskStatusChange(task.id, 'COMPLETED')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VEHICLE DISPATCH (Current PO) */}
      {activeTab === 'delivery' && currentPO && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="badge badge-info text-xs font-mono font-bold">
                Assigned Requisition: {currentPO.poNumber}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{currentPO.supplierName}</h2>
              <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>Destination: <strong className="text-slate-800">{currentPO.projectName}</strong></span>
              </p>
            </div>
            <span className="badge badge-info text-xs">
              Status: {currentPO.deliveryStatus}
            </span>
          </div>

          {/* Cargo items - Quantities only, NO prices */}
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Cargo Materials:</span>
            {currentPO.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between font-medium text-xs text-slate-800">
                <span>{item.name || item.materialName}</span>
                <span className="text-[#2563EB] font-bold tabular-nums">{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>

          {/* 1-Click Status Stepper */}
          <div className="space-y-2 pt-1">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              1-Click Status Dispatch Stepper:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Dispatched', 'In-Transit', 'Delivered', 'Verified'].map((step) => {
                const isActive = currentPO.deliveryStatus === step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleStepClick(step)}
                    className={`py-2 px-3 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 ${
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

          {/* Gate Pass Notes */}
          <form onSubmit={handleNotesSave} className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Live Location Note / Toll Check-in Note (Visible to Project Managers):
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
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & SHIFTS */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>Site Staff Duty Muster & Attendance Log</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Today's Date</span>
              <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Attendance Status</span>
              <p className={`text-sm font-bold ${attendanceRecord.status === 'PRESENT' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {attendanceRecord.status === 'PRESENT' ? 'Present (Punched In)' : 'Pending Punch In'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Standard Site Shift</span>
              <p className="text-sm font-bold text-slate-900">08:00 AM - 06:00 PM</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Weekly Duty Roster Active</h4>
              <p className="text-[11px] text-slate-500">6 Days / Week on Site Assignment</p>
            </div>
            {attendanceRecord.status !== 'PRESENT' && (
              <button
                onClick={handlePunchAttendance}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
              >
                Punch In Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SITE DAILY UPDATE & ISSUE REPORT */}
      {activeTab === 'report' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Send className="w-4 h-4 text-[#2563EB]" />
            <span>Submit Site Update, Issue or Material Requirement</span>
          </h3>

          <form onSubmit={handleSiteUpdateSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Update Type</label>
              <select
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value)}
                className="form-select"
              >
                <option value="DAILY_PROGRESS">Daily Construction Progress Update</option>
                <option value="ISSUE_REPORT">Report Site Hazard / Maintenance Issue</option>
                <option value="MATERIAL_REQUEST">Site Material Requisition / Shortage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Details & Remarks</label>
              <textarea
                rows="4"
                required
                value={updateDescription}
                onChange={(e) => setUpdateDescription(e.target.value)}
                placeholder="Explain the work completed today or describe the issue encountered at site..."
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Update'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

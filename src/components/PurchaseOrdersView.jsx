import React, { useState } from 'react';
import { ShoppingCart, Plus, Download, Truck, Calendar, PhoneCall, Building, Eye, PackageCheck, FileSpreadsheet, Edit3, Trash2 } from 'lucide-react';
import { exportToExcel, exportPurchaseOrdersWithMaterials } from '../utils/excelExport';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import PODetailModal from './PODetailModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function PurchaseOrdersView({ 
  data, 
  selectedPartner, 
  onAddNew, 
  onEdit, 
  onDelete, 
  onNavigateTo, 
  onSaveItem 
}) {
  const [selectedPOForDetails, setSelectedPOForDetails] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const moduleInfo = MODULE_DESCRIPTIONS.purchaseOrders;

  const purchaseOrders = (data.purchaseOrders || []).filter(po => {
    if (selectedPartner === 'ALL') return true;
    const proj = (data.projects || []).find(p => p.id === po.projectId);
    return proj && proj.partnerId === selectedPartner;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const handleExportMaterials = () => {
    exportPurchaseOrdersWithMaterials(purchaseOrders, data.purchaseBills || []);
  };

  const columns = [
    {
      key: 'poNumber',
      header: 'PO Ref & Date',
      render: (val, row) => (
        <div>
          <button
            type="button"
            onClick={() => setSelectedPOForDetails(row)}
            className="font-bold text-[#2563EB] hover:underline font-mono text-xs block text-left"
          >
            {val || row.id}
          </button>
          <span className="text-[11px] text-slate-400 block">{row.orderDate || '—'}</span>
        </div>
      )
    },
    {
      key: 'supplierName',
      header: 'Supplier Vendor',
      render: (val) => (
        <span className="font-semibold text-slate-900 text-xs block">{val || '—'}</span>
      )
    },
    {
      key: 'projectName',
      header: 'Destination Site',
      render: (val) => (
        <span className="text-slate-700 font-medium text-xs inline-flex items-center space-x-1">
          <Building className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{val || 'General Site'}</span>
        </span>
      )
    },
    {
      key: 'materials',
      header: 'Materials Ordered',
      render: (val, row) => {
        const items = row.items || [];
        if (items.length === 0) return <span className="text-slate-400 text-xs italic">No items listed</span>;
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-slate-800 block">
              {items[0].quantity} {items[0].unit} &bull; {items[0].materialName || items[0].name}
            </span>
            {items.length > 1 && (
              <span className="text-[10px] text-blue-600 font-medium">
                +{items.length - 1} more material items
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalAmount',
      header: 'Total Value (₹)',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'deliveryStatus',
      header: 'Delivery Status',
      align: 'center',
      render: (val) => {
        let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        if (val === 'Delivered') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (val === 'In-Transit' || val === 'Dispatched') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';

        return (
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
            {val || 'Pending'}
          </span>
        );
      }
    }
  ];

  const filterOptions = [
    {
      key: 'deliveryStatus',
      label: 'Delivery Status',
      options: [
        { value: 'ALL', label: 'All Delivery Statuses' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'In-Transit', label: 'In-Transit' },
        { value: 'Dispatched', label: 'Dispatched' },
        { value: 'Pending', label: 'Pending' }
      ]
    },
    {
      key: 'projectName',
      label: 'Destination Site',
      options: [
        { value: 'ALL', label: 'All Sites' },
        ...Array.from(new Set(purchaseOrders.map(p => p.projectName).filter(Boolean))).map(s => ({
          value: s,
          label: s
        }))
      ]
    }
  ];

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete('purchaseOrders', deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleSavePOItems = (poId, updatedItems) => {
    const targetPO = purchaseOrders.find(p => p.id === poId);
    if (targetPO && onSaveItem) {
      const newTotal = updatedItems.reduce((s, i) => s + (Number(i.amount) || Number(i.quantity * i.rate) || 0), 0);
      onSaveItem('purchaseOrders', {
        ...targetPO,
        items: updatedItems,
        totalAmount: newTotal > 0 ? newTotal : targetPO.totalAmount
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={ShoppingCart}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`${purchaseOrders.length} Orders Active`}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportMaterials}
              className="btn-secondary flex items-center space-x-1.5 text-xs font-semibold"
              title="Export POs with full material breakdown"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Materials Excel</span>
            </button>
            <button
              onClick={() => onAddNew('purchaseOrders')}
              className="btn-primary flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create New PO</span>
            </button>
          </div>
        }
      />

      <DataTable
        data={purchaseOrders}
        columns={columns}
        searchKeys={['poNumber', 'supplierName', 'projectName', 'deliveryStatus', 'driverName', 'vehicleNumber']}
        searchPlaceholder="Search PO by number, supplier, site, driver, status..."
        filters={filterOptions}
        onAddNew={() => onAddNew('purchaseOrders')}
        addNewLabel="Create New PO"
        onView={(row) => setSelectedPOForDetails(row)}
        onEdit={(row) => onEdit('purchaseOrders', row)}
        onDelete={(row) => setDeleteTarget(row)}
        exportFilename="Shivshakti_Purchase_Orders.xlsx"
        exportSheetName="PurchaseOrders"
      />

      {/* PO DETAIL MODAL */}
      {selectedPOForDetails && (
        <PODetailModal
          po={selectedPOForDetails}
          bills={data.purchaseBills || []}
          onClose={() => setSelectedPOForDetails(null)}
          onSaveItems={handleSavePOItems}
          onNavigateToBills={() => {
            setSelectedPOForDetails(null);
            if (onNavigateTo) onNavigateTo('purchaseBills');
          }}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Purchase Order"
        message={`Are you sure you want to permanently delete purchase order ${deleteTarget?.poNumber || deleteTarget?.id} for ${deleteTarget?.supplierName}? All linked records in PostgreSQL will be affected.`}
        confirmLabel="Confirm Delete PO"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ClientPortalView from './components/ClientPortalView';
import WorkerPortalView from './components/WorkerPortalView';

import DashboardView from './components/DashboardView';
import DeliveryTrackerView from './components/DeliveryTrackerView';
import ProjectsView from './components/ProjectsView';
import ClientsView from './components/ClientsView';
import ClientPaymentsView from './components/ClientPaymentsView';
import SuppliersView from './components/SuppliersView';
import PurchaseOrdersView from './components/PurchaseOrdersView';
import PurchaseBillsView from './components/PurchaseBillsView';
import PurchasePaymentsView from './components/PurchasePaymentsView';
import LabourWagesView from './components/LabourWagesView';
import AssetsView from './components/AssetsView';
import SubcontractorsView from './components/SubcontractorsView';
import ExpensesView from './components/ExpensesView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import GenericModal from './components/GenericModal';
import LoginView from './components/LoginView';

// Admin Data Management Views
import UsersView from './components/UsersView';
import PartnersView from './components/PartnersView';
import AuditLogsView from './components/AuditLogsView';

import { api, getStoredData } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    return api.getAuthUser();
  });

  const [activeTab, setActiveTab] = useState('projects');
  const [selectedPartner, setSelectedPartner] = useState(() => {
    const u = api.getAuthUser();
    return u?.partnerId || 'ALL';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(getStoredData());
  const [activeModal, setActiveModal] = useState(null);
  const [activeEditItem, setActiveEditItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    async function loadData() {
      // Verify token with backend
      const verifiedUser = await api.verifySession();
      if (verifiedUser) {
        setCurrentUser(verifiedUser);
        if (verifiedUser.partnerId) {
          setSelectedPartner(verifiedUser.partnerId);
        }
      }
      const dbData = await api.getData();
      if (dbData) setData(dbData);
    }
    loadData();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.partnerId) {
      setSelectedPartner(user.partnerId);
    }
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    showToast('Logged out of session.');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefreshData = async () => {
    const dbData = await api.getData();
    if (dbData) {
      setData(dbData);
      showToast('Live database metrics refreshed.');
    }
  };

  const handleUpdateStatus = async (poId, status, notes) => {
    const updatedData = await api.updateDeliveryStatus(poId, status, notes);
    setData(updatedData);
    showToast(`Material status updated to '${status}'!`);
  };

  const handleSaveItem = async (moduleName, item) => {
    const updatedData = await api.updateItem(moduleName, item);
    setData(updatedData);
    showToast(`Record ${activeEditItem ? 'updated in' : 'saved to'} ${moduleName}!`);
    setActiveEditItem(null);
    setActiveModal(null);
  };

  const handleDeleteItem = async (moduleName, itemId) => {
    const updatedData = await api.deleteItem(moduleName, itemId);
    setData(updatedData);
    showToast(`Record deleted from ${moduleName}!`);
  };

  const handleAddNewItem = (moduleName) => {
    setActiveEditItem(null);
    setActiveModal(moduleName);
  };

  const handleEditItem = (moduleName, item) => {
    setActiveEditItem(item);
    setActiveModal(moduleName);
  };

  const pendingDeliveriesCount = (data?.purchaseOrders || []).filter(
    po => po.deliveryStatus === 'In-Transit' || po.deliveryStatus === 'Dispatched'
  ).length;

  // Unauthenticated: Show real JWT login screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentUser?.role === 'CLIENT') {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col font-sans">
        <Header 
          user={currentUser} 
          onLogout={handleLogout} 
          selectedPartner={selectedPartner} 
          setSelectedPartner={setSelectedPartner} 
          data={data} 
          onOpenDeliveryTracker={() => setActiveTab('deliveryTracker')} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          onNavigateTo={(tab) => setActiveTab(tab)}
        />
        <main className="flex-1 p-6 bg-[#F7F9FC]">
          <ClientPortalView
            user={currentUser}
            data={data}
            onRecordClientPayment={handleSaveItem}
          />
        </main>
      </div>
    );
  }

  if (currentUser?.role === 'WORKER') {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col font-sans">
        <Header 
          user={currentUser} 
          onLogout={handleLogout} 
          selectedPartner={selectedPartner} 
          setSelectedPartner={setSelectedPartner} 
          data={data} 
          onOpenDeliveryTracker={() => setActiveTab('deliveryTracker')} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          onNavigateTo={(tab) => setActiveTab(tab)}
        />
        <main className="flex-1 p-6 bg-[#F7F9FC]">
          <WorkerPortalView
            user={currentUser}
            data={data}
            onUpdateStatus={handleUpdateStatus}
          />
        </main>
      </div>
    );
  }

  // Admin / Partner Full ERP Portal View
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            data={data}
            selectedPartner={selectedPartner}
            currentUser={currentUser}
            onNavigateTo={(tab) => setActiveTab(tab)}
            onRetry={handleRefreshData}
          />
        );

      case 'deliveryTracker':
        return (
          <DeliveryTrackerView
            data={data}
            selectedPartner={selectedPartner}
            onUpdateStatus={handleUpdateStatus}
          />
        );

      case 'projects':
        return (
          <ProjectsView
            data={data}
            selectedPartner={selectedPartner}
            onSaveProject={(project) => handleSaveItem('projects', project)}
            onEditProject={(project) => handleEditItem('projects', project)}
            onDeleteProject={(projectId) => handleDeleteItem('projects', projectId)}
            onSaveExpense={(expense) => handleSaveItem('otherExpenses', expense)}
            onDeleteExpense={(source, id) => handleDeleteItem(source || 'otherExpenses', id)}
          />
        );

      // Admin Direct Management Views
      case 'users':
        return <UsersView currentUser={currentUser} />;

      case 'partners':
        return (
          <PartnersView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(partner) => handleEditItem('partners', partner)}
            onDelete={(id) => handleDeleteItem('partners', id)}
          />
        );

      case 'auditLogs':
        return <AuditLogsView />;

      case 'clients':
        return (
          <ClientsView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(client) => handleEditItem('clients', client)}
            onDelete={(id) => handleDeleteItem('clients', id)}
          />
        );

      case 'clientPayments':
        return (
          <ClientPaymentsView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(item) => handleEditItem('clientPayments', item)}
            onDelete={(id) => handleDeleteItem('clientPayments', id)}
          />
        );

      case 'suppliers':
        return (
          <SuppliersView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(supplier) => handleEditItem('suppliers', supplier)}
            onDelete={(id) => handleDeleteItem('suppliers', id)}
          />
        );

      case 'purchaseOrders':
        return (
          <PurchaseOrdersView
            data={data}
            selectedPartner={selectedPartner}
            onAddNew={handleAddNewItem}
            onEdit={(po) => handleEditItem('purchaseOrders', po)}
            onDelete={(id) => handleDeleteItem('purchaseOrders', id)}
            onNavigateTo={(tab) => setActiveTab(tab)}
            onSaveItem={handleSaveItem}
          />
        );

      case 'purchaseBills':
        return (
          <PurchaseBillsView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(bill) => handleEditItem('purchaseBills', bill)}
            onDelete={(id) => handleDeleteItem('purchaseBills', id)}
          />
        );

      case 'purchasePayments':
        return (
          <PurchasePaymentsView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(payment) => handleEditItem('purchasePayments', payment)}
            onDelete={(id) => handleDeleteItem('purchasePayments', id)}
          />
        );

      case 'labourWages':
        return (
          <LabourWagesView
            data={data}
            selectedPartner={selectedPartner}
            onAddNew={handleAddNewItem}
            onEdit={(wage) => handleEditItem('labourWages', wage)}
            onDelete={(id) => handleDeleteItem('labourWages', id)}
          />
        );

      case 'assets':
        return (
          <AssetsView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(asset) => handleEditItem('assetsAndDeposits', asset)}
            onDelete={(id) => handleDeleteItem('assetsAndDeposits', id)}
          />
        );

      case 'subcontractors':
        return (
          <SubcontractorsView
            data={data}
            onAddNew={handleAddNewItem}
            onEdit={(sub) => handleEditItem('subcontractors', sub)}
            onDelete={(id) => handleDeleteItem('subcontractors', id)}
          />
        );

      case 'otherExpenses':
        return (
          <ExpensesView
            data={data}
            selectedPartner={selectedPartner}
            onAddNew={handleAddNewItem}
            onEdit={(exp) => handleEditItem('otherExpenses', exp)}
            onDelete={(id) => handleDeleteItem('otherExpenses', id)}
          />
        );

      case 'reports':
        return <ReportsView data={data} />;

      case 'settings':
        return <SettingsView currentUser={currentUser} />;

      default:
        return (
          <DashboardView 
            data={data} 
            selectedPartner={selectedPartner} 
            currentUser={currentUser}
            onNavigateTo={setActiveTab} 
            onRetry={handleRefreshData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col font-sans">
      <Header
        user={currentUser}
        onLogout={handleLogout}
        selectedPartner={selectedPartner}
        setSelectedPartner={setSelectedPartner}
        data={data}
        onOpenDeliveryTracker={() => setActiveTab('deliveryTracker')}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onNavigateTo={(tab) => setActiveTab(tab)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          counts={{
            pendingDeliveries: pendingDeliveriesCount,
            projects: data.projects?.length || 0,
            purchaseOrders: data.purchaseOrders?.length || 0,
          }}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#F7F9FC]">
          {renderActiveTabContent()}
        </main>
      </div>

      {activeModal && (
        <GenericModal
          moduleName={activeModal}
          editItem={activeEditItem}
          onClose={() => {
            setActiveModal(null);
            setActiveEditItem(null);
          }}
          onSave={handleSaveItem}
          projects={data.projects}
          suppliers={data.suppliers}
          clients={data.clients}
          partners={data.partners}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-gray-900 font-semibold px-4 py-3 rounded-xl border border-gray-200 shadow-lg flex items-center space-x-2 text-xs">
          <span className="text-emerald-600 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

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
import GenericModal from './components/GenericModal';
import LoginView from './components/LoginView';

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

  const handleUpdateStatus = async (poId, status, notes) => {
    const updatedData = await api.updateDeliveryStatus(poId, status, notes);
    setData(updatedData);
    showToast(`Material status updated to '${status}'!`);
  };

  const handleSaveItem = async (moduleName, item) => {
    const updatedData = await api.updateItem(moduleName, item);
    setData(updatedData);
    showToast(`New record saved to ${moduleName}!`);
  };

  const handleDeleteItem = async (moduleName, itemId) => {
    const updatedData = await api.deleteItem(moduleName, itemId);
    setData(updatedData);
    showToast(`Record deleted from ${moduleName}!`);
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
            onNavigateTo={(tab) => setActiveTab(tab)}
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
            onDeleteProject={(projectId) => handleDeleteItem('projects', projectId)}
            onSaveExpense={(expense) => handleSaveItem('otherExpenses', expense)}
            onDeleteExpense={(source, id) => handleDeleteItem(source || 'otherExpenses', id)}
          />
        );

      case 'clients':
        return (
          <ClientsView
            data={data}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('clients', id)}
          />
        );

      case 'clientPayments':
        return (
          <ClientPaymentsView
            data={data}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('clientPayments', id)}
          />
        );

      case 'suppliers':
        return (
          <SuppliersView
            data={data}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('suppliers', id)}
          />
        );

      case 'purchaseOrders':
        return (
          <PurchaseOrdersView
            data={data}
            selectedPartner={selectedPartner}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('purchaseOrders', id)}
            onNavigateTo={(tab) => setActiveTab(tab)}
          />
        );

      case 'purchaseBills':
        return (
          <PurchaseBillsView
            data={data}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('purchaseBills', id)}
          />
        );

      case 'purchasePayments':
        return (
          <PurchasePaymentsView
            data={data}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('purchasePayments', id)}
          />
        );

      case 'labourWages':
        return (
          <LabourWagesView
            data={data}
            selectedPartner={selectedPartner}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('labourWages', id)}
          />
        );

      case 'assets':
        return (
          <AssetsView
            data={data}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('assetsAndDeposits', id)}
          />
        );

      case 'subcontractors':
        return (
          <SubcontractorsView
            data={data}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('subcontractors', id)}
          />
        );

      case 'otherExpenses':
        return (
          <ExpensesView
            data={data}
            selectedPartner={selectedPartner}
            onAddNew={(mod) => setActiveModal(mod)}
            onDelete={(id) => handleDeleteItem('otherExpenses', id)}
          />
        );

      case 'reports':
        return <ReportsView data={data} />;

      default:
        return <DashboardView data={data} selectedPartner={selectedPartner} onNavigateTo={setActiveTab} />;
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
          onClose={() => setActiveModal(null)}
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

'use client';

import React, { useState } from 'react';
import { WhatsAppStatusProvider, useWhatsAppStatus } from '../context/WhatsAppStatusContext';
import { Navigation, TabId } from './Navigation';
import { OverviewView } from './OverviewView';
import { SetupWizard } from './SetupWizard';
import { ApplicationsView } from './ApplicationsView';
import { WhatsAppView } from './WhatsAppView';
import { SandboxTesterView } from './SandboxTesterView';
import { IntegrationWizardView } from './IntegrationWizardView';
import { UsersSessionsView } from './UsersSessionsView';
import { LogsView } from './LogsView';
import { HealthDocsView } from './HealthDocsView';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { isConnected, phoneNumber } = useWhatsAppStatus();

  return (
    <div className="flex min-h-screen bg-[#090d16] text-white">
      {/* Sidebar Navigation with live system status */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={isConnected ? `WhatsApp: ${phoneNumber || 'Connected'}` : 'Online'}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {activeTab === 'overview' && <OverviewView setActiveTab={setActiveTab} />}
        {activeTab === 'wizard' && (
          <SetupWizard
            onComplete={() => setActiveTab('overview')}
            onNavigateToSandbox={() => setActiveTab('sandbox')}
          />
        )}
        {activeTab === 'apps' && <ApplicationsView />}
        {activeTab === 'whatsapp' && <WhatsAppView />}
        {activeTab === 'sandbox' && <SandboxTesterView />}
        {activeTab === 'integration' && <IntegrationWizardView />}
        {activeTab === 'users' && <UsersSessionsView />}
        {activeTab === 'logs' && <LogsView />}
        {activeTab === 'health' && <HealthDocsView />}
      </main>
    </div>
  );
}

export function DashboardView() {
  return (
    <WhatsAppStatusProvider>
      <DashboardContent />
    </WhatsAppStatusProvider>
  );
}

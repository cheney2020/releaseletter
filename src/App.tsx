import React from 'react';
import { AppProvider, useAppContext } from './store';
import { TeamList } from './pages/TeamList';
import { ReleaseList } from './pages/ReleaseList';
import { ReleaseWizard } from './pages/ReleaseWizard';
import { LayoutDashboard, FileText, Settings, LogOut, Users } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentView, setCurrentView } = useAppContext();

  if (currentView === 'wizard') {
    return <ReleaseWizard />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 shadow-sm z-10">
        <div className="w-8 h-8 bg-[#DA291C] rounded-lg flex items-center justify-center text-white font-bold mr-3">
          P
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">产品迭代功能清单发布系统</span>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-auto">
        {currentView === 'teams' && <TeamList />}
        {currentView === 'list' && <ReleaseList />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

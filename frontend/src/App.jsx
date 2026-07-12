import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import TextModule from './views/TextModule';
import UrlModule from './views/UrlModule';
import PdfModule from './views/PdfModule';
import OcrModule from './views/OcrModule';
import PlannerModule from './views/PlannerModule';
import History from './views/History';
import SettingsView from './views/Settings';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Map tabs to views
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'text':
        return <TextModule />;
      case 'url':
        return <UrlModule />;
      case 'pdf':
        return <PdfModule />;
      case 'ocr':
        return <OcrModule />;
      case 'planner':
        return <PlannerModule />;
      case 'history':
        return <History />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-obsidian-900 transition-colors duration-300">
      {/* Side Navigation panel */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame */}
      <main className="pl-72 pr-6 py-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;

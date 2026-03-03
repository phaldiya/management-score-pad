import { Route, Routes } from 'react-router-dom';

import GamePage from './components/game/GamePage.tsx';
import Header from './components/layout/Header.tsx';
import SetupPage from './components/setup/SetupPage.tsx';
import ErrorBoundary from './components/shared/ErrorBoundary.tsx';
import { AppProvider } from './context/AppContext.tsx';

function AppLayout() {
  return (
    <div className="flex h-dvh flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        <ErrorBoundary>
          <Routes>
            <Route index element={<SetupPage />} />
            <Route path="/game" element={<GamePage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

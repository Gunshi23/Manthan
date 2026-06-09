import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthFlow } from './pages/AuthFlow';
import { OrbitInitialization } from './pages/OrbitInitialization';
import { BusinessProfileSetup } from './pages/BusinessProfileSetup';
import { MissionSetup } from './pages/MissionSetup';
import { AppShell } from './components/AppShell';
import { CommandCenter } from './pages/CommandCenter';
import { MissionControl } from './pages/MissionControl';
import { CustomerGalaxy } from './pages/CustomerGalaxy';
import { GrowthEngine } from './pages/GrowthEngine';
import { AgentBoardroom } from './pages/AgentBoardroom';
import { VoiceConsole } from './pages/VoiceConsole';
import { OrbitAnalytics } from './pages/OrbitAnalytics';
import { SystemConfiguration } from './pages/SystemConfiguration';
import { FutureSimulator } from './pages/FutureSimulator';
import { OpportunityRadar } from './pages/OpportunityRadar';
import { SeasonalIntelligence } from './pages/SeasonalIntelligence';
import { CompetitorIntelligence } from './pages/CompetitorIntelligence';

type AppStage = 'landing' | 'auth' | 'init' | 'profile-setup' | 'setup' | 'app';
type AppPage = 'command-center' | 'mission-control' | 'customer-galaxy' | 'growth-engine' | 'agent-boardroom' | 'voice-console' | 'analytics' | 'system-config' | 'future-simulator' | 'opportunity-radar' | 'seasonal-intel' | 'competitor-intel';

function App() {
  const [stage, setStage] = useState<AppStage>('landing');
  const [activePage, setActivePage] = useState<AppPage>('command-center');
  const [missionGoal, setMissionGoal] = useState<string>('');

  const handleEnterOS = () => setStage('auth');
  const handleLoginSuccess = () => setStage('init');
  const handleInitComplete = () => setStage('profile-setup');
  const handleProfileComplete = (goal?: string) => {
    if (goal) {
      setMissionGoal(goal);
      setStage('app');
    } else {
      setStage('setup');
    }
  };
  const handleSetupComplete = (goal: string) => {
    setMissionGoal(goal);
    setStage('app');
  };

  if (stage === 'landing') {
    return <LandingPage onEnterOS={handleEnterOS} />;
  }

  if (stage === 'auth') {
    return <AuthFlow onLoginSuccess={handleLoginSuccess} onBack={() => setStage('landing')} />;
  }

  if (stage === 'init') {
    return <OrbitInitialization onComplete={handleInitComplete} />;
  }

  if (stage === 'profile-setup') {
    return <BusinessProfileSetup onSetupComplete={handleProfileComplete} />;
  }

  if (stage === 'setup') {
    return <MissionSetup onSetupComplete={handleSetupComplete} />;
  }

  return (
    <AppShell
      activePage={activePage}
      onNavigate={(page) => setActivePage(page as AppPage)}
      missionGoal={missionGoal}
    >
      {activePage === 'command-center' && <CommandCenter />}
      {activePage === 'mission-control' && <MissionControl />}
      {activePage === 'customer-galaxy' && <CustomerGalaxy />}
      {activePage === 'growth-engine' && <GrowthEngine />}
      {activePage === 'agent-boardroom' && <AgentBoardroom />}
      {activePage === 'voice-console' && <VoiceConsole />}
      {activePage === 'analytics' && <OrbitAnalytics />}
      {activePage === 'system-config' && <SystemConfiguration />}
      {activePage === 'future-simulator' && <FutureSimulator />}
      {activePage === 'opportunity-radar' && <OpportunityRadar />}
      {activePage === 'seasonal-intel' && <SeasonalIntelligence />}
      {activePage === 'competitor-intel' && <CompetitorIntelligence />}
    </AppShell>
  );
}

export default App;

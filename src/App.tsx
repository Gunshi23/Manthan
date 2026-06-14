import { useState, useEffect } from 'react';
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
import { OrbitAnalytics } from './pages/OrbitAnalytics';
import { OrbitPersonas } from './pages/OrbitPersonas';

import { FutureSimulator } from './pages/FutureSimulator';
import { OpportunityRadar } from './pages/OpportunityRadar';
import { CompetitorIntelligence } from './pages/CompetitorIntelligence';
import { SeasonalIntelligence } from './pages/SeasonalIntelligence';
import { RegionalIntelligence } from './pages/RegionalIntelligence';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useOrbit } from './context/OrbitContext';

type AppStage = 'landing' | 'auth' | 'init' | 'profile-setup' | 'setup' | 'app';
type AppPage = 'command-center' | 'mission-control' | 'customer-galaxy' | 'growth-engine' | 'agent-boardroom' | 'analytics' | 'future-simulator' | 'opportunity-radar' | 'competitor-intel' | 'Manthan-personas' | 'seasonal-intelligence' | 'regional-intelligence';

function App() {
  const [stage, setStage] = useState<AppStage>('landing');
  const [activePage, setActivePage] = useState<AppPage>('command-center');
  const [missionGoal, setMissionGoal] = useState<string>('');
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const { workspaceDna } = useOrbit();

  // Redirect if no workspace exists or onboarding is not completed
  useEffect(() => {
    if (stage === 'landing' || stage === 'auth' || stage === 'init') return;

    if (!onboardingCompleted) {
      // Force users to stay in profile-setup or setup if onboarding is not completed
      if (stage === 'app') {
        setStage('profile-setup');
      }
    } else {
      // Once onboarding is completed, ensure a workspace DNA exists before moving to app stage
      if (workspaceDna === null) {
        if (stage !== 'profile-setup') {
          setStage('profile-setup');
        }
      } else {
        if (stage === 'profile-setup' || stage === 'setup') {
          setStage('app');
        }
      }
    }
  }, [workspaceDna, stage, onboardingCompleted]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStage(prev => (prev === 'landing' || prev === 'auth') ? 'init' : prev);
      } else {
        setStage(prev => (prev !== 'landing' && prev !== 'auth') ? 'landing' : prev);
        setOnboardingCompleted(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleEnterOS = () => {
    if (auth.currentUser) {
      setStage('init');
    } else {
      setStage('auth');
    }
  };

  const handleLoginSuccess = () => setStage('init');
  const handleInitComplete = () => setStage('profile-setup');
  
  const handleProfileComplete = (goal?: string) => {
    if (goal) {
      setMissionGoal(goal);
      setOnboardingCompleted(true);
      setStage('app');
    } else {
      setStage('setup');
    }
  };

  const handleSetupComplete = (goal: string) => {
    setMissionGoal(goal);
    setOnboardingCompleted(true);
    setStage('app');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase SignOut error:", err);
    }
    setOnboardingCompleted(false);
    setStage('landing');
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
      activePage={activePage as any}
      onNavigate={(page) => setActivePage(page as AppPage)}
      missionGoal={missionGoal}
      onLogout={handleLogout}
    >
      {activePage === 'command-center' && <CommandCenter />}
      {activePage === 'mission-control' && <MissionControl />}
      {activePage === 'customer-galaxy' && <CustomerGalaxy />}
      {activePage === 'growth-engine' && <GrowthEngine />}
      {activePage === 'agent-boardroom' && <AgentBoardroom />}
      {activePage === 'analytics' && <OrbitAnalytics />}
      {activePage === 'future-simulator' && <FutureSimulator />}
      {activePage === 'opportunity-radar' && <OpportunityRadar onNavigate={setActivePage} />}
      {activePage === 'competitor-intel' && <CompetitorIntelligence />}
      {activePage === 'Manthan-personas' && <OrbitPersonas />}
      {activePage === 'seasonal-intelligence' && <SeasonalIntelligence />}
      {activePage === 'regional-intelligence' && <RegionalIntelligence />}
    </AppShell>
  );
}

export default App;

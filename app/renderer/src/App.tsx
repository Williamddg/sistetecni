import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Login } from './pages/Login';
import { AppRoutes } from './routes';
import { getSessionUser, setSessionUser } from './services/session';
import { ChangePassword } from './pages/ChangePassword';
import { BusinessSetup } from './pages/BusinessSetup';
import { getConfig } from './services/config';
import { SplashScreen } from './ui/SplashScreen';
import SetupWizard from './pages/SetupWizard';
import { AppBootScreen } from './ui/AppBootScreen';
import type { InstallerAutoConfig, SessionUser } from './types';
import { getRendererApi, type InstallerCheckStatus } from './services/rendererApi';

type AppState = 'loading' | 'setup' | 'ready';
type SetupStatus = InstallerCheckStatus;

export default function App() {
  const api = getRendererApi();
  // ── Estado del instalador ──
  const [appState, setAppState]     = useState<AppState>('loading');
  const [autoConfig, setAutoConfig] = useState<InstallerAutoConfig>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>(null);

  // ── Estado interno del POS ──
  const [showSplash, setShowSplash]             = useState(true);
  const [user, setUser]                         = useState<SessionUser | null>(null);
  const [forceChangePassword, setForceChangePassword] = useState(false);
  const [cfgChecked, setCfgChecked]             = useState(false);
  const [needsBusinessSetup, setNeedsBusinessSetup]   = useState(false);

  // ── 1. Autodetect MySQL (primer arranque) ──
  useEffect(() => {
    const init = async () => {
      try {
        const detect = await api.autodetect.status();

        const readInstallerStatus = async () => {
          try {
            const status = await api.installer.check();
            if (status?.state) setSetupStatus(status);
            if (status?.state === 'complete') {
              setAppState('ready');
              return true;
            }
          } catch {
            // best effort
          }
          return false;
        };

        if (!detect.ok) {
          const isReady = await readInstallerStatus();
          if (!isReady) setAppState('setup');
          return;
        }

        const result = detect.data;

        if (result.status === 'ready') {
          setAppState('ready');
        } else if (result.status === 'server_auto') {
          if (result.dbInstalled) {
            setAppState('ready');
          } else {
            setAutoConfig({ ...result.config, mode: 'server' });
            setSetupStatus({
              state: 'partial',
              reason: 'Se detectó instalación parcial de MySQL. Completa el setup para recuperar.',
            });
            setAppState('setup');
          }
        } else if (result.status === 'cashier') {
          setAutoConfig({ mode: 'cashier' });
          await readInstallerStatus();
          setAppState('setup');
        } else {
          // manual → mostrar wizard sin pre-llenado
          const isReady = await readInstallerStatus();
          if (!isReady) setAppState('setup');
        }
      } catch {
        // Si falla el autodetect (ej: primer dev sin NSIS)
        // usar installer:check como fallback para evitar estado ambiguo
        try {
          const status = await api.installer.check();
          if (status?.state) setSetupStatus(status);
          setAppState(status?.state === 'complete' ? 'ready' : 'setup');
        } catch {
          setAppState('ready');
        }
      }
    };
    init();
  }, []);

  // ── 2. Splash screen (solo cuando el POS ya está listo) ──
  useEffect(() => {
    if (appState !== 'ready') return;
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, [appState]);

  // ── 3. Cargar config del negocio y sesión ──
  useEffect(() => {
    if (appState !== 'ready') return;
    (async () => {
      const cfg = await getConfig();
      const hasName = !!String(cfg?.business?.name ?? '').trim();
      setNeedsBusinessSetup(!hasName);
      setCfgChecked(true);

      const u = getSessionUser?.();
      if (u) setUser(u);
    })();
  }, [appState]);

  // ── Handlers de sesión ──
  const handleLogout = (): void => {
    setSessionUser(null);
    setUser(null);
    setForceChangePassword(false);
    localStorage.clear();
    sessionStorage.clear();
  };

  const handleLogin = (u: SessionUser): void => {
    if (u._forceChangePassword || u.mustChangePassword) {
      setUser(u);
      setForceChangePassword(true);
      return;
    }
    setSessionUser(u);
    setUser(u);
  };

  // ── RENDER ──

  // Paso 1: wizard de instalación MySQL (primer arranque)
  if (appState === 'loading') {
    return <AppBootScreen />;
  }

  // Paso 2: wizard de instalación (BD no configurada)
  if (appState === 'setup') {
    return (
      <SetupWizard
        prefill={autoConfig}
        initialStatus={setupStatus}
        onComplete={() => setAppState('ready')}
      />
    );
  }

  // Paso 3: splash screen
  if (showSplash) {
    return <SplashScreen />;
  }

  // Paso 4: esperando que cargue la config
  if (!cfgChecked) {
    return null;
  }

  // Paso 5: POS normal
  return (
    <HashRouter>
      {needsBusinessSetup ? (
        <BusinessSetup onDone={() => setNeedsBusinessSetup(false)} />
      ) : !user ? (
        <Login onLogin={handleLogin} />
      ) : forceChangePassword ? (
        <ChangePassword
          user={user}
          onChanged={() => {
            setForceChangePassword(false);
            setSessionUser(user);
          }}
        />
      ) : (
        <AppRoutes user={user} onLogout={handleLogout} />
      )}
    </HashRouter>
  );
}

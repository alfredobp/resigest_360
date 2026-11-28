'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { driver, type Driver, type DriveStep } from 'driver.js';
import onboardingService from '@/services/onboardingService';
import { getTourStepsForRole, type OnboardingTourStep } from '@/config/onboardingTours';
import type { CompanyRole } from '@/types/wasteManagement';

interface OnboardingContextType {
  isReady: boolean;
  showProfileModal: boolean;
  activeRole: CompanyRole | null;
  hasCompany: boolean;
  isTourRunning: boolean;
  selectRoleAndStartTour: (role: CompanyRole) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  startTour: (overrideRole?: CompanyRole) => void;
  openProfileModal: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

function waitForElement(selector: string, timeoutMs = 4500): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(found);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeoutMs);
  });
}

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const driverRef = useRef<Driver | null>(null);
  const completedRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeRole, setActiveRole] = useState<CompanyRole | null>(null);
  const [hasCompany, setHasCompany] = useState(false);
  const [isTourRunning, setIsTourRunning] = useState(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const finishOnboarding = useCallback(async (role?: CompanyRole | null) => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      await onboardingService.markOnboardingCompleted(role);
    } catch {
      // No bloquear la experiencia de usuario si falla el guardado remoto
    }
  }, []);

  const launchDriverTour = useCallback(
    async (steps: OnboardingTourStep[], role: CompanyRole | null) => {
      if (steps.length === 0) return;

      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }

      setIsTourRunning(true);

      // Navegar a la ruta inicial del primer paso si es necesario
      const firstStep = steps[0];
      if (pathnameRef.current !== firstStep.route) {
        router.push(firstStep.route);
        await waitForElement(firstStep.element);
      } else {
        await waitForElement(firstStep.element, 1500);
      }

      const driverObj: Driver = driver({
        showProgress: true,
        allowClose: true,
        animate: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'resigest-driver-popover',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        progressText: 'Paso {{current}} de {{total}}',
        onCloseClick: () => {
          void finishOnboarding(role);
          driverObj.destroy();
        },
        onDestroyed: () => {
          setIsTourRunning(false);
          void finishOnboarding(role);
        },
      });

      const navigateAndMove = async (targetIndex: number) => {
        const targetStep = steps[targetIndex];
        if (!targetStep) {
          driverObj.destroy();
          return;
        }

        if (pathnameRef.current !== targetStep.route) {
          router.push(targetStep.route);
        }

        await waitForElement(targetStep.element);
        driverObj.moveTo(targetIndex);
      };

      const driveSteps: DriveStep[] = steps.map((step, index) => ({
        element: step.element,
        popover: {
          ...step.popover,
          onNextClick: () => {
            if (index >= steps.length - 1) {
              void finishOnboarding(role);
              driverObj.destroy();
              return;
            }
            void navigateAndMove(index + 1);
          },
          onPrevClick: () => {
            if (index <= 0) return;
            void navigateAndMove(index - 1);
          },
        },
      }));

      driverObj.setSteps(driveSteps);
      driverRef.current = driverObj;
      driverObj.drive(0);
    },
    [finishOnboarding, router]
  );

  useEffect(() => {
    let mounted = true;

    async function initOnboarding() {
      try {
        const state = await onboardingService.getOnboardingState();
        if (!mounted) return;

        setActiveRole(state.role);
        setHasCompany(state.hasCompany);
        completedRef.current = state.completed;

        if (!state.completed) {
          if (state.hasCompany && state.role) {
            // Ya tiene empresa configurada: lanzar directamente el tour de su rol
            const steps = getTourStepsForRole(state.role);
            void launchDriverTour(steps, state.role);
          } else {
            // Primera vez sin empresa: mostrar selector de perfil
            setShowProfileModal(true);
          }
        }
      } catch {
        // Si no hay sesión aún o hay error transitorio, no bloquear la app
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    void initOnboarding();

    return () => {
      mounted = false;
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [launchDriverTour]);

  const selectRoleAndStartTour = useCallback(
    async (role: CompanyRole) => {
      setActiveRole(role);
      setShowProfileModal(false);
      completedRef.current = false;

      try {
        await onboardingService.saveOnboardingRole(role);
      } catch {
        // Continuar aunque falle el guardado remoto
      }

      const steps = getTourStepsForRole(role);
      await launchDriverTour(steps, role);
    },
    [launchDriverTour]
  );

  const skipOnboarding = useCallback(async () => {
    setShowProfileModal(false);
    if (driverRef.current) {
      driverRef.current.destroy();
    }
    await finishOnboarding(activeRole);
  }, [activeRole, finishOnboarding]);

  const startTour = useCallback(
    (overrideRole?: CompanyRole) => {
      const targetRole = overrideRole ?? activeRole;
      if (!targetRole) {
        setShowProfileModal(true);
        return;
      }
      const steps = getTourStepsForRole(targetRole);
      void launchDriverTour(steps, targetRole);
    },
    [activeRole, launchDriverTour]
  );

  const openProfileModal = useCallback(() => {
    setShowProfileModal(true);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isReady,
        showProfileModal,
        activeRole,
        hasCompany,
        isTourRunning,
        selectRoleAndStartTour,
        skipOnboarding,
        startTour,
        openProfileModal,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    return {
      isReady: true,
      showProfileModal: false,
      activeRole: null,
      hasCompany: false,
      isTourRunning: false,
      selectRoleAndStartTour: async () => {},
      skipOnboarding: async () => {},
      startTour: () => {},
      openProfileModal: () => {},
    };
  }
  return context;
};

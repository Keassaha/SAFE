"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface TimerState {
  running: boolean;
  startTime: number | null;
  accumulatedSeconds: number;
  /** True après "Arrêter" : afficher Enregistrer / Annuler au lieu de Reprendre / Arrêter. */
  stoppedForSave: boolean;
  clientId: string | null;
  clientLabel: string | null;
  dossierId: string | null;
  dossierLabel: string | null;
  description: string;
  typeActivite: string | null;
}

interface TimerContextValue extends TimerState {
  elapsedSeconds: number;
  isPaused: boolean;
  /** True si le chrono est arrêté avec du temps à enregistrer (affichage bouton Enregistrer). */
  hasStoppedWithPending: boolean;
  start: (payload: { clientId: string; clientLabel?: string; dossierId?: string; dossierLabel?: string; description?: string; typeActivite?: string }) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  stop: () => void;
  /** Arrête le chrono sans ouvrir le modal (données conservées pour "Enregistrer"). */
  stopOnly: () => void;
  /** Ouvre le modal d'enregistrement avec le temps actuel (à appeler après "Arrêter"). */
  triggerOpenSaveModal: () => void;
  onStopConfirm: (callback: (payload: TimerState) => void) => void;
  /** @deprecated Utiliser stopOnly + triggerOpenSaveModal. Arrête et ouvre le modal. */
  triggerStopConfirm: () => void;
  /** Réinitialise le chrono après enregistrement ou annulation. */
  clearPending: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function formatTimerElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>({
    running: false,
    startTime: null,
    accumulatedSeconds: 0,
    stoppedForSave: false,
    clientId: null,
    clientLabel: null,
    dossierId: null,
    dossierLabel: null,
    description: "",
    typeActivite: null,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const stopCallbackRef = useRef<((payload: TimerState) => void) | null>(null);
  const pendingStopPayloadRef = useRef<TimerState | null>(null);
  const stateRef = useRef<TimerState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!state.running || !state.startTime) {
      setElapsedSeconds(state.accumulatedSeconds);
      return;
    }
    const tick = () => {
      setElapsedSeconds(state.accumulatedSeconds + Math.floor((Date.now() - state.startTime!) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.running, state.startTime, state.accumulatedSeconds]);

  useEffect(() => {
    const payload = pendingStopPayloadRef.current;
    if (!state.running && payload && stopCallbackRef.current) {
      pendingStopPayloadRef.current = null;
      stopCallbackRef.current(payload);
    }
  }, [state.running]);

  const start = useCallback(
    (payload: { clientId: string; clientLabel?: string; dossierId?: string; dossierLabel?: string; description?: string; typeActivite?: string }) => {
      setState({
        running: true,
        startTime: Date.now(),
        accumulatedSeconds: 0,
        stoppedForSave: false,
        clientId: payload.clientId,
        clientLabel: payload.clientLabel ?? null,
        dossierId: payload.dossierId ?? null,
        dossierLabel: payload.dossierLabel ?? null,
        description: payload.description ?? "",
        typeActivite: payload.typeActivite ?? null,
      });
    },
    []
  );

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.running || !prev.startTime) return prev;
      const added = Math.floor((Date.now() - prev.startTime) / 1000);
      return {
        ...prev,
        running: false,
        startTime: null,
        accumulatedSeconds: prev.accumulatedSeconds + added,
      };
    });
  }, []);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.running || (!prev.dossierId && prev.accumulatedSeconds === 0)) return prev;
      return {
        ...prev,
        running: true,
        startTime: Date.now(),
      };
    });
  }, []);

  const restart = useCallback(() => {
    setState((prev) => ({
      ...prev,
      running: true,
      startTime: Date.now(),
      accumulatedSeconds: 0,
      stoppedForSave: false,
    }));
  }, []);

  const stop = useCallback(() => {
    setState((prev) => {
      if (prev.running && stopCallbackRef.current) {
        const totalSeconds = prev.accumulatedSeconds + (prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0);
        pendingStopPayloadRef.current = { ...prev, startTime: Date.now() - totalSeconds * 1000 };
      }
      return {
        running: false,
        startTime: null,
        accumulatedSeconds: 0,
        stoppedForSave: false,
        clientId: null,
        clientLabel: null,
        dossierId: null,
        dossierLabel: null,
        description: "",
        typeActivite: null,
      };
    });
    setElapsedSeconds(0);
  }, []);

  const onStopConfirm = useCallback((callback: (payload: TimerState) => void) => {
    stopCallbackRef.current = callback;
  }, []);

  const stopOnly = useCallback(() => {
    setState((prev) => {
      if (!prev.running && !prev.startTime) return prev;
      const totalSeconds =
        prev.accumulatedSeconds + (prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0);
      return {
        ...prev,
        running: false,
        startTime: null,
        accumulatedSeconds: totalSeconds,
        stoppedForSave: true,
      };
    });
  }, []);

  const triggerOpenSaveModal = useCallback(() => {
    const current = stateRef.current;
    let totalSeconds =
      current.accumulatedSeconds +
      (current.running && current.startTime ? Math.floor((Date.now() - current.startTime) / 1000) : 0);
    if (current.stoppedForSave && totalSeconds < 1) totalSeconds = 1;
    if (totalSeconds < 1 && !current.clientId) return;
    const payload: TimerState = {
      ...current,
      running: false,
      startTime: null,
      accumulatedSeconds: Math.max(1, totalSeconds),
    };
    stopCallbackRef.current?.(payload);
  }, []);

  const clearPending = useCallback(() => {
    setState({
      running: false,
      startTime: null,
      accumulatedSeconds: 0,
      stoppedForSave: false,
      clientId: null,
      clientLabel: null,
      dossierId: null,
      dossierLabel: null,
      description: "",
      typeActivite: null,
    });
    setElapsedSeconds(0);
  }, []);

  const triggerStopConfirm = useCallback(() => {
    setState((prev) => {
      if (prev.running) {
        const totalSeconds = prev.accumulatedSeconds + (prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0);
        pendingStopPayloadRef.current = { ...prev, startTime: Date.now() - totalSeconds * 1000 };
      }
      return {
        running: false,
        startTime: null,
        accumulatedSeconds: 0,
        stoppedForSave: false,
        clientId: null,
        clientLabel: null,
        dossierId: null,
        dossierLabel: null,
        description: "",
        typeActivite: null,
      };
    });
    setElapsedSeconds(0);
  }, []);

  const hasStoppedWithPending = state.stoppedForSave && state.accumulatedSeconds > 0;
  const isPaused =
    !state.running && !state.stoppedForSave && (state.accumulatedSeconds > 0 || state.clientId != null || state.dossierId != null);

  const value: TimerContextValue = {
    ...state,
    elapsedSeconds,
    isPaused,
    hasStoppedWithPending,
    start,
    pause,
    resume,
    restart,
    stop,
    stopOnly,
    triggerOpenSaveModal,
    onStopConfirm,
    triggerStopConfirm,
    clearPending,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

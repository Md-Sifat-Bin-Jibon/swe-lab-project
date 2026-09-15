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

export interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 right-6 z-[70] max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg transition ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      } ${message ? "" : "hidden"}`}
    >
      {message}
    </div>
  );
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (removeTimer.current) clearTimeout(removeTimer.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const showToast = useCallback(
    (nextMessage: string) => {
      clearTimers();
      setMessage(nextMessage);
      setVisible(true);

      hideTimer.current = setTimeout(() => {
        setVisible(false);
        removeTimer.current = setTimeout(() => {
          setMessage("");
        }, 200);
      }, 2800);
    },
    [clearTimers],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={message} visible={visible && Boolean(message)} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

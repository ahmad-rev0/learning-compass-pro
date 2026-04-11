import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface DemoContextType {
  isDemoMode: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({ isDemoMode: false, enterDemo: () => {}, exitDemo: () => {} });

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const enterDemo = useCallback(() => setIsDemoMode(true), []);
  const exitDemo = useCallback(() => setIsDemoMode(false), []);

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}

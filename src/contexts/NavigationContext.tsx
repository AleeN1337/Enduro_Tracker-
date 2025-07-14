import React, { createContext, useContext, useState, ReactNode } from "react";
import { EnduroSpot } from "../types";

interface NavigationContextType {
  navigationTarget: EnduroSpot | null;
  setNavigationTarget: (spot: EnduroSpot | null) => void;
  shouldShowNavigation: boolean;
  setShouldShowNavigation: (show: boolean) => void;
  isGPSNavigating: boolean;
  setIsGPSNavigating: (navigating: boolean) => void;
  navigationMode: "map" | "gps";
  setNavigationMode: (mode: "map" | "gps") => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const [navigationTarget, setNavigationTarget] = useState<EnduroSpot | null>(
    null
  );
  const [shouldShowNavigation, setShouldShowNavigation] = useState(false);
  const [isGPSNavigating, setIsGPSNavigating] = useState(false);
  const [navigationMode, setNavigationMode] = useState<"map" | "gps">("map");

  return (
    <NavigationContext.Provider
      value={{
        navigationTarget,
        setNavigationTarget,
        shouldShowNavigation,
        setShouldShowNavigation,
        isGPSNavigating,
        setIsGPSNavigating,
        navigationMode,
        setNavigationMode,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

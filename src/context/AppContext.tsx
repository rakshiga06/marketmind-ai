import React, { createContext, useContext, useState } from "react";

interface AppContextType {
  beginnerMode: boolean;
  setBeginnerMode: (v: boolean) => void;
  theme: "dark" | "light";
  setTheme: (v: "dark" | "light") => void;
}

const AppContext = createContext<AppContextType>({
  beginnerMode: true,
  setBeginnerMode: () => {},
  theme: "dark",
  setTheme: () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <AppContext.Provider value={{ beginnerMode, setBeginnerMode, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
};

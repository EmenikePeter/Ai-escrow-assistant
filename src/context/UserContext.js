import { createContext, useCallback, useContext, useMemo, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, _setUser] = useState(null); // { id, name, role }
  const setUser = useCallback((userData) => {
    _setUser(userData);
  }, []);
  const contextValue = useMemo(() => ({ user, setUser }), [user, setUser]);
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createHouse, getHouses, getSession, login, logout, onSessionChange,
  redeemInvite, register, type House, type Session,
} from "../lib/casaApi";

type AuthValue = {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(getSession);
  useEffect(() => onSessionChange(setSession), []);
  return (
    <AuthContext.Provider value={{
      session, signIn: login, signUp: register, signOut: logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider não encontrado");
  return value;
}

type HouseValue = {
  house: House | null; houses: House[]; loading: boolean; error: string;
  create: (name: string) => Promise<void>;
  join: (code: string) => Promise<void>;
  select: (id: string) => void;
  reload: () => Promise<void>;
};
const HouseContext = createContext<HouseValue | null>(null);
const HOUSE_SELECTION_KEY = "casa-nexo-selected-house-v1";
export function HouseProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(() => localStorage.getItem(HOUSE_SELECTION_KEY));

  async function reload() {
    const rows = await getHouses();
    setHouses(rows);
    if (!rows.some((row) => row.id === selected)) {
      setSelected(rows[0]?.id ?? null);
    }
  }

  useEffect(() => {
    let active = true;
    getHouses().then((rows) => {
      if (!active) return;
      setHouses(rows);
      setSelected((current) =>
        rows.some((row) => row.id === current) ? current : (rows[0]?.id ?? null));
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Erro ao carregar a Casa");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.user.id]);

  useEffect(() => {
    if (selected) localStorage.setItem(HOUSE_SELECTION_KEY, selected);
    else localStorage.removeItem(HOUSE_SELECTION_KEY);
  }, [selected]);

  const house = houses.find((row) => row.id === selected) ?? null;
  return (
    <HouseContext.Provider value={{
      house, houses, loading, error,
      async create(name) {
        const row = await createHouse(name);
        await reload();
        setSelected(row.id);
      },
      async join(code) {
        const id = await redeemInvite(code);
        await reload();
        setSelected(id);
      },
      select: setSelected, reload,
    }}>
      {children}
    </HouseContext.Provider>
  );
}
export function useHouse() {
  const value = useContext(HouseContext);
  if (!value) throw new Error("HouseProvider não encontrado");
  return value;
}

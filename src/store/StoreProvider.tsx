import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppData, Settings, Transaction } from '../types';

const STORAGE_KEY = 'income-tracker:data:v1';

export const EMPTY_DATA: AppData = { version: 1, transactions: [], settings: { currency: 'USD' } };

type Action =
  | { type: 'load'; data: AppData }
  | { type: 'upsert'; tx: Transaction }
  | { type: 'remove'; id: string }
  | { type: 'settings'; settings: Partial<Settings> };

interface State {
  loaded: boolean;
  data: AppData;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load':
      return { loaded: true, data: action.data };
    case 'upsert': {
      const others = state.data.transactions.filter((t) => t.id !== action.tx.id);
      return { ...state, data: { ...state.data, transactions: [action.tx, ...others] } };
    }
    case 'remove':
      return {
        ...state,
        data: { ...state.data, transactions: state.data.transactions.filter((t) => t.id !== action.id) },
      };
    case 'settings':
      return { ...state, data: { ...state.data, settings: { ...state.data.settings, ...action.settings } } };
  }
}

interface Store {
  loaded: boolean;
  transactions: Transaction[];
  settings: Settings;
  saveTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
  exportData: () => AppData;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { loaded: false, data: EMPTY_DATA });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'load', data: raw ? { ...EMPTY_DATA, ...JSON.parse(raw) } : EMPTY_DATA }))
      .catch(() => dispatch({ type: 'load', data: EMPTY_DATA }));
  }, []);

  useEffect(() => {
    // Never persist before the initial load, or we'd overwrite saved data with EMPTY_DATA.
    if (state.loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)).catch(() => {});
  }, [state]);

  const saveTransaction = useCallback((tx: Transaction) => dispatch({ type: 'upsert', tx }), []);
  const deleteTransaction = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const updateSettings = useCallback((settings: Partial<Settings>) => dispatch({ type: 'settings', settings }), []);
  const replaceAll = useCallback((data: AppData) => dispatch({ type: 'load', data }), []);

  const store = useMemo<Store>(
    () => ({
      loaded: state.loaded,
      transactions: state.data.transactions,
      settings: state.data.settings,
      saveTransaction,
      deleteTransaction,
      updateSettings,
      replaceAll,
      exportData: () => state.data,
    }),
    [state, saveTransaction, deleteTransaction, updateSettings, replaceAll],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

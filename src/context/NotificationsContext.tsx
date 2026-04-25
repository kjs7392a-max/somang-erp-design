"use client";

import {
  createContext, useCallback, useContext, useReducer, useRef,
} from "react";
import type { Notif, NotifKind, NotifDeeplink } from "@/lib/notifications";
import { NOTIF_SEED } from "@/lib/notifications";

export type NotifInput = {
  kind: NotifKind;
  title: string;
  body: string;
  deeplink: NotifDeeplink;
};

type State = { notifications: Notif[]; headsUp: Notif | null };

type Action =
  | { type: "PUSH"; notif: Notif }
  | { type: "DISMISS_HEADS_UP" }
  | { type: "MARK_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "CLEAR_ALL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PUSH":
      return { notifications: [action.notif, ...state.notifications], headsUp: action.notif };
    case "DISMISS_HEADS_UP":
      return { ...state, headsUp: null };
    case "MARK_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };
    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    case "CLEAR_ALL":
      return { notifications: [], headsUp: null };
  }
}

type NotificationsCtx = {
  notifications: Notif[];
  headsUp: Notif | null;
  unreadCount: number;
  push: (input: NotifInput) => void;
  dismissHeadsUp: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<NotificationsCtx | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { notifications: NOTIF_SEED, headsUp: null });
  const counter = useRef(200);

  const push = useCallback((input: NotifInput) => {
    const notif: Notif = {
      id: `NT-${++counter.current}`,
      ...input,
      at: new Date().toISOString(),
      read: false,
    };
    dispatch({ type: "PUSH", notif });
  }, []);

  const dismissHeadsUp = useCallback(() => dispatch({ type: "DISMISS_HEADS_UP" }), []);
  const markRead       = useCallback((id: string) => dispatch({ type: "MARK_READ", id }), []);
  const markAllRead    = useCallback(() => dispatch({ type: "MARK_ALL_READ" }), []);
  const clearAll       = useCallback(() => dispatch({ type: "CLEAR_ALL" }), []);

  return (
    <NotificationsContext.Provider
      value={{
        ...state,
        unreadCount: state.notifications.filter((n) => !n.read).length,
        push, dismissHeadsUp, markRead, markAllRead, clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}

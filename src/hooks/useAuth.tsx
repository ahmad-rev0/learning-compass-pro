import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { DEMO_USER_ID } from "@/lib/demoData";

type UserRole = "teacher" | "student" | "admin";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_ROLE_PRIORITY: UserRole[] = ["admin", "teacher", "student"];

const parseUserRole = (value: unknown): UserRole | null => {
  return USER_ROLE_PRIORITY.includes(value as UserRole) ? (value as UserRole) : null;
};

// Fake user object for demo mode
const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@atlas-learning.app",
  user_metadata: { display_name: "Demo Student", app_role: "student" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useDemo();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string, userMeta?: Record<string, unknown>) => {
    const metadataRole = parseUserRole(userMeta?.app_role);

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const dbRoles = (data ?? [])
      .map(({ role }) => parseUserRole(role))
      .filter((candidate): candidate is UserRole => candidate !== null);

    if (!error && metadataRole && !dbRoles.includes(metadataRole)) {
      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: metadataRole,
      });

      if (!insertError) {
        dbRoles.unshift(metadataRole);
      }
    }

    const resolvedRole =
      metadataRole ??
      USER_ROLE_PRIORITY.find((candidate) => dbRoles.includes(candidate)) ??
      "student";

    setRole(resolvedRole);
  };

  // Demo mode override
  useEffect(() => {
    if (isDemoMode) {
      setUser(DEMO_USER);
      setRole("student");
      setSession({ user: DEMO_USER } as unknown as Session);
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => fetchRole(nextSession.user.id, nextSession.user.user_metadata), 0);
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        fetchRole(nextSession.user.id, nextSession.user.user_metadata);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const signUp = async (email: string, password: string, displayName: string, selectedRole: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, app_role: selectedRole } },
    });

    if (error) throw error;
    if (data.user) setRole(selectedRole);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isDemoMode) {
      // Will be handled by DemoContext exit
      return;
    }
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

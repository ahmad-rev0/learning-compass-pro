import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Auth() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background pixel-grid-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="text-4xl inline-block"
          >
            🧭
          </motion.span>
          <h1 className="font-pixel text-sm mt-3 text-foreground">ATLAS</h1>
          <p className="text-muted-foreground text-sm mt-1">Agent × Gamification × Learning</p>
        </div>

        <Card className="border-2 border-border">
          <Tabs defaultValue="login">
            <CardHeader className="pb-2">
              <TabsList className="w-full border-2 border-border bg-card">
                <TabsTrigger value="login" className="flex-1 font-pixel text-[8px]">LOG IN</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 font-pixel text-[8px]">SIGN UP</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login"><LoginForm /></TabsContent>
              <TabsContent value="signup"><SignupForm /></TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" className="w-full font-pixel text-[9px]" disabled={loading}>
        {loading ? "LOGGING IN..." : "LOG IN"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, displayName, role);
      toast.success("Account created! Check your email to verify.");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-pixel text-[8px]">I AM A:</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={role === "student" ? "default" : "outline"}
            className="flex-1 font-pixel text-[8px]"
            onClick={() => setRole("student")}
          >
            📚 STUDENT
          </Button>
          <Button
            type="button"
            variant={role === "teacher" ? "default" : "outline"}
            className="flex-1 font-pixel text-[8px]"
            onClick={() => setRole("teacher")}
          >
            🎓 TEACHER
          </Button>
        </div>
      </div>
      <Button type="submit" className="w-full font-pixel text-[9px]" disabled={loading}>
        {loading ? "CREATING..." : "CREATE ACCOUNT"}
      </Button>
    </form>
  );
}

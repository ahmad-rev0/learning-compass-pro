import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Play } from "lucide-react";
import atlasLogo from "@/assets/atlas-logo.png";

export default function Auth() {
  const { user, loading } = useAuth();
  const { isDemoMode, enterDemo } = useDemo();
  const navigate = useNavigate();

  if (loading && !isDemoMode) return null;
  if (user || isDemoMode) return <Navigate to="/dashboard" replace />;

  const handleDemo = () => {
    enterDemo();
    toast.success("Demo mode activated! Explore the full platform ✨");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background pixel-grid-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.img
            src={atlasLogo}
            alt="Atlas"
            width={180}
            height={180}
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <h1 className="font-pixel text-3xl mt-4 text-foreground">ATLAS</h1>
          <p className="text-muted-foreground text-xl mt-2">Agent × Gamification × Learning</p>
        </div>

        {/* Demo Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Button
            onClick={handleDemo}
            className="w-full h-16 font-pixel text-lg bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 text-primary-foreground border-2 border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
          >
            <Play className="h-5 w-5 mr-2" />
            LAUNCH DEMO
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Experience the full platform — AI grading, agentic quests, Exa resources & more
          </p>
        </motion.div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-4 text-muted-foreground font-pixel">OR SIGN IN</span>
          </div>
        </div>

        <Card className="border-3 border-border">
          <Tabs defaultValue="login">
            <CardHeader className="pb-4">
              <TabsList className="w-full border-2 border-border bg-card h-14">
                <TabsTrigger value="login" className="flex-1 font-pixel text-lg py-3">LOG IN</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 font-pixel text-lg py-3">SIGN UP</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="px-8 pb-8">
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="text-lg h-14 px-4"
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="text-lg h-14 px-4"
        required
      />
      <Button
        type="submit"
        variant="secondary"
        className="w-full font-pixel text-lg h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-2 border-border"
        disabled={loading}
      >
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="text-lg h-14 px-4"
        required
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="text-lg h-14 px-4"
        required
      />
      <Input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="text-lg h-14 px-4"
        minLength={6}
        required
      />
      <div className="space-y-3">
        <p className="text-lg text-muted-foreground font-pixel">I AM A:</p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className={role === "student"
              ? "flex-1 font-pixel text-lg h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-2 border-border"
              : "flex-1 font-pixel text-lg h-14 bg-muted/40 hover:bg-muted text-muted-foreground border-2 border-border"
            }
            onClick={() => setRole("student")}
          >
            📚 STUDENT
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={role === "teacher"
              ? "flex-1 font-pixel text-lg h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-2 border-border"
              : "flex-1 font-pixel text-lg h-14 bg-muted/40 hover:bg-muted text-muted-foreground border-2 border-border"
            }
            onClick={() => setRole("teacher")}
          >
            🎓 TEACHER
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="w-full font-pixel text-lg h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-2 border-border"
        disabled={loading}
      >
        {loading ? "CREATING..." : "CREATE ACCOUNT"}
      </Button>
    </form>
  );
}

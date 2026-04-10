import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import DashboardLayout from "./pages/Dashboard";
import TeacherCourses from "./pages/teacher/Courses";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherStudents from "./pages/teacher/Students";
import TeacherSubmissions from "./pages/teacher/Submissions";
import TeacherAnalytics from "./pages/teacher/Analytics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout />} />

            {/* Teacher routes */}
            <Route path="/teacher/courses" element={<DashboardLayout><TeacherCourses /></DashboardLayout>} />
            <Route path="/teacher/assignments" element={<DashboardLayout><TeacherAssignments /></DashboardLayout>} />
            <Route path="/teacher/students" element={<DashboardLayout><TeacherStudents /></DashboardLayout>} />
            <Route path="/teacher/submissions" element={<DashboardLayout><TeacherSubmissions /></DashboardLayout>} />
            <Route path="/teacher/analytics" element={<DashboardLayout><TeacherAnalytics /></DashboardLayout>} />

            {/* Student routes (placeholder for Phase 3) */}
            <Route path="/student/*" element={<DashboardLayout><PlaceholderPage label="Coming in Phase 3" /></DashboardLayout>} />

            <Route path="/simulation" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="font-pixel text-[9px] text-muted-foreground">🚧 {label}</p>
    </div>
  );
}

export default App;

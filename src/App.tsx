import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoProvider } from "@/contexts/DemoContext";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import DashboardLayout from "./pages/Dashboard";
import TeacherCourses from "./pages/teacher/Courses";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherStudents from "./pages/teacher/Students";
import TeacherSubmissions from "./pages/teacher/Submissions";
import TeacherAnalytics from "./pages/teacher/Analytics";
import StudentAssignments from "./pages/student/Assignments";
import StudentProgress from "./pages/student/Progress";
import StudentQuests from "./pages/student/Quests";
import StudentUpload from "./pages/student/Upload";
import StudentAchievements from "./pages/student/Achievements";
import StudentAgentDashboard from "./pages/student/AgentDashboard";
import StudentStudyPlan from "./pages/student/StudyPlan";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DemoProvider>
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

              {/* Student routes */}
              <Route path="/student/assignments" element={<DashboardLayout><StudentAssignments /></DashboardLayout>} />
              <Route path="/student/progress" element={<DashboardLayout><StudentProgress /></DashboardLayout>} />
              <Route path="/student/quests" element={<DashboardLayout><StudentQuests /></DashboardLayout>} />
              <Route path="/student/upload" element={<DashboardLayout><StudentUpload /></DashboardLayout>} />
              <Route path="/student/achievements" element={<DashboardLayout><StudentAchievements /></DashboardLayout>} />
              <Route path="/student/agent" element={<DashboardLayout><StudentAgentDashboard /></DashboardLayout>} />
              <Route path="/student/study-plan" element={<DashboardLayout><StudentStudyPlan /></DashboardLayout>} />

              <Route path="/simulation" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </DemoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

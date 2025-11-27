/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import AdminLayout from "./layouts/AdminLayout";
import { AuthProvider } from "./context/AuthContext";
// Layouts
import ParentLayout from "./layouts/ParentLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import StudentLayout from "./layouts/StudentLayout"; // ✅ nuevo import

//paginas del admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminTasks from "./pages/AdminTasks";
import AdminReports from "./pages/AdminReports";
import AdminCalendar from "./pages/AdminCalendar";
import AdminSecurity from "./pages/AdminSecurity";
import AdminSettings from "./pages/AdminSettings";
import AdminSubjects from "./pages/AdminSubjects";
import CourseDetail from "./pages/CourseDetail";
import AdminSchedules from "./pages/AdminSchedules";


// Páginas del padre
import ParentHome from "./pages/ParentDashboard";
import ParentTasks from "./pages/ParentTasks";
import ParentSchedule from "./pages/ParentSchedule";
import ParentExcuses from "./pages/ParentExcuses";
import ParentAppointments from "./pages/ParentAppointments";
import ParentEvents from "./pages/ParentEvents";
import ParentComms from "./pages/ParentComms";

// Páginas del profesor
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherTasks from "./pages/TeacherTasks";
import TeacherSchedule from "./pages/TeacherSchedule";
import TeacherExcuses from "./pages/TeacherExcuses";
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherAppointments from "./pages/TeacherAppointments";
import TeacherComms from "./pages/TeacherComms";
import TeacherEvents from "./pages/TeacherEvents";
import TeacherAttendanceReport from "./pages/TeacherAttendanceReport";
import TeacherAttendanceDetail from "./pages/TeacherAttendanceDetail";


// Páginas del estudiante
import StudentDashboard from "./pages/StudentDashboard";
import StudentTasks from "./pages/StudentTasks";
import StudentSchedule from "./pages/StudentSchedule";
import StudentEvents from "./pages/StudentEvents";
import StudentMessages from "./pages/StudentMessages";
import StudentExcuses from "./pages/StudentExcuses"; 

// App login/landing
import App from "./App";



// ---------- Helpers de ruta ----------
function GuardAdmin({ children }) {
  const rol = localStorage.getItem("rol");
  if (rol !== "admin") return <Navigate to="/login" replace />;
  return children;
}

function GuardParent({ children }) {
  const rol = localStorage.getItem("rol");
  if (rol !== "padre") return <Navigate to="/login" replace />;
  return children;
}
function GuardTeacher({ children }) {
  const rol = localStorage.getItem("rol");
  if (rol !== "profesor") return <Navigate to="/login" replace />;
  return children;
}
function GuardStudent({ children }) {
  const rol = localStorage.getItem("rol");
  if (rol !== "estudiante") return <Navigate to="/login" replace />;
  return children;
}

function HomeGate() {
  const rol = localStorage.getItem("rol");
  if (rol === "padre") return <Navigate to="/parent" replace />;
  if (rol === "profesor") return <Navigate to="/teacher" replace />;
  if (rol === "estudiante") return <Navigate to="/student" replace />;
  if (rol === "admin") return <Navigate to="/admin" replace />;
  return <App />;
}

// ---------- Router principal ----------
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
        <AuthProvider>

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route path="/login" element={<App />} />


          <Route element={<GuardAdmin><AdminLayout /></GuardAdmin>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/:id" element={<CourseDetail />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/calendar" element={<AdminCalendar />} />
            <Route path="/admin/security" element={<AdminSecurity />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/subjects" element={<AdminSubjects />} />
            <Route path="/admin/schedules" element={<AdminSchedules />} />


          </Route>

        <Route element={<GuardParent><ParentLayout /></GuardParent>}>
          <Route path="/parent" element={<ParentHome />} />
          <Route path="/parent/tasks" element={<ParentTasks />} />
          <Route path="/parent/schedule" element={<ParentSchedule />} />
          <Route path="/parent/excuses" element={<ParentExcuses />} />
          <Route path="/parent/appointments" element={<ParentAppointments />} />
          <Route path="/parent/events" element={<ParentEvents />} />
          <Route path="/parent/comms" element={<ParentComms />} />
        </Route>

        <Route element={<GuardTeacher><TeacherLayout /></GuardTeacher>}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/tasks" element={<TeacherTasks />} />
          <Route path="/teacher/schedule" element={<TeacherSchedule />} />
          <Route path="/teacher/excuses" element={<TeacherExcuses />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/appointments" element={<TeacherAppointments />} />
          <Route path="/teacher/comms" element={<TeacherComms />} />
          <Route path="/teacher/events" element={<TeacherEvents />} />
         <Route path="/teacher/attendance-report" element={<TeacherAttendanceReport />} />
          <Route path="/teacher/attendance-detail" element={<TeacherAttendanceDetail />} />
        </Route>

        <Route element={<GuardStudent><StudentLayout /></GuardStudent>}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/tasks" element={<StudentTasks />} />
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/events" element={<StudentEvents />} />
          <Route path="/student/messages" element={<StudentMessages />} />
          <Route path="/student/excuses" element={<StudentExcuses />} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
        </AuthProvider>

  </React.StrictMode>
);










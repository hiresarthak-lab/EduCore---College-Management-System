import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { Users, CheckCircle, XCircle, Clock, Save, Search } from "lucide-react";
import { motion } from "motion/react";

export default function Attendance() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [currentRecords, setCurrentRecords] = useState<Record<string, string>>({});
  
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedDate && user?.role !== 'student') {
      fetchAttendanceForDate();
    }
  }, [selectedCourse, selectedDate]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchStudentAttendance();
    }
  }, []);

  const fetchInitialData = async () => {
    if (user?.role === 'student') return; // Handled separately
    try {
      const [eRes, cRes] = await Promise.all([
        api("/api/academic/enrollments"),
        api("/api/academic/courses")
      ]);
      if (eRes.ok) setEnrollments(await eRes.json());
      if (cRes.ok) setCourses(await cRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendanceForDate = async () => {
    try {
      const res = await api(`/api/academic/attendance?courseId=${selectedCourse}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        data.forEach((d: any) => {
          map[d.studentId._id || d.studentId.id] = d.status;
        });
        setCurrentRecords(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentAttendance = async () => {
    try {
      const res = await api('/api/academic/attendance');
      if (res.ok) setAttendanceData(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setCurrentRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    setMessage(null);

    const records = courseStudents.map(s => ({
      studentId: s._id,
      status: currentRecords[s._id] || 'present' // default to present if unmarked
    }));

    try {
      const res = await api('/api/academic/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, date: selectedDate, records })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Attendance saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role === 'student') return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;

  const courseStudents = enrollments
    .filter(e => {
        const cId = typeof e.courseId === 'object' ? e.courseId._id || e.courseId.id : e.courseId;
        return cId === selectedCourse;
    })
    .map(e => e.studentId)
    .filter(s => s?.displayName?.toLowerCase().includes(search.toLowerCase()) || s?.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Log Attendance</h1>
          <p className="text-white/50 text-sm mt-1">Record daily attendance for enrolled students.</p>
        </div>
      </div>

      {message && (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn(
          "p-4 rounded-xl border text-sm font-bold text-center",
          message.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        )}>
          {message.text}
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row gap-4 glass-panel p-4 rounded-[24px]">
        <select 
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
        >
          <option value="" className="bg-[#1e1b4b]">Select a Course</option>
          {courses.map(c => (
             <option key={c._id || c.id} value={c._id || c.id} className="bg-[#1e1b4b]">{c.name} ({c.branch})</option>
          ))}
        </select>
        
        <input 
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-white css-invert-calendar"
        />

        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {selectedCourse && (
        <div className="glass-panel border-white/10 rounded-[32px] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 px-6 text-[10px] font-black uppercase tracking-[2px] text-white/40">Student</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[2px] text-white/40 text-center">Present</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[2px] text-white/40 text-center">Absent</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[2px] text-white/40 text-center">Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {courseStudents.length > 0 ? courseStudents.map(student => {
                const status = currentRecords[student._id || student.id] || 'present';
                return (
                  <tr key={student._id || student.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 px-6">
                      <div className="font-bold">{student.displayName || "Unknown"}</div>
                      <div className="text-xs text-white/40">{student.email}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleStatusChange(student._id || student.id, 'present')} className={cn(
                        "p-2 rounded-xl transition-all", status === 'present' ? "bg-green-500/20 text-green-400" : "text-white/20 hover:bg-white/5"
                      )}>
                        <CheckCircle className="w-6 h-6 mx-auto" />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleStatusChange(student._id || student.id, 'absent')} className={cn(
                        "p-2 rounded-xl transition-all", status === 'absent' ? "bg-red-500/20 text-red-400" : "text-white/20 hover:bg-white/5"
                      )}>
                        <XCircle className="w-6 h-6 mx-auto" />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleStatusChange(student._id || student.id, 'late')} className={cn(
                        "p-2 rounded-xl transition-all", status === 'late' ? "bg-amber-500/20 text-amber-400" : "text-white/20 hover:bg-white/5"
                      )}>
                        <Clock className="w-6 h-6 mx-auto" />
                      </button>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                   <td colSpan={4} className="p-12 text-center text-white/20 font-bold uppercase tracking-widest">No active enrollments for this course.</td>
                </tr>
              )}
            </tbody>
          </table>
          {courseStudents.length > 0 && (
            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg"
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : "Save Register"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

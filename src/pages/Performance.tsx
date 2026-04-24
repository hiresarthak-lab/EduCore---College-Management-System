import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { Search, Save, GraduationCap, Trophy } from "lucide-react";
import { motion } from "motion/react";

export default function Performance() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [examName, setExamName] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);
  
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [currentRecords, setCurrentRecords] = useState<Record<string, { marksObtained: string, remarks: string }>>({});
  
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchStudentPerformance();
    }
  }, []);

  const fetchInitialData = async () => {
    if (user?.role === 'student') return;
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

  const fetchStudentPerformance = async () => {
    try {
      const res = await api('/api/academic/performance');
      if (res.ok) setPerformanceData(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleRecordChange = (studentId: string, field: 'marksObtained' | 'remarks', value: string) => {
    setCurrentRecords(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { marksObtained: '', remarks: '' }),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedCourse || !examName || totalMarks <= 0) {
       setMessage({ type: 'error', text: 'Please fill Course, Exam Name, and Total Marks.' });
       return;
    }

    setSaving(true);
    setMessage(null);

    const recordsToSave = courseStudents.map(s => {
      const rec = currentRecords[s._id || s.id];
      return {
        studentId: s._id || s.id,
        courseId: selectedCourse,
        examName,
        totalMarks,
        marksObtained: rec ? Number(rec.marksObtained) : 0,
        remarks: rec ? rec.remarks : ''
      };
    }).filter(r => r.marksObtained !== undefined && !isNaN(r.marksObtained));

    if (recordsToSave.length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await api('/api/academic/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToSave })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Marks recorded successfully!' });
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
          <h1 className="text-3xl font-black tracking-tight">Record Performance</h1>
          <p className="text-white/50 text-sm mt-1">Publish exam results and remarks to students.</p>
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
          type="text"
          placeholder="Exam Name (e.g. Midterm)"
          value={examName}
          onChange={e => setExamName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-white"
        />

        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden px-4">
           <span className="text-white/40 text-sm font-bold whitespace-nowrap">Total Marks:</span>
           <input 
             type="number"
             min="1"
             value={totalMarks}
             onChange={e => setTotalMarks(Number(e.target.value))}
             className="w-20 bg-transparent border-none py-3 outline-none focus:ring-0 text-white text-right font-bold"
           />
        </div>
      </div>

      {selectedCourse && (
        <div className="glass-panel border-white/10 rounded-[32px] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 px-6 text-[10px] font-black uppercase tracking-[2px] text-white/40">Student</th>
                <th className="p-4 w-32 text-[10px] font-black uppercase tracking-[2px] text-white/40">Marks Obtd.</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[2px] text-white/40">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {courseStudents.length > 0 ? courseStudents.map(student => {
                const rec = currentRecords[student._id || student.id] || { marksObtained: '', remarks: '' };
                return (
                  <tr key={student._id || student.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 px-6">
                      <div className="font-bold">{student.displayName || "Unknown"}</div>
                      <div className="text-xs text-white/40">{student.email}</div>
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        min="0"
                        max={totalMarks}
                        placeholder="0"
                        value={rec.marksObtained}
                        onChange={e => handleRecordChange(student._id || student.id, 'marksObtained', e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        placeholder="Optional feedback..."
                        value={rec.remarks}
                        onChange={e => handleRecordChange(student._id || student.id, 'remarks', e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-sm"
                      />
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                   <td colSpan={3} className="p-12 text-center text-white/20 font-bold uppercase tracking-widest">No active enrollments for this course.</td>
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
                {saving ? "Saving..." : "Publish Marks"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

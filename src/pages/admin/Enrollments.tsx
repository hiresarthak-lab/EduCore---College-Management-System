import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion } from "motion/react";
import { Users, BookOpen, Trash2, GraduationCap, X } from "lucide-react";
import { cn, formatDate } from "../../lib/utils";

interface UserProfile {
  _id: string;
  id?: string;
  email: string;
  displayName?: string;
  role: string;
}

interface Course {
  _id: string;
  id?: string;
  name: string;
  branch: string;
}

interface Enrollment {
  _id: string;
  studentId: UserProfile;
  courseId: Course;
  enrolledAt: string;
}

export default function Enrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [searchStudent, setSearchStudent] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eRes, sRes, cRes] = await Promise.all([
        api("/api/academic/enrollments"),
        api("/api/academic/users?role=student"),
        api("/api/academic/courses")
      ]);
      
      if (eRes.ok) setEnrollments(await eRes.json());
      if (sRes.ok) setStudents(await sRes.json());
      if (cRes.ok) setCourses(await cRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async () => {
    setModalError("");
    setModalSuccess(false);

    if (!selectedStudent || !selectedCourse) {
      setModalError("Please select both a student and a course.");
      return;
    }

    try {
      const res = await api('/api/academic/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent, courseId: selectedCourse })
      });

      if (res.ok) {
        setModalSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setModalSuccess(false);
          setSelectedStudent("");
          setSelectedCourse("");
          fetchData();
        }, 1500);
      } else {
        const data = await res.json();
        setModalError(data.message || "Failed to enroll student");
      }
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await api(`/api/academic/enrollments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEnrollments(enrollments.filter(e => e._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  const filteredEnrollments = enrollments.filter(e => {
    // 1. Course Filter
    const courseMatch = filterCourse === "all" || (e.courseId?._id || e.courseId?.id) === filterCourse;
    
    // 2. Student Search Filter
    const searchLow = searchStudent.toLowerCase();
    const studentMatch = !searchLow ||
      e.studentId?.displayName?.toLowerCase().includes(searchLow) ||
      e.studentId?.email?.toLowerCase().includes(searchLow);

    return courseMatch && studentMatch;
  });

  // Group enrollments by course
  const groupedEnrollments = filteredEnrollments.reduce((acc, current) => {
    const courseId = current.courseId?._id || current.courseId?.id || 'unassigned';
    if (!acc[courseId]) {
      acc[courseId] = {
        course: current.courseId,
        students: []
      };
    }
    acc[courseId].students.push(current);
    return acc;
  }, {} as Record<string, { course: Course, students: Enrollment[] }>);

  return (
    <div className="space-y-10 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Student Enrollments</h1>
          <p className="text-white/50 text-sm mt-1">Manage course registrations and assign students to modules.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
        >
          <GraduationCap className="w-5 h-5" />
          Enroll New Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <select 
          className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white focus:ring-2 focus:ring-blue-500 appearance-none min-w-[200px]"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="all" className="bg-[#1e1b4b]">All Courses</option>
          {courses.map(c => (
             <option key={c._id || c.id} value={c._id || c.id} className="bg-[#1e1b4b]">{c.name} ({c.branch})</option>
          ))}
        </select>
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search enrolled student..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full pl-5 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {loading ? (
         <div className="p-12 text-center text-white/20 font-bold uppercase tracking-widest glass-panel rounded-[32px]">Loading records...</div>
      ) : filteredEnrollments.length > 0 ? (
        <div className="space-y-8">
          {Object.values(groupedEnrollments).map((group: any) => (
            <div key={group.course?._id || 'unknown'} className="glass-panel border-white/10 rounded-[32px] overflow-hidden">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {group.course?.name ? `${group.course.name} (${group.course.branch})` : 'Unknown Course'}
                </h2>
                <span className="ml-auto px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {group.students.length} Students
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-4 px-6 text-[10px] font-black uppercase tracking-[3px] text-white/40">Student Detail</th>
                      <th className="p-4 px-6 text-[10px] font-black uppercase tracking-[3px] text-white/40">Registration Date</th>
                      <th className="p-4 px-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {group.students.map((enr) => (
                      <tr key={enr._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold">{enr.studentId?.displayName || 'Unknown Student'}</span>
                            <span className="text-xs text-white/40">{enr.studentId?.email || ''}</span>
                          </div>
                        </td>
                        <td className="p-4 px-6 text-sm text-white/60">
                          {formatDate(enr.enrolledAt)}
                        </td>
                        <td className="p-4 px-6 text-right">
                          <button 
                            onClick={() => handleRemove(enr._id)}
                            className="p-2.5 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
         <div className="p-12 text-center text-white/20 font-bold uppercase tracking-widest glass-panel rounded-[32px]">No enrollments found</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel border-white/20 shadow-2xl w-full max-w-md p-10 rounded-[40px]">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-widest text-blue-400">
              New Enrollment
            </h3>

            {modalError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-2xl text-center">
                {modalError}
              </div>
            )}
            
            {modalSuccess && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold rounded-2xl text-center">
                Student enrolled successfully!
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Select Student</label>
                <select 
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none"
                  value={selectedStudent}
                  onChange={e => setSelectedStudent(e.target.value)}
                >
                  <option value="" className="bg-[#1e1b4b] text-white/50">-- Choose a student --</option>
                  {students.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id} className="bg-[#1e1b4b]">
                      {s.displayName || s.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Select Course</label>
                <select 
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none"
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                >
                  <option value="" className="bg-[#1e1b4b] text-white/50">-- Choose a course --</option>
                  {courses.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id} className="bg-[#1e1b4b]">
                      {c.name} ({c.branch})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEnroll}
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all text-sm shadow-lg shadow-blue-500/20"
                >
                  Enroll
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

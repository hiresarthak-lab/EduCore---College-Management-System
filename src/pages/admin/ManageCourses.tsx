import React, { useState, useEffect } from "react";
import { Course, Subject } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { BookPlus, Trash2, Plus, ChevronRight, BookOpen, Edit2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";

export default function ManageCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({ name: "", branch: "", duration: 4 });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({ name: "", code: "", semester: 1, syllabusUrl: "" });
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        api('/api/academic/courses'),
        api('/api/academic/subjects')
      ]);
      if (cRes.ok) setCourses(await cRes.json());
      if (sRes.ok) setSubjects(await sRes.json());
    } catch (err) {
      console.error("Failed to fetch curriculum:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCourse = async () => {
    try {
      const url = editingCourse ? `/api/academic/courses/${(editingCourse as any)._id || editingCourse.id}` : '/api/academic/courses';
      const method = editingCourse ? 'PATCH' : 'POST';

      const res = await api(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });
      if (res.ok) {
        setShowAddCourse(false);
        setEditingCourse(null);
        setNewCourse({ name: "", branch: "", duration: 4 });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save course:", err);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedCourseId) return;
    try {
      const url = editingSubject ? `/api/academic/subjects/${(editingSubject as any)._id || editingSubject.id}` : '/api/academic/subjects';
      const method = editingSubject ? 'PATCH' : 'POST';

      let body: FormData | string;
      let headers: any = {};
      
      const payloadObj = { ...newSubject, courseId: selectedCourseId };

      if (subjectFile) {
        const formData = new FormData();
        formData.append('name', payloadObj.name);
        formData.append('code', payloadObj.code);
        formData.append('semester', payloadObj.semester.toString());
        formData.append('courseId', payloadObj.courseId);
        if (payloadObj.syllabusUrl) formData.append('syllabusUrl', payloadObj.syllabusUrl);
        formData.append('file', subjectFile);
        body = formData;
      } else {
        body = JSON.stringify(payloadObj);
        headers['Content-Type'] = 'application/json';
      }

      const res = await api(url, {
        method,
        headers,
        body
      });
      if (res.ok) {
        setShowAddSubject(false);
        setEditingSubject(null);
        setNewSubject({ name: "", code: "", semester: 1, syllabusUrl: "" });
        setSubjectFile(null);
        fetchData();
      } else {
        const errorText = await res.text();
        try {
          const errData = JSON.parse(errorText);
          alert("Failed: " + (errData.message || errorText));
        } catch(e) {
          alert("Failed: " + errorText);
        }
        console.error("Failed to add/update subject:", errorText);
      }
    } catch (err) {
      console.error("error during upload:", err);
      alert("Error: " + err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const res = await api(`/api/academic/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCourseId === id) setSelectedCourseId(null);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const res = await api(`/api/academic/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Failed to delete subject:", err);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>;
  }

  return (
    <div className="space-y-10 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Curriculum Management</h1>
          <p className="text-white/50 text-sm mt-1">Manage institutional courses, branches, and subject mappings.</p>
        </div>
        <button 
          onClick={() => setShowAddCourse(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
        >
          < BookPlus className="w-5 h-5" />
          Add New Course
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course List */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-sm font-black text-white/40 flex items-center gap-3 uppercase tracking-[3px] px-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Active Courses
          </h2>
          <div className="space-y-4">
            {courses.map(course => (
              <motion.div 
                key={(course as any)._id || course.id}
                onClick={() => setSelectedCourseId((course as any)._id || course.id)}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-6 rounded-[28px] border transition-all cursor-pointer",
                  (selectedCourseId === course.id || selectedCourseId === (course as any)._id)
                    ? "bg-white text-[#1e1b4b] border-white shadow-2xl"
                    : "glass-card border-white/10 text-white hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{course.name}</h3>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mt-2", (selectedCourseId === course.id || selectedCourseId === (course as any)._id) ? "text-indigo-600" : "text-white/40")}>
                      {course.branch} • {course.duration} Years
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCourse(course);
                        setNewCourse({ name: course.name, branch: course.branch, duration: course.duration });
                        setShowAddCourse(true);
                      }}
                      className={cn("p-2 rounded-lg transition-colors", (selectedCourseId === course.id || selectedCourseId === (course as any)._id) ? "hover:bg-indigo-100 text-indigo-400" : "hover:bg-white/5 text-white/20")}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse((course as any)._id || course.id);
                      }}
                      className={cn("p-2 rounded-lg transition-colors", (selectedCourseId === course.id || selectedCourseId === (course as any)._id) ? "hover:bg-indigo-100 text-indigo-400" : "hover:bg-white/5 text-white/20")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={cn("w-5 h-5 transition-transform", (selectedCourseId === course.id || selectedCourseId === (course as any)._id) ? "rotate-90 text-indigo-600" : "text-white/20")} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subject Management */}
        <div className="lg:col-span-2">
          {selectedCourseId ? (
            <div className="glass-panel rounded-[40px] overflow-hidden border-white/20">
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">
                    {courses.find(c => c.id === selectedCourseId || (c as any)._id === selectedCourseId)?.name}
                  </h3>
                  <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Subject Mapping & Semesters</p>
                </div>
                <button 
                  onClick={() => setShowAddSubject(true)}
                  className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-90"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-[2px]">
                    <tr>
                      <th className="px-8 py-5">Sem</th>
                      <th className="px-8 py-5">Subject Details</th>
                      <th className="px-8 py-5">Code</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subjects.filter(s => s.courseId === selectedCourseId || (s.courseId as any)?._id === selectedCourseId).sort((a,b) => a.semester - b.semester).map((subject) => (
                      <tr key={(subject as any)._id || subject.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-white/10 rounded-lg text-white font-black text-[10px] border border-white/5 tracking-wider">S{subject.semester}</span>
                        </td>
                        <td className="px-8 py-6 font-bold text-white group-hover:text-blue-400 transition-colors uppercase text-xs tracking-wide">{subject.name}</td>
                        <td className="px-8 py-6">
                            <span className="font-mono text-[11px] text-white/40 bg-white/5 px-3 py-1 rounded-md">{subject.code}</span>
                            {subject.syllabusUrl && (
                              <a href={subject.syllabusUrl} target="_blank" rel="noreferrer" className="ml-3 text-[10px] uppercase font-black tracking-wider text-blue-400 hover:text-blue-300">
                                Syllabus <ChevronRight className="inline w-3 h-3" />
                              </a>
                            )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => {
                              setEditingSubject(subject);
                              setNewSubject({ name: subject.name, code: subject.code, semester: subject.semester, syllabusUrl: subject.syllabusUrl || "" });
                              setShowAddSubject(true);
                            }}
                            className="p-2 text-white/20 hover:text-blue-400 transition-colors mr-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubject((subject as any)._id || subject.id)}
                            className="p-2 text-white/20 hover:text-red-400 transition-colors"
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
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel rounded-[40px] border-dashed border-white/10 border-2">
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mb-6 ring-1 ring-white/10">
                <BookOpen className="w-8 h-8 text-white/10" />
              </div>
              <p className="text-white/30 font-bold uppercase tracking-[3px] text-center max-w-xs leading-relaxed">Select a course from the list to view and manage subjects</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add/Edit Course */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel border-white/20 shadow-2xl w-full max-w-md p-10 rounded-[40px]">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-widest text-blue-400">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Course Name</label>
                <input 
                  type="text" 
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                  placeholder="e.g. B.Tech Computer Science"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Branch</label>
                  <input 
                    type="text" 
                    value={newCourse.branch}
                    onChange={(e) => setNewCourse({...newCourse, branch: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                    placeholder="e.g. CSE"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Duration (Yrs)</label>
                  <input 
                    type="number" 
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({...newCourse, duration: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-10">
              <button 
                onClick={() => {
                  setShowAddCourse(false);
                  setEditingCourse(null);
                  setNewCourse({ name: "", branch: "", duration: 4 });
                }}
                className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCourse}
                className="flex-1 py-4 bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {editingCourse ? 'Save' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Add Subject */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel border-white/20 shadow-2xl w-full max-w-md p-10 rounded-[40px]">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-widest text-blue-400">
              {editingSubject ? 'Edit Subject' : 'Assign Subject'}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Subject Name</label>
                <input 
                  type="text" 
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                  placeholder="e.g. Data Structures"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Subject Code</label>
                  <input 
                    type="text" 
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                    placeholder="BCSE201"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Semester</label>
                  <input 
                    type="number" 
                    value={newSubject.semester}
                    onChange={(e) => setNewSubject({...newSubject, semester: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Syllabus</label>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={newSubject.syllabusUrl}
                    onChange={(e) => setNewSubject({...newSubject, syllabusUrl: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                    placeholder="Syllabus URL (optional)"
                  />
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">OR UPLOAD PDF:</span>
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => setSubjectFile(e.target.files?.[0] || null)}
                      className="text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-10">
              <button 
                onClick={() => {
                  setShowAddSubject(false);
                  setEditingSubject(null);
                  setNewSubject({ name: "", code: "", semester: 1, syllabusUrl: "" });
                  setSubjectFile(null);
                }}
                className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSubject}
                className="flex-1 py-4 bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {editingSubject ? 'Save' : 'Add'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

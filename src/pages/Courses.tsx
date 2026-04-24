import React, { useState, useEffect } from "react";
import { Course, Subject } from "../types";
import { BookOpen, GraduationCap, ChevronRight, Search, Layers, Upload } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'student') {
           const [eRes, sRes] = await Promise.all([
             api('/api/academic/enrollments'),
             api('/api/academic/subjects')
           ]);
           if (eRes.ok) {
              const eData = await eRes.json();
              if (Array.isArray(eData)) {
                 const mappedCourses = eData.map((e: any) => e.courseId).filter(Boolean);
                 // Deduplicate courses
                 const uniqueCourses = mappedCourses.filter((v,i,a)=>a.findIndex(t=>(t._id === v._id))===i);
                 setCourses(uniqueCourses);
              }
           }
           if (sRes.ok) {
             const sData = await sRes.json();
             if (Array.isArray(sData)) setSubjects(sData);
           }
        } else {
          const [cRes, sRes] = await Promise.all([
            api('/api/academic/courses'),
            api('/api/academic/subjects')
          ]);
          if (cRes.ok) {
            const cData = await cRes.json();
            if (Array.isArray(cData)) setCourses(cData);
          }
          if (sRes.ok) {
            const sData = await sRes.json();
            if (Array.isArray(sData)) setSubjects(sData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUploadSyllabus = async (e: React.ChangeEvent<HTMLInputElement>, subject: Subject) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api(`/api/academic/subjects/${(subject as any)._id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (res.ok) {
        alert("Syllabus uploaded successfully");
        // Update subjects state locally
        const updatedSubject = await res.json();
        setSubjects(prev => prev.map(s => (s as any)._id === updatedSubject._id ? updatedSubject : s));
      } else {
        const errorText = await res.text();
        alert("Failed to upload: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.branch.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCourse = courses.find(c => (c as any)._id === selectedCourseId);
  const courseSubjects = subjects.filter(s => (s.courseId as any)?._id === selectedCourseId || s.courseId === selectedCourseId);

  const groupedSubjects = courseSubjects.reduce<Record<number, Subject[]>>((acc, sub) => {
    const sem = sub.semester || 1;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(sub);
    return acc;
  }, {});

  const semesters = Object.keys(groupedSubjects).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-10 text-white pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight tracking-widest text-blue-400 uppercase">Academic Catalog</h1>
          <p className="text-white/50 text-sm mt-1">Explore courses, branches, and subject curricula.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder="Search disciplines..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Select a Course</h2>
          {loading ? (
             [1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)
          ) : filteredCourses.length === 0 ? (
             <div className="glass-panel p-8 text-center rounded-3xl border-dashed">
                <GraduationCap className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No Courses Found</p>
                {user?.role === 'student' && <p className="text-white/30 text-[10px] mt-2">You are not enrolled in any active courses.</p>}
             </div>
          ) : filteredCourses.map(course => (
            <motion.div
              key={(course as any)._id}
              whileHover={{ x: 10 }}
              onClick={() => setSelectedCourseId((course as any)._id)}
              className={cn(
                "p-6 rounded-3xl border transition-all cursor-pointer group",
                selectedCourseId === (course as any)._id 
                  ? "bg-blue-500 border-blue-400 shadow-xl shadow-blue-500/20" 
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    selectedCourseId === (course as any)._id ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <GraduationCap className={cn("w-5 h-5", selectedCourseId === (course as any)._id ? "text-white" : "text-white/40")} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{course.name}</h3>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mt-1", selectedCourseId === (course as any)._id ? "text-white/60" : "text-white/30")}>
                      {course.branch}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", selectedCourseId === (course as any)._id ? "rotate-90" : "text-white/20")} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-8">
          {selectedCourseId ? (
            <div className="glass-panel p-10 rounded-[40px] border-white/20 min-h-[600px] flex flex-col">
              <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/5">
                <div className="w-16 h-16 bg-blue-500 rounded-[20px] flex items-center justify-center shadow-2xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedCourse?.name}</h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px] mt-1">{selectedCourse?.branch} • {selectedCourse?.duration} Year Undergraduate Program</p>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Curriculum Subjects</h3>
                  <span className="text-[10px] font-bold text-white/30">{courseSubjects.length} Found</span>
                </div>

                {courseSubjects.length > 0 ? (
                  <div className="space-y-8">
                    {semesters.map(sem => (
                      <div key={sem}>
                        <h4 className="text-xl font-black mb-4 pb-2 border-b border-white/10 text-white/80">Semester {sem}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupedSubjects[sem].map(sub => (
                            <div key={(sub as any)._id} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[9px] text-white/20 bg-white/5 px-2 py-0.5 rounded uppercase">{sub.code}</span>
                              </div>
                              <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase text-xs tracking-wide">{sub.name}</h4>
                              <div className="mt-4 flex items-center gap-4">
                                {sub.syllabusUrl && (
                                  <a 
                                    href={sub.syllabusUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[9px] font-black text-white/30 hover:text-white uppercase tracking-widest"
                                  >
                                    <Layers className="w-3 h-3" />
                                    View Syllabus
                                  </a>
                                )}
                                {(user?.role === 'admin' || user?.role === 'teacher') && (
                                  <label className="flex items-center gap-2 text-[9px] font-black text-blue-400/50 hover:text-blue-400 uppercase tracking-widest cursor-pointer">
                                    <Upload className="w-3 h-3" />
                                    {sub.syllabusUrl ? 'Update PDF' : 'Upload PDF'}
                                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleUploadSyllabus(e, sub)} />
                                  </label>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl py-20">
                    <BookOpen className="w-12 h-12 text-white/5 mb-4" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[4px]">No subjects registered for this course yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-20 rounded-[40px] border-dashed flex flex-col items-center justify-center text-center opacity-40 h-full min-h-[600px]">
               <Layers className="w-20 h-20 text-white/5 mb-8" />
               <h3 className="text-2xl font-black uppercase tracking-widest mb-2">Academic Roadmap</h3>
               <p className="text-sm text-white/50 max-w-sm">Select a course from the catalog to explore detailed curriculum and learning outcomes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

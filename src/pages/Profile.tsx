import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { motion } from "motion/react";
import { UserCircle, Trophy, CheckCircle, Clock, Edit2, Camera, MapPin, Hash, BarChart3, List, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "../lib/utils";

export default function Profile() {
  const { user, checkAuth } = useAuth();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: "",
    password: "",
    address: "",
    studentClass: "",
    sectionDiv: "",
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [signaturePhotoFile, setSignaturePhotoFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      const [attRes, perfRes] = await Promise.all([
        api('/api/academic/attendance'),
        api('/api/academic/performance')
      ]);
      if (attRes.ok) setAttendanceData(await attRes.json());
      if (perfRes.ok) setPerformanceData(await perfRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditProfile = () => {
    setEditFormData({
      displayName: user?.displayName || "",
      password: "",
      address: user?.address || "",
      studentClass: user?.studentClass || "",
      sectionDiv: user?.sectionDiv || "",
    });
    setProfilePhotoFile(null);
    setSignaturePhotoFile(null);
    setShowEditModal(true);
  };

  const submitEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        displayName: editFormData.displayName,
        password: editFormData.password,
        address: editFormData.address,
        studentClass: editFormData.studentClass,
        sectionDiv: editFormData.sectionDiv,
      }));
      
      if (profilePhotoFile) formData.append('profilePhoto', profilePhotoFile);
      if (signaturePhotoFile) formData.append('signaturePhoto', signaturePhotoFile);

      const res = await api('/api/auth/profile', {
        method: 'PATCH',
        body: formData,
      });

      if (res.ok) {
        // console.log('Profile updated successfully!');
        setShowEditModal(false);
        checkAuth(); // refresh user data
      } else {
        const errorText = await res.text();
        console.error('Failed to update profile: ' + errorText);
      }
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-10 text-white">
      {/* Profile Header */}
      <div className="glass-panel border-white/10 rounded-[40px] p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || user?.email || 'U'}`} 
            alt="avatar" 
            className="w-32 h-32 rounded-[32px] border-4 border-white/10 shadow-2xl object-cover"
          />
          <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl border-2 border-[#0f172a]">
            {user?.role}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left pt-2 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">{user?.displayName || "User Profile"}</h1>
              <p className="text-white/50 text-base">{user?.email}</p>
            </div>
            <button 
              onClick={handleEditProfile}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full transition-colors text-sm font-bold shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            {user?.studentClass && (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-sm font-medium">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                Class: {user.studentClass}
              </div>
            )}
            {user?.sectionDiv && (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-sm font-medium">
                <Hash className="w-4 h-4 text-purple-400" />
                Div: {user.sectionDiv}
              </div>
            )}
            {user?.address && (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-sm font-medium">
                <MapPin className="w-4 h-4 text-red-400" />
                {user.address}
              </div>
            )}
          </div>
        </div>
      </div>

      {user?.role === 'student' && (
        <div className="glass-panel border-white/10 rounded-[32px] p-8 mt-6">
          <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Academic Standing
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="text-sm font-black text-white/40 uppercase tracking-widest mb-2">GPA</div>
              <div className="text-3xl font-black">{user?.gpa ?? 'N/A'}</div>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="text-sm font-black text-white/40 uppercase tracking-widest mb-2">Attendance</div>
              <div className="text-3xl font-black">{user?.attendance ?? 0}%</div>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="text-sm font-black text-white/40 uppercase tracking-widest mb-2">Backlogs</div>
              <div className="text-3xl font-black">{user?.backlogs ?? 0}</div>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="text-sm font-black text-white/40 uppercase tracking-widest mb-2">Credits</div>
              <div className="text-3xl font-black">{user?.credits ?? 0}</div>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="text-sm font-black text-white/40 uppercase tracking-widest mb-2">Active Subjects</div>
              <div className="text-3xl font-black">{user?.activeSubjects?.length ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Signature and Modals Here */}
      {user?.signatureURL && (
         <div className="glass-panel border-white/10 rounded-[32px] p-8">
           <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4">Official Signature</h2>
           <img src={user.signatureURL} alt="Signature" className="h-24 object-contain invert mix-blend-screen opacity-80 bg-white/5 p-2 rounded-xl" />
         </div>
      )}

      {user?.role === 'student' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Performance Module */}
          <div className="glass-panel border-white/10 rounded-[32px] p-8 flex flex-col min-h-[400px]">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Academic Results</h2>
                <p className="text-white/40 text-sm mt-1">Your exam performance logic</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {performanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-white/30 font-bold uppercase tracking-widest">
                  No Exam Records
                </div>
              ) : (
                performanceData.map((record: any) => {
                  const percentage = Math.round((record.marksObtained / record.totalMarks) * 100);
                  const isPass = percentage >= 40;
                  return (
                    <div key={record._id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col">
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{record.examName}</h3>
                          <p className="text-xs text-white/50 font-medium">{record.courseId?.name || "Unknown Course"}</p>
                        </div>
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[2px]",
                          isPass ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {percentage}%
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-2">
                          <span className="text-2xl font-black">{record.marksObtained}</span>
                          <span className="text-sm font-bold text-white/30 mt-auto mb-1">/ {record.totalMarks}</span>
                        </div>
                      </div>
                      {record.remarks && (
                        <div className="mt-4 p-3 bg-[#0f172a] rounded-xl text-xs italic text-white/60 border border-white/5 shadow-inner">
                          "{record.remarks}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Attendance Module */}
          <div className="glass-panel border-white/10 rounded-[32px] p-8 flex flex-col min-h-[400px]">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Attendance Log</h2>
                <p className="text-white/40 text-sm mt-1">Your daily register records</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {attendanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-white/30 font-bold uppercase tracking-widest">
                  No Attendance Records
                </div>
              ) : (
                attendanceData.map((record: any) => (
                  <div key={record._id} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5">
                    <div>
                      <h3 className="font-bold text-sm">{record.courseId?.name || "Unknown Course"}</h3>
                      <p className="text-xs font-mono text-white/40 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {record.date}
                      </p>
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[2px]",
                      record.status === 'present' ? "bg-green-500/20 text-green-400" :
                      record.status === 'absent' ? "bg-red-500/20 text-red-400" :
                      "bg-amber-500/20 text-amber-400"
                    )}>
                      {record.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel border-white/10 rounded-[32px] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <h2 className="text-2xl font-black mb-6">Edit Profile</h2>
            <form onSubmit={submitEditProfile} className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Display Name</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.displayName}
                    onChange={(e) => setEditFormData({...editFormData, displayName: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">New Password (leave blank to keep current)</label>
                  <input 
                    type="password" 
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Address</label>
                  <input 
                    type="text" 
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Class</label>
                    <input 
                      type="text" 
                      value={editFormData.studentClass}
                      onChange={(e) => setEditFormData({...editFormData, studentClass: e.target.value})}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Division</label>
                    <input 
                      type="text" 
                      value={editFormData.sectionDiv}
                      onChange={(e) => setEditFormData({...editFormData, sectionDiv: e.target.value})}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Profile Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)}
                    className="text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Signature Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setSignaturePhotoFile(e.target.files?.[0] || null)}
                    className="text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-black uppercase tracking-widest text-shadow shadow-xl transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

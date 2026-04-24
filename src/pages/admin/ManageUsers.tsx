import React, { useState, useEffect } from "react";
import { UserProfile, Role } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { 
  Users, 
  Search, 
  Shield, 
  Mail, 
  Calendar, 
  Edit2, 
  Trash,
  Plus
} from "lucide-react";
import { motion } from "motion/react";
import { cn, formatDate } from "../../lib/utils";
import { api } from "../../lib/api";

export default function ManageUsers({ targetRole }: { targetRole: Role }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    password: "",
    role: targetRole,
    branch: "",
    semester: 1,
    gpa: 0,
    attendance: 0,
    backlogs:  0,
    credits: 0
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api(`/api/academic/users?role=${targetRole}`);
      if (response.ok) {
        setUsers(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [targetRole]);

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (u.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const handleSave = async () => {
    setModalError("");
    setModalSuccess(false);

    try {
      const method = editingUser ? 'PATCH' : 'POST';
      const url = editingUser ? `/api/academic/users/${(editingUser as any)._id || editingUser.uid}` : '/api/academic/users';
      
      const res = await api(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setModalSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setEditingUser(null);
          setFormData({ email: "", displayName: "", password: "", role: targetRole, branch: "", semester: 1, gpa: 0, attendance: 0, backlogs: 0, credits: 0 });
          setModalSuccess(false);
          fetchUsers();
        }, 1500);
      } else {
        const text = await res.text();
        try {
          setModalError(JSON.parse(text).message || "Failed to save user");
        } catch(e) {
          setModalError("Failed to save user: Server Error");
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setModalError(err.message || "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api(`/api/academic/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
      else console.error("Failed to delete user");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (currentUser?.role !== 'admin') return <div className="p-8 text-red-500">Access Denied</div>;

  return (
    <div className="space-y-10 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight capitalize">Manage {targetRole}s</h1>
          <p className="text-white/50 text-sm mt-1">Directory of all {targetRole}s registered in the system.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setEditingUser(null);
              setFormData({ email: "", displayName: "", password: "", role: targetRole, branch: "", semester: 1, gpa: 0, attendance: 0, backlogs: 0, credits: 0 });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add {targetRole}
          </button>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input 
              type="text" 
              placeholder={`Search ${targetRole}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[40px] overflow-hidden border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-[2px]">
              <tr>
                <th className="px-8 py-5">Identities</th>
                <th className="px-8 py-5">System Role</th>
                <th className="px-8 py-5">Affiliation</th>
                <th className="px-8 py-5">Joined</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                   <td colSpan={5} className="p-12 text-center text-white/20 font-bold uppercase tracking-widest">Loading Records...</td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.uid || (u as any)._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName}`} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform" alt="" />
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase text-xs tracking-wide">{u.displayName}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold mt-1">
                            <Mail className="w-3 h-3 text-blue-500/50" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        u.role === 'admin' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        u.role === 'teacher' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                        "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs">
                        <p className="font-black text-white/60 mb-1">{u.branch || "N/A"}</p>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{u.semester ? `Semester ${u.semester}` : "Staff"}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingUser(u);
                            setFormData({
                              email: u.email,
                              displayName: u.displayName,
                              password: "",
                              role: u.role,
                              branch: u.branch || "",
                              semester: u.semester || 1,
                              gpa: u.gpa || 0,
                              attendance: u.attendance || 0,
                              backlogs: u.backlogs || 0,
                              credits: u.credits || 0
                            });
                            setShowModal(true);
                          }}
                          className="p-2.5 text-white/20 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete((u as any)._id || u.uid)}
                          className="p-2.5 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="p-12 text-center text-white/20 font-bold uppercase tracking-widest">No Records Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel border-white/20 shadow-2xl w-full max-w-md p-10 rounded-[40px]">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-widest text-blue-400">
              {editingUser ? 'Edit User' : `Add ${targetRole}`}
            </h3>

            {modalError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-2xl text-center">
                {modalError}
              </div>
            )}
            
            {modalSuccess && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold rounded-2xl text-center">
                User saved successfully!
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Full Name</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  disabled={!!editingUser}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white disabled:opacity-50" 
                  placeholder="name@edu.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Password {editingUser && '(Leave blank to keep same)'}</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Branch</label>
                  <input 
                    type="text" 
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Semester</label>
                  <input 
                    type="number" 
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                  />
                </div>
              </div>

              {targetRole === 'student' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">GPA</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.gpa}
                        onChange={(e) => setFormData({...formData, gpa: Number(e.target.value)})}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Attendance %</label>
                      <input 
                        type="number" 
                        value={formData.attendance}
                        onChange={(e) => setFormData({...formData, attendance: Number(e.target.value)})}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Backlogs</label>
                      <input 
                        type="number" 
                        value={formData.backlogs}
                        onChange={(e) => setFormData({...formData, backlogs: Number(e.target.value)})}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Credits</label>
                      <input 
                        type="number" 
                        value={formData.credits}
                        onChange={(e) => setFormData({...formData, credits: Number(e.target.value)})}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                      />
                    </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-10">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {editingUser ? 'Save' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

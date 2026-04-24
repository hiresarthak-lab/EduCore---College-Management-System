import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Plus, Trash2, User, Clock, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { cn, formatDate } from "../lib/utils";
import { api } from "../lib/api";

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    targetRole: "all"
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api('/api/academic/announcements');
      if (res.ok) setAnnouncements(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const url = editingId ? `/api/academic/announcements/${editingId}` : '/api/academic/announcements';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await api(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement)
      });
      if (res.ok) {
        setShowAdd(false);
        setEditingId(null);
        setNewAnnouncement({ title: "", content: "", targetRole: "all" });
        fetchAnnouncements();
      } else {
        const text = await res.text();
        console.error("Failed to save announcement", text);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const res = await api(`/api/academic/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAnnouncements();
      else setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 text-white pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Announcements</h1>
          <p className="text-white/50 text-sm mt-1">Official updates and notices for the institution.</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Notice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[32px]" />)
        ) : announcements.length > 0 ? (
          announcements.filter(a => a.targetRole === 'all' || a.targetRole === user?.role || user?.role === 'admin' || a.authorId?._id === user?.uid).map((ann) => (
            <motion.div 
              key={ann._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 rounded-[32px] flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 flex gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border",
                  ann.targetRole === 'all' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                  ann.targetRole === 'teacher' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                  "bg-purple-500/20 text-purple-400 border-purple-500/30"
                )}>
                  {ann.targetRole}
                </span>
                {(user?.role === 'admin' || user?.uid === ann.authorId?._id) && (
                  <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingId(ann._id);
                        setNewAnnouncement({ title: ann.title, content: ann.content, targetRole: ann.targetRole });
                        setShowAdd(true);
                      }}
                      className="p-2 text-white/50 hover:text-blue-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(ann._id)}
                      className="p-2 text-white/50 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:bg-blue-500/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>

              <h3 className="text-xl font-bold mb-3 line-clamp-2">{ann.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed line-clamp-4 flex-1 mb-6">
                {ann.content}
              </p>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {ann.authorId?.displayName?.substring(0,1) || 'A'}
                  </div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{ann.authorId?.displayName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-bold uppercase">
                  <Clock className="w-3 h-3" />
                  {formatDate(ann.createdAt)}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center glass-panel rounded-[40px] border-dashed border-2">
            <Bell className="w-16 h-16 text-white/5 mx-auto mb-6" />
            <p className="text-white/30 font-bold uppercase tracking-[3px]">No recent announcements</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-white">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel border-white/20 shadow-2xl w-full max-w-md p-10 rounded-[40px]">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-widest text-blue-400">{editingId ? 'Edit Notice' : 'Post New Notice'}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Announcement Title</label>
                <input 
                  type="text" 
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                  placeholder="e.g. Mid-term Exam Dates"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Content Description</label>
                <textarea 
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  rows={4}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white resize-none placeholder:text-white/20" 
                  placeholder="Enter details here..."
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Target Audience</label>
                <select 
                  value={newAnnouncement.targetRole}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, targetRole: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white bg-[#0f172a]" 
                >
                  <option value="all" className="bg-[#0f172a]">Everyone</option>
                  <option value="student" className="bg-[#0f172a]">Students Only</option>
                  <option value="teacher" className="bg-[#0f172a]">Teachers Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-10">
              <button 
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                  setNewAnnouncement({ title: "", content: "", targetRole: "all" });
                }}
                className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 py-4 bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {editingId ? 'Save Changes' : 'Broadcast'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

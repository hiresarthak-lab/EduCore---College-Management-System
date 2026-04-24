import React, { useState, useEffect } from "react";
import { Material, Subject } from "../types";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, 
  Download, 
  Search, 
  BookOpen, 
  Clock, 
  Plus,
  Trash2
} from "lucide-react";
import { motion } from "motion/react";
import { cn, formatDate } from "../lib/utils";
import { api } from "../lib/api";

export default function Academics() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    type: "notes",
    subjectId: "",
  });

  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes] = await Promise.all([
        api('/api/academic/materials'),
        api('/api/academic/subjects')
      ]);
      
      if (mRes.ok) {
        const mData = await mRes.json();
        if (Array.isArray(mData)) setMaterials(mData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        if (Array.isArray(sData)) setSubjects(sData);
      }
    } catch (error) {
      console.error("Failed to fetch academics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async () => {
    setUploadError("");
    setUploadSuccess(false);

    if (!newMaterial.title) {
        setUploadError("Please enter a title for the material.");
        return;
    }
    if (!newMaterial.subjectId) {
        setUploadError("Please select a subject.");
        return;
    }
    if (!selectedFile) {
        setUploadError("Please select a file to upload.");
        return;
    }

    try {
      // Find the subject to get its courseId
      const subjectDoc = subjects.find((s: any) => s._id === newMaterial.subjectId || s.id === newMaterial.subjectId);
      
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('type', newMaterial.type);
      formData.append('subjectId', newMaterial.subjectId);
      if (subjectDoc && subjectDoc.courseId) {
        formData.append('courseId', typeof subjectDoc.courseId === 'object' ? (subjectDoc.courseId as any)._id : subjectDoc.courseId);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await api('/api/academic/materials', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setUploadSuccess(true);
        setTimeout(() => {
          setShowUpload(false);
          setUploadSuccess(false);
          setNewMaterial({ title: "", type: "notes", subjectId: "" });
          setSelectedFile(null);
          fetchData();
        }, 1500);
      } else {
        const text = await res.text();
        try {
          setUploadError(JSON.parse(text).message || "Failed to upload material");
        } catch(e) {
          setUploadError("Failed to upload material: Server Error");
        }
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api(`/api/academic/materials/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesFilter = filterType === "all" || m.type === filterType;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-10 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Academic Resources</h1>
          <p className="text-white/50 text-sm mt-1">Access notes, PYQs, and assignments shared by faculty.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Upload Material
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="glass-panel p-4 rounded-[28px] flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder="Search by title, subject or code..." 
            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-[20px] border border-white/10">
          {["all", "notes", "pyq", "assignment"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filterType === type ? "bg-white text-[#1e1b4b] shadow-xl" : "text-white/40 hover:text-white"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-72 bg-white/5 animate-pulse rounded-[32px] border border-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((material: any) => (
              <MaterialCard 
                key={material._id || material.id} 
                material={material} 
                subject={subjects.find(s => s.id === material.subjectId || (typeof material.subjectId === 'object' && (material.subjectId as any)?._id === (s as any)?._id))} 
                onDelete={handleDelete}
                currentUserRole={user?.role}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass-panel rounded-[32px] border-dashed">
              <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold uppercase tracking-[3px]">No resources found</p>
            </div>
          )}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel border-white/20 shadow-2xl w-full max-w-md p-10 rounded-[40px]">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-widest text-blue-400">Upload Learning Resource</h3>
            
            {uploadError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-2xl text-center">
                {uploadError}
              </div>
            )}
            
            {uploadSuccess && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold rounded-2xl text-center">
                Material uploaded successfully!
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Material Title</label>
                <input 
                  type="text" 
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-white/20" 
                  placeholder="e.g. Unit 1: Introduction to AI"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Type</label>
                  <select 
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white bg-[#0f172a]" 
                  >
                    <option value="notes">Notes</option>
                    <option value="pyq">PYQ</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Subject</label>
                  <select 
                    value={newMaterial.subjectId}
                    onChange={(e) => setNewMaterial({...newMaterial, subjectId: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white bg-[#0f172a]" 
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={(s as any)._id} value={(s as any)._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Upload File (PDF/DOC)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf,.doc,.docx"
                  />
                  <div className="w-full px-5 py-8 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center group-hover:border-blue-500/50 transition-all">
                    <Plus className="w-8 h-8 text-white/20 mb-2 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                    <span className="text-xs text-white/40 font-bold uppercase tracking-widest">
                      {selectedFile ? selectedFile.name : "Click or drag file here"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-10">
              <button 
                onClick={() => setShowUpload(false)}
                className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                className="flex-1 py-4 bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Publish
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

interface MaterialCardProps {
  key?: any;
  material: any;
  subject?: Subject;
  onDelete?: (id: string) => void;
  currentUserRole?: string;
}

function MaterialCard({ material, subject, onDelete, currentUserRole }: MaterialCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'notes': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pyq': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'assignment': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-white/10 text-white/50 border-white/10';
    }
  };

  const subjectData = subject || (typeof material.subjectId === 'object' ? material.subjectId : null);

  const handleDownload = async () => {
    try {
      const response = await fetch(encodeURI(material.fileUrl));
      if (!response.ok) {
        if (response.status === 404) {
          alert('This file was uploaded before the permanent Database storage upgrade and has expired. Please re-upload it.');
        } else {
          alert('Failed to download file.');
        }
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.title ? `${material.title}.pdf` : "document.pdf";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback for strict iframes that block blob extraction completely
      window.open(encodeURI(material.fileUrl), '_blank');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-8 rounded-[32px] flex flex-col group h-full"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border", getTypeColor(material.type))}>
          {material.type}
        </div>
      </div>

      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight mb-4">
        {material.title}
      </h3>
      
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="font-medium truncate">{subjectData ? `${subjectData.name} (${subjectData.code})` : "General Subject"}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/30 font-bold uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          <span>Uploaded {formatDate(material.createdAt)}</span>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${material.uploadedByName || 'U'}`} 
            className="w-8 h-8 rounded-full border border-white/10" 
            alt="" 
          />
          <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Faculty Upload</span>
        </div>
        <div className="flex items-center gap-2">
          {subjectData?.syllabusUrl && (
            <a 
              href={subjectData.syllabusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
            >
              View Syllabus
            </a>
          )}
          {onDelete && currentUserRole !== 'student' && (
            <button
              onClick={() => onDelete(material._id || material.id)}
              className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20 active:scale-90"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={handleDownload}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-90"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

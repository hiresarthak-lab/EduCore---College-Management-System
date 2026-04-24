import React from "react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Define an interface for the timetable to satisfy TypeScript
interface TimetableType {
  [key: string]: string[];
}

const timetable: TimetableType = {
  Monday: ["PPS", "M-II", "CHEM", "BEE", "F1-CHEM"],
  Tuesday: ["BEE", "M-II", "F1-BEE", "CHEM", "CCC-II"],
  Wednesday: ["CHEM", "EG", "BEE", "PPS", "WS"],
  Thursday: ["IKS", "WS", "M-II", "EG", "BEE"],
  Friday: ["PPS", "CHEM", "EG", "PPS", "M-II"],
  Saturday: ["EG", "BEE", "F1-EG", "M-II", "CHEM"],
};

const timeSlots = [
  "10:00 - 10:55",
  "10:55 - 11:50",
  "11:50 - 12:30",
  "12:30 - 01:25",
  "01:25 - 02:20",
];

export default function Timetables() {
  return (
    <div className="space-y-10 text-white pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">FE Master Timetable</h1>
        <p className="text-white/50 text-sm mt-1">Class: FE F | Room: 331 | Academic Year 2025-26</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto glass-panel p-1 rounded-[32px]">
        <table className="w-full text-center border-collapse overflow-hidden rounded-[28px]">
          
          {/* Header Row */}
          <thead className="bg-[#1e293b]">
            <tr>
              <th className="p-4 border-b border-r border-[#334155] font-black uppercase tracking-widest text-[#94a3b8] text-xs">Day / Time</th>
              {timeSlots.map((time, i) => (
                <th key={i} className="p-4 border-b border-[#334155] font-black uppercase tracking-widest text-[#94a3b8] text-xs whitespace-nowrap">
                  {time}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-[#0f172a]/50">
            {days.map((day, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors border-b border-[#334155] last:border-0">
                
                {/* Day Name */}
                <td className="p-4 font-bold border-r border-[#334155] text-white/80">
                  {day}
                </td>

                {/* Subjects */}
                {timetable[day].map((sub, j) => (
                  <td
                    key={j}
                    className="p-4 hover:bg-blue-500/20 transition-colors font-semibold text-blue-100"
                  >
                    {sub}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

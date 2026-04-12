import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('mindsight_logs') || '[]');
    setLogs(saved);
  }, []);

  const clearLogs = () => {
    if(confirm("Are you sure you want to clear all prediction history?")) {
      localStorage.removeItem('mindsight_logs');
      setLogs([]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Screening History</h1>
          <p className="text-textMuted">A localized log of all AI inferences performed during this session.</p>
        </div>
        <button onClick={clearLogs} disabled={logs.length===0} className="flex items-center gap-2 text-danger hover:text-red-400 bg-danger/10 px-4 py-2 rounded-lg transition-colors border border-danger/20 disabled:opacity-50">
          <Trash2 size={18} /> Clear Data
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-16 text-textMuted border-dashed border-2">
          <History size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">No Historical Logs Found</p>
          <p className="text-sm">Run individual screenings to start building your database.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/50 border-b border-border text-sm text-textMuted">
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Student Profile</th>
                  <th className="px-6 py-4 font-medium">Stress & Sleep</th>
                  <th className="px-6 py-4 font-medium">Risk Flag</th>
                  <th className="px-6 py-4 font-medium text-right">Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">{log.date}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">Age {log.Age} • {log.Gender}</div>
                      <div className="text-xs text-textMuted">{log.Department} (CGPA: {log.CGPA})</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      Level {log.Stress_Level} / {log.Sleep_Duration} hrs
                    </td>
                    <td className="px-6 py-4">
                      {log.prediction ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">
                          <ShieldAlert size={14} /> High Risk
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                          <CheckCircle2 size={14} /> Healthy
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold" style={{color: log.prediction ? '#f85149' : '#2ea043'}}>
                      {log.riskPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Logs;

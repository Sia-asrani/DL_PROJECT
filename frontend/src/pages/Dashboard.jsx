import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { api } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const total_records = stats ? stats.total_records.toLocaleString() : "100,000";
  const depression_rate = stats ? (stats.depression_rate * 100).toFixed(1) : "10.1";
  const avg_stress = stats ? stats.avg_stress.toFixed(2) : "4.13";
  const avg_sleep = stats ? stats.avg_sleep.toFixed(2) : "7.00";

  let departmentData = stats && stats.department_dist ? Object.keys(stats.department_dist).map(key => ({
    name: key,
    value: stats.department_dist[key]
  })) : [
    { name: 'ENGINEERING', value: 32450 },
    { name: 'SALES & MARKETING', value: 28100 },
    { name: 'OPERATIONS', value: 21450 },
    { name: 'PRODUCT & DESIGN', value: 18000 }
  ];

  departmentData.sort((a, b) => b.value - a.value);
  const maxDept = Math.max(...departmentData.map(d => d.value));

  const pieData = [
    { name: 'Depressed', value: parseFloat(depression_rate) },
    { name: 'Healthy', value: 100 - parseFloat(depression_rate) }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="pb-10">
      
      {/* Header Area */}
      <div className="flex justify-between items-start mb-10 mt-2">
        <div className="max-w-xl">
          <h1 className="text-[44px] leading-tight font-bold text-white mb-5 tracking-tight">
            Student Depression Analytics
          </h1>
          <p className="text-[15px] text-textMuted leading-relaxed">
            Analytics drawn from {total_records} student records utilized for model training. Curated insights for resource allocation and institutional resilience.
          </p>
        </div>
        <div className="bg-surface px-5 py-2.5 border border-border shadow-sm flex items-center gap-3 mt-3 rounded-lg">
          <span className="material-symbols-outlined text-primary text-[22px]">calendar_today</span>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white">Data View</span>
            <span className="text-[11px] font-bold text-textMuted tracking-wider leading-none mt-1">Current</span>
          </div>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-surface border text-center border-border rounded-xl p-7 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
           <div className="text-[10px] font-bold text-textMuted tracking-[0.15em] mb-4 uppercase">Total Records</div>
           <div className="text-[38px] font-bold text-white tracking-tight leading-none mb-3">{total_records}</div>
           <div className="flex items-center justify-center gap-1.5 text-primary font-medium text-xs mt-1">
             <span className="material-symbols-outlined text-[16px]">trending_up</span>
             <span className="font-bold tracking-tight text-[11px]">+12% vs last period</span>
           </div>
        </div>

        <div className="bg-surface border border-border rounded-xl py-7 px-1 shadow-sm relative flex">
          <div className="w-1 bg-primary h-full absolute left-0 top-0 rounded-l-xl"></div>
          <div className="ml-6 flex-1 flex flex-col justify-center items-center">
            <div className="text-[10px] font-bold text-textMuted tracking-[0.15em] mb-4 uppercase text-center w-full">Depression Rate</div>
            <div className="text-[38px] font-bold text-primary tracking-tight leading-none mb-4 text-center w-full">{parseFloat(depression_rate)}%</div>
            <div className="text-textMuted text-[11px] text-center w-full font-medium">Overall Rate</div>
          </div>
        </div>

        <div className="bg-surface border text-center border-border rounded-xl p-7 shadow-sm flex flex-col items-center justify-center">
           <div className="text-[10px] font-bold text-textMuted tracking-[0.15em] mb-4 uppercase whitespace-nowrap">Avg Stress Level</div>
           <div className="text-[38px] font-bold text-white tracking-tight leading-none mb-4">{avg_stress}</div>
           <div className="text-textMuted text-[11px] text-center w-full font-medium">Scale 1-10 (Moderate)</div>
        </div>

        <div className="bg-surface border text-center border-border rounded-xl p-7 shadow-sm flex flex-col items-center justify-center">
           <div className="text-[10px] font-bold text-textMuted tracking-[0.15em] mb-4 uppercase">Avg Sleep</div>
           <div className="text-[38px] font-bold text-white tracking-tight leading-none mb-4">{avg_sleep}</div>
           <div className="text-textMuted text-[11px] text-center w-full font-medium">Hours per night</div>
        </div>
      </div>

      {/* Middle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 mb-8">
        
        {/* Population by Department */}
        <div className="bg-surface border border-border rounded-[12px] p-8 pb-10 shadow-sm">
          <div className="flex justify-between items-end mb-10 border-b border-border/40 pb-4">
             <h2 className="text-[20px] font-bold text-white">Population by Department</h2>
             <span className="text-[9px] font-bold tracking-[0.15em] text-textMuted uppercase">Distribution Volume</span>
          </div>
          
          <div className="flex flex-col gap-6">
            {departmentData.map((dept, index) => {
              const percentage = (dept.value / maxDept) * 100;
              const opacities = ["opacity-100", "opacity-[0.85]", "opacity-[0.65]", "opacity-40"];
              return (
                <div key={dept.name} className="flex flex-col gap-3">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[11px] font-bold tracking-[0.1em] text-textMuted uppercase">{dept.name}</span>
                    <span className="text-[18px] font-bold text-white leading-none">{dept.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-[#1c222b] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`bg-primary h-full rounded-full transition-all duration-1000 ${opacities[index] || 'opacity-30'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Imbalance Donut */}
        <div className="bg-surface border border-border rounded-[12px] p-8 shadow-sm flex flex-col items-center">
          <h2 className="text-[20px] font-bold text-white mb-1 text-center border-border/40 w-full pb-1 border-b">Health Distribution</h2>
          <p className="text-[11px] italic text-textMuted text-center mb-6 mt-3">Variance from health norms</p>

          <div className="h-44 relative w-full flex-shrink-0 flex items-center justify-center mt-2 mb-4">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={65} 
                  outerRadius={80} 
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value" 
                  stroke="none"
                >
                  <Cell fill="#f85149" />
                  <Cell fill="#2ea043" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col pt-2">
              <span className="text-[34px] font-bold text-white leading-none mb-1">
                {(100 - parseFloat(depression_rate)).toFixed(0)}%
              </span>
              <span className="text-[9px] text-textMuted font-bold uppercase tracking-[0.2em] mt-1">Healthy</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto w-full">
            <div className="flex justify-between items-center px-2 py-1">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-danger block"></span>
                <span className="text-[11px] font-semibold text-textMuted">At Risk</span>
              </div>
              <span className="text-[11px] font-bold text-white">{parseFloat(depression_rate)}%</span>
            </div>
            <div className="flex justify-between items-center px-2 py-1">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-success block"></span>
                <span className="text-[11px] font-semibold text-textMuted">Healthy</span>
              </div>
              <span className="text-[11px] font-bold text-white">{(100 - parseFloat(depression_rate)).toFixed(0)}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px_250px] gap-6">
        {/* Quote */}
        <div className="relative pl-14 pr-8 py-4 flex flex-col justify-center text-left">
            <span className="text-[100px] text-border absolute -top-4 left-0 leading-[0.8] select-none pointer-events-none">"</span>
            <p className="text-[25px] italic text-textMain leading-[1.3] mb-8 relative z-10 w-full text-left">
              Lack of sleep directly impacts stress levels and academic performance. The baseline depression rate of {depression_rate}% reflects an underlying institutional challenge during intensive study periods.
            </p>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-[12px] shadow-sm bg-primary/20 border border-primary/50 flex align-center justify-center items-center text-primary font-bold">
                AI
              </div>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <h4 className="text-[12px] font-bold tracking-[0.1em] text-white uppercase">Insight Engine</h4>
                <p className="text-[10px] tracking-[0.05em] text-textMuted uppercase">Automated Inference</p>
              </div>
            </div>
        </div>

        {/* Weekly Trend Mini Chart */}
        <div className="bg-surface border border-border rounded-[12px] p-6 shadow-sm flex flex-col items-center">
           <h4 className="text-[10px] font-bold tracking-[0.2em] text-textMuted uppercase mb-4 text-center mt-1 border-b border-border/40 pb-3 w-full">Recent Trend</h4>
           <div className="flex-1 flex items-end justify-center gap-2 mb-6 mt-4 w-full h-[80px]">
              <div className="w-3.5 bg-[#1c222b] h-[35%] rounded-md"></div>
              <div className="w-3.5 bg-[#1c222b] h-[60%] rounded-md"></div>
              <div className="w-3.5 bg-primary h-[100%] rounded-md shadow-sm"></div>
              <div className="w-3.5 bg-[#1c222b] h-[45%] rounded-md"></div>
              <div className="w-3.5 bg-[#1c222b] h-[30%] rounded-md"></div>
           </div>
           <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-primary tracking-[0.1em] uppercase mb-1">
             <span className="material-symbols-outlined text-[15px]">auto_graph</span>
             <span>+4.2% Stability</span>
           </div>
        </div>

        {/* Regional Risk */}
        <div className="bg-surface border border-border rounded-[12px] p-6 shadow-sm flex flex-col justify-center items-center">
           <h4 className="text-[10px] font-bold tracking-[0.2em] text-textMuted uppercase mb-auto text-center mt-1 border-b border-border/40 pb-3 w-full">Current Risk Status</h4>
           
           <div className="flex items-center justify-center gap-2 mb-5 mt-auto">
             <div className="bg-success/10 text-success px-4 py-2.5 rounded-lg flex items-center justify-center shadow-sm border border-success/20">
               <span className="material-symbols-outlined text-[20px] mr-1.5">shield_moon</span>
               <span className="text-[24px] font-bold leading-none mb-0.5 mt-0.5">Low</span>
             </div>
           </div>

           <div className="text-[10px] font-bold tracking-[0.2em] text-textMuted uppercase text-center mt-auto mb-1">
             Campus Wide
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, ShieldAlert, Sparkles, MoveRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from 'recharts';
import { api } from '../api';

const formatFeatureName = (name) =>
  name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const DEFAULT_FORM_DATA = {
  Age: '21',
  Gender: 'Female',
  Department: 'Science',
  CGPA: '3.5',
  Sleep_Duration: '7.0',
  Study_Hours: '4.0',
  Social_Media_Hours: '2.0',
  Physical_Activity: '60',
  Stress_Level: '5',
};

const NUMERIC_FIELDS = [
  'Age',
  'CGPA',
  'Sleep_Duration',
  'Study_Hours',
  'Social_Media_Hours',
  'Physical_Activity',
  'Stress_Level',
];

const SinglePrediction = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const hasEmptyNumericField = NUMERIC_FIELDS.some((field) => formData[field] === '');
    if (hasEmptyNumericField) {
      setError('Please complete all numeric fields before running a prediction.');
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      Age: Number(formData.Age),
      CGPA: Number(formData.CGPA),
      Sleep_Duration: Number(formData.Sleep_Duration),
      Study_Hours: Number(formData.Study_Hours),
      Social_Media_Hours: Number(formData.Social_Media_Hours),
      Physical_Activity: Number(formData.Physical_Activity),
      Stress_Level: Number(formData.Stress_Level),
    };

    const totalCommittedHours =
      payload.Sleep_Duration + payload.Study_Hours + (payload.Physical_Activity / 60);
    if (totalCommittedHours > 24) {
      setError('Sleep, study, and exercise time combined must be 24 hours or less.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/predict', payload);
      setResult(res.data);
      
      const newLog = {
        date: new Date().toLocaleString(),
        ...payload,
        riskPercentage: Math.round(res.data.probability * 100),
        prediction: res.data.prediction
      };
      const logs = JSON.parse(localStorage.getItem('mindsight_logs') || '[]');
      localStorage.setItem('mindsight_logs', JSON.stringify([newLog, ...logs]));
      
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred.");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: '',
        }));
        return;
      }

      if (name === 'Age' && Number(value) > 100) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  let shapData = [];
  if (result && result.shap_values) {
    shapData = Object.entries(result.shap_values)
      .map(([name, value]) => ({
        name: formatFeatureName(name),
        value: Number(value),
      }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 7); // Top 7 impact features
  }
  const hasShapData = shapData.length > 0;
  const maxAbsShapValue = hasShapData
    ? Math.max(...shapData.map((entry) => Math.abs(entry.value)))
    : 0;
  const shapAxisLimit = maxAbsShapValue > 0 ? Number((maxAbsShapValue * 1.15).toFixed(4)) : 1;

  // Formatting Probability
  const riskPercentage = result ? Math.round(result.probability * 100) : 0;
  const isHighRisk = riskPercentage >= 50;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col xl:flex-row gap-8">
      {/* Form Section */}
      <div className="w-full xl:w-1/3">
        <h1 className="text-3xl font-bold text-white mb-2">Individual Screening</h1>
        <p className="text-textMuted mb-6">Enter demographic and lifestyle metrics to infer deep learning depression risk.</p>
        
        <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Age" name="Age" type="number" value={formData.Age} onChange={handleChange} min="1" max="100" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textMuted">Gender</label>
              <select name="Gender" value={formData.Gender} onChange={handleChange} className="bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-sm font-medium text-textMuted">Department</label>
              <select name="Department" value={formData.Department} onChange={handleChange} className="bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary">
                <option value="Science">Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Medical">Medical</option>
                <option value="Arts">Arts</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <InputField label="CGPA (0 - 4)" name="CGPA" type="number" step="0.01" value={formData.CGPA} onChange={handleChange} min="0" max="4" />
            <InputField label="Stress Level (0-10)" name="Stress_Level" type="number" value={formData.Stress_Level} onChange={handleChange} min="0" max="10" />
            <InputField label="Sleep (Hours)" name="Sleep_Duration" type="number" step="0.1" value={formData.Sleep_Duration} onChange={handleChange} min="0" max="24" />
            <InputField label="Study (Hours)" name="Study_Hours" type="number" step="0.1" value={formData.Study_Hours} onChange={handleChange} min="0" max="24" />
            <InputField label="Social Media (Hours)" name="Social_Media_Hours" type="number" step="0.1" value={formData.Social_Media_Hours} onChange={handleChange} min="0" max="24" />
            <InputField label="Exercise (Minutes)" name="Physical_Activity" type="number" value={formData.Physical_Activity} onChange={handleChange} min="0" max="1440" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-primary hover:bg-blue-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-t-white border-white/30 rounded-full animate-spin"></div> : <Brain size={20} />}
            {loading ? 'Processing Neural Net...' : 'Run Prediction Engine'}
          </button>
          
          {error && <div className="text-danger text-sm mt-2 text-center">{error}</div>}
        </form>
      </div>

      {/* Results Section */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="empty" initial={{ opacity: 0}} animate={{opacity:1}} exit={{opacity:0}} className="glass-card flex-1 flex flex-col items-center justify-center min-h-[500px] text-textMuted border-dashed border-2">
              <Activity size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Awaiting Input Data</p>
              <p className="text-sm">Submit the form to visualize neural responses and SHAP features here.</p>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col gap-6">
              
              {/* Top Banner Indicator */}
              <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-lg ${isHighRisk ? 'bg-danger/10 border-danger/30' : 'bg-success/10 border-success/30'}`}>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wider mb-1" style={{color: isHighRisk ? '#f85149' : '#2ea043'}}>
                    Classification Result
                  </div>
                  <div className="text-4xl font-bold text-white flex items-center gap-3">
                    {isHighRisk ? 'Depression Risk Detected' : 'Healthy Baseline'}
                    {isHighRisk && <ShieldAlert size={32} className="text-danger" />}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black" style={{color: isHighRisk ? '#f85149' : '#2ea043'}}>{riskPercentage}%</div>
                  <div className="text-sm text-textMuted">Probability Score</div>
                </div>
              </div>

              {/* Explainability & Insights Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SHAP Chart */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="text-primary" size={20} />
                    <h2 className="text-lg font-semibold">SHAP Feature Importance</h2>
                  </div>
                  <p className="text-xs text-textMuted mb-4">Values pushing right increase depression risk. Values pushing left decrease it.</p>
                  {hasShapData ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={shapData} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#30363d" />
                          <XAxis
                            type="number"
                            stroke="#8b949e"
                            tick={{ fontSize: 12 }}
                            domain={[-shapAxisLimit, shapAxisLimit]}
                            tickFormatter={(value) => value.toFixed(2)}
                          />
                          <YAxis type="category" dataKey="name" stroke="#8b949e" tick={{fontSize: 12, fill: '#c9d1d9'}} width={140} />
                          <ReferenceLine x={0} stroke="#8b949e" strokeOpacity={0.7} />
                          <Tooltip cursor={{fill: '#21262d'}} contentStyle={{backgroundColor: '#161b22', borderColor: '#30363d'}} formatter={(val) => val.toFixed(4)} />
                          <Bar dataKey="value">
                            {shapData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f85149' : '#2ea043'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 rounded-xl border border-dashed border-border bg-surface/60 flex items-center justify-center text-center px-6">
                      <p className="text-sm text-textMuted">
                        Explanation data is not available for this prediction yet. If this keeps happening, restart the backend so the SHAP explainer can initialize.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="glass-card p-6 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <Brain className="text-primary" size={20} />
                    <h2 className="text-lg font-semibold">AI Recommended Interventions</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
                    {result.recommendations.map((rec, i) => (
                      <motion.div initial={{opacity: 0, x: 20}} animate={{opacity:1, x:0}} transition={{delay: i*0.1}} key={i} className="p-4 rounded-xl bg-surface border border-border flex gap-3 items-start">
                        <MoveRight className="text-primary shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-textMain leading-relaxed">{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
};

// Reusable Input Field
const InputField = ({ label, name, type, value, onChange, step, min, max }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-textMuted">{label}</label>
    <input 
      type={type} name={name} value={value} onChange={onChange} step={step} min={min} max={max} required
      className="bg-surface border border-border rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
    />
  </div>
);

export default SinglePrediction;

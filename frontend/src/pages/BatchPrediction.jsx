import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

const BatchPrediction = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processBatch = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setBatchResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/predict/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during batch processing.");
    }
    setLoading(false);
  };

  const downloadCsv = () => {
    if (!batchResult || !batchResult.results) return;
    
    const headers = ["Original_Row_Index", "Probability_Score", "Risk_Classification", "Error_Message"];
    const rows = batchResult.results.map(r => [
      r.row, 
      r.probability?.toFixed(4) || "Error", 
      r.error ? "Invalid" : r.prediction ? "High Risk" : "Healthy",
      r.error || ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "mindsight_batch_results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mass Cohort Processor</h1>
        <p className="text-textMuted">Upload a CSV file conforming to the 100K dataset schema to process thousands of predictions globally.</p>
      </div>

      <div className="glass-card p-10 flex flex-col items-center justify-center border-dashed border-2 text-center" 
           style={{ borderColor: file ? '#58a6ff' : '#30363d' }}>
        
        {!file ? (
          <>
            <UploadCloud size={64} className="text-textMuted mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Drag & Drop CSV File</h3>
            <p className="text-textMuted mb-6 max-w-sm">File must contain exactly the same column headers as the Kaggle dataset to map correctly.</p>
            <button onClick={handleUploadClick} className="bg-surfaceHover border border-border text-white px-6 py-2.5 rounded-lg hover:border-primary transition-colors cursor-pointer">
              Browse Files
            </button>
          </>
        ) : (
          <>
            <FileText size={64} className="text-primary mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">{file.name}</h3>
            <p className="text-success mb-6 flex items-center gap-2"><CheckCircle2 size={16}/> File ready for injection</p>
            <div className="flex gap-4">
              <button disabled={loading} onClick={() => {setFile(null); setBatchResult(null);}} className="bg-surface text-white px-6 py-2.5 rounded-lg border border-border hover:bg-surfaceHover transition-colors disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button disabled={loading} onClick={processBatch} className="bg-primary hover:bg-blue-400 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div> : <Layers size={18} />}
                {loading ? 'Processing Matrix...' : 'Run Pipeline'}
              </button>
            </div>
          </>
        )}
        <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileChange} />
      </div>

      {error && <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-center">{error}</div>}

      {/* Batch Results Overview */}
      {batchResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="glass-card p-6 border-t-4 border-t-primary">
              <div className="text-textMuted mb-2">Valid Processed</div>
              <div className="text-4xl font-bold text-white">{batchResult.total_processed}</div>
            </div>
            <div className="glass-card p-6 border-t-4 border-t-danger bg-danger/5">
              <div className="text-textMuted mb-2">Depression Flagged</div>
              <div className="text-4xl font-bold text-danger">{batchResult.depression_detected_count}</div>
            </div>
            <div className="glass-card p-6 border-t-4 border-t-success">
              <div className="text-textMuted mb-2">Healthy Baseline</div>
              <div className="text-4xl font-bold text-success">{batchResult.anomalies_detected}</div>
            </div>
            <div className="glass-card p-6 border-t-4 border-t-yellow-500 bg-yellow-500/5">
              <div className="text-textMuted mb-2">Invalid Entries</div>
              <div className="text-4xl font-bold text-yellow-500">{batchResult.invalid_entries_count}</div>
            </div>
          </div>
          <button onClick={downloadCsv} className="self-center flex items-center gap-2 bg-surface border border-primary text-primary px-8 py-3 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer font-medium">
             Download Combined CSV Dataset
          </button>
        </motion.div>
      )}

    </motion.div>
  );
};

export default BatchPrediction;

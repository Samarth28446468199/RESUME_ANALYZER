import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { Upload, FileText, CheckCircle, Download, Loader } from 'lucide-react';
import { resumeAPI } from '../api';
import { PageHeader, ProgressBar, Badge, Spinner } from '../components/ui/UI';
import jsPDF from 'jspdf';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Only PDF or DOCX files under 5MB are allowed');
      return;
    }
    setFile(accepted[0]);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      const { data } = await resumeAPI.upload(formData);
      setResult(data.resume);
      toast.success('Resume analyzed successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Resume Analysis Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${result.name || 'N/A'}`, 20, 40);
    doc.text(`Email: ${result.email || 'N/A'}`, 20, 50);
    doc.text(`Experience: ${result.experienceYears} years`, 20, 60);
    doc.text(`Resume Score: ${result.resumeScore}/100`, 20, 70);
    doc.setFontSize(14);
    doc.text('Skills Detected:', 20, 90);
    doc.setFontSize(11);
    const skillText = result.skills.join(', ');
    const splitSkills = doc.splitTextToSize(skillText, 170);
    doc.text(splitSkills, 20, 100);
    doc.save('resume-analysis.pdf');
    toast.success('Report downloaded!');
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Upload Resume"
          subtitle="Upload your PDF or DOCX resume for instant AI analysis"
        />

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`section-card cursor-pointer transition-all duration-300 border-2 border-dashed flex flex-col items-center justify-center py-16 mb-6 hover:border-indigo-400
            ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-700'}`}
        >
          <input {...getInputProps()} />
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
            ${isDragActive ? 'bg-indigo-100 dark:bg-indigo-900/30 scale-110' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <Upload className={`w-10 h-10 ${isDragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
            {isDragActive ? 'Drop your resume here!' : 'Drag & drop your resume'}
          </h3>
          <p className="text-slate-400 text-sm">or click to browse — PDF or DOCX, max 5MB</p>
        </div>

        {/* Selected file */}
        {file && !result && (
          <div className="section-card flex items-center justify-between mb-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-gradient flex items-center gap-2 disabled:opacity-60"
            >
              {uploading ? (
                <><Spinner size="sm" /> Analyzing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Analyze Resume</>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="section-card flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{result.name || 'Your Resume'}</h2>
                  <p className="text-slate-400 text-sm">{result.email}</p>
                </div>
              </div>
              <button onClick={downloadReport} className="btn-gradient flex items-center gap-2 text-sm py-2">
                <Download className="w-4 h-4" /> Download Report
              </button>
            </div>

            {/* Resume score */}
            <div className="section-card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                Resume Score
                <Badge variant={result.resumeScore >= 70 ? 'success' : result.resumeScore >= 40 ? 'warning' : 'danger'}>
                  {result.resumeScore >= 70 ? 'Strong' : result.resumeScore >= 40 ? 'Average' : 'Needs Work'}
                </Badge>
              </h3>
              <ProgressBar
                value={result.resumeScore}
                label={`${result.resumeScore} / 100`}
                color={result.resumeScore >= 70 ? 'green' : result.resumeScore >= 40 ? 'yellow' : 'red'}
              />
            </div>

            {/* Stats grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Skills Detected', value: result.skills.length, color: 'text-indigo-500' },
                { label: 'Experience Years', value: result.experienceYears, color: 'text-blue-500' },
                { label: 'Education Entries', value: result.education?.length || 0, color: 'text-emerald-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="section-card text-center">
                  <p className={`text-3xl font-black ${color}`}>{value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="section-card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.skills.length > 0 ? (
                  result.skills.map((s) => (
                    <span key={s} className="skill-badge-blue">{s}</span>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">No skills detected. Try a more detailed resume.</p>
                )}
              </div>
            </div>

            {/* Education */}
            {result.education?.length > 0 && (
              <div className="section-card">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Education</h3>
                <div className="space-y-2">
                  {result.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{edu.degree}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

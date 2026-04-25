import React, { useState } from 'react';
import { FileText, Sparkles, Copy, CheckCircle } from 'lucide-react';
import { PageHeader, Badge, Spinner } from '../components/ui/UI';
import { aiAPI } from '../api';

export default function CoverLetterPage() {
    const [formData, setFormData] = useState({
        jobTitle: '',
        companyName: '',
        skills: ''
    });
    const [generating, setGenerating] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setCoverLetter('');
        
        try {
            const response = await aiAPI.generateCoverLetter(formData);
            if (response.data.success) {
                setCoverLetter(response.data.data.coverLetter);
            }
        } catch (error) {
            console.error('Error generating cover letter:', error);
            setCoverLetter('An error occurred while generating the cover letter. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <PageHeader
                    title="AI Cover Letter Builder"
                    subtitle="Instantly generate tailored cover letters for your job applications"
                    action={<Badge variant="primary">New Feature</Badge>}
                />

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="section-card">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Job Details</h2>
                        </div>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Job Title</label>
                                <input 
                                    className="input-field w-full" 
                                    placeholder="e.g., Frontend Developer" 
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                                <input 
                                    className="input-field w-full" 
                                    placeholder="e.g., TechNova" 
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Key Skills to Highlight (Comma separated)</label>
                                <textarea 
                                    className="input-field w-full h-24 pt-3" 
                                    placeholder="e.g., React, Tailwind, Team Leadership" 
                                    value={formData.skills}
                                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={generating} className="btn-gradient w-full py-3 flex items-center justify-center gap-2">
                                {generating ? <Spinner size="sm" /> : <FileText className="w-4 h-4" />}
                                {generating ? 'Generating...' : 'Generate Cover Letter'}
                            </button>
                        </form>
                    </div>

                    {/* Output Area */}
                    <div className="section-card flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Generated Letter</h2>
                            {coverLetter && (
                                <button onClick={handleCopy} className="text-sm font-medium text-indigo-500 flex items-center gap-1 hover:text-indigo-400">
                                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                                </button>
                            )}
                        </div>
                        <div className="flex-grow bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 overflow-y-auto">
                            {generating ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Sparkles className="w-8 h-8 animate-pulse text-indigo-400" />
                                    <p>AI is writing your letter...</p>
                                </div>
                            ) : coverLetter ? (
                                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {coverLetter}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <FileText className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">Your cover letter will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

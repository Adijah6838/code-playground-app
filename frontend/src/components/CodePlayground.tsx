import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Plus, Trash2, FileCode, Save } from 'lucide-react';

const API_URL = 'http://localhost:4100/api';

interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

export default function CodePlayground() {
  const [files, setFiles] = useState<ProjectFile[]>([
    { name: 'index.js', language: 'javascript', content: '// Write your code here\nconsole.log("Hello, World!");' }
  ]);
  const [activeFile, setActiveFile] = useState<string>('index.js');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const currentFile = files.find(f => f.name === activeFile) || files[0];

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles(files.map(f => f.name === activeFile ? { ...f, content: value } : f));
  };

  const addFile = () => {
    const name = prompt('Enter file name (e.g. app.js):');
    if (!name) return;
    if (files.find(f => f.name === name)) return alert('File already exists');
    
    const language = name.endsWith('.ts') ? 'typescript' : 'javascript';
    setFiles([...files, { name, language, content: '' }]);
    setActiveFile(name);
  };

  const deleteFile = (name: string) => {
    if (files.length === 1) return alert('Must have at least one file');
    setFiles(files.filter(f => f.name !== name));
    if (activeFile === name) setActiveFile(files[0].name);
  };

  const runCode = async () => {
    setIsRunning(true);
    setLogs(['> Running ' + currentFile.name + '...']);
    try {
      const res = await axios.post(`${API_URL}/execute`, { code: currentFile.content });
      if (res.data.success) {
        setLogs(prev => [...prev, ...res.data.logs, res.data.result ? `=> ${res.data.result}` : '']);
      } else {
        setLogs(prev => [...prev, ...res.data.logs, `❌ Error: ${res.data.error}`]);
      }
    } catch (err) {
      setLogs(prev => [...prev, '❌ Failed to connect to execution server']);
    }
    setIsRunning(false);
  };

  const saveProject = async () => {
    try {
      await axios.post(`${API_URL}/projects`, { name: 'My Project', files_json: files });
      alert('Project saved successfully!');
    } catch (err) { alert('Failed to save project'); }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files]);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="font-bold">Explorer</h2>
          <button onClick={addFile} className="text-gray-400 hover:text-white"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {files.map(file => (
            <div 
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`flex items-center justify-between p-2 cursor-pointer text-sm ${activeFile === file.name ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700'}`}
            >
              <div className="flex items-center gap-2"><FileCode size={14} /> {file.name}</div>
              <button onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button onClick={saveProject} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm flex items-center justify-center gap-2 transition">
            <Save size={16} /> Save Project
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
          <div className="flex gap-4 text-sm text-gray-400">
            <span>{currentFile.name}</span>
          </div>
          <button 
            onClick={runCode} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 transition"
          >
            <Play size={14} /> {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>

        <div className="flex-1">
          <Editor
            height="100%"
            language={currentFile.language}
            theme="vs-dark"
            value={currentFile.content}
            onChange={handleEditorChange}
            options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', formatOnPaste: true }}
          />
        </div>

        <div className="h-48 bg-[#1e1e1e] border-t border-gray-700 p-4 font-mono text-sm overflow-y-auto">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Console Output</h3>
          {logs.map((log, i) => (
            <div key={i} className={log.includes('Error') || log.includes('❌') ? 'text-red-400' : 'text-green-400'}>
              {log}
            </div>
          ))}
          {logs.length === 0 && <span className="text-gray-600 italic">Output will appear here...</span>}
        </div>
      </div>
    </div>
  );
}
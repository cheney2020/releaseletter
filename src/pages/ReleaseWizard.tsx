import React, { useState, useRef, useEffect } from 'react';
import { useAppContext, Release, Feature } from '../store';
import { Button, Input, Textarea, Label, Card, CardContent, Badge } from '../components/ui';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Save, Download, Send, ChevronDown, ChevronUp, GripVertical, Copy, BarChart2, LayoutTemplate, Sparkles, RefreshCw } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { GoogleGenAI } from "@google/genai";

const APP_OPTIONS = ['CDP', 'FAST', 'SPP', 'MDIC', 'DOP', '投放主数据'];

export const ReleaseWizard: React.FC = () => {
  const { currentTeam, setCurrentView, editingRelease, addRelease, updateRelease, releases } = useAppContext();
  
  const [release, setRelease] = useState<Release>(editingRelease || {
    id: Math.random().toString(36).substr(2, 9),
    scrumTeam: currentTeam?.name || '增长组',
    versionNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    releaseDate: new Date().toISOString().split('T')[0],
    publisher: '',
    summary: '',
    features: [],
    status: '草稿',
    createdAt: new Date().toISOString()
  });

  const [activeAnchor, setActiveAnchor] = useState('basic-info');
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [draggedFeatureId, setDraggedFeatureId] = useState<string | null>(null);
  
  const infographicRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derived state
  const addedApps: string[] = Array.from(new Set(release.features.map(f => f.appName)));
  const availableApps = APP_OPTIONS.filter(app => !addedApps.includes(app));
  
  const newCount = release.features.filter(f => f.featureType === '新功能').length;
  const optCount = release.features.filter(f => f.featureType === '功能优化').length;
  const bugCount = release.features.filter(f => f.featureType === 'Bug修复').length;

  const isReadOnly = release.status !== '草稿';
  const isVersionConflict = releases.some(r => 
    r.scrumTeam === release.scrumTeam && 
    r.versionNumber.trim().toLowerCase() === release.versionNumber.trim().toLowerCase() && 
    r.id !== release.id && 
    r.status !== '已作废'
  );

  // Handlers
  const generateAISummary = async () => {
    if (release.features.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `
        请根据以下产品迭代功能列表，生成一句简短的迭代概述（不超过50个字），用于发布说明的开头。
        要求：突出核心价值，语气专业、积极。
        
        功能列表：
        ${release.features.map(f => `- [${f.appName}] ${f.name} (${f.featureType}): ${f.description}`).join('\n')}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      if (response.text) {
        setRelease(prev => ({ ...prev, summary: response.text?.trim() || '' }));
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveDraft = () => {
    if (editingRelease) updateRelease({ ...release, status: '草稿' });
    else addRelease({ ...release, status: '草稿' });
    setCurrentView('list');
  };

  const handlePublish = () => {
    if (editingRelease) updateRelease({ ...release, status: '已发布' });
    else addRelease({ ...release, status: '已发布' });
    setCurrentView('list');
  };

  const handleDownload = async () => {
    if (!infographicRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(infographicRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Release_${release.versionNumber || 'Untitled'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const handleAddApp = (appName: string) => {
    // Add an empty feature to initialize the app group
    const newFeature: Feature = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      appName,
      module: '',
      valueLevel: '中',
      description: '',
      screenshots: [],
      targetUsers: [],
      featureType: '新功能',
      sortOrder: release.features.filter(f => f.appName === appName).length + 1
    };
    setRelease({ ...release, features: [...release.features, newFeature] });
    setExpandedFeatures({ ...expandedFeatures, [newFeature.id]: true });
    setShowAppSelector(false);
  };

  const handleAddFeature = (appName: string) => {
    const newFeature: Feature = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      appName,
      module: '',
      valueLevel: '中',
      description: '',
      screenshots: [],
      targetUsers: [],
      featureType: '新功能',
      sortOrder: release.features.filter(f => f.appName === appName).length + 1
    };
    setRelease({ ...release, features: [...release.features, newFeature] });
    setExpandedFeatures({ ...expandedFeatures, [newFeature.id]: true });
  };

  const updateFeature = (id: string, field: keyof Feature, value: any) => {
    setRelease({
      ...release,
      features: release.features.map(f => f.id === id ? { ...f, [field]: value } : f)
    });
  };

  const removeFeature = (id: string) => {
    setRelease({ ...release, features: release.features.filter(f => f.id !== id) });
  };

  const copyFeature = (feature: Feature) => {
    const newFeature = {
      ...feature,
      id: Math.random().toString(36).substr(2, 9),
      sortOrder: release.features.filter(f => f.appName === feature.appName).length + 1
    };
    setRelease({ ...release, features: [...release.features, newFeature] });
  };

  const toggleFeatureExpand = (id: string) => {
    setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const removeAppGroup = (appName: string) => {
    setRelease({ ...release, features: release.features.filter(f => f.appName !== appName) });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedFeatureId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string, appName: string) => {
    e.preventDefault();
    if (!draggedFeatureId || draggedFeatureId === targetId) return;

    const draggedFeature = release.features.find(f => f.id === draggedFeatureId);
    const targetFeature = release.features.find(f => f.id === targetId);

    if (!draggedFeature || !targetFeature || draggedFeature.appName !== appName) return;

    const appFeatures = release.features.filter(f => f.appName === appName).sort((a, b) => a.sortOrder - b.sortOrder);
    const draggedIndex = appFeatures.findIndex(f => f.id === draggedFeatureId);
    const targetIndex = appFeatures.findIndex(f => f.id === targetId);

    const newAppFeatures = [...appFeatures];
    newAppFeatures.splice(draggedIndex, 1);
    newAppFeatures.splice(targetIndex, 0, draggedFeature);

    const updatedFeatures = release.features.map(f => {
      if (f.appName === appName) {
        const newIndex = newAppFeatures.findIndex(nf => nf.id === f.id);
        return { ...f, sortOrder: newIndex + 1 };
      }
      return f;
    });

    setRelease({ ...release, features: updatedFeatures });
    setDraggedFeatureId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Scroll spy for anchor navigation
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const sections = ['basic-info', 'stats', ...addedApps.map(app => `app-${app}`)];
      let current = sections[0];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) { // Offset for header
            current = section;
          }
        }
      }
      setActiveAnchor(current);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [addedApps]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && containerRef.current) {
      const topPos = element.offsetTop - 20; // Add some padding
      containerRef.current.scrollTo({ top: topPos, behavior: 'smooth' });
    }
  };

  // Group features by appName then module for the preview
  const groupedFeatures = release.features
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .reduce((acc, feature) => {
      if (!acc[feature.appName]) acc[feature.appName] = {};
      if (!acc[feature.appName][feature.module || '未分类模块']) acc[feature.appName][feature.module || '未分类模块'] = [];
      acc[feature.appName][feature.module || '未分类模块'].push(feature);
      return acc;
    }, {} as Record<string, Record<string, Feature[]>>);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('list')} className="gap-2 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-lg font-semibold text-gray-900">
            {editingRelease ? '编辑迭代发布' : '新建迭代发布'}
          </h1>
          <Badge variant={release.status === '已发布' ? 'success' : 'secondary'} className="ml-2">
            {release.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <>
              <Button variant="outline" size="sm" onClick={handleSaveDraft} className="gap-2" disabled={isVersionConflict || !release.versionNumber.trim()}>
                <Save className="w-4 h-4" /> 保存草稿
              </Button>
              <Button size="sm" onClick={handlePublish} className="gap-2" disabled={isVersionConflict || !release.versionNumber.trim()}>
                <Send className="w-4 h-4" /> 发布
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" /> 导出长图
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Anchor Navigation */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 shrink-0 overflow-y-auto">
          <div className="px-6 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">页面导航</div>
          <nav className="space-y-1">
            <button 
              onClick={() => scrollToSection('basic-info')}
              className={`w-full text-left px-6 py-2 text-sm transition-colors border-l-4 ${activeAnchor === 'basic-info' ? 'border-[#FFC72C] bg-yellow-50 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              基本信息
            </button>
            <button 
              onClick={() => scrollToSection('stats')}
              className={`w-full text-left px-6 py-2 text-sm transition-colors border-l-4 ${activeAnchor === 'stats' ? 'border-[#FFC72C] bg-yellow-50 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              统计概览
            </button>
            
            {addedApps.length > 0 && (
              <div className="mt-6 mb-2 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">应用分组</div>
            )}
            {addedApps.map(app => (
              <button 
                key={app}
                onClick={() => scrollToSection(`app-${app}`)}
                className={`w-full text-left px-6 py-2 text-sm transition-colors border-l-4 ${activeAnchor === `app-${app}` ? 'border-[#FFC72C] bg-yellow-50 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="pl-2">{app}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Middle: Form Editor */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-8 scroll-smooth relative">
          <fieldset disabled={isReadOnly} className="max-w-3xl mx-auto space-y-8 pb-32 min-w-0">
            
            {/* Basic Info */}
            <section id="basic-info" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-gray-400" /> 基本信息
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>所属 Scrum Team <span className="text-red-500">*</span></Label>
                  <Input 
                    value={release.scrumTeam} 
                    readOnly 
                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>迭代版本号 <span className="text-red-500">*</span></Label>
                  <Input 
                    value={release.versionNumber} 
                    onChange={e => setRelease({ ...release, versionNumber: e.target.value })} 
                    placeholder="例如：v2.3.0" 
                    className={isVersionConflict ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {isVersionConflict && (
                    <p className="text-red-500 text-sm mt-1">该版本号已存在，请修改</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>迭代周期 <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={release.startDate} onChange={e => setRelease({ ...release, startDate: e.target.value })} />
                    <span className="text-gray-500">至</span>
                    <Input type="date" value={release.endDate} onChange={e => setRelease({ ...release, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>上线时间 <span className="text-red-500">*</span></Label>
                  <Input type="date" value={release.releaseDate} onChange={e => setRelease({ ...release, releaseDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>发布人 <span className="text-red-500">*</span></Label>
                  <Input value={release.publisher} onChange={e => setRelease({ ...release, publisher: e.target.value })} placeholder="您的姓名" />
                </div>
              </div>
            </section>

            {/* AI Summary */}
            <section className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-indigo-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" /> AI 迭代概述
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateAISummary} 
                    disabled={isGeneratingSummary || release.features.length === 0}
                    className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    {isGeneratingSummary ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {release.summary ? '重新生成' : '一键生成'}
                  </Button>
                </div>
                
                {release.features.length === 0 ? (
                  <div className="text-sm text-indigo-400 italic py-4">录入更多功能后可生成概述</div>
                ) : (
                  <div className="space-y-2">
                    <Textarea 
                      value={release.summary} 
                      onChange={e => setRelease({ ...release, summary: e.target.value })} 
                      placeholder="点击右上角按钮，AI 将根据您录入的功能自动生成迭代概述..." 
                      rows={3} 
                      className="bg-white/80 border-indigo-100 focus-visible:ring-indigo-500"
                    />
                    <p className="text-xs text-indigo-400">支持手动微调编辑</p>
                  </div>
                )}
              </div>
            </section>

            {/* Stats */}
            <section id="stats" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-gray-400" /> 统计概览
              </h2>
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                  <div className="text-2xl font-bold text-gray-900">{release.features.length}</div>
                  <div className="text-xs text-gray-500 mt-1">功能总数</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                  <div className="text-2xl font-bold text-gray-900">{addedApps.length}</div>
                  <div className="text-xs text-gray-500 mt-1">涉及应用</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                  <div className="text-2xl font-bold text-[#DA291C]">{newCount}</div>
                  <div className="text-xs text-red-700 mt-1">新功能</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{optCount}</div>
                  <div className="text-xs text-yellow-800 mt-1">功能优化</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                  <div className="text-2xl font-bold text-green-600">{bugCount}</div>
                  <div className="text-xs text-green-700 mt-1">Bug修复</div>
                </div>
              </div>
            </section>

            {/* App Groups Management */}
            <div className="flex items-center justify-between pt-4">
              <h2 className="text-xl font-bold text-gray-900">应用功能录入</h2>
            </div>

            {/* App Groups */}
            {addedApps.map(app => {
              const appFeatures = release.features.filter(f => f.appName === app).sort((a, b) => a.sortOrder - b.sortOrder);
              
              return (
                <section key={app} id={`app-${app}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#FFC72C] rounded-full"></div>
                      <h3 className="text-lg font-bold text-gray-900">{app}</h3>
                      <Badge variant="secondary" className="ml-2">{appFeatures.length} 个功能</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isReadOnly && (
                        <Button variant="ghost" size="sm" onClick={() => removeAppGroup(app)} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="删除整个应用分组">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {appFeatures.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        当前应用暂无功能，请点击下方新增功能
                      </div>
                    ) : (
                      appFeatures.map((feature, index) => {
                        const isExpanded = expandedFeatures[feature.id];
                        
                        return (
                          <div 
                            key={feature.id} 
                            draggable={!isReadOnly}
                            onDragStart={(e) => handleDragStart(e, feature.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, feature.id, app)}
                            className={`border rounded-lg transition-colors ${isExpanded ? 'border-[#FFC72C] shadow-sm' : 'border-gray-200 hover:border-gray-300'} ${draggedFeatureId === feature.id ? 'opacity-50' : ''}`}
                          >
                            {/* Card Header (Collapsed State) */}
                            <div 
                              className="flex items-center p-4 cursor-pointer select-none"
                              onClick={() => toggleFeatureExpand(feature.id)}
                            >
                              <div className={`${isReadOnly ? 'text-gray-300' : 'cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600'} mr-3`} onClick={e => e.stopPropagation()}>
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium mr-4 shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center gap-4">
                                <div className="font-medium text-gray-900 truncate max-w-[200px]">
                                  {feature.name || <span className="text-gray-400 italic">未命名功能</span>}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  {feature.module && <Badge variant="secondary">{feature.module}</Badge>}
                                  <Badge variant={feature.featureType === '新功能' ? 'default' : 'outline'}>{feature.featureType}</Badge>
                                  <Badge variant={feature.valueLevel === '高' ? 'destructive' : feature.valueLevel === '中' ? 'warning' : 'success'}>{feature.valueLevel}价值</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-4" onClick={e => e.stopPropagation()}>
                                {!isReadOnly && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => copyFeature(feature)} className="h-8 w-8 p-0 text-gray-500">
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => removeFeature(feature.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => toggleFeatureExpand(feature.id)} className="h-8 w-8 p-0 text-gray-500">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </Button>
                              </div>
                            </div>

                            {/* Card Body (Expanded State) */}
                            {isExpanded && (
                              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>功能名称 <span className="text-red-500">*</span></Label>
                                      <Input value={feature.name} onChange={e => updateFeature(feature.id, 'name', e.target.value)} placeholder="简短标题（最多20字）" maxLength={20} />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="space-y-2">
                                        <Label>所属模块 <span className="text-red-500">*</span></Label>
                                        <Input value={feature.module} onChange={e => updateFeature(feature.id, 'module', e.target.value)} placeholder="例如：首页、订单" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>功能类型 <span className="text-red-500">*</span></Label>
                                        <div className="flex gap-2">
                                          {['新功能', '功能优化', 'Bug修复'].map(type => (
                                            <Badge
                                              key={type}
                                              variant={feature.featureType === type ? 'default' : 'outline'}
                                              className={isReadOnly ? "cursor-default opacity-70" : "cursor-pointer"}
                                              onClick={() => !isReadOnly && updateFeature(feature.id, 'featureType', type)}
                                            >
                                              {type}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>功能价值 <span className="text-red-500">*</span></Label>
                                        <div className="flex gap-2">
                                          {['高', '中', '低'].map(level => (
                                            <Badge
                                              key={level}
                                              variant={feature.valueLevel === level ? (level === '高' ? 'destructive' : level === '中' ? 'warning' : 'success') : 'outline'}
                                              className={isReadOnly ? "cursor-default opacity-70" : "cursor-pointer"}
                                              onClick={() => !isReadOnly && updateFeature(feature.id, 'valueLevel', level)}
                                            >
                                              {level}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>适用对象</Label>
                                      <Input value={feature.targetUsers.join(', ')} onChange={e => updateFeature(feature.id, 'targetUsers', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="例如：普通用户, 管理员（用逗号分隔）" />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>功能描述 <span className="text-red-500">*</span></Label>
                                      <Textarea value={feature.description} onChange={e => updateFeature(feature.id, 'description', e.target.value)} placeholder="功能的详细介绍..." rows={3} />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2 h-full flex flex-col">
                                    <Label>产品截图（选填）</Label>
                                    <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer p-4 text-center">
                                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                      <span className="text-sm text-gray-500 font-medium">点击上传图片</span>
                                      <span className="text-xs text-gray-400 mt-1">支持 PNG, JPG，最大 5MB</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    
                    {/* Add Feature Button at the bottom of the app group */}
                    <div className="pt-2">
                      <Button variant="outline" onClick={() => handleAddFeature(app)} className="w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 gap-2">
                        <Plus className="w-4 h-4" /> 添加功能
                      </Button>
                    </div>
                  </div>
                </section>
              );
            })}
            
            {/* Add App Group Button at the bottom */}
            {!isReadOnly && (
              <div className="pt-4 relative">
                <Button onClick={() => setShowAppSelector(!showAppSelector)} variant="outline" className="w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 gap-2 py-6">
                  <Plus className="w-5 h-5" /> 添加应用分组
                </Button>
                
                {showAppSelector && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                    {availableApps.length > 0 ? (
                      availableApps.map(app => (
                        <button
                          key={app}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                          onClick={() => handleAddApp(app)}
                        >
                          {app}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">所有应用已添加</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isReadOnly && addedApps.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">暂未添加应用分组</h3>
                <p className="text-gray-500 mt-1 mb-6">请先添加一个应用分组，然后开始录入功能。</p>
                <Button onClick={() => setShowAppSelector(true)}>添加应用分组</Button>
              </div>
            )}

          </fieldset>
        </div>

        {/* Right: Live Preview */}
        <aside className="w-[500px] xl:w-[600px] bg-gray-200 border-l border-gray-300 flex flex-col shrink-0">
          <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> 信息图实时预览
            </span>
            <div className="text-xs text-gray-500">缩放: 适应窗口</div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
            {/* Scaled container to fit the preview panel */}
            <div className="origin-top scale-[0.4] xl:scale-[0.45] transition-transform">
              {/* Infographic Container (Fixed width for consistent rendering) */}
              <div 
                ref={infographicRef}
                className="bg-[#fdfbf7] shadow-2xl overflow-hidden flex flex-col relative"
                style={{ width: '1200px', minHeight: '675px' }}
              >
                {/* Header */}
                <div className="bg-[#FFC72C] text-gray-900 p-10 flex flex-col relative overflow-hidden">
                  {/* Decorative background element */}
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#DA291C] rounded-full opacity-10"></div>
                  <div className="absolute right-10 top-10 w-32 h-32 bg-[#DA291C] rounded-full opacity-5"></div>
                  
                  <div className="relative z-10 flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#DA291C] text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase shadow-sm">
                          {release.scrumTeam}
                        </span>
                        <span className="text-gray-800 font-bold tracking-wider uppercase">产品迭代发布说明</span>
                      </div>
                      <h1 className="text-6xl font-black tracking-tight text-gray-900 drop-shadow-sm">{release.versionNumber || '未命名版本'}</h1>
                    </div>
                  </div>

                  <div className="relative z-10 flex gap-8 text-sm font-bold text-gray-800 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-[#FFC72C]/50 shadow-sm inline-flex w-fit">
                    <div className="flex items-center gap-2">
                      <span className="text-[#DA291C] bg-white px-2 py-1 rounded-md shadow-sm">迭代周期</span>
                      <span className="text-lg">{release.startDate} <span className="text-gray-500 mx-1">至</span> {release.endDate}</span>
                    </div>
                    <div className="w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#DA291C] bg-white px-2 py-1 rounded-md shadow-sm">上线日期</span>
                      <span className="text-lg">{release.releaseDate}</span>
                    </div>
                    <div className="w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#DA291C] bg-white px-2 py-1 rounded-md shadow-sm">发布人</span>
                      <span className="text-lg">{release.publisher || '未指定'}</span>
                    </div>
                  </div>
                </div>

                {/* Summary & Stats */}
                <div className="px-10 py-8 border-b-4 border-[#DA291C] bg-white flex gap-8 items-center">
                  <div className="flex-1">
                    <p className="text-xl text-gray-800 leading-relaxed border-l-4 border-[#DA291C] pl-4 italic font-medium">
                      "{release.summary || '全新版本现已发布，包含多项激动人心的新功能与体验优化。'}"
                    </p>
                  </div>
                  <div className="flex gap-6 shrink-0">
                    <div className="bg-[#fdfbf7] px-6 py-4 rounded-xl shadow-sm border-2 border-[#FFC72C] text-center min-w-[120px]">
                      <div className="text-4xl font-black text-[#DA291C]">{newCount}</div>
                      <div className="text-sm text-gray-600 font-bold mt-1 uppercase tracking-wider">新功能</div>
                    </div>
                    <div className="bg-[#fdfbf7] px-6 py-4 rounded-xl shadow-sm border-2 border-[#FFC72C] text-center min-w-[120px]">
                      <div className="text-4xl font-black text-[#DA291C]">{optCount}</div>
                      <div className="text-sm text-gray-600 font-bold mt-1 uppercase tracking-wider">功能优化</div>
                    </div>
                    <div className="bg-[#fdfbf7] px-6 py-4 rounded-xl shadow-sm border-2 border-[#FFC72C] text-center min-w-[120px]">
                      <div className="text-4xl font-black text-[#DA291C]">{bugCount}</div>
                      <div className="text-sm text-gray-600 font-bold mt-1 uppercase tracking-wider">Bug修复</div>
                    </div>
                  </div>
                </div>

                {/* Features Content */}
                <div className="p-10 flex-1 bg-[#fdfbf7]">
                  {Object.entries(groupedFeatures).map(([appName, modules]) => (
                    <div key={appName} className="mb-12 last:mb-0">
                      <div className="bg-[#FFC72C] text-gray-900 px-6 py-3 rounded-t-xl font-black text-2xl inline-block mb-6 shadow-sm border-b-4 border-[#DA291C]">
                        {appName}
                      </div>
                      
                      <div className="space-y-8">
                        {Object.entries(modules).map(([moduleName, features]) => (
                          <div key={moduleName} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 border-l-8 border-l-[#DA291C]">
                              <h3 className="text-xl font-bold text-gray-800">{moduleName}</h3>
                            </div>
                            <div className={`p-6 grid gap-6 ${features.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {features.map(feature => (
                                <div key={feature.id} className="flex gap-5">
                                  {/* Placeholder for screenshot */}
                                  <div className="w-1/3 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                                    <ImageIcon className="w-10 h-10 text-gray-300" />
                                  </div>
                                  <div className="flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="text-lg font-bold text-gray-900 leading-tight">{feature.name || '未命名功能'}</h4>
                                    </div>
                                    <div className="flex gap-2 shrink-0 mb-2 flex-wrap">
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                                        feature.featureType === '新功能' ? 'bg-red-50 text-[#DA291C] border border-red-100' :
                                        feature.featureType === '功能优化' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                        'bg-green-50 text-green-700 border border-green-100'
                                      }`}>
                                        {feature.featureType}
                                      </span>
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                                        feature.valueLevel === '高' ? 'bg-[#DA291C] text-white' :
                                        feature.valueLevel === '中' ? 'bg-[#FFC72C] text-gray-900' :
                                        'bg-gray-200 text-gray-700'
                                      }`}>
                                        {feature.valueLevel}价值
                                      </span>
                                      {feature.targetUsers.length > 0 && (
                                        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                                          适用对象: {feature.targetUsers.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-sm flex-1">{feature.description || '暂无描述。'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {release.features.length === 0 && (
                    <div className="text-center py-20 text-gray-400 text-xl font-medium">
                      本次发布暂未添加任何功能。
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-900 text-gray-400 px-10 py-6 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#DA291C] rounded-md flex items-center justify-center text-white font-bold">P</div>
                    <span className="font-medium text-white tracking-wider">产品迭代自动发布系统</span>
                  </div>
                  <div>扫描二维码或访问链接查看完整详情</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

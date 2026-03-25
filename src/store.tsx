import React, { createContext, useContext, useState } from 'react';

export type Team = {
  id: string;
  name: string;
  code: string;
  description: string;
};

export type Feature = {
  id: string;
  appName: string;
  name: string;
  module: string;
  valueLevel: '高' | '中' | '低';
  description: string;
  screenshots: string[];
  targetUsers: string[];
  featureType: '新功能' | '功能优化' | 'Bug修复';
  sortOrder: number;
};

export type Release = {
  id: string;
  scrumTeam: string;
  versionNumber: string;
  startDate: string;
  endDate: string;
  releaseDate: string;
  publisher: string;
  summary: string;
  features: Feature[];
  status: '草稿' | '已发布' | '已作废';
  createdAt: string;
};

type AppContextType = {
  teams: Team[];
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  releases: Release[];
  addRelease: (release: Release) => void;
  updateRelease: (release: Release) => void;
  deleteRelease: (id: string) => void;
  currentView: 'teams' | 'list' | 'wizard';
  setCurrentView: (view: 'teams' | 'list' | 'wizard') => void;
  editingRelease: Release | null;
  setEditingRelease: (release: Release | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([
    { id: 't1', name: '增长组', code: 'GROWTH', description: '负责用户增长、拉新、留存等核心业务链路' },
    { id: 't2', name: '商业化组', code: 'MONETIZATION', description: '负责广告投放、变现、会员订阅等商业化产品' },
    { id: 't3', name: '基础架构组', code: 'INFRA', description: '负责底层架构、中间件、稳定性保障' },
    { id: 't4', name: '数据组', code: 'DATA', description: '负责数据中台、BI报表、数据分析工具' }
  ]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  const addTeam = (team: Team) => setTeams(prev => [...prev, team]);
  const updateTeam = (team: Team) => setTeams(prev => prev.map(t => t.id === team.id ? team : t));
  const deleteTeam = (id: string) => setTeams(prev => prev.filter(t => t.id !== id));

  const [releases, setReleases] = useState<Release[]>([
    {
      id: '1',
      scrumTeam: '增长组',
      versionNumber: 'v2.3.0',
      startDate: '2026-01-27',
      endDate: '2026-02-10',
      releaseDate: '2026-02-10',
      publisher: '张三',
      summary: '春节大促核心版本，包含全新首页UI及性能优化。',
      features: [
        {
          id: 'f1',
          appName: 'CDP',
          name: '大促活动横幅',
          module: '首页',
          valueLevel: '高',
          description: '在首页顶部新增春节大促活动横幅，支持动态配置。',
          screenshots: [],
          targetUsers: ['用户'],
          featureType: '新功能',
          sortOrder: 1
        }
      ],
      status: '已发布',
      createdAt: new Date().toISOString()
    }
  ]);
  const [currentView, setCurrentView] = useState<'teams' | 'list' | 'wizard'>('teams');
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);

  const addRelease = (release: Release) => setReleases(prev => [release, ...prev]);
  const updateRelease = (release: Release) => setReleases(prev => prev.map(r => r.id === release.id ? release : r));
  const deleteRelease = (id: string) => setReleases(prev => prev.filter(r => r.id !== id));

  return (
    <AppContext.Provider value={{ 
      teams, addTeam, updateTeam, deleteTeam, currentTeam, setCurrentTeam,
      releases, addRelease, updateRelease, deleteRelease, 
      currentView, setCurrentView, 
      editingRelease, setEditingRelease 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

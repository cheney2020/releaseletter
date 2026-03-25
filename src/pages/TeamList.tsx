import React, { useState } from 'react';
import { useAppContext, Team } from '../store';
import { Button, Card, CardContent, Badge, Input, Textarea, Label } from '../components/ui';
import { Users, ArrowRight, Activity, Plus, Edit, Trash2 } from 'lucide-react';

export const TeamList: React.FC = () => {
  const { teams, releases, setCurrentTeam, setCurrentView, addTeam, updateTeam, deleteTeam } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const handleEnterTeam = (team: Team) => {
    setCurrentTeam(team);
    setCurrentView('list');
  };

  const handleOpenModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setFormData({ name: team.name, code: team.code, description: team.description });
    } else {
      setEditingTeam(null);
      setFormData({ name: '', code: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveTeam = () => {
    if (!formData.name || !formData.code) return;
    
    if (editingTeam) {
      updateTeam({ ...editingTeam, ...formData });
    } else {
      addTeam({
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteTeam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeamToDelete(id);
  };

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete);
      setTeamToDelete(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scrum Team 列表</h1>
          <p className="text-gray-500 mt-1">选择团队以管理其产品迭代发布记录</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          新建团队
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => {
          const teamReleases = releases.filter(r => r.scrumTeam === team.name);
          const publishedReleases = teamReleases.filter(r => r.status === '已发布');
          
          // Find the most recent release
          const lastRelease = publishedReleases.length > 0 
            ? publishedReleases.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0]
            : null;

          return (
            <Card key={team.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 text-[#DA291C] rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{team.code}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal(team); }} className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => handleDeleteTeam(team.id, e)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-6 flex-1">
                  {team.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">总发布迭代数</div>
                    <div className="font-semibold text-gray-900">{teamReleases.filter(r => r.status === '已发布').length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">最近发布</div>
                    <div className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                      {lastRelease ? (
                        <>
                          <Activity className="w-3 h-3 text-green-500" />
                          {lastRelease.releaseDate} ({lastRelease.versionNumber})
                        </>
                      ) : '-'}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleEnterTeam(team)} 
                  className="w-full gap-2"
                  variant="default"
                >
                  进入团队 <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingTeam ? '编辑团队' : '新建团队'}</h2>
            <div className="space-y-4">
              <div>
                <Label>团队名称 <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="例如：增长组"
                />
              </div>
              <div>
                <Label>Team Code <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  placeholder="例如：GROWTH"
                />
              </div>
              <div>
                <Label>描述</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="团队职责描述..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button onClick={handleSaveTeam} disabled={!formData.name || !formData.code}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {teamToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-900">确认删除</h2>
            <p className="text-gray-600 mb-6">确定要删除该团队吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTeamToDelete(null)}>取消</Button>
              <Button variant="destructive" onClick={confirmDeleteTeam}>确认删除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

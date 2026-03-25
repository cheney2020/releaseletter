import React, { useState } from 'react';
import { useAppContext, Release } from '../store';
import { Button, Card, CardContent, Badge, Input } from '../components/ui';
import { Plus, Edit, Trash2, FileText, ArrowLeft, Search, Users, Activity, Ban, Eye, Send } from 'lucide-react';

export const ReleaseList: React.FC = () => {
  const { releases, currentTeam, setCurrentView, setEditingRelease, deleteRelease, updateRelease } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const teamReleases = currentTeam 
    ? releases.filter(r => r.scrumTeam === currentTeam.name)
    : [];

  const filteredReleases = teamReleases
    .filter(r => 
      (r.versionNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.publisher || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  const handleCreate = () => {
    setEditingRelease(null);
    setCurrentView('wizard');
  };

  const handleEdit = (release: Release) => {
    setEditingRelease(release);
    setCurrentView('wizard');
  };

  const handleView = (release: Release) => {
    setEditingRelease(release);
    setCurrentView('wizard');
  };

  const handlePublish = (release: Release) => {
    updateRelease({ ...release, status: '已发布' });
  };

  const handleVoid = (release: Release) => {
    if (window.confirm(`确定要作废版本 ${release.versionNumber} 吗？作废后不可恢复。`)) {
      updateRelease({ ...release, status: '已作废' });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('teams')} className="gap-2 text-gray-500 hover:text-gray-900 -ml-3">
          <ArrowLeft className="w-4 h-4" /> 返回团队列表
        </Button>
      </div>
      
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-red-50 text-[#DA291C] rounded-xl flex items-center justify-center shrink-0 mt-1">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{currentTeam?.name || '所有团队'}</h1>
              {currentTeam?.code && (
                <span className="text-sm font-mono bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200">
                  {currentTeam.code}
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-2 max-w-2xl">{currentTeam?.description || '管理该团队的产品迭代发布记录'}</p>
            
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="font-medium text-gray-700">总迭代数:</span> 
                {teamReleases.length}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span className="font-medium text-gray-700">最近上线:</span> 
                {teamReleases.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-green-500" />
                    {[...teamReleases].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0].releaseDate}
                  </span>
                ) : '暂无发布'}
              </div>
            </div>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          新建发布
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="搜索版本号、发布人或概述..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {filteredReleases.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">暂无发布记录</h3>
            <p className="text-gray-500 mt-1 mb-4">没有找到匹配的迭代发布记录。</p>
            {searchTerm === '' && <Button onClick={handleCreate}>创建发布</Button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">版本号</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">状态</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">发布日期</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">发布人</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">功能数</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">迭代概述</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReleases.map(release => (
                  <tr key={release.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{release.versionNumber || '未命名版本'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={release.status === '已发布' ? 'success' : release.status === '已作废' ? 'destructive' : 'secondary'}>
                        {release.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{release.releaseDate}</td>
                    <td className="px-6 py-4 text-gray-600">{release.publisher || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{release.features.length}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={release.summary}>
                      {release.summary || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {release.status === '草稿' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handlePublish(release)} className="text-green-600 hover:text-green-700 hover:bg-green-50" title="发布">
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(release)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="编辑">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteRelease(release.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50" title="删除">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {release.status === '已发布' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleView(release)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="查看">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleVoid(release)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" title="作废">
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {release.status === '已作废' && (
                          <Button variant="ghost" size="sm" onClick={() => handleView(release)} className="text-gray-600 hover:text-gray-700 hover:bg-gray-50" title="查看详情">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

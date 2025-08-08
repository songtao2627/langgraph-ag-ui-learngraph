/**
 * Advanced Conversation Sidebar
 * Features search, categorization, and smart organization
 */

import { useState, useMemo } from 'react';
import type { FC } from 'react';
import type { Conversation } from '../../types/chat';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  className?: string;
}

type SortOption = 'recent' | 'alphabetical' | 'length' | 'date';
type FilterOption = 'all' | 'today' | 'week' | 'month';

export const ConversationSidebar: FC<ConversationSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Generate conversation title from first message
  const getConversationTitle = (conversation: Conversation): string => {
    const firstUserMessage = conversation.messages.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return `对话 ${conversation.id.slice(0, 8)}`;
  };

  // Filter conversations by date
  const filterConversations = (conversations: Conversation[]): Conversation[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return conversations.filter(conv => {
      const convDate = new Date(conv.updated_at);
      switch (filterBy) {
        case 'today':
          return convDate >= today;
        case 'week':
          return convDate >= weekAgo;
        case 'month':
          return convDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Sort and filter conversations
  const processedConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => {
        const title = getConversationTitle(conv);
        const content = conv.messages.map(msg => msg.content).join(' ');
        return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               content.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Apply date filter
    filtered = filterConversations(filtered);

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'alphabetical':
          return getConversationTitle(a).localeCompare(getConversationTitle(b));
        case 'length':
          return b.messages.length - a.messages.length;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [conversations, searchQuery, sortBy, filterBy]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: Conversation[] } = {};
    
    processedConversations.forEach(conv => {
      const date = new Date(conv.updated_at);
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = '今天';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = '昨天';
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        groupKey = '本周';
      } else if (date.getTime() > today.getTime() - 30 * 24 * 60 * 60 * 1000) {
        groupKey = '本月';
      } else {
        groupKey = '更早';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conv);
    });
    
    return groups;
  }, [processedConversations]);

  // Handle conversation rename
  const handleRename = (id: string, title: string) => {
    onRenameConversation?.(id, title);
    setEditingId(null);
    setEditingTitle('');
  };

  if (isCollapsed) {
    return (
      <div className={`w-16 bg-white/80 backdrop-blur-sm border-r border-gray-200 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center mb-4"
        >
          <span className="text-lg">📋</span>
        </button>
        
        <button
          onClick={onNewConversation}
          className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center"
        >
          <span className="text-lg">➕</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">对话历史</h2>
          <div className="flex gap-2">
            <button
              onClick={onNewConversation}
              className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center"
            >
              <span className="text-sm">➕</span>
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center"
            >
              <span className="text-sm">◀</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索对话..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 px-3 py-1 text-sm bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">最近更新</option>
            <option value="alphabetical">按标题</option>
            <option value="length">按长度</option>
            <option value="date">按创建时间</option>
          </select>
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="flex-1 px-3 py-1 text-sm bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>

        {/* Stats */}
        <div className="text-xs text-gray-500">
          共 {conversations.length} 个对话，显示 {processedConversations.length} 个
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {Object.entries(groupedConversations).map(([groupName, groupConversations]) => (
          <div key={groupName} className="mb-4">
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              {groupName} ({groupConversations.length})
            </div>
            
            {groupConversations.map((conversation) => {
              const isActive = conversation.id === currentConversationId;
              const title = getConversationTitle(conversation);
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              const isEditing = editingId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={`group relative mx-2 mb-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    onClick={() => !isEditing && onSelectConversation(conversation.id)}
                    className="p-3 cursor-pointer"
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleRename(conversation.id, editingTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(conversation.id, editingTitle);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingTitle('');
                          }
                        }}
                        className="w-full bg-transparent border-none outline-none text-sm font-medium"
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-medium line-clamp-1 ${
                            isActive ? 'text-white' : 'text-gray-800'
                          }`}>
                            {title}
                          </h3>
                          <span className={`text-xs ${
                            isActive ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {conversation.messages.length}
                          </span>
                        </div>
                        
                        {lastMessage && (
                          <p className={`text-xs line-clamp-2 ${
                            isActive ? 'text-white/80' : 'text-gray-600'
                          }`}>
                            {lastMessage.content}
                          </p>
                        )}
                        
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          isActive ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          <span>
                            {new Date(conversation.updated_at).toLocaleDateString('zh-CN')}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full" />
                            <span>完成</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!isEditing && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(conversation.id);
                          setEditingTitle(title);
                        }}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                        }`}
                      >
                        ✏️
                      </button>
                      
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定要删除这个对话吗？')) {
                              onDeleteConversation(conversation.id);
                            }
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                            isActive
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-white'
                              : 'bg-red-100 hover:bg-red-200 text-red-600'
                          }`}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {processedConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <span className="text-4xl mb-4">💬</span>
            <p className="text-sm text-center">
              {searchQuery ? '没有找到匹配的对话' : '还没有对话记录'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewConversation}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                开始新对话
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
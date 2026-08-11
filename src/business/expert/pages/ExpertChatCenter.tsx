import { useState } from 'react'
import { PageShell, PageHeader, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard } from '../../../components/widgets'
import expertMock from '../mock'
import { formatRelativeTime } from '../utils/helpers'

export function ExpertChatCenter() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(expertMock.chatEnterprises[0]?.enterpriseId || null)
  const [messageInput, setMessageInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const { chatEnterprises, chatMessages } = expertMock

  const filteredEnterprises = searchKeyword
    ? chatEnterprises.filter(e => e.enterpriseName.includes(searchKeyword))
    : chatEnterprises

  const currentMessages = selectedEnterprise ? (chatMessages[selectedEnterprise] || []) : []
  const currentEnterprise = chatEnterprises.find(e => e.enterpriseId === selectedEnterprise)

  const handleSend = () => {
    if (!messageInput.trim()) return
    alert(`Demo: 发送消息 - ${messageInput}`)
    setMessageInput('')
  }

  const quickReplies = ['请尽快整改', '已安排复核', '收到，稍后处理']

  return (
    <PageShell maxWidth="wide">
      <PageHeader title="沟通中心" subtitle="与安管员即时沟通" />

      <SectionBlock>
        <div className="card overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* 左侧：企业对话列表 */}
            <div className="w-72 border-r border-border flex flex-col shrink-0">
              {/* 搜索框 */}
              <div className="p-3 border-b border-border">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  placeholder="搜索企业..."
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* 列表 */}
              <div className="flex-1 overflow-y-auto">
                {filteredEnterprises.map(ent => {
                  const isActive = selectedEnterprise === ent.enterpriseId
                  return (
                    <button
                      key={ent.enterpriseId}
                      onClick={() => setSelectedEnterprise(ent.enterpriseId)}
                      className={`w-full text-left p-3 border-b border-border transition-colors ${isActive ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text truncate">{ent.enterpriseName}</span>
                        {ent.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center font-medium">{ent.unreadCount}</span>
                        )}
                      </div>
                      <div className="text-xs text-text-tertiary truncate">{ent.lastMessage}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-text-tertiary">{ent.safetyOfficerName}</span>
                        <span className="text-xs text-text-tertiary">{formatRelativeTime(ent.lastMessageTime)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 右侧：对话内容区 */}
            <div className="flex-1 flex flex-col">
              {currentEnterprise ? (
                <>
                  {/* 对话头部 */}
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                      <span className="font-medium text-text">{currentEnterprise.enterpriseName}</span>
                      <span className="text-xs text-text-tertiary ml-2">{currentEnterprise.safetyOfficerName}</span>
                    </div>
                  </div>

                  {/* 消息列表 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentMessages.map(msg => {
                      const isExpert = msg.senderType === 'expert'
                      const isSystem = msg.senderType === 'system'

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center">
                            <div className="px-4 py-2 bg-slate-50 rounded-full text-xs text-text-tertiary">
                              {msg.content}
                              {msg.relatedHazardId && <span className="text-primary ml-1">关联隐患: {msg.relatedHazardId}</span>}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={msg.id} className={`flex ${isExpert ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isExpert ? 'order-2' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-text-tertiary">{msg.senderName}</span>
                              <span className="text-xs text-text-tertiary">{formatRelativeTime(msg.sentAt)}</span>
                            </div>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm ${isExpert ? 'bg-primary text-white rounded-br-md' : 'bg-slate-100 text-text rounded-bl-md'}`}>
                              {msg.content}
                            </div>
                            {msg.relatedHazardId && (
                              <div className="mt-1">
                                <span className="text-xs text-primary">关联隐患: {msg.relatedHazardId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 输入区 */}
                  <div className="p-4 border-t border-border">
                    {/* 快捷回复 */}
                    <div className="flex gap-2 mb-3">
                      {quickReplies.map(reply => (
                        <button
                          key={reply}
                          onClick={() => setMessageInput(reply)}
                          className="px-3 py-1 text-xs text-text-secondary bg-slate-50 border border-border rounded-full hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-end gap-3">
                      <textarea
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                        placeholder="输入消息..."
                        rows={1}
                        className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!messageInput.trim()}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 shrink-0"
                      >
                        发送
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-tertiary">
                  选择一家企业开始对话
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionBlock>
    </PageShell>
  )
}

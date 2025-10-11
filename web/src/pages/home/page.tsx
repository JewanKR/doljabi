
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'omok' | 'baduk'>('omok');
  const [activeMode, setActiveMode] = useState<'single' | 'multi'>('single');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: '#2a2a33' }}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ 
                 background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
                 boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)'
               }}>
            <i className="ri-game-fill text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Doljabi
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap border"
            style={{ 
              backgroundColor: '#141822', 
              borderColor: '#2a2a33',
              color: '#e8eaf0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8ab4f8';
              e.currentTarget.style.color = '#8ab4f8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a33';
              e.currentTarget.style.color = '#e8eaf0';
            }}
          >
            로그인
          </button>
          <button 
            onClick={() => setShowSignupModal(true)}
            className="px-6 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap text-white"
            style={{ 
              background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            회원가입
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-88px)] p-8">
        <div className="w-full max-w-4xl">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              돌잡이에 오신 것을 환영합니다
            </h2>
            <p className="text-xl" style={{ color: '#9aa1ad' }}>
              AI와의 대전부터 실시간 멀티플레이까지,<br />
              오목과 바둑의 모든 것을 경험하세요
            </p>
          </div>

          {/* Dynamic Game Board Image */}
          <div className="mb-8">
            <img 
              src="https://readdy.ai/api/search-image?query=Traditional%20Korean%20Go%20Baduk%20game%20board%20with%20black%20and%20white%20stones%20strategically%20placed%20on%20wooden%20board%2C%20top%20view%20perspective%2C%20warm%20natural%20lighting%2C%20professional%20photography%20style%2C%20minimalist%20clean%20background%2C%20high%20quality%20detail%20rendering%2C%202D%20flat%20design%20aesthetic%2C%20traditional%20wooden%20texture%20with%20grain%20patterns%2C%20classic%20oriental%20board%20game%20setup%20with%20scattered%20stones%20showing%20ongoing%20game&width=800&height=400&seq=baduk-traditional-home-v14&orientation=landscape"
              alt="바둑판 이미지"
              className="w-full h-64 object-cover rounded-2xl"
              style={{ 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}
            />
          </div>

          {/* Game Selection Tabs */}
          <div className="flex justify-center mb-6">
            <div className="flex rounded-xl p-1 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33'
                 }}>
              <button
                onClick={() => setActiveTab('omok')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'omok' ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: activeTab === 'omok' ? '#1f6feb' : 'transparent',
                  color: activeTab === 'omok' ? '#ffffff' : '#9aa1ad',
                  boxShadow: activeTab === 'omok' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
                }}
              >
                <i className="ri-game-fill text-xl"></i>
                <span>오목</span>
              </button>
              <button
                onClick={() => setActiveTab('baduk')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'baduk' ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: activeTab === 'baduk' ? '#1f6feb' : 'transparent',
                  color: activeTab === 'baduk' ? '#ffffff' : '#9aa1ad',
                  boxShadow: activeTab === 'baduk' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
                }}
              >
                <i className="ri-grid-line text-xl"></i>
                <span>바둑</span>
              </button>
            </div>
          </div>

          {/* Game Mode Selection - Thin style matching game options width */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-4xl">
              <div className="flex rounded-lg p-1 border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.6)', 
                     borderColor: '#2a2a33',
                     height: '48px'
                   }}>
                <button
                  onClick={() => setActiveMode('single')}
                  className={`flex-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center space-x-2 ${
                    activeMode === 'single' ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: activeMode === 'single' ? '#6b7280' : 'transparent',
                    color: activeMode === 'single' ? '#ffffff' : '#9aa1ad',
                    boxShadow: activeMode === 'single' ? '0 2px 8px rgba(107, 114, 128, 0.3)' : 'none'
                  }}
                >
                  <i className="ri-robot-fill text-lg"></i>
                  <span>싱글 플레이</span>
                </button>
                <button
                  onClick={() => setActiveMode('multi')}
                  className={`flex-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center space-x-2 ${
                    activeMode === 'multi' ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: activeMode === 'multi' ? '#6b7280' : 'transparent',
                    color: activeMode === 'multi' ? '#ffffff' : '#9aa1ad',
                    boxShadow: activeMode === 'multi' ? '0 2px 8px rgba(107, 114, 128, 0.3)' : 'none'
                  }}
                >
                  <i className="ri-team-fill text-lg"></i>
                  <span>멀티 플레이</span>
                </button>
              </div>
            </div>
          </div>

          {/* Game Options - Always show all options with shadow effect */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* AI 대전 */}
            <div 
              onClick={() => navigate(`/${activeTab}/single-play`)}
              className={`rounded-2xl p-6 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 ${
                activeMode !== 'single' ? 'opacity-30 pointer-events-none' : ''
              }`}
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: activeMode === 'single' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.6)',
                filter: activeMode !== 'single' ? 'grayscale(50%)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeMode === 'single') {
                  e.currentTarget.style.borderColor = '#8ab4f8';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMode === 'single') {
                  e.currentTarget.style.borderColor = '#2a2a33';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                }
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <i className="ri-robot-fill text-3xl" style={{ color: '#8ab4f8' }}></i>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#e8eaf0' }}>AI 대전</h3>
                <p className="text-sm" style={{ color: '#9aa1ad' }}>
                  컴퓨터와 대결하며 실력을 키워보세요
                </p>
              </div>
            </div>

            {/* 빠른 대국 */}
            <div 
              onClick={() => navigate(`/${activeTab}/quick-match`)}
              className={`rounded-2xl p-6 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 ${
                activeMode !== 'multi' ? 'opacity-30 pointer-events-none' : ''
              }`}
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: activeMode === 'multi' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.6)',
                filter: activeMode !== 'multi' ? 'grayscale(50%)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeMode === 'multi') {
                  e.currentTarget.style.borderColor = '#8ab4f8';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMode === 'multi') {
                  e.currentTarget.style.borderColor = '#2a2a33';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                }
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <i className="ri-flashlight-fill text-3xl" style={{ color: '#8ab4f8' }}></i>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#e8eaf0' }}>빠른 대국</h3>
                <p className="text-sm" style={{ color: '#9aa1ad' }}>
                  랜덤 매칭으로 즉시 게임 시작
                </p>
              </div>
            </div>

            {/* 방 만들기 */}
            <div 
              onClick={() => navigate(`/${activeTab}/create-room`)}
              className={`rounded-2xl p-6 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 ${
                activeMode !== 'multi' ? 'opacity-30 pointer-events-none' : ''
              }`}
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: activeMode === 'multi' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.6)',
                filter: activeMode !== 'multi' ? 'grayscale(50%)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeMode === 'multi') {
                  e.currentTarget.style.borderColor = '#8ab4f8';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMode === 'multi') {
                  e.currentTarget.style.borderColor = '#2a2a33';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                }
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <i className="ri-add-circle-fill text-3xl" style={{ color: '#8ab4f8' }}></i>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#e8eaf0' }}>방 만들기</h3>
                <p className="text-sm" style={{ color: '#9aa1ad' }}>
                  친구와 함께 플레이할 방을 생성
                </p>
              </div>
            </div>

            {/* 방 입장 */}
            <div 
              onClick={() => navigate(`/${activeTab}/join-room`)}
              className={`rounded-2xl p-6 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 ${
                activeMode !== 'multi' ? 'opacity-30 pointer-events-none' : ''
              }`}
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: activeMode === 'multi' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.6)',
                filter: activeMode !== 'multi' ? 'grayscale(50%)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeMode === 'multi') {
                  e.currentTarget.style.borderColor = '#8ab4f8';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMode === 'multi') {
                  e.currentTarget.style.borderColor = '#2a2a33';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                }
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <i className="ri-door-open-fill text-3xl" style={{ color: '#8ab4f8' }}></i>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#e8eaf0' }}>방 입장</h3>
                <p className="text-sm" style={{ color: '#9aa1ad' }}>
                  방 코드로 친구의 방에 참여
                </p>
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="mt-12 text-center">
            <div className="rounded-2xl p-8 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#e8eaf0' }}>
                {activeTab === 'omok' ? '오목' : '바둑'}에 대해
              </h3>
              <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: '#9aa1ad' }}>
                {activeTab === 'omok' 
                  ? '오목은 19×19 바둑판에서 흑돌과 백돌을 번갈아 놓아,\n먼저 5개의 돌을 일직선으로 연결하는 사람이 승리하는 게임입니다.'
                  : '바둑은 19×19 바둑판에서 흑돌과 백돌을 번갈아 놓아,\n상대방보다 더 많은 집을 차지하는 것이 목표인 전략 게임입니다.'
                }
              </p>
            </div>
          </div>

          {/* Login Modal */}
          {showLoginModal && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="rounded-2xl p-8 w-full max-w-md border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.9)', 
                     borderColor: '#2a2a33',
                     boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                   }}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#e8eaf0' }}>로그인</h3>
                  <p style={{ color: '#9aa1ad' }}>돌잡이에 오신 것을 환영합니다</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      이메일
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      비밀번호
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button 
                    className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                    style={{ 
                      background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    로그인
                  </button>
                  <button 
                    onClick={() => setShowLoginModal(false)}
                    className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                    style={{ 
                      backgroundColor: '#141822', 
                      borderColor: '#2a2a33',
                      color: '#e8eaf0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8ab4f8';
                      e.currentTarget.style.color = '#8ab4f8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a33';
                      e.currentTarget.style.color = '#e8eaf0';
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Signup Modal */}
          {showSignupModal && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="rounded-2xl p-8 w-full max-w-md border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.9)', 
                     borderColor: '#2a2a33',
                     boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                   }}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#e8eaf0' }}>회원가입</h3>
                  <p style={{ color: '#9aa1ad' }}>새로운 계정을 만들어보세요</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      닉네임
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="닉네임을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      이메일
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      비밀번호
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="비밀번호를 다시 입력하세요"
                    />
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button 
                    className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                    style={{ 
                      background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    회원가입
                  </button>
                  <button 
                    onClick={() => setShowSignupModal(false)}
                    className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                    style={{ 
                      backgroundColor: '#141822', 
                      borderColor: '#2a2a33',
                      color: '#e8eaf0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8ab4f8';
                      e.currentTarget.style.color = '#8ab4f8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a33';
                      e.currentTarget.style.color = '#e8eaf0';
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

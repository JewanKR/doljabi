
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameSettings {
  useMainTime: boolean;
  mainTime: number;
  useAdditionalTime: boolean;
  additionalTime: number;
  useByoyomiTime: boolean;
  byoyomiTime: number;
  useByoyomiCount: boolean;
  byoyomiCount: number;
}

interface Room {
  id: string;
  roomCode: string;
  hostName: string;
  hostRating: string;
  playerCount: number;
  maxPlayers: number;
  gameType: string;
  status: 'waiting' | 'playing';
  createdAt: Date;
  gameSettings: GameSettings;
}

export default function OmokJoinRoom() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // 예시 방 목록 데이터 (10개로 확장)
  const rooms: Room[] = [
    { 
      id: '1', 
      roomCode: 'ABC123', 
      hostName: '오목마스터', 
      hostRating: '1단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '친선전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 600,
        useAdditionalTime: true,
        additionalTime: 30,
        useByoyomiTime: true,
        byoyomiTime: 30,
        useByoyomiCount: true,
        byoyomiCount: 3
      }
    },
    { 
      id: '2', 
      roomCode: 'DEF456', 
      hostName: '5목달인', 
      hostRating: '2단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '연습전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 900,
        useAdditionalTime: false,
        additionalTime: 0,
        useByoyomiTime: true,
        byoyomiTime: 60,
        useByoyomiCount: true,
        byoyomiCount: 5
      }
    },
    { 
      id: '3', 
      roomCode: 'GHI789', 
      hostName: '오목고수', 
      hostRating: '3단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '친선전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      gameSettings: {
        useMainTime: false,
        mainTime: 0,
        useAdditionalTime: true,
        additionalTime: 60,
        useByoyomiTime: true,
        byoyomiTime: 30,
        useByoyomiCount: false,
        byoyomiCount: 0
      }
    },
    { 
      id: '4', 
      roomCode: 'JKL012', 
      hostName: '연승왕', 
      hostRating: '4단',
      playerCount: 2, 
      maxPlayers: 2, 
      gameType: '연습전', 
      status: 'playing',
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 1200,
        useAdditionalTime: true,
        additionalTime: 45,
        useByoyomiTime: true,
        byoyomiTime: 45,
        useByoyomiCount: true,
        byoyomiCount: 3
      }
    },
    { 
      id: '5', 
      roomCode: 'MNO345', 
      hostName: '바둑신동', 
      hostRating: '5단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '친선전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 1800,
        useAdditionalTime: true,
        additionalTime: 60,
        useByoyomiTime: true,
        byoyomiTime: 60,
        useByoyomiCount: true,
        byoyomiCount: 5
      }
    },
    { 
      id: '6', 
      roomCode: 'PQR678', 
      hostName: '돌잡이', 
      hostRating: '2단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '연습전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 600,
        useAdditionalTime: false,
        additionalTime: 0,
        useByoyomiTime: true,
        byoyomiTime: 30,
        useByoyomiCount: true,
        byoyomiCount: 3
      }
    },
    { 
      id: '7', 
      roomCode: 'STU901', 
      hostName: '오목천재', 
      hostRating: '6단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '친선전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 35 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 900,
        useAdditionalTime: true,
        additionalTime: 30,
        useByoyomiTime: true,
        byoyomiTime: 45,
        useByoyomiCount: true,
        byoyomiCount: 4
      }
    },
    { 
      id: '8', 
      roomCode: 'VWX234', 
      hostName: '흑백고수', 
      hostRating: '3단',
      playerCount: 2, 
      maxPlayers: 2, 
      gameType: '연습전', 
      status: 'playing',
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 1200,
        useAdditionalTime: true,
        additionalTime: 45,
        useByoyomiTime: true,
        byoyomiTime: 60,
        useByoyomiCount: true,
        byoyomiCount: 3
      }
    },
    { 
      id: '9', 
      roomCode: 'YZA567', 
      hostName: '돌놓기왕', 
      hostRating: '4단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '친선전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 1500,
        useAdditionalTime: true,
        additionalTime: 60,
        useByoyomiTime: true,
        byoyomiTime: 30,
        useByoyomiCount: true,
        byoyomiCount: 5
      }
    },
    { 
      id: '10', 
      roomCode: 'BCD890', 
      hostName: '오목달인', 
      hostRating: '7단',
      playerCount: 1, 
      maxPlayers: 2, 
      gameType: '연습전', 
      status: 'waiting',
      createdAt: new Date(Date.now() - 50 * 60 * 1000),
      gameSettings: {
        useMainTime: true,
        mainTime: 2400,
        useAdditionalTime: true,
        additionalTime: 90,
        useByoyomiTime: true,
        byoyomiTime: 60,
        useByoyomiCount: true,
        byoyomiCount: 3
      }
    },
  ];

  const handleJoinRoom = (targetRoomCode?: string, room?: Room) => {
    const codeToJoin = targetRoomCode || roomCode;
    
    if (!codeToJoin.trim()) {
      setError('방 입장 코드를 입력해주세요.');
      return;
    }
    
    navigate(`/omok/waiting-room/${codeToJoin}`, { 
      state: { 
        roomCode: codeToJoin, 
        isHost: false 
      } 
    });
  };

  const handleDirectCodeJoin = () => {
    handleJoinRoom();
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return '#22c55e';
      case 'playing':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return '대기중';
      case 'playing':
        return '게임중';
      default:
        return '알 수 없음';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };

  return (
    <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>방 입장</h1>
          <p style={{ color: '#9aa1ad' }}>입장 코드를 입력하거나 생성된 방 목록에서 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 입장 코드 입력 */}
          <div className="rounded-xl p-8 border h-fit"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33'
               }}>
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#e8eaf0' }}>입장 코드 입력</h3>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg border"
                   style={{ 
                     backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                     borderColor: '#ef4444',
                     color: '#ef4444'
                   }}>
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: '#e8eaf0' }}>
                방 입장 코드
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="ABC123"
                className="w-full px-4 py-4 rounded-lg border text-xl text-center font-bold tracking-wider"
                style={{ 
                  backgroundColor: '#141822', 
                  borderColor: '#2a2a33',
                  color: '#e8eaf0'
                }}
                maxLength={6}
              />
            </div>

            <button 
              onClick={handleDirectCodeJoin}
              className="w-full py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
              style={{ 
                background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
              방 입장하기
            </button>
          </div>

          {/* 방 목록 */}
          <div className="lg:col-span-2 rounded-xl p-8 border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33'
               }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#e8eaf0' }}>생성된 방 목록</h2>
            
            {/* 6개씩 표시되도록 높이 조정 */}
            <div className="overflow-y-auto pr-2" 
                 style={{ 
                   height: '480px', // 6개 방이 딱 맞는 높이
                   scrollbarWidth: 'thin', 
                   scrollbarColor: '#2a2a33 transparent' 
                 }}>
              <div className="grid gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className={`rounded-lg p-6 border cursor-pointer transition-all ${
                      selectedRoom?.id === room.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      backgroundColor: '#141822',
                      borderColor: selectedRoom?.id === room.id ? '#1f6feb' : '#2a2a33',
                      boxShadow: selectedRoom?.id === room.id ? '0 0 20px rgba(31, 111, 235, 0.3)' : 'none',
                      height: '72px' // 각 방 카드의 고정 높이
                    }}
                  >
                    <div className="flex items-center justify-between h-full">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-1">
                          <div className="font-bold text-base" style={{ color: '#e8eaf0' }}>
                            {room.roomCode}
                          </div>
                          <div
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: getStatusColor(room.status),
                              color: '#ffffff'
                            }}
                          >
                            {getStatusText(room.status)}
                          </div>
                          <div className="text-sm" style={{ color: '#9aa1ad' }}>
                            {room.playerCount}/{room.maxPlayers}명
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm" style={{ color: '#9aa1ad' }}>방장:</span>
                            <span className="font-semibold text-sm" style={{ color: '#e8eaf0' }}>
                              {room.hostName}
                            </span>
                            <span className="text-sm" style={{ color: '#9aa1ad' }}>
                              (레이팅: {room.hostRating === '1단' ? '1500' : room.hostRating === '2단' ? '1600' : room.hostRating === '3단' ? '1700' : room.hostRating === '4단' ? '1800' : room.hostRating === '5단' ? '1900' : room.hostRating === '6단' ? '2000' : '2100'})
                            </span>
                          </div>
                          <div className="text-base" style={{ color: '#9aa1ad' }}>
                            생성: {getTimeAgo(room.createdAt)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinRoom(room.roomCode, room);
                        }}
                        disabled={room.status !== 'waiting'}
                        className="px-6 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-sm"
                        style={{
                          backgroundColor: room.status === 'waiting' ? '#22c55e' : '#2a2a33',
                          color: '#ffffff',
                          opacity: room.status === 'waiting' ? 1 : 0.5,
                          cursor: room.status === 'waiting' ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {room.status === 'waiting' ? '입장' : '불가'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-12" style={{ color: '#9aa1ad' }}>
                생성된 방이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
            style={{ 
              backgroundColor: '#141822', 
              borderColor: '#2a2a33',
              color: '#e8eaf0'
            }}>
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

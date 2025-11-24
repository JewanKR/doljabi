import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OmokCreateRoom() {
  const navigate = useNavigate();

  useEffect(() => {
    async function createRoom() {
      try {
        const res = await fetch('/api/room/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            game_type: "omok",
            game_config: {
              main_time: 0,
              fischer_time: 0,
              overtime: 0,
              remaining_overtime: 0
            }
          })
        });

        if (!res.ok) {
          throw new Error("방 생성 실패");
        }

        const data = await res.json();
        const { enter_code } = data;

        // 방 입장 코드만 URL에 붙여서 waiting-room 으로 이동
        navigate(`/omok/waiting-room?enterCode=${enter_code}`);

      } catch (err) {
        console.error(err);
        alert("방 생성에 실패했습니다.");
      }
    }

    createRoom();
  }, [navigate]);

  return null;
}

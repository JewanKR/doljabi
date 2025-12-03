import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 중요: 데이터가 1분 동안은 "신선하다"고 간주함 (불필요한 재요청 방지)
      staleTime: 1000 * 60 * 1, 
      
      // API 실패 시 1번만 더 시도 (기본값은 3번이라 너무 많음)
      retry: 3,
      
      // 창에 포커스될 때 자동 재요청 (취향에 따라 false로 꺼도 됨)
      refetchOnWindowFocus: true, 
    },
  },
});

export default function App() {
  return (
    // 2. 앱 전체를 Provider로 감싸기
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={__BASE_PATH__}>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
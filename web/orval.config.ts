import { defineConfig } from "orval";

export default defineConfig({
  "petstore-file": {
    input: "./openapi.json",
    output: {
      mode: "tags-split", // API 태그별로 폴더를 나눠서 정리해줍니다 (추천)
      target: "./src/api/endpoints", // 생성된 파일이 저장될 경로
      schemas: "./src/api/model", // DTO/Type 정의만 따로 모을 경로
      client: "react-query", // React Query 훅을 생성하라는 옵션
      mock: true, // MSW용 Mock 데이터도 필요하면 true (선택)
      prettier: true, // 생성 후 코드를 예쁘게 정렬

      override: {
        mutator: {
          path: "./src/api/axios-instance.ts", // 내가 만든 커스텀 Axios 경로
          name: "customInstance", // 그 파일에서 export한 함수 이름
        },

        // React Query 생성 옵션 제어
        query: {
          // useQuery 훅 생성 (읽기 전용 API)
          useQuery: true,

          // useInfiniteQuery 훅 생성 (무한 스크롤 필요할 때 true)
          useInfinite: false,

          // Suspense 모드 사용 시 (React 18+ 최신 기능 사용 시 true)
          useSuspenseQuery: false,

          signal: true,

          // 에러 발생 시 데이터 타입을 any가 아닌 AxiosError로 명시
          options: {
            // 여기에 공통으로 넣고 싶은 쿼리 옵션이 있다면 추가 가능
          },
        },
      },
    },
  },
});

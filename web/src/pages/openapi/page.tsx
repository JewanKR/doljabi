import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import openapiSpec from './openapi.json';

export default function OpenApiDocs() {
  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <SwaggerUI spec={openapiSpec} />
    </div>
  );
}

/** openapi 명세 페이지 만들기
 * 
 * /src/router/config.tsx 파일에 붙여 넣기
 {
    path: '/openapi',
    element: <OpenApiDocs />,
  },
 *
 */
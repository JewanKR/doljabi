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
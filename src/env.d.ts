/// <reference types="@rsbuild/core/types" />

// 다음(카카오) 우편번호 API 타입 선언
interface DaumPostcodeData {
   zonecode: string;    // 우편번호
   roadAddress: string; // 도로명 주소
   jibunAddress: string; // 지번 주소
   buildingName: string; // 건물명
   apartment: 'Y' | 'N'; // 공동주택 여부
}

interface DaumPostcodeOptions {
   oncomplete: (data: DaumPostcodeData) => void;
   width?: number;
   height?: number;
}

interface DaumPostcode {
   new (options: DaumPostcodeOptions): { open: () => void };
}

interface Window {
   daum?: {
      Postcode: DaumPostcode;
   };
}

/**
 * Imports the SVG file as a URL string.
 */
declare module '*.svg' {
  const src: string;
  export default src;
}

/**
 * Imports the SVG file as a React component.
 * @requires [@rsbuild/plugin-svgr](https://npmjs.com/package/@rsbuild/plugin-svgr)
 */
declare module '*.svg?react' {
  import type React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

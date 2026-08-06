// 构建版本号：astro.config.mjs 在构建时通过 vite define 注入 __BUILD_ID__。
// 服务端经 /api/version 返回，页面渲染成 <meta name="build-id">，
// 客户端轮询比对两者，发现新部署即自动刷新页面。
declare const __BUILD_ID__: string;

export const BUILD_ID: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

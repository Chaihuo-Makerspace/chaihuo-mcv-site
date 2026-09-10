export type SceneId = 'science' | 'industry' | 'maker' | 'education';

export const SCENES: readonly [SceneId, SceneId, SceneId, SceneId];
export const DEFAULT_SCENE: SceneId;
export const SCENE_LABELS: {
  readonly zh: Readonly<Record<SceneId, string>>;
  readonly en: Readonly<Record<SceneId, string>>;
};

export function isSceneId(value: unknown): value is SceneId;
export function sceneLabel(locale: 'zh' | 'en', id: SceneId): string;

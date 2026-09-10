/** @typedef {'science' | 'industry' | 'maker' | 'education'} SceneId */

/**
 * Journal 场景 — one schema for /journals cards and /route map chips.
 * Source of truth is the diary (`category` on yuque-journals + overrides).
 * Stops do not author this field.
 */
export const SCENES = Object.freeze(
  /** @type {const} */ (['science', 'industry', 'maker', 'education']),
);

export const DEFAULT_SCENE = /** @type {SceneId} */ ('science');

export const SCENE_LABELS = Object.freeze({
  zh: Object.freeze({
    science: '科普',
    industry: '产业',
    maker: '创客社区',
    education: '教育',
  }),
  en: Object.freeze({
    science: 'STEM',
    industry: 'Industry',
    maker: 'Maker community',
    education: 'Education',
  }),
});

/** @param {unknown} value @returns {value is SceneId} */
export function isSceneId(value) {
  return typeof value === 'string' && SCENES.includes(/** @type {SceneId} */ (value));
}

/** @param {'zh' | 'en'} locale @param {SceneId} id */
export function sceneLabel(locale, id) {
  return SCENE_LABELS[locale][id] ?? id;
}

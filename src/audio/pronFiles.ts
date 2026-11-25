/**
 * Where the pronunciation model lives: public/models/w2v2/ on this site, split in two parts
 * under 50 MB each (wav2vec2-base-960h, 8-bit ONNX, Apache-2.0; see CREDITS.md). Rename the
 * parts and the cache when the model changes, so an old copy is never used.
 */
export const MODEL_DIR = 'models/w2v2/';
export const MODEL_PARTS = ['model.q8.part0', 'model.q8.part1'] as const;
/** Both parts together, for download progress. */
export const MODEL_BYTES = 95286046;
export const MODEL_CACHE = 'lamplit-models-v1';

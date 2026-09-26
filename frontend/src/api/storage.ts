import type { Annotation, Artifact, Exhibition, Feedback, Tour } from '@/types';
import {
  deleteManyRecords,
  deleteRecord,
  getAllRecords,
  getRecord,
  putManyRecords,
  putRecord,
  type EntityStoreName
} from '@/utils/storage';

function createRepository<T extends { id: string }>(storeName: EntityStoreName) {
  return {
    list: () => getAllRecords<T>(storeName),
    get: (id: string) => getRecord<T>(storeName, id),
    save: (record: T) => putRecord(storeName, record),
    saveMany: (records: T[]) => putManyRecords(storeName, records),
    remove: (id: string) => deleteRecord(storeName, id),
    removeMany: (ids: string[]) => deleteManyRecords(storeName, ids)
  };
}

export const artifactRepository = createRepository<Artifact>('artifacts');
export const exhibitionRepository = createRepository<Exhibition>('exhibitions');
export const annotationRepository = createRepository<Annotation>('annotations');
export const tourRepository = createRepository<Tour>('tours');
export const feedbackRepository = createRepository<Feedback>('feedbacks');

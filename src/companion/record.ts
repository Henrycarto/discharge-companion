/** The parts of the shared patient record the companion reads. */
import { EVENTS, PATIENT, byId, type Event } from '../record/record';

export { PATIENT, byId };
export const dosesOf = (drug: string): Event[] => EVENTS.filter((e) => e.row === drug && e.kind === 'dose');

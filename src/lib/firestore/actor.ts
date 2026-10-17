import { auth } from '@/lib/firebase';
import { EMPTY_ACTOR, actorFromUser, type Actor } from '@/lib/audit';

/** Akun yang sedang login, untuk stempel `createdBy`/`updatedBy` di lapisan repo (K-36). */
export function currentActor(): Actor {
  try {
    return actorFromUser(auth.currentUser);
  } catch {
    // Mock Firebase di test bisa tidak menyediakan `auth`; penulisan tetap jalan tanpa stempel.
    return EMPTY_ACTOR;
  }
}

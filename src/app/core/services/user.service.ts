import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, from, of, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth = inject(Auth);
  private db = getFirestore();

  isAdmin = toSignal(
    authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of(false);
        return from(getDoc(doc(this.db, 'users', user.uid))).pipe(
          map(snap => {
            console.log('[UserService] uid:', user.uid, '| exists:', snap.exists(), '| data:', snap.data());
            return snap.exists() && snap.data()?.['role'] === 'admin';
          })
        );
      })
    ),
    { initialValue: false }
  );
}

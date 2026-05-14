import { Component, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, increment, query, orderBy, where } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, combineLatest, map, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-folders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './folders.html',
  styles: [`
    .folder-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .folder-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .folder-card:hover {
      border-color: var(--accent-color);
      background: var(--surface-hover);
      transform: translateY(-2px);
    }

    .delete-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      color: var(--text-secondary);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .folder-card:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      color: var(--danger-color);
    }

    .folder-icon {
      font-size: 3rem;
      color: var(--accent-color);
    }

    .folder-name {
      font-weight: 500;
      font-size: 0.9rem;
      text-align: center;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .action-btns {
      display: flex;
      gap: 1rem;
    }

    .btn-outline {
      padding: 0.6rem 1.2rem;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-outline:hover {
      border-color: var(--accent-color);
      color: var(--accent-color);
    }

    .file-row:hover .file-delete {
      opacity: 1;
    }

    .file-delete {
      opacity: 0;
      transition: opacity 0.2s;
      color: var(--text-secondary);
    }

    .file-delete:hover {
      color: var(--danger-color);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      width: 450px;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }

    .viewer-modal {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.5rem;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }

    .viewer-modal img {
      max-width: 80vw;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 8px;
    }

    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-row:hover {
      background: var(--surface-hover);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      color: var(--text-secondary);
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }

    .form-input {
      width: 100%;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.75rem;
      color: var(--text-primary);
      font-size: 1rem;
    }

    .form-input:focus {
      border-color: var(--accent-color);
      outline: none;
    }
  `]
})
export class FoldersComponent implements OnInit {
  private storage = inject(Storage);
  private db = getFirestore();
  auth = inject(Auth);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  showModal = false;
  newFolderName = '';
  newFolderIsPublic = false;
  folderSearch = '';

  filterFolders(folders: any[]): any[] {
    const q = this.folderSearch.trim().toLowerCase();
    return q ? folders.filter(f => f.name?.toLowerCase().includes(q)) : folders;
  }

  folders$: Observable<any[]> | undefined;
  selectedFolder = signal<any>(null);
  files$: Observable<any[]> | undefined;
  viewingFile = signal<any>(null);

  ngOnInit() {
    const uid = this.auth.currentUser!.uid;
    const col = collection(this.db, 'folders');
    const own$    = collectionData(query(col, where('uid', '==', uid)), { idField: 'id' });
    const public$ = collectionData(query(col, where('isPublic', '==', true)), { idField: 'id' });
    this.folders$ = combineLatest([own$, public$]).pipe(
      map(([own, pub]) => {
        const merged = [...own];
        for (const p of pub) {
          if (!merged.find((f: any) => f.id === p.id)) merged.push(p);
        }
        return merged;
      })
    );

    const targetId = this.route.snapshot.queryParamMap.get('id');
    if (targetId) {
      this.folders$!.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(folders => {
        const target = folders.find((f: any) => f.id === targetId);
        if (target) this.selectFolder(target);
      });
    }
  }

  openModal() {
    this.showModal = true;
    this.newFolderName = '';
    this.newFolderIsPublic = false;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveNewFolder() {
    if (!this.newFolderName) return;
    try {
      const foldersCol = collection(this.db, 'folders');
      await addDoc(foldersCol, {
        uid: this.auth.currentUser!.uid,
        name: this.newFolderName,
        count: 0,
        isPublic: this.userService.isAdmin() ? this.newFolderIsPublic : false
      });
      this.closeModal();
    } catch (e) {
      this.toast.error('Error creating folder. Check Firebase Rules are updated.');
    }
  }

  async deleteFolder(event: Event, folder: any) {
    event.stopPropagation();
    const ok = await this.confirm.confirm(
      'Delete Folder',
      `Delete "${folder.name}" and all its contents? This action cannot be undone.`
    );
    if (ok) {
      try {
        await deleteDoc(doc(this.db, 'folders', folder.id));
      } catch (e) {
        this.toast.error('Failed to delete folder.');
      }
    }
  }

  selectFolder(folder: any) {
    this.selectedFolder.set(folder);
    const filesCol = collection(this.db, 'folders', folder.id, 'files');
    this.files$ = collectionData(query(filesCol, orderBy('uploadedAt', 'desc')), { idField: 'id' });
  }

  backToRoot() {
    this.selectedFolder.set(null);
    this.files$ = undefined;
  }

  async uploadFile(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const folder = this.selectedFolder();
    if (!folder) {
      this.toast.error('Open a folder first before uploading.');
      return;
    }

    try {
      const path = `uploads/${folder.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      let type = 'File';
      if (file.type.includes('pdf')) type = 'PDF';
      else if (file.type.startsWith('image/')) type = 'Image';
      else if (file.type.startsWith('text/')) type = 'Text';

      const filesCol = collection(this.db, 'folders', folder.id, 'files');
      await addDoc(filesCol, {
        name: file.name,
        mimeType: file.type,
        type,
        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        date: new Date().toLocaleDateString(),
        uploadedAt: new Date().toISOString(),
        url,
        path
      });

      await updateDoc(doc(this.db, 'folders', folder.id), { count: increment(1) });
      this.toast.success('File uploaded successfully!');
    } catch (err: any) {
      this.toast.error('Upload failed: ' + err.message);
    }
  }

  async deleteFile(file: any) {
    const folder = this.selectedFolder();
    if (!folder) return;
    const ok = await this.confirm.confirm('Delete File', `Delete "${file.name}"? This action cannot be undone.`);
    if (ok) {
      try {
        if (file.path) {
          await deleteObject(ref(this.storage, file.path));
        }
        await deleteDoc(doc(this.db, 'folders', folder.id, 'files', file.id));
        await updateDoc(doc(this.db, 'folders', folder.id), { count: increment(-1) });
        this.toast.success('File deleted.');
      } catch (err: any) {
        this.toast.error('Delete failed: ' + err.message);
      }
    }
  }

  openFile(file: any) {
    if (file.mimeType?.startsWith('image/')) {
      this.viewingFile.set(file);
    } else {
      window.open(file.url, '_blank');
    }
  }

  closeViewer() {
    this.viewingFile.set(null);
  }

  getFileIcon(file: any): string {
    if (file.type === 'PDF') return 'picture_as_pdf';
    if (file.type === 'Image') return 'image';
    if (file.type === 'Text') return 'description';
    return 'insert_drive_file';
  }
}

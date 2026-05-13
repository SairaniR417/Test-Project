import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, query, CollectionReference, DocumentData } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-scripts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scripts.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 130px);
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-shrink: 0;
    }

    .btn-group { display: flex; gap: 0.75rem; }

    .btn-outline {
      padding: 0.5rem 1rem;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
    }

    .btn-outline:hover { border-color: var(--accent-color); color: var(--accent-color); }
    .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-accent {
      background: var(--accent-color) !important;
      border-color: var(--accent-color) !important;
      color: #000 !important;
    }

    .btn-accent:hover { opacity: 0.85; }

    .scripts-layout {
      display: flex;
      flex: 1;
      gap: 1.25rem;
      overflow: hidden;
      min-height: 0;
    }

    .scripts-sidebar {
      width: 240px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      overflow-y: auto;
    }

    .script-item {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 0.875rem 1rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .script-item:hover, .script-item.active {
      border-color: var(--accent-color);
    }

    .script-item.active { background: var(--surface-hover); }

    .del-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      color: var(--text-secondary);
      font-size: 1.1rem !important;
      transition: opacity 0.2s;
      cursor: pointer;
    }

    .script-item:hover .del-btn { opacity: 1; }
    .del-btn:hover { color: var(--danger-color) !important; }

    .editor-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      min-width: 0;
    }

    .editor-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border-color);
      background: rgba(0,0,0,0.3);
      flex-shrink: 0;
    }

    .code-textarea {
      flex: 1;
      width: 100%;
      background: #0d1117;
      color: #D4D4D4;
      border: none;
      outline: none;
      padding: 1.25rem 1.5rem;
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
      font-size: 14px;
      line-height: 1.7;
      resize: none;
      tab-size: 2;
      white-space: pre;
      overflow-wrap: normal;
      overflow-x: auto;
      caret-color: #fff;
      box-sizing: border-box;
    }

    .code-textarea::selection { background: #264f78; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
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
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }

    .form-group { margin-bottom: 1.25rem; }

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
      box-sizing: border-box;
    }

    .form-input:focus { border-color: var(--accent-color); outline: none; }

    .modal-code {
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      min-height: 300px;
      resize: vertical;
      background: #0d1117;
      color: #D4D4D4;
      tab-size: 2;
      white-space: pre;
      overflow-wrap: normal;
      overflow-x: auto;
    }
  `]
})
export class ScriptsComponent implements OnInit {
  private db = getFirestore();
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  showModal = false;
  isUpload = false;
  isSavingNew = false;
  isSaving = false;
  scriptForm = { name: '', type: 'Indicator' };
  pendingCode = '';

  scripts$: Observable<any[]> | undefined;
  selectedScript = signal<any>(null);
  currentCode = '';

  readonly PINE_TEMPLATE = `//@version=5
indicator("My Script", overlay=true)

// ─── Inputs ───────────────────────────────────────────────────────────────────
length = input.int(14, title="Length")
source = input.source(close, title="Source")

// ─── Calculations ─────────────────────────────────────────────────────────────
ma = ta.sma(source, length)

// ─── Plots ────────────────────────────────────────────────────────────────────
plot(ma, title="MA", color=color.new(color.yellow, 0), linewidth=2)
`;

  ngOnInit() {
    const scriptsCol = collection(this.db, 'scripts') as CollectionReference<DocumentData>;
    this.scripts$ = collectionData(query(scriptsCol), { idField: 'id' });
  }

  openNewModal() {
    this.isUpload = false;
    this.pendingCode = this.PINE_TEMPLATE;
    this.scriptForm = { name: '', type: 'Indicator' };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveNewScript() {
    if (!this.scriptForm.name || this.isSavingNew) return;
    const { name, type } = this.scriptForm;
    this.isSavingNew = true;
    try {
      const docRef = await addDoc(collection(this.db, 'scripts'), {
        name,
        type: type || 'Indicator',
        updated: new Date().toLocaleDateString(),
        code: this.pendingCode
      });
      const newScript = { id: docRef.id, name, type, code: this.pendingCode, updated: new Date().toLocaleDateString() };
      this.closeModal();
      this.selectScript(newScript);
      this.toast.success(`"${name}" added to library!`);
    } catch (e: any) {
      this.toast.error('Failed to save: ' + (e?.message ?? 'Unknown error'));
    } finally {
      this.isSavingNew = false;
    }
  }

  selectScript(script: any) {
    this.selectedScript.set(script);
    this.currentCode = script.code || '';
  }

  async saveCurrentScript() {
    const script = this.selectedScript();
    if (!script?.id || this.isSaving) return;
    this.isSaving = true;
    try {
      await updateDoc(doc(this.db, 'scripts', script.id), {
        code: this.currentCode,
        updated: new Date().toLocaleDateString()
      });
      this.selectedScript.set({ ...script, code: this.currentCode });
      this.toast.success('Script saved!');
    } catch (e: any) {
      this.toast.error('Save failed: ' + e?.message);
    } finally {
      this.isSaving = false;
    }
  }

  copyCode() {
    navigator.clipboard.writeText(this.currentCode).then(() => this.toast.success('Copied to clipboard!'));
  }

  onTabKey(event: Event) {
    event.preventDefault();
    const el = event.target as HTMLTextAreaElement;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    this.currentCode = this.currentCode.substring(0, start) + '  ' + this.currentCode.substring(end);
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + 2; }, 0);
  }

  uploadScript(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.isUpload = true;
      this.pendingCode = (e.target?.result as string) ?? '';
      this.scriptForm = { name: file.name.replace(/\.(pine|txt)$/, ''), type: 'Indicator' };
      this.showModal = true;
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async deleteScript(script: any) {
    const ok = await this.confirm.confirm('Delete Script', `Delete "${script.name}"? This action cannot be undone.`);
    if (ok) {
      try {
        await deleteDoc(doc(this.db, 'scripts', script.id));
        if (this.selectedScript()?.id === script.id) {
          this.selectedScript.set(null);
          this.currentCode = '';
        }
      } catch (e: any) {
        this.toast.error('Failed to delete: ' + (e?.message ?? 'Unknown error'));
      }
    }
  }
}

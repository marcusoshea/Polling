import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PollingSummary } from '../interfaces/polling-summary';

/**
 * Pre-submit review/confirm dialog (Phase 5).
 * Receives the voting rows via MAT_DIALOG_DATA and closes with:
 *   true  -> user clicked "Confirm Submit" (caller proceeds with the real submit)
 *   false -> user clicked "Go Back" (nothing is sent)
 */
@Component({
  selector: 'submit-review-dialog',
  imports: [CommonModule, MatDialogModule],
  template: `
    <mat-dialog-content>
      <h2 class="h4">Review your votes</h2>
      <ul class="list-unstyled m-2">
        <li *ngFor="let row of rows" class="mb-1">
          {{ row.name }} —
          <span *ngIf="row.vote != null">{{ voteWord(row.vote) }}</span>
          <strong *ngIf="row.vote == null" class="text-danger">No vote</strong>
        </li>
      </ul>
      <p class="fw-bold m-2">{{ votedCount }} of {{ rows.length }} voted.</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button type="button" class="btn btn-danger m-2" (click)="confirm()">Confirm Submit</button>
      <button type="button" class="btn btn-secondary m-2" (click)="goBack()">Go Back</button>
    </mat-dialog-actions>
  `
})
export class SubmitReviewDialog {
  constructor(
    public dialogRef: MatDialogRef<SubmitReviewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { rows: PollingSummary[] }
  ) { }

  get rows(): PollingSummary[] {
    return this.data?.rows ?? [];
  }

  get votedCount(): number {
    return this.rows.filter(r => r.vote != null).length;
  }

  // Same vote-word semantics as the voting table's mat-options / the ngSwitch in polling-candidate.html.
  voteWord(vote: number): string {
    switch (vote) {
      case 1: return 'Yes';
      case 2: return 'Wait';
      case 3: return 'No';
      case 4: return 'Abstain';
      default: return 'No vote';
    }
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  goBack(): void {
    this.dialogRef.close(false);
  }
}

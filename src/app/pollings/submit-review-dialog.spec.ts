import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SubmitReviewDialog } from './submit-review-dialog';
import { PollingSummary } from '../interfaces/polling-summary';

function makeRow(name: string, vote: number | null): PollingSummary {
  return {
    polling_id: 10,
    polling_name: 'P',
    start_date: '',
    end_date: '',
    polling_order_id: 1,
    candidate_id: 1,
    polling_candidate_id: 1,
    name,
    polling_notes_id: 0,
    note: '',
    vote: vote as unknown as number,
    pn_created_at: '',
    polling_order_member_id: 1,
    completed: false
  };
}

describe('SubmitReviewDialog', () => {
  let fixture: ComponentFixture<SubmitReviewDialog>;
  let dialog: SubmitReviewDialog;
  let closeSpy: jasmine.Spy;

  async function setup(rows: PollingSummary[]): Promise<void> {
    closeSpy = jasmine.createSpy('close');
    await TestBed.configureTestingModule({
      imports: [SubmitReviewDialog, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: { rows } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitReviewDialog);
    dialog = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('lists every candidate with its vote word and highlights unvoted rows as "No vote"', async () => {
    await setup([makeRow('Alice', 1), makeRow('Bob', null), makeRow('Cara', 4)]);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Review your votes');

    const items = Array.from(el.querySelectorAll('li'))
      .map(li => (li.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(items).toEqual(['Alice — Yes', 'Bob — No vote', 'Cara — Abstain']);

    // The unvoted row is visually highlighted (bold + red).
    const noVote = el.querySelector('li strong.text-danger');
    expect(noVote?.textContent).toContain('No vote');

    // Count line.
    expect((el.textContent ?? '').replace(/\s+/g, ' ')).toContain('2 of 3 voted.');
  });

  it('maps every vote value to its word (same semantics as the voting table)', async () => {
    await setup([]);
    expect(dialog.voteWord(1)).toBe('Yes');
    expect(dialog.voteWord(2)).toBe('Wait');
    expect(dialog.voteWord(3)).toBe('No');
    expect(dialog.voteWord(4)).toBe('Abstain');
  });

  it('"Confirm Submit" closes with true and "Go Back" closes with false', async () => {
    await setup([makeRow('Alice', 1)]);

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const confirmBtn = buttons.find(b => b.textContent?.includes('Confirm Submit'))!;
    const goBackBtn = buttons.find(b => b.textContent?.includes('Go Back'))!;
    expect(confirmBtn).toBeTruthy();
    expect(goBackBtn).toBeTruthy();

    confirmBtn.click();
    expect(closeSpy).toHaveBeenCalledWith(true);

    goBackBtn.click();
    expect(closeSpy).toHaveBeenCalledWith(false);
  });
});

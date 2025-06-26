import { Component, ComponentFactoryResolver, Inject, OnInit, ViewChild } from '@angular/core';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { NavigationExtras, Router } from '@angular/router';
import { PollingOrder } from '../interfaces/polling-order'
import { OrderMember } from '../interfaces/order-member'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Candidate } from '../interfaces/candidate';
import { CandidateService } from '../services/candidate.service';
import { MatListOption, MatSelectionList } from '@angular/material/list'
import { PollingService } from '../services/polling.service';
import { Polling } from '../interfaces/polling';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { OrderByNamePipe } from './order-by-name.pipe';
import { OrderByMemberNamePipe } from './order-by-member-name.pipe';
import { PollingReportService } from '../services/polling-report.service';
import { forkJoin } from 'rxjs';
import { NotesService } from '../services/notes.service';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatTableModule,
    FormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatInputModule,
    CommonModule,
    OrderByNamePipe,
    OrderByMemberNamePipe
  ],
  styleUrls: ['./admin.component.css'],
  animations: [
    trigger('bodyExpansion', [
      state('collapsed', style({ height: '0px', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class AdminComponent implements OnInit {
  @ViewChild(MatSelectionList) candidate: MatSelectionList;

  pollingOrder = {} as PollingOrder;
  orderMemberList: OrderMember[] = [];
  UnapprovedOrderMemberList: OrderMember[] = [];
  candidateList: Candidate[] = [];
  pollingList: Polling[] = [];
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  public subscript1?: Subscription;
  public subscript2?: Subscription;
  public subscript3?: Subscription;
  public subscript4?: Subscription;
  public subscript5?: Subscription;
  public subscript6?: Subscription;
  public subscript7?: Subscription;
  public subscript8?: Subscription;
  public subscript9?: Subscription;
  public subscript10?: Subscription;
  public subscript11?: Subscription;
  public subscript12?: Subscription;
  public subscript13?: Subscription;

  constructor(public fb: FormBuilder, private pollingOrderService: PollingOrderService,
    private candidateService: CandidateService, private memberService: MemberService, private pollingService: PollingService,
    private storageService: StorageService, private router: Router, public dialog: MatDialog, private authService: AuthService,
    private pollingReportService: PollingReportService, private notesService: NotesService) { }
  private showAdmin = false;
  public changeAdminOccurred = false;
  public changeAsstOccurred = false;
  private errorMessage = '';
  private accessToken = '';
  public displayedColumns = ['name', 'buttons'];
  public displayedColumnsPollings: string[] = ['name', 'startDate', 'endDate', 'actions'];
  public dataSource = new MatTableDataSource<OrderMember>();
  public dataSourceMemberList = new MatTableDataSource<OrderMember>();
  public dataSourceCandidates = new MatTableDataSource<Candidate>();
  public dataSourcePollings = new MatTableDataSource<Polling>();
  public displayedColumnsCandidates = ['name', 'buttons'];
  public newCandidateName = '';
  public newCandidateLink = '';
  public newOrderMemberName = '';
  public newOrderMemberEmail = '';
  public showCandidateWarning = false;
  public panelOpenStateMA = false;
  public panelOpenStateML = false;
  public panelOpenStateCA = false;
  public panelOpenStatePO = false;
  public panelOpenStateReports = false;
  public selectedPollingCandidates: any[];
  public newPollingName = '';
  public selectAllBox = false;
  public selectPollingListBox = false;
  public imageDesc = '';
  public selectAllButtonText = 'Select All';
  public selectAllPollingButtonText = 'Select Polling Candidates';
  public selectPollingListBoxDisabled = false;
  public missingVotesNumber: number = 1;
  public missingVotesReport: any = null;
  public memberListFilter: string = '';
  public candidateListFilter: string = '';
  public closedPollingReport: any = null;
  public showAdminNotes: boolean = true;
  public showAdminPrivateNotes: boolean = true;
  public showAdminVotes: boolean = true;

  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
    this.showAdmin = member.isOrderAdmin;
    this.accessToken = member.access_token;

    if (!this.showAdmin) {
      this.router.navigate(['/home']);
    }

    this.selectOrderAdmin.setValue(this.pollingOrder.polling_order_admin.toString(), {
      onlySelf: true
    })
    this.selectOrderAdminAsst.setValue(this.pollingOrder.polling_order_admin_assistant.toString(), {
      onlySelf: true
    })

    this.getAllOrderMembers();

    this.subscript1 = this.candidateService.getAllCandidates(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.candidateList = data;
        for (var i = 0; i < this.candidateList.length; i++) {
          this.candidateList[i].authToken = this.accessToken;
        }

        this.dataSourceCandidates.data = this.candidateList;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.subscript2 = this.pollingService.getAllPollings(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.pollingList = data;
        this.dataSourcePollings.data = data.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

  }

  reset(): void {
    window.location.reload();
  }

  getAllOrderMembers(): void {
    this.subscript3 = this.memberService.getAllOrderMembers(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.orderMemberList = data.filter(e => e.approved === true && e.removed === false).sort(function (a, b) {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });

        this.UnapprovedOrderMemberList = data.filter(e => e.approved === false);
        this.dataSourceMemberList.data = this.orderMemberList;
        this.dataSource.data = this.UnapprovedOrderMemberList;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  orderAdminForm = this.fb.group({
    orderAdmin: ['', [Validators.required]],
  });
  orderAdminAsstForm = this.fb.group({
    orderAdminAsst: ['', [Validators.required]],
  });

  get selectOrderAdmin() {
    return this.orderAdminForm.get('orderAdmin');
  }

  changeOrderAdmin(e) {
    this.changeAdminOccurred = true;
    this.selectOrderAdmin.setValue(e.target.value, {
      onlySelf: true
    })
  }

  get selectOrderAdminAsst() {
    return this.orderAdminAsstForm.get('orderAdminAsst');
  }

  changeOrderAdminAsst(e) {
    this.changeAsstOccurred = true;
    this.selectOrderAdminAsst.setValue(e.target.value, {
      onlySelf: true
    })
  }

  randomizer(): string {
    let ts = String(new Date().getTime()),
      i = 0,
      out = '';
    for (i = 0; i < ts.length; i += 2) {
      out += Number(ts.substr(i, 2)).toString(36);
    }
    return Math.ceil(Math.random() * 10000) + out;
    ;
  }

  addNewMember(): void {
    if (this.newOrderMemberEmail === '') {
      this.newOrderMemberEmail = this.randomizer() + '@polling.aethelmearc.org';
    }
    let password = this.randomizer();

    this.authService.forceRegister(this.newOrderMemberName, this.newOrderMemberEmail, password, this.pollingOrder.polling_order_id.toString(), this.accessToken).subscribe({
      next: data => {
        alert("New Member Created");
        setTimeout(() => {
          this.reset();
        }, 1000);
      }
    });
  }

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string, Asst: boolean): void {
    let admin = 0;
    if (Asst) {
      admin = parseInt(this.orderAdminAsstForm.value.orderAdminAsst)
    } else {
      admin = parseInt(this.orderAdminForm.value.orderAdmin)
    }
    const dialogRef = this.dialog.open(AdminConfirm, {
      panelClass: 'custom-dialog-container',
      enterAnimationDuration,
      exitAnimationDuration,
      data: {
        orderMember: this.orderMemberList.filter(e => e.polling_order_member_id === admin),
        pollingOrder: this.pollingOrder,
        assistantUpdate: Asst
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.pollingOrder = result.data;
      this.pollingOrderService.updatePollingOrder(this.pollingOrder.polling_order_id, this.pollingOrder.polling_order_name.toString(), this.pollingOrder.polling_order_admin.toString(), this.pollingOrder.polling_order_admin_assistant.toString(), this.accessToken).subscribe({
        next: data => {
          this.storageService.clean();
          this.router.navigate(['/login']);
        },
        error: err => {
          this.errorMessage = err.error.message;
        }
      });
    });
  }

  approveNewMember(memberInQuestion: any, approved: boolean): void {
    if (approved) {
      this.showCandidateWarning = true;
      const today = new Date();
      const created = today.toISOString().split('T')[0];

      this.subscript4 = this.memberService.updateMember(memberInQuestion.polling_order_member_id, memberInQuestion.name, memberInQuestion.email, true, this.pollingOrder.polling_order_id, created, this.accessToken, false, true).subscribe({
        next: data => {
          let index = this.UnapprovedOrderMemberList.findIndex(e => e.polling_order_member_id === memberInQuestion.polling_order_member_id)
          this.orderMemberList.push(this.UnapprovedOrderMemberList[index]);
          this.UnapprovedOrderMemberList.splice(index, 1);
          this.dataSource.data = this.UnapprovedOrderMemberList;
        },
        error: err => {
          this.errorMessage = err.error.message;
        }
      });

      setTimeout(() => {
        this.showCandidateWarning = false;
      }, 3000);

    } else {
      this.subscript5 = this.memberService.removeMember(memberInQuestion.polling_order_member_id, this.accessToken).subscribe({
        next: data => {
          let index = this.UnapprovedOrderMemberList.findIndex(e => e.polling_order_member_id === memberInQuestion.polling_order_member_id)
          this.UnapprovedOrderMemberList.splice(index, 1);
          this.dataSource.data = this.UnapprovedOrderMemberList;
        },
        error: err => {
          this.errorMessage = err.error.message;
        }
      });
    }
  };

  openMemberDialog(enterAnimationDuration: string, exitAnimationDuration: string, member: OrderMember): void {
    const dialogRef = this.dialog.open(MemberConfirm, {
      panelClass: 'custom-dialog-container',
      enterAnimationDuration,
      exitAnimationDuration,
      data: {
        "member": member
      },
    });

    dialogRef.afterClosed().subscribe(data => {
      this.removeOrderMember(data.data);
    });
  }

  removeOrderMember(memberInQuestion: any): void {
    const today = new Date();
    const created = today.toISOString().split('T')[0];

    this.subscript6 = this.memberService.updateMember(memberInQuestion.polling_order_member_id, memberInQuestion.name, memberInQuestion.email, true, this.pollingOrder.polling_order_id, created, this.accessToken, true, false).subscribe({
      next: data => {
        let index = this.orderMemberList.findIndex(e => e.polling_order_member_id === memberInQuestion.polling_order_member_id)
        this.orderMemberList.splice(index, 1);
        this.dataSourceMemberList.data = this.orderMemberList;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  };


  openCandidateDialog(enterAnimationDuration: string, exitAnimationDuration: string, candidate: Candidate): void {
    const dialogRef = this.dialog.open(CandidateConfirm, {
      panelClass: 'custom-dialog-container',
      enterAnimationDuration,
      exitAnimationDuration,
      data: {
        "candidate": candidate
      },
    });

    dialogRef.afterClosed().subscribe(data => {
      this.removeCandidate(data);
    });
  }

  removeCandidate(candidateId: any): void {
    this.subscript7 = this.candidateService.removeCandidate(candidateId.data, this.accessToken).subscribe({
      next: data => {
        let index = this.candidateList.findIndex(e => e.candidate_id === candidateId.data)
        this.candidateList.splice(index, 1);
        this.dataSourceCandidates.data = this.candidateList;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  goToCandidateImages(element): void {
    const navigationExtras: NavigationExtras = {
      state: {
        candidateName: element.name,
        candidateId: element.candidate_id
      }
    };

    this.router.navigate(['candidate-images'], navigationExtras);
  }

  activeMember(memberInQuestion: any, activate: boolean): void {
    const today = new Date();
    const created = today.toISOString().split('T')[0];

    this.subscript8 = this.memberService.updateMember(memberInQuestion.polling_order_member_id, memberInQuestion.name, memberInQuestion.email, true, this.pollingOrder.polling_order_id, created, this.accessToken, false, activate).subscribe({
      next: data => {
        this.getAllOrderMembers();
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    setTimeout(() => {
      this.showCandidateWarning = false;
    }, 3000);
  };

  updateCandidate(candidateInQuestion: any, watchlist: boolean, nameUpdate?: boolean): void {
    if (candidateInQuestion.link === null) {
      candidateInQuestion.link = '';
    }

    candidateInQuestion.watch_list = watchlist;

    this.subscript13 = this.candidateService.editCandidate(candidateInQuestion, this.accessToken).subscribe({
      next: data => {
        this.getAllOrderMembers();
        if (nameUpdate) {
          this.reset();
        }
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

  };

  addNewCandidate(): void {
    this.subscript9 = this.candidateService.createCandidate(this.newCandidateName, this.newCandidateLink, this.pollingOrder.polling_order_id.toString(), this.accessToken).subscribe({
      next: data => {
        this.candidateList.push(data);
        this.dataSourceCandidates.data = this.candidateList;
        this.newCandidateName = '';
        this.newCandidateLink = '';
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  addNewPolling(): void {
    if (this.newPollingName && this.range.value.start !== null
      && this.range.value.end !== null && this.selectedPollingCandidates.length > 0) {

      this.selectedPollingCandidates = this.selectedPollingCandidates.filter(item => item);
      this.subscript10 = this.pollingService.createPolling(this.newPollingName, this.pollingOrder.polling_order_id.toString(), this.range.value.start.toISOString().split('T')[0], this.range.value.end.toISOString().split('T')[0], this.accessToken).subscribe({
        next: data => {
          this.pollingList.push(data);
          this.dataSourcePollings.data = this.pollingList;
          this.newPollingName = '';
          for (var i = 0; i < this.selectedPollingCandidates.length; i++) {
            this.selectedPollingCandidates[i].polling_id = data.polling_id;
          }
          this.pollingService.createPollingCandidates(this.selectedPollingCandidates, this.accessToken).subscribe({
            next: () => {
              alert("New Polling Created!");
            },
            error: err => {
              this.errorMessage = err.error.message;
            }
          });
        },
        error: err => {
          this.errorMessage = err.error.message;
        }
      });
    }
  }

  editPolling(element): void {

    console.log(element.polling_id)
    if (element.polling_name && element.start_date !== null
      && element.end_date !== null) {

      this.subscript10 = this.pollingService.editPolling(element.polling_name, this.pollingOrder.polling_order_id.toString(), element.polling_id, new Date(element.start_date).toISOString().split('T')[0], new Date(element.end_date).toISOString().split('T')[0], this.accessToken).subscribe({
        next: data => {
          alert("Polling Updated!");
          element.isEditing = false;
        },
        error: err => {
          this.errorMessage = err.error.message;
        }
      });
    }
  }

  selectAll(): void {
    if (this.selectAllBox) {
      this.candidate.deselectAll();
      this.selectAllBox = false;
      this.selectAllButtonText = 'Select All';
      this.selectPollingListBoxDisabled = false;
    } else {
      this.candidate.selectAll();
      this.selectAllBox = true;
      this.selectAllButtonText = 'Unselect All';
      this.selectAllPollingButtonText = 'Select Polling Candidates';
      this.selectPollingListBoxDisabled = true;


    }
  }

  selectAllPollingList(): void {
    this.selectPollingListBox = !this.selectPollingListBox;
    this.selectAllPollingButtonText = 'Unselect Polling Candidates';
    this.candidate.options.forEach((option: MatListOption) => {
      if (option.value && !option.value.watch_list) {
        option.selected = true;
      }
    });
    if (this.selectPollingListBox === false) {
      this.candidate.deselectAll();
      this.selectAllPollingButtonText = 'Select Polling Candidates';
    }
  }

  openPollingDialog(enterAnimationDuration: string, exitAnimationDuration: string, polling: Polling): void {
    const dialogRef = this.dialog.open(PollingConfirm, {
      panelClass: 'custom-dialog-container',
      enterAnimationDuration,
      exitAnimationDuration,
      data: {
        "polling": polling
      },
    });

    dialogRef.afterClosed().subscribe(data => {
      this.removePolling(data);
    });
  }

  removePolling(polling: any): void {
    this.subscript11 = this.pollingService.removePolling(polling.data, this.accessToken).subscribe({
      next: data => {
        let index = this.pollingList.findIndex(e => e.polling_id === polling.data)
        this.pollingList.splice(index, 1);
        this.dataSourcePollings.data = this.pollingList;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  getMissingVotesReport() {
    if (!this.pollingOrder.polling_order_id || !this.missingVotesNumber) return;
    this.pollingService.getMissingVotesReport(Number(this.pollingOrder.polling_order_id), this.missingVotesNumber, this.accessToken)
      .subscribe({
        next: (data) => {
          this.missingVotesReport = data;
        },
        error: (err) => {
          this.missingVotesReport = null;
          this.errorMessage = err.error?.message || 'Failed to fetch report';
        }
      });
  }

  getClosedPollingReport() {
    if (!this.pollingOrder.polling_order_id) return;
    const member = this.storageService.getMember();
    const isOrderClerk = member.isOrderAdmin;
    this.pollingReportService.getClosedPollingReport(Number(this.pollingOrder.polling_order_id), this.accessToken, isOrderClerk, false)
      .subscribe({
        next: (data) => {
          this.closedPollingReport = data;
        },
        error: (err) => {
          this.closedPollingReport = null;
          this.errorMessage = err.error?.message || 'Failed to fetch closed polling report';
        }
      });
  }

  applyMemberListFilter() {
    const filterValue = this.memberListFilter.trim().toLowerCase();
    this.dataSourceMemberList.filter = filterValue;
    this.dataSourceMemberList.filterPredicate = (data: any, filter: string) => {
      return (
        (data.name && data.name.toLowerCase().includes(filter)) ||
        (data.email && data.email.toLowerCase().includes(filter))
      );
    };
  }

  applyCandidateListFilter() {
    const filterValue = this.candidateListFilter.trim().toLowerCase();
    this.dataSourceCandidates.filter = filterValue;
    this.dataSourceCandidates.filterPredicate = (data: any, filter: string) => {
      return (
        (data.name && data.name.toLowerCase().includes(filter))
      );
    };
  }

  ngOnDestroy(): void {
    if (this.subscript1) {
      this.subscript1.unsubscribe();
    }
    if (this.subscript2) {
      this.subscript2.unsubscribe();
    }
    if (this.subscript3) {
      this.subscript3.unsubscribe();
    }
    if (this.subscript4) {
      this.subscript4.unsubscribe();
    }
    if (this.subscript5) {
      this.subscript5.unsubscribe();
    }
    if (this.subscript6) {
      this.subscript6.unsubscribe();
    }
    if (this.subscript7) {
      this.subscript7.unsubscribe();
    }
    if (this.subscript8) {
      this.subscript8.unsubscribe();
    }
    if (this.subscript9) {
      this.subscript9.unsubscribe();
    }
    if (this.subscript10) {
      this.subscript10.unsubscribe();
    }
    if (this.subscript11) {
      this.subscript11.unsubscribe();
    }
    if (this.subscript12) {
      this.subscript12.unsubscribe();
    }
    if (this.subscript13) {
      this.subscript13.unsubscribe();
    }
  }

  sortNotes(notes: any[]): any[] {
    if (!Array.isArray(notes)) return [];
    return notes
      .filter(n => n.completed !== false)
      .slice().sort((a, b) => {
        const aHasNote = a.note && a.note.trim() !== '';
        const bHasNote = b.note && b.note.trim() !== '';
        return (bHasNote ? 1 : 0) - (aHasNote ? 1 : 0);
      });
  }

}


@Component({
  selector: 'confirm-admin',
  templateUrl: 'confirm-admin.html',
})
export class AdminConfirm {
  public newClerk: OrderMember;
  public pollingOrderDialog: PollingOrder;
  public assistant = '';
  constructor(
    public dialogRef: MatDialogRef<AdminConfirm>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.newClerk = data.orderMember[0];
    this.pollingOrderDialog = data.pollingOrder;

    if (this.data.assistantUpdate) {
      this.assistant = 'Assistant';
    }
  }

  reset(): void {
    window.location.reload();
  }

  updateOrderAdmin(): void {
    if (this.data.assistantUpdate) {
      this.pollingOrderDialog.polling_order_admin_assistant = this.newClerk.polling_order_member_id;
    } else {
      this.pollingOrderDialog.polling_order_admin = this.newClerk.polling_order_member_id;
    }
    this.dialogRef.close({ data: this.pollingOrderDialog });
  }
}


@Component({
  selector: 'confirm-candidate',
  templateUrl: 'confirm-candidate.html',
})
export class CandidateConfirm {
  public candidate: Candidate;
  public candidate_id: number;
  constructor(
    public dialogRef: MatDialogRef<CandidateConfirm>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.candidate_id = data.candidate.candidate_id;
    this.candidate = data.candidate
  }

  reset(): void {
    window.location.reload();
  }

  removeConfirmedCandidate(): void {
    this.dialogRef.close({ data: this.candidate_id });
  }
}


@Component({
  selector: 'confirm-member',
  templateUrl: 'confirm-member.html',
})
export class MemberConfirm {
  public member: OrderMember;

  constructor(
    public dialogRef: MatDialogRef<MemberConfirm>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.member = data.member
  }

  reset(): void {
    window.location.reload();
  }

  removeOrderMember(): void {
    this.dialogRef.close({ data: this.member });
  }
}


@Component({
  selector: 'confirm-polling',
  templateUrl: 'confirm-polling.html',
})
export class PollingConfirm {
  public polling: Polling;
  public polling_id: number;
  constructor(
    public dialogRef: MatDialogRef<PollingConfirm>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.polling_id = data.polling.polling_id;
    this.polling = data.polling
  }

  reset(): void {
    window.location.reload();
  }

  removeConfirmedPolling(): void {
    this.dialogRef.close({ data: this.polling_id });
  }
}

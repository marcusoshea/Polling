import { Component, ComponentFactoryResolver, Inject, OnInit, ViewChild } from '@angular/core';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { Router } from '@angular/router';
import { PollingOrder } from '../interfaces/polling-order'
import { OrderMember } from '../interfaces/order-member'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Candidate } from '../interfaces/candidate';
import { CandidateService } from '../services/candidate.service';
import { MatListOption, MatSelectionList } from '@angular/material/list'
import { PollingService } from '../services/polling.service';
import { Polling } from '../interfaces/polling';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
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

  selectedFiles: FileList;


  constructor(public fb: FormBuilder, private pollingOrderService: PollingOrderService,
    private candidateService: CandidateService, private memberService: MemberService, private pollingService: PollingService,
    private storageService: StorageService, private router: Router, public dialog: MatDialog, private authService: AuthService) { }
  private showAdmin = false;
  public changeAdminOccurred = false;
  public changeAsstOccurred = false;
  private errorMessage = '';
  private accessToken = '';
  public displayedColumns = ['buttons', 'name'];
  public displayedColumnsPollings = ['buttons', 'name'];
  public dataSource = new MatTableDataSource<OrderMember>();
  public dataSourceMemberList = new MatTableDataSource<OrderMember>();
  public dataSourceCandidates = new MatTableDataSource<Candidate>();
  public dataSourcePollings = new MatTableDataSource<Polling>();
  public displayedColumnsCandidates = ['buttons', 'name', 'images'];
  public newCandidateName = '';
  public newCandidateLink = '';
  public newOrderMemberName = '';
  public newOrderMemberEmail = '';
  public showCandidateWarning = false;
  public panelOpenStateMA = false;
  public panelOpenStateML = false;
  public panelOpenStateCA = false;
  public panelOpenStatePO = false;
  public selectedPollingCandidates: any[];
  public newPollingName = '';
  public selectAllBox = false;
  public imageDesc = '';

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
        this.dataSourcePollings.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

  }

  getAllOrderMembers(): void {
    this.subscript3 = this.memberService.getAllOrderMembers(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.orderMemberList = data.filter(e => e.approved === true && e.removed === false);
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
      this.newOrderMemberEmail = this.randomizer() + '@aepolling.org';
    }
    let password = this.randomizer();

    this.authService.forceRegister(this.newOrderMemberName, this.newOrderMemberEmail, password, this.pollingOrder.polling_order_id.toString(), this.accessToken).subscribe({
      next: data => {
        alert("New Member Created");
        setTimeout(() => {
          window.location.reload();
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

    this.subscript6 = this.memberService.updateMember(memberInQuestion.polling_order_member_id, memberInQuestion.name, memberInQuestion.email, true, this.pollingOrder.polling_order_id, created, this.accessToken, true, true).subscribe({
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

  // MOVE TO IMAGE MODAL
  upload(element: any) {
    const file = this.selectedFiles.item(0);
    console.log('filessssss', file);
    console.log('imageDesc', this.imageDesc);
    //this.uploadService.uploadfile(file);

    this.subscript12 = this.candidateService.createCandidateImage(file, element.candidate_id, this.imageDesc, this.accessToken).subscribe({
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

  selectFile(event) {
    this.selectedFiles = event.target.files;
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

  selectAll(): void {
    if (this.selectAllBox) {
      this.candidate.deselectAll();
      this.selectAllBox = false;
    } else {
      this.candidate.selectAll();
      this.selectAllBox = true;
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

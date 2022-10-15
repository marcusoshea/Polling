import { Component, Inject, OnInit } from '@angular/core';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { Router } from '@angular/router';
import { PollingOrder } from '../interfaces/polling-order'
import { OrderMember } from '../interfaces/order-member'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  orderMemberList: OrderMember[] = [];
  UnapprovedOrderMemberList: OrderMember[] = [];


  constructor(public fb: FormBuilder, private pollingOrderService: PollingOrderService, private memberService: MemberService, private storageService: StorageService, private router: Router, public dialog: MatDialog) { }
  private showAdmin = false;
  public changeAdminOccurred = false;
  public changeAsstOccurred = false;
  private errorMessage = '';
  private accessToken = '';

  public displayedColumns = ['buttonDeny', 'buttonApprove', 'name', 'email'];
  public dataSource = new MatTableDataSource<OrderMember>();


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

    this.memberService.getAllOrderMembers(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.orderMemberList = data.filter(e => e.approved === true);
        this.UnapprovedOrderMemberList = data.filter(e => e.approved === false);
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
      console.log('The dialog was closed');
    });
  }

  approveNewMember(memberInQuestion: any, approved: boolean): void {
    if (approved) {

      //TODO: should set an email to go out to the newly approved member

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const created = year + '-' + month + '-' + day;

      this.memberService.updateMember(memberInQuestion.polling_order_member_id, memberInQuestion.name, memberInQuestion.email, true, this.pollingOrder.polling_order_id, created, this.accessToken).subscribe({
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
    } else {
      this.memberService.removeMember(memberInQuestion.polling_order_member_id, this.accessToken).subscribe({
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

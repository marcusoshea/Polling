import { Component, ComponentFactoryResolver, Inject, OnInit, ViewChild } from '@angular/core';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { NavigationExtras, Router } from '@angular/router';
import { OrderMember } from '../interfaces/order-member'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Candidate } from '../interfaces/candidate';
import { CandidateService } from '../services/candidate.service';
import { MatListOption,  MatSelectionList } from '@angular/material/list'
import { PollingService } from '../services/polling.service';
import { Polling } from '../interfaces/polling';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { CandidateImages } from '../interfaces/candidateImages';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker'; 
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { AngularEditorModule } from '@kolkov/angular-editor';


@Component({
  selector: 'app-candidate-images',
  templateUrl: './candidate-images.component.html',
  imports: [
    MatExpansionModule, 
    MatTableModule, 
    FormsModule, 
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    AngularEditorModule
  ],
  styleUrls: ['./candidate-images.component.css']
})
export class CandidateImagesComponent implements OnInit {
  @ViewChild(MatSelectionList) candidate: MatSelectionList;

  config: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '5rem',
    minHeight: '5rem',
    placeholder: '--OPTIONAL-- Add some more information here, this will be presented with the image',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      ['insertImage', 'insertVideo', 'toggleEditorMode', 'superscript', 'subscript', 'strikeThrough']
    ]
  };

  candidateImageList: CandidateImages[] = [];

  public subscript1?: Subscription;
  public subscript2?: Subscription;
  public subscript3?: Subscription;
  public candidateId: string;
  selectedFiles: FileList;
  private showAdmin = false;
  private errorMessage = '';
  private accessToken = '';
  public dataSourceCandidates = new MatTableDataSource<Candidate>();
  public displayedColumnsCandidates = ['buttons', 'name', 'images'];
  public candidateName = '';
  public imageDesc = '';

  public displayedColumnsCandidateImage = ['image','description','delete'];
  public dataSourceCandidateImages = new MatTableDataSource<CandidateImages>();

  constructor(public fb: FormBuilder, private pollingOrderService: PollingOrderService,
    private candidateService: CandidateService, private memberService: MemberService, private pollingService: PollingService,
    private storageService: StorageService, private router: Router, public dialog: MatDialog, private authService: AuthService) {
     
    const navigation = this.router.getCurrentNavigation();
    const state = navigation.extras.state as {
      candidateName: string,
      candidateId: string
    };

    this.candidateName = state.candidateName;
    this.candidateId = state.candidateId;
  }

  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.showAdmin = member.isOrderAdmin;
    this.accessToken = member.access_token;

    if (!this.showAdmin) {
      this.router.navigate(['/home']);
    }
    this.subscript1 = this.candidateService.getAllCandidateImages(this.candidateId, this.accessToken).subscribe({
      next: data => {
        this.candidateImageList = data;
        this.dataSourceCandidateImages.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

  }

  async upload() {

    let file: File;
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      file = this.selectedFiles.item(0);
    } else {
      const placeholderPath = 'assets/placeholder.png';
      const response = await fetch(placeholderPath);
      const blob = await response.blob();
      file = new File([blob], 'placeholder.png', { type: 'image/png' });

    }

     this.subscript2 = this.candidateService.createCandidateImage(file, this.candidateId, this.imageDesc, this.accessToken).subscribe({
       error: err => {
         this.errorMessage = err.error.message;
         alert('Error Saving Info!' + this.errorMessage.toString());
       },
       complete: () => { 
        this.goToCandidateImages(); 
      }
    });
  }

  goToCandidateImages(): void {
    const navigationExtras: NavigationExtras = {
      state: {
        candidateName: this.candidateName,
        candidateId: this.candidateId
      }
    };

    this.router.navigate(['admin'], navigationExtras);
  }

  DeleteCandidateImage(element: any): void {
    this.subscript2 = this.candidateService.deleteCandidateImage(element.image_id, this.accessToken, this.candidateId, element.aws_key).subscribe({
      next: data => {
        let index = this.candidateImageList.findIndex(e => e.image_id === element.image_id)
        this.candidateImageList.splice(index, 1);
        this.dataSourceCandidateImages.data = this.candidateImageList;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  selectFile(event) {
    this.selectedFiles = event.target.files;
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
  }

}

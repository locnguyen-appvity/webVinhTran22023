import { Component, Inject, Optional } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { take, takeUntil, timer } from 'rxjs';
import { SharedPropertyService } from 'src/app/shared/shared-property.service';
import { SharedService } from 'src/app/shared/shared.service';
import { SimpleBaseComponent } from 'src/app/shared/simple.base.component';

@Component({
	selector: 'app-dialog-items',
	templateUrl: './dialog-items.component.html',
	styleUrls: ['./dialog-items.component.scss']
})
export class DialogItemsComponent extends SimpleBaseComponent {

	public title: string = 'Danh Sách';
	public target: string = 'organizations';
	public data: any;
	public ctrlFormGroup: FormGroup;
	public arrGroups: any[] = [];
	public positionList: any[] = [];

	constructor(public override sharedService: SharedPropertyService,
		private fb: FormBuilder,
		private service: SharedService,
		public dialogRef: MatDialogRef<DialogItemsComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) private dialogData: any) {
		super(sharedService);
		if(this.dialogData && this.dialogData.item){
			this.data = this.dialogData.item;
		}
		if(this.dialogData && this.dialogData.target){
			this.target = this.dialogData.target;
		}
		if(this.dialogData && this.dialogData.title){
			this.title = this.dialogData.title;
		}
		this.getGroups();
		this.getPositions();
		this.ctrlFormGroup = this.fb.group({
			groupID: (this.data && this.data.groupID) ? this.data.groupID : 'all',
			name: (this.data && this.data.name) ? this.data.name : '',
			masses: (this.data && this.data.masses) ? this.data.masses : '',
			position: (this.data && this.data.position) ? this.data.position : 'all',
		})

	}

	getPositions() {
		let options = {
			filter: "contains(level, 'giao_xu')"
		}
		this.positionList = [];
		this.service.getPositions(options).pipe(take(1)).subscribe({
			next: (res: any) => {
				let items = []
				if (res && res.value && res.value.length > 0) {
					items = res.value;
				}
				this.positionList = items;
			}
		})
	}


	getGroups() {
		this.arrGroups = [];
		let options = {
			filter: "type eq 'giao_hat'"
		}
		this.service.getGroups(options).pipe(take(1)).subscribe({
			next: (res: any) => {
				let items = []
				if (res && res.value && res.value.length > 0) {
					items = res.value;
				}
				this.arrGroups = items;
			}
		})
	}

	closeDialog() {
		this.dialogRef.close(null)
	}

	onSearch() {
		this.data = null;
		timer(1000).pipe(takeUntil(this.unsubscribe)).subscribe({
			next:()=>{
				this.data = this.ctrlFormGroup.value;
			}
		})
	}

}
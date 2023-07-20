import { Component, Inject, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { take, takeUntil } from 'rxjs';
import { AppCustomDateAdapter, CUSTOM_DATE_FORMATS } from 'src/app/shared/date.customadapter';
import { SharedPropertyService } from 'src/app/shared/shared-property.service';
import { SharedService } from 'src/app/shared/shared.service';
import { SimpleBaseComponent } from 'src/app/shared/simple.base.component';

@Component({
	selector: 'app-event-info',
	templateUrl: './event-info.component.html',
	styleUrls: ['./event-info.component.scss'],
	providers: [
		{
			provide: DateAdapter,
			useClass: AppCustomDateAdapter
		},
		{
			provide: MAT_DATE_FORMATS,
			useValue: CUSTOM_DATE_FORMATS
		}
	]
})
export class EventInfoComponent extends SimpleBaseComponent {

	public dataItemGroup: FormGroup;
	public title: string = "Sự Kiện";
	public entityID: string = "";
	public entityName: string = "";
	public entityType: string = "";
	public localItem: any;
	public arrLocations: any[] = [];

	constructor(public override sharedService: SharedPropertyService,
		private fb: FormBuilder,
		private service: SharedService,
		public dialogRef: MatDialogRef<EventInfoComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) private dialogData: any) {
		super(sharedService);
		if (this.dialogData.item) {
			this.title = "Sửa Sự Kiện"
			this.localItem = this.dialogData.item;
		}
		if (this.dialogData.entityID) {
			this.entityID = this.dialogData.entityID;
		}
		if (this.dialogData.entityName) {
			this.entityName = this.dialogData.entityName;
		}
		if (this.dialogData.entityType) {
			this.entityType = this.dialogData.entityType;
		}
		this.dataItemGroup = this.initialEventGroup(this.localItem);
		this.getOrganizations();
	}

	initialEventGroup(item: any): FormGroup {
		return this.fb.group({
			id: item ? item.id : '',
			name: [item ? item.name : '', Validators.required],
			day: [item ? item.day : '', Validators.required],
			date: item ? item._date : '',
			type: [item ? item.type : 'ngay_ky_niem', Validators.required],
			description: item ? item.description : '',
			locationID: item ? item.locationID : (this.entityType == 'organization' ? this.entityID : ''),
			locationType: item ? item.locationType : (this.entityType == 'organization' ? 'organization' : ''),
			locationName: item ? item.locationName : (this.entityType == 'organization' ? this.entityName : ''),
		});
	}

	getOrganizations() {
		this.service.getOrganizations().pipe(take(1)).subscribe((res: any) => {
			let items = [];
			if (res && res.value && res.value.length > 0) {
				items = res.value;
				for (let item of items) {
					item._type = 'organization';
					switch (item.type) {
						case 'giao_xu':
							item.title = `Giáo xứ ${item.name}`;
							break;
						case 'dong_tu':
							item.title = `Dòng ${item.name}`;
							break;
						default:
							item.title = item.name;
							break;
					}
				}
			}
			this.arrLocations = items;

		})
	}

	onChangeValue(event: any, target: string) {
		if (target == "locationName") {
			if (!this.isNullOrEmpty(this.dataItemGroup.get("locationID").value)) {
				this.dataItemGroup.get("locationID").setValue(null);
			}
		}
	}

	valueChangeSelect(item: any, target: string) {
		if (target == "locationName") {
			this.dataItemGroup.get("locationID").setValue(item.id);
			this.dataItemGroup.get("locationType").setValue(item.type);
		}
	}

	closeDialog() {
		this.dialogRef.close(null)
	}

	onSaveItem() {
		let valueForm = this.dataItemGroup.value;
		let dataJSON = {
			"entityID": this.entityID,
			"entityType": this.entityType,
			"name": valueForm.name,
			"day": valueForm.day,
			"date": this.sharedService.ISOStartDay(valueForm.date),
			"description": valueForm.description,
			"locationName": valueForm.locationName,
			"locationID": valueForm.locationID,
			"locationType": valueForm.locationType
		}
		if (this.localItem && this.localItem.id) {
			this.dataProcessing = true;
			this.service.updateAnniversary(this.localItem.id, dataJSON).pipe(takeUntil(this.unsubscribe)).subscribe({
				next: () => {
					this.dataProcessing = false;
					this.dialogRef.close("OK")
				}
			})
		}
		else {
			this.dataProcessing = true;
			this.service.createAnniversary(dataJSON).pipe(takeUntil(this.unsubscribe)).subscribe({
				next: () => {
					this.dataProcessing = false;
					this.dialogRef.close("OK")
				}
			})
		}
	}
}

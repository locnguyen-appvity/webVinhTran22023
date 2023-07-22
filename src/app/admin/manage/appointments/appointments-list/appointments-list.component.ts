import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin, take, takeUntil } from 'rxjs';
import { SharedPropertyService } from 'src/app/shared/shared-property.service';
import { SharedService } from 'src/app/shared/shared.service';
import { Router } from '@angular/router';
import { TemplateGridApplicationComponent } from 'src/app/shared/template.grid.component';
import { LinqService } from 'src/app/shared/linq.service';
import { IAppState } from 'src/app/shared/redux/state';
import { Store } from '@ngrx/store';
import { LTYPE_ORG, STATUS_CLERGY } from 'src/app/shared/data-manage';
import { AppointmentsInfoComponent } from '../appointment-info/appointment-info.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormControl } from '@angular/forms';

@Component({
	selector: 'app-appointments-list',
	templateUrl: './appointments-list.component.html',
	styleUrls: ['./appointments-list.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class AppointmentsListComponent extends TemplateGridApplicationComponent implements OnChanges, AfterViewInit {

	@Input() entityID: string = '';
	public statusClergy: any[] = STATUS_CLERGY;
	public positionList: any[] = [];
	public clergysList: any[] = [];
	public entityList: any[] = [];
	public entityListCache: any[] = [];
	public entityTypeList: any[] = LTYPE_ORG;
	public filterClergyID: FormControl;
	public filterEntityID: FormControl;
	public filterTypeEntityID: FormControl;
	public filterStatus: FormControl;
	public filterEntity: string = '';

	constructor(
		public sharedService: SharedPropertyService,
		public linq: LinqService,
		public router: Router,
		public service: SharedService,
		public dialog: MatDialog,
		public snackbar: MatSnackBar,
		public store: Store<IAppState>
	) {
		super(sharedService, linq, store, service, snackbar);
		this.entityTypeList.unshift({
			code: 'all',
			name: 'Tất Cả Loại Nơi Bổ Nhiệm'
		})
		this.statusClergy.unshift({
			code: 'all',
			name: 'Tất Cả Trạng Thái'
		})
		this.filterClergyID = new FormControl('all');
		this.filterClergyID.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
			this.getDataGridAndCounterApplications();
		})
		this.filterTypeEntityID = new FormControl('all');
		this.filterTypeEntityID.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe((type: any) => {
			if (type == 'all') {
				this.entityList = this.entityListCache;
			}
			else {
				this.entityList = this.entityListCache.filter(it => it.type == type);
				this.entityList.unshift({
					order: '1',
					groupName: "All",
					type: 'all',
					id: 'all',
					_id: 'all',
					name: `Tất cả ${this.sharedService.updateTypeOrg(type)}`
				})
			}
			this.filterClergyID.setValue('all');
		})
		this.filterEntityID = new FormControl('all');
		this.filterEntityID.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
			this.getDataGridAndCounterApplications();
		})
		this.filterStatus = new FormControl('all');
		this.filterStatus.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
			this.getDataGridAndCounterApplications();
		})
		this.defaultSort = 'created desc';
		this.dataSettingsKey = 'user-list';
		this.getPositions();
		this.getClergies();
		this.getEntityList();
	}

	onSelectItem(event: any, target: string) {
		if (target == 'entityID') {
			this.filterEntity = "";
			if (event && event.id != 'all') {
				this.filterEntity = event.id;
			}
			this.getDataGridAndCounterApplications();
		}
	}

	getEntityList() {
		forkJoin({ organization: this.getOrganizations(), group: this.getGroups() }).pipe(take(1)).subscribe({
			next: (res: any) => {
				let items = [];
				if (res && res.organization && res.organization.length > 0) {
					items.push(...res.organization);
				}
				if (res && res.group && res.group.length > 0) {
					items.push(...res.group);
				}
				items.unshift({
					order: '1',
					groupName: "All",
					type: 'all',
					id: 'all',
					_id: 'all',
					name: 'Tất Cả Nơi Bổ Nhiệm'
				})
				this.entityListCache = items;
				this.entityList = items;
			}
		})
	}

	getOrganizations() {
		return new Observable(obs => {
			let options = {
				select: 'id,name,type',
				filter: this.getFilter(),
				// skip: 0,
				// top: 5
			}
			this.service.getOrganizations(options).pipe(take(1)).subscribe({
				next: (res: any) => {
					let items = []
					if (res && res.value && res.value.length > 0) {
						items.push(...res.value);
						for (let item of items) {
							item._id = `${item.type}_${item.id}`;
							// item._type = 'organization';
							item.groupName = this.sharedService.updateTypeOrg(item.type);
							// item.order = this.sharedService.getOrderTypeOrg(item.type);
							item.name = `${this.sharedService.updateNameTypeOrg(item.type)} ${item.name}`;
						}
					}
					obs.next(items);
					obs.complete();
				}
			})
		})
	}

	getGroups() {
		return new Observable(obs => {
			let options = {
				select: 'id,name,type',
				filter: this.getFilter(),
				// skip: 0,
				// top: 5
			}
			this.service.getGroups(options).pipe(take(1)).subscribe({
				next: (res: any) => {
					let items = []
					if (res && res.value && res.value.length > 0) {
						items.push(...res.value);
						for (let item of items) {
							item._id = `${item.type}_${item.id}`;
							item.name = `${this.sharedService.updateNameTypeOrg(item.type)} ${item.name}`;
							item.groupName = this.sharedService.updateTypeOrg(item.type);
						}
					}
					obs.next(items);
					obs.complete();
				}
			})
		})
	}

	getPositions() {
		// let options = {
		// 	filter: "type eq 'giao_xu'"
		// }
		this.positionList = [];
		this.service.getPositions().pipe(take(1)).subscribe({
			next: (res: any) => {
				let items = []
				if (res && res.value && res.value.length > 0) {
					items = res.value;
				}
				this.positionList = items;
				this.getDataGridAndCounterApplications();
			}
		})
	}

	getClergies() {
		this.clergysList = [];
		this.service.getClergies().pipe(take(1)).subscribe({
			next: (res: any) => {
				let items = []
				if (res && res.value && res.value.length > 0) {
					items = res.value;
					for (let item of items) {
						item.name = `${this.sharedService.getClergyType(item)} ${item.stName} ${item.name}`;
					}
				}
				items.unshift({
					id: 'all',
					name: 'Tất Cả Linh Mục'
				})
				this.clergysList = items;
			}
		})
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['entityID']) {
			this.getDataGridAndCounterApplications();
			this.registerGridColumns();
		}
	}

	getFilter() {
		let filter = '';
		if (!this.isNullOrEmpty(this.entityID)) {
			if (this.isNullOrEmpty(filter)) {
				filter = `entityID eq ${this.entityID}`;
			}
			else {
				filter = `(${filter}) and (entityID eq ${this.entityID})`;
			}
		}
		if (!this.isNullOrEmpty(this.filterEntity) && this.filterEntity != 'all') {
			if (this.isNullOrEmpty(filter)) {
				filter = `entityID eq  ${this.filterEntity}`;
			}
			else {
				filter = `(${filter}) and (entityID eq ${this.filterEntity})`;
			}
		}
		if (!this.isNullOrEmpty(this.filterStatus.value) && this.filterStatus.value != 'all') {
			if (this.isNullOrEmpty(filter)) {
				filter = `status eq '${this.filterStatus.value}'`;
			}
			else {
				filter = `(${filter}) and (status eq '${this.filterClergyID.value}')`;
			}
		}
		if (!this.isNullOrEmpty(this.filterClergyID.value) && this.filterClergyID.value != 'all') {
			if (this.isNullOrEmpty(filter)) {
				filter = `clergyID eq ${this.filterClergyID.value}`;
			}
			else {
				filter = `(${filter}) and (clergyID eq ${this.filterClergyID.value})`;
			}
		}
		if (!this.isNullOrEmpty(this.filterTypeEntityID.value) && this.filterTypeEntityID.value != 'all') {
			if (this.isNullOrEmpty(filter)) {
				filter = `entityType eq '${this.filterTypeEntityID.value}'`;
			}
			else {
				filter = `(${filter}) and (entityType eq '${this.filterTypeEntityID.value}')`;
			}
		}
		if (!this.isNullOrEmpty(this.searchValue)) {
			let quick = this.searchValue.replace("'", "`");
			quick = this.sharedService.handleODataSpecialCharacters(quick);
			let quickSearch = `contains(tolower(name), tolower('${quick}'))`;
			if (this.isNullOrEmpty(filter)) {
				filter = quickSearch;
			}
			else {
				filter = "(" + filter + ")" + " and (" + quickSearch + ")";
			}
		}
		return filter;
	}


	getDataGridAndCounterApplications() {
		this.getDataGridApplications();
	}

	getDataGridApplications() {
		let options = {
			filter: this.getFilter(),
			sort: 'effectiveDate desc'
		}
		if (this.subscription['getAppointments']) {
			this.subscription['getAppointments'].unsubscribe();
		}
		this.dataProcessing = true;
		this.subscription['getAppointments'] = this.service.getAppointments(options).pipe(take(1)).subscribe((res: any) => {
			let dataItems = [];
			let total = res.total || 0;
			if (res && res.value && res.value.length > 0) {
				dataItems = res.value;
				for (let item of dataItems) {
					item.disabledItem = false;
					item.readyLoadExpand = false;
					this.handleDataItem(item);
				}
			}
			this.gridDataChanges.data = dataItems;
			this.gridDataChanges.total = total;
			this.gridMessages = this.sharedService.displayGridMessage(this.gridDataChanges.total);
			this.dataProcessing = false;
			if (this.subscription['getAppointments']) {
				this.subscription['getAppointments'].unsubscribe();
			}

		})
	}

	handleDataItem(item: any) {
		item.statusView = this.updateStatus(item);
		this.getPosition(item);
		if (item.created) {
			item._created = this.sharedService.convertDateStringToMoment(item.created, this.offset);
			item.createdView = item._created.format('DD/MM/YYYY hh:mm A');
		}
		if (item.effectiveDate) {
			item._effectiveDate = this.sharedService.convertDateStringToMoment(item.effectiveDate, this.offset);
			item.effectiveDateView = this.sharedService.formatDate(item._effectiveDate);
		}
		if (item.fromDate) {
			item._fromDate = this.sharedService.convertDateStringToMoment(item.fromDate, this.offset);
			item.fromDateView = this.sharedService.formatDate(item._fromDate);
		}
		if (item.toDate) {
			item._toDate = this.sharedService.convertDateStringToMoment(item.toDate, this.offset);
			item.toDateView = this.sharedService.formatDate(item._toDate);
		}
	}

	getPosition(item: any) {
		item.positionView = 'Chưa xác định'
		if (!this.isNullOrEmpty(item.position)) {
			let position = this.sharedService.getValueAutocomplete(item.position, this.positionList, 'code');
			if (position && position.name) {
				item.positionView = position.name;
			}
		}
	}

	updateStatus(item: any) {
		for (let status of this.statusClergy) {
			if (item.status == status.code) {
				return status.name;
			}
		}
		return "Không Xác Định";
	}

	onDeactive(item: any) {
		let dataJSON = {
			status: 'inactive',
		}
		this.service.updateAppointment(item.id, dataJSON).pipe(take(1)).subscribe({
			next: () => {
				let snackbarData: any = {
					key: 'inactivate-item',
					message: 'Ẩn Thành Công'
				};
				this.showInfoSnackbar(snackbarData);
				this.getDataGridApplications();
			}
		})
	}

	openNewTab(element: any,target: string) {
		let link = '';
		if(target == 'clergy'){
			link = `./#/admin/manage/clergys/clergy/${element.clergyID}`;
		}
		else {
			link = `./#/admin/manage/${element.entityType}/detail/${element.entityID}`;
		}
		console.log('');
		
		// this.router.navigate([]).then(() => {
			window.open(link, '_blank');
		// });
	}

	onUpdateStatus(item: any, status: string) {
		let dataJSON = {
			status: status,
		}
		this.service.updateAppointment(item.id, dataJSON).pipe(take(1)).subscribe({
			next: () => {
				let snackbarData: any = {
					key: 'activate-item',
					message: 'Hiện Thành Công'
				};
				this.showInfoSnackbar(snackbarData);
				this.getDataGridApplications();
			}
		})
	}

	addItem(item?: any) {
		let config: any = {
			data: {
				target: 'new',
				clergyID: item ? item.clergyID : ''
			}
		};
		config.disableClose = true;
		config.panelClass = 'dialog-form-l';
		config.maxWidth = '80vw';
		config.autoFocus = true;
		let dialogRef = this.dialog.open(AppointmentsInfoComponent, config);
		dialogRef.afterClosed().pipe(takeUntil(this.unsubscribe)).subscribe({
			next: (res: any) => {
				let snackbarData: any = {
					key: ''
				};
				if (res === 'OK') {
					snackbarData.key = 'new-item';
					snackbarData.message = 'Thêm Giáo Xứ Thành Công';
					this.showInfoSnackbar(snackbarData);
					this.getDataGridApplications();
				}
			}
		});
	}

	getRowSelected(item: any, action: string) {
		if (this.isNullOrEmpty(this.entityID)) {
			let config: any = {
				data: {
					target: 'edit',
					// entityID: item.entityID,
					// entityName: item.entityName,
					// entityType: item.entityType,
					item: item,
					clergyID: item.clergyID,
					clergyName: item.clergyName,
					action: action
				}
			};
			config.disableClose = true;
			config.panelClass = 'dialog-form-l';
			config.maxWidth = '80vw';
			config.autoFocus = true;
			let dialogRef = this.dialog.open(AppointmentsInfoComponent, config);
			dialogRef.afterClosed().pipe(takeUntil(this.unsubscribe)).subscribe({
				next: (res: any) => {
					let snackbarData: any = {
						key: ''
					};
					if (res === 'OK') {
						snackbarData.key = 'new-item';
						snackbarData.message = 'Thêm Giáo Xứ Thành Công';
						this.showInfoSnackbar(snackbarData);
						this.getDataGridApplications();
					}
				}
			});
		}
	}

	onDelete(item: any) {
		this.dataProcessing = true;
		this.service.deleteAppointment(item.id).pipe(take(1)).subscribe(() => {
			this.dataProcessing = false;
			let snackbarData: any = {
				key: 'delete-item',
				message: 'Xóa Thành Công'
			};
			this.showInfoSnackbar(snackbarData);
			this.getDataGridApplications();
		})
	}

	registerGridColumns() {
		if (!this.isNullOrEmpty(this.entityID)) {
			this.displayColumns = ['id', 'clergyName', 'entityName', 'status', 'appointerName', 'effectiveDate', 'created'];
		}
		else {
			this.displayColumns = ['id', 'clergyName', 'entityName', 'status', 'appointerName', 'effectiveDate', 'created', 'moreActions'];
		}
	}

	toggleExpandElements(item: any) {
		if (item.readyLoadExpand) {
			item._expand_detail = !item._expand_detail;
			return;
		}
		if (!this.isNullOrEmpty(item.fromAppointmentID)) {
			this.service.getAppointment(item.fromAppointmentID).pipe(take(1)).subscribe({
				next: (res: any) => {
					this.handleDataItem(res);
					item.readyLoadExpand = true;
					item.expandData = res;
					item._expand_detail = !item._expand_detail;

				}
			})
		}
		else {
			item.readyLoadExpand = true;
			item._expand_detail = !item._expand_detail;
		}
	}


}

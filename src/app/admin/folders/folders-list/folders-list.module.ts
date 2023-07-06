import { NgModule } from '@angular/core';
import { FoldersListComponent } from './folders-list.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ListItemsBaseModule } from 'src/app/controls/list-item-base/list-item.base.module';
import { FolderInfoModule } from '../../../controls/folder-info/folder-info.module';
import { FoldersTreeModule } from '../../../controls/folders-tree/folders-tree.module';

@NgModule({
  declarations: [
    FoldersListComponent
  ],
  imports: [
    SharedModule,
    MatDividerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ListItemsBaseModule,
    FolderInfoModule,
    FoldersTreeModule
  ],
  exports: [FoldersListComponent]
})
export class FoldersListModule { }

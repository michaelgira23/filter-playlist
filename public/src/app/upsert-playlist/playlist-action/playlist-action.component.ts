import { Component, Input, OnInit } from '@angular/core';

import { Action } from '../../../model/actions';

@Component({
	selector: 'app-playlist-action',
	templateUrl: './playlist-action.component.html',
	styleUrls: ['./playlist-action.component.scss']
})
export class PlaylistActionComponent implements OnInit {

	@Input() action: Action;

	constructor() { }

	ngOnInit() {
	}

}

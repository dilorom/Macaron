import Reflux from 'reflux';


var vticonActions = Reflux.createActions(
	[
		'newKeyframe',

		'selectKeyframe',
		'selectKeyframes',
		'addSelectedKeyframe',
		'addSelectedKeyframes',
		'addToggleSelectedKeyframe',
		'selectKeyframesInRange',
		'addSelectedKeyframesInRange',
		'unselectKeyframe',
		'unselectKeyframes',

		'moveSelectedKeyframes',

		'deleteSelectedKeyframes'
	]

);


var vticonStore = Reflux.createStore({

	listenables: [vticonActions],

	init : function() {
		this._data = {
						duration: 3000, //ms

						parameters: {
							amplitude: {
								valueScale:[0,1], //normalized
								data : [
									{ id: 0, t: 600, value:0.5, selected:false}, 
									{ id: 1, t: 1500, value:1, selected:false},
									{ id: 2, t: 3000, value:0, selected:false}]
							},

							frequency: {
								valueScale:[50,500], //Hz
								data : [
									{ id: 3, t: 0, value:250, selected:false}, 
									{ id: 4, t: 1200, value:50, selected:false},
									{ id: 5, t: 1800, value:500, selected:false}]
							}
						}
					};

		this._kfuidCount = 0;
		for (var p in this._data.parameters) {
			for (var d in this._data.parameters[p].data)
			{
				this._kfuidCount += 1;
			}
		}
	},

	getInitialState : function() {
		return this._data;

	},

	onNewKeyframe(parameter, t, value, addToSelection=false) {
		var new_id = this._getNewKFUID();
		this._data.parameters[parameter].data.push({
			id:new_id,
			t:t,
			value:value,
			selected:true
		});

		this._data.parameters[parameter].data.sort(this._keyframeCompare);

		if (addToSelection)
		{
			this.trigger(this._data);
		} else {
			this.onSelectKeyframe(new_id);
		}
	},

	/**
	* Selection
	*/

	onSelectKeyframe(id) {
		this._setSelectedKeyframes([id], true);
	},

	onSelectKeyframes(ids) {
		this._setSelectedKeyframes(ids, true);
	},

	onAddSelectedKeyframe(id) {
		this._setSelectedKeyframes([id], false);
	},

	onAddSelectedKeyframes(ids) {
		this._setSelectedKeyframes(ids, true);
	},

	onAddToggleSelectedKeyframe(id) {
		for (var p in this._data.parameters) {
			for (var i = 0; i < this._data.parameters[p].data.length; i++) {
				if(this._data.parameters[p].data[i].id == id)
				{
					this._data.parameters[p].data[i].selected = !this._data.parameters[p].data[i].selected;
				}
			}
		}
		this.trigger(this._data);
	},

	onUnselectKeyframe(id) {
		this._setUnselectedKeyframes([id], false);
	},

	onUnselectKeyframes() {
		for (var p in this._data.parameters) {
			for (var i = 0; i < this._data.parameters[p].data.length; i++) {
					this._data.parameters[p].data[i].selected = false;
			}
		}
		this.trigger(this._data);
	},

	//Range select
	onSelectKeyframesInRange(time1, time2, parameter_value_map) {
		var ids = this._getKFIDSInRange(time1, time2, parameter_value_map);
		this._setSelectedKeyframes(ids, true);

	},

	onAddSelectedKeyframesInRange(time1, time2, parameter_value_map) {
		var ids = this._getKFIDSInRange(time1, time2, parameter_value_map);
		this._setSelectedKeyframes(ids, false);
	},

	//helpers
	//need to refactor into one function at some point?

	_getKFIDSInRange(time1, time2, parameter_value_map) {
		var tLeft = time1;
		var tRight = time2;
		if(tLeft > tRight)
		{
			tLeft = time2;
			tRight = time1;
		}

		var rv =[];

		for (var p in parameter_value_map) {
			var vTop = parameter_value_map[p].value1;
			var vBottom = parameter_value_map[p].value2;
			if(vTop < vBottom)
			{
				vTop = parameter_value_map[p].value2;
				vBottom = parameter_value_map[p].value1;
			}

			for (var i = 0; i < this._data.parameters[p].data.length; i++) {
					if(this._data.parameters[p].data[i].t >= tLeft
						&& this._data.parameters[p].data[i].t <= tRight
						&& this._data.parameters[p].data[i].value <= vTop
						&& this._data.parameters[p].data[i].value >= vBottom)
					{
						rv.push(this._data.parameters[p].data[i].id);
					}
				}
		}

		return rv;
	},

	_setSelectedKeyframes(ids, setUnselected) {
		for (var p in this._data.parameters) {
			for (var i = 0; i < this._data.parameters[p].data.length; i++) {
				if (ids.indexOf(this._data.parameters[p].data[i].id) >= 0 ) {
					this._data.parameters[p].data[i].selected = true;
				} else if (setUnselected) {
					this._data.parameters[p].data[i].selected = false;
				}
			}
		}
		this.trigger(this._data);
	},

	_setUnselectedKeyframes(ids, setSelected) {
		for (var p in this._data.parameters) {
			for (var i = 0; i < this._data.parameters[p].data.length; i++) {
				if (ids.indexOf(this._data.parameters[p].data[i].id) >= 0 ) {
					this._data.parameters[p].data[i].selected = false;
				} else if (setSelected) {
					this._data.parameters[p].data[i].selected = true;
				}
			}
		}
		this.trigger(this._data);
	},

	/**
	* Move Keyframes
	*/

	onMoveSelectedKeyframes(dt, dv) {
		for (var p in this._data.parameters) {
			for (var i = 0; i < this._data.parameters[p].data.length; i++) {
					if (this._data.parameters[p].data[i].selected) {
						this._data.parameters[p].data[i].t += dt;
						this._data.parameters[p].data[i].value += dv[p];
					}
			}
			this._data.parameters[p].data.sort(this._keyframeCompare);
		}
		this.trigger(this._data);
	},

	/**
	* Delete Keyframes
	*/

	onDeleteSelectedKeyframes() {

		var kfNotSelected = function(value) {
			return !value.selected;
		};

		for (var p in this._data.parameters) {
			this._data.parameters[p].data = this._data.parameters[p].data.filter(kfNotSelected);
			if (this._data.parameters[p].data.length == 0) {
				//can't have an empty keyframe track, create new keyframe
				var new_id = this._getNewKFUID(p);
				var new_t = this._data.duration/2;
				//assign a midway value
				var new_value = (this._data.parameters[p].valueScale[0] + this._data.parameters[p].valueScale[1])/2; 

				this._data.parameters[p].data.push({
					id:new_id,
					t:new_t,
					value:new_value,
					selected:false
				});
			}
		}

		this.trigger(this._data);
	},


	/**
	* KFUID helper functions
	*/

	//returns a new, unique, kfid
	_getNewKFUID(parameter) {
		this._kfuidCount  += 1;
		return this._kfuidCount;
	},

	//compares two keyframes
	_keyframeCompare(a, b) {
		return (a.t - b.t);
	}



	});




module.exports = {
	actions:vticonActions,
	store:vticonStore
};
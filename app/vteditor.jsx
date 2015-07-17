
import React from 'react';
import Reflux from 'reflux';


var ControlBar = require('./controlbar.jsx');
var SoundGen = require('./soundgen.jsx'); //TODO
var PlayHead = require('./playhead.jsx');
var IconVis = require('./iconvis.jsx');
var KeyframeEditor = require('./keyframeeditor.jsx');
var PlaybackStore = require('./stores/playbackstore.js');
var VTIconStore = require('./stores/vticonstore.js');



var VTEditor = React.createClass({
	mixins : [
				Reflux.connect(PlaybackStore.store, 'playback'), //emitted updates go to 'playback' key
				Reflux.connect(VTIconStore.store, 'vticon') //emitted updates go to 'vticon' key			
	],

	getInitialState : function () {
		return {}; //handled as stores
	},


	//returns parameter value for a given time
	interpolateParameter: function(p, t) {
		var param = this.state.vticon.parameters[p];
		var data = param.data;
		var prev = null;
		var next = null;

		var rv = null;

		for(var i = 0; i < data.length; i++)
		{
			
			if (data[i].t == t)
			{
				rv = data[i].value;
			}
			else if (data[i].t < t) 
			{
				if (prev == null || prev.t <= data[i].t) {
					prev = data[i];
				}
			} else {
				if (next == null || next.t >= data[i].t) {
					next = data[i];
				}
			}
		}

		if (rv == null)
		{

			if (next == null && prev == null) {
			//if no exact match was found
			if (rv == null)
			{
				//error
				throw "No keyframes found in parameter " + p;
			}
			//if an exact match was found, we already stored rv
				
			} else if (next == null) {
				//use prev
				rv = prev.value;
			} else if (prev == null) {
				//use next
				rv = next.value;
			} else {
				//TODO: not just linear interpolation
				if (prev.t == next.t) 
				{
					rv = prev.value;
				} else {
					var dt = next.t-prev.t;
					var proportionPrev = (t-prev.t)/dt;
					var dvalue = next.value - prev.value;
					rv = proportionPrev*dvalue + prev.value;
					/*
					console.log("INTERPOLATE");
					console.log(t);
					console.log(prev.t, prev.value);
					console.log(next.t, next.value);
					console.log(dt, dvalue);
					console.log(proportionPrev);
					console.log(rv);*/
				}
			}

		}
	
		return rv;

	} ,

	//returns parameter values as a dictionary for a given time
	interpolateParameters: function(t) {
		var interpolateParameter = this.interpolateParameter;
		//map _interpolateParameter to vticon keys
		return Object.keys(this.state.vticon.parameters).reduce( function(obj, p) 
			{
				obj[p] = interpolateParameter(p, t);
				return obj;
			}, {});
	} ,

	getDefaultProps: function() {

		return {
			keyframeCircleRadius:5,
			playheadFill:"red"
		}

	},
	
	render : function() {

		var frequency = this.interpolateParameter('frequency', this.state.playback.currentTime);
		var amplitude = this.interpolateParameter('amplitude', this.state.playback.currentTime);

		return (
			<div id="app">
				<ControlBar playing={this.state.playback.playing} mute={this.state.playback.mute}/>
				<SoundGen frequency={frequency} amplitude={amplitude} mute={this.state.playback.mute} />
				<PlayHead currentTime={this.state.playback.currentTime} duration={this.state.vticon.duration} keyframeCircleRadius={this.props.keyframeCircleRadius} playheadFill={this.props.playheadFill}/>
				<IconVis vticon={this.state.vticon} currentTime={this.state.playback.currentTime} keyframeCircleRadius={this.props.keyframeCircleRadius} playheadFill={this.props.playheadFill} interpolateParameters={this.interpolateParameters} interpolateParameter={this.interpolateParameter}/>
				{Object.keys(this.state.vticon.parameters).map( (p) => (
						<KeyframeEditor currentTime={this.state.playback.currentTime} parameter={p} vticon={this.state.vticon} keyframeCircleRadius={this.props.keyframeCircleRadius} playheadFill={this.props.playheadFill}/>
					))}
			</div>);
		}

	});


module.exports = VTEditor;

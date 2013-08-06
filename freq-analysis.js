'use strict';

var Input = {
    MICROPHONE: 1,
    OSCILLATOR: 2
}

var Analyser = function(defaultOptions, task) {
    // The default options.
    defaultOptions = defaultOptions || {};
    this.options = {
        input: defaultOptions.input || Input.MICROPHONE,
        freq: defaultOptions.freq || 400,
        fftSize: defaultOptions.fftSize || 2048,
        playback: defaultOptions.playback || false
    };

    // Set the task.
    if (typeof task === 'function') {
        this.task = task;
    } else {
        this.task = function() { /* Do nothing. */ };
    }

    // Vendor routes.
    navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    // Set up the AudioContext.
    this.context = new window.AudioContext();

    // Set up the analyser.
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = this.options.fftSize;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    // Make sure some variables are accessible.
    this.input;
    this.rafID;

    // Iinitialize the input.
    this.initInput();
}

Analyser.prototype.initInput = function() {
    if (this.options.input === Input.MICROPHONE) {
        // Fetch the user microphone.
        navigator.getUserMedia({audio: true}, this.initMicrophone.bind(this), function(e) { console.error(e); });
    } else if (this.options.input === Input.OSCILLATOR) {
        // Fetch the user microphone.
        this.initOscillator.call(this);
    }
}

Analyser.prototype.initMicrophone = function(stream) {
    // Set up the microphone like a stream source.
    this.input = this.context.createMediaStreamSource(stream);

    // Connect the microphone to the analyser.
    this.input.connect(this.analyser);

    // Initialize the playback.
    this.initPlayback();

    // Go ahead to the update loop.
    this.update();
}

Analyser.prototype.initOscillator = function() {
    // Setup the oscillator.
    if (this.input) this.stopInput();
    this.input = this.context.createOscillator();
    this.input.frequency.value = this.options.freq;
    this.input.start(0);

    // Connect it to the analyser.
    this.input.connect(this.analyser);

    // Initialize the playback.
    this.initPlayback();

    // Go ahead to the update loop.
    this.update();
}

Analyser.prototype.setFrequency = function(freq) {
    return this.input.frequency.value = freq;
}

Analyser.prototype.initPlayback = function() {
    // If the playback option is set to true,
    // go ahead and connect the analyser so we can hear it.
    if (this.options.playback) {
        this.analyser.connect(this.context.destination);
    }
}

Analyser.prototype.update = function() {
    // This is the main loop, all it does is to update the frequency data.
    this.analyser.getByteFrequencyData(this.freqData);

    // User defined thingys.
    this.task();

    // Then make the update loop.. loop.
    this.rafID = requestAnimationFrame(this.update.bind(this));
}

Analyser.prototype.startInput = function() {
    // Since you cant start an AudioBufferSourceNode after it has once been stopped,
    // we have to re-connect it, therefore calling to initialize.
    this.initOscillator();
}

Analyser.prototype.stopInput = function() {
    this.input.stop(0);
    cancelAnimationFrame(this.rafID);
}

Analyser.prototype.task = function() {
    // The user defined task to run, remember that `this` in the task is the Analyser instance.
    this.task();
}
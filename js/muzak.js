function loadAudio (context, fileDict, callback) {
    var soundNames = Object.keys(fileDict);
    var downloaded = {};
    soundNames.forEach(function (soundName) {
        var fileName = fileDict[soundName];

        // Load buffer asynchronously
        var request = new XMLHttpRequest();
        request.open("GET", fileName, true);
        request.responseType = "arraybuffer";

        request.onload = function() {
            // Asynchronously decode the audio file data in request.response
            context.decodeAudioData(request.response, function(buffer) {
                if (!buffer) {
                    callback(new Error('error decoding file data: ' + fileName));
                    callback = function () {}
                    return;
                }
                downloaded[soundName] = buffer;
                if (Object.keys(downloaded).length === soundNames.length)
                    callback(undefined, downloaded);
            }, function(error) {
                console.error('decodeAudioData error', error);
                callback(error);
            });
        };

        request.onerror = function() {
            console.error('BufferLoader: XHR error');
            callback(error);
        };

        request.send();
    });
}

function Sequencer (context, samples) {
    this.context = context;
    this.samples = samples;

    this.BPM = 300;
    this._tickerId = null;
    this._pos = null;
    this._seqMap = [];
}

Sequencer.prototype = {
    setSequence: function (text) {
        var lines = text.split('\n');
        var parsedSeq = lines.reduce(function (seq, line) {
            line.split('').forEach(function (letter, i) {
                var beatIndex = 3*i;
                if (seq[beatIndex] === undefined)
                    seq[beatIndex] = [];
                if (seq[beatIndex+1] === undefined)
                    seq[beatIndex+1] = [];
                if (seq[beatIndex+2] === undefined)
                    seq[beatIndex+2] = [];

                if (letter.toLowerCase() === letter)
                    seq[beatIndex].push(letter);
                else {
                    var lower = letter.toLowerCase();
                    seq[beatIndex].push(lower);
                    seq[beatIndex+1].push(lower);
                    seq[beatIndex+2].push(lower);
                }
            });
            return seq;
        }, []);

        this._seqMap = parsedSeq;
    },

    start: function () {
        var self = this;
        if (self.BPM <= 0 || isNaN(self.BPM))
            return;
        if (self._tickerId != null)
            clearInterval(self._tickerId);
        var secondsPerBeat = 60 / self.BPM;
        var msPerBeat = secondsPerBeat * 1000;
        var msPerTriplet = msPerBeat / 3;

        self._pos = 0;
        self._tickerId = setInterval(self.tick.bind(self), msPerTriplet);
    },

    tick: function () {
        var self = this;
        if (self._seqMap.length === 0)
            return;
        if (self._pos > self._seqMap.length - 1)
            self._pos = 0;
        var notes = self._seqMap[self._pos];
        notes.filter(function (note) {
            return note !== ' ';
        }).forEach(function (note) {
            var source = self.context.createBufferSource();
            source.connect(self.context.destination);
            source.buffer = self.samples[note];
            source.start(0);
        });
        self._pos++;
    },
};

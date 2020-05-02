# MckMixer

## Features

- [X] Mixing mono and stereo channel to a stereo master bus
- [X] Delay FX Bus
  - [ ] Feedback Filtering
  - [ ] Ping pong delay
  - [ ] Tempo and Time mode switchable (secs vs tabs per step)
  - [ ] Tempo sync (MIDI)
- [X] Reverb FX Bus
  - [X] More reverb type
  - [ ] More reverb controls
- [X] HTML GUI with websocket communication
  - [X] Sleek design
  - [ ] Dark theme
- [X] Saving and loading JACK connections
  - [X] Controlling connections from GUI
- [ ] MIDI Control
  - [ ] Settings page with MIDI learn
- [ ] Master bus recording
  - [ ] Looper functionality with MIDI sync, MIDI control & overdubbing
  - [ ] Define folder for recordings
- [ ] Architecture
  - [X] Bind JACK ports to channel buffer
  - [ ] Save & load presets on the fly
  - [ ] Backup folder for presets / config


## Building

### Build dependencies

```
sudo apt install libfftw3-dev libjack-jackd2-dev

sudo ld-config
```

### Build steps

```
git clone ...
cd MckMixer
git submodule update --init --recursive

cd freeverb3
./autogen.sh
./configure
make
sudo make install

cd gui
npm install
# npm update
npm run build

make
```
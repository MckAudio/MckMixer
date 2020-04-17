# MckMixer

## Features

- [X] Mixing mono and stereo channel to a stereo master bus
- [X] Delay FX Bus
  - [ ] Feedback Filtering
  - [ ] Ping pong delay
  - [ ] Tempo and Time mode switchable (secs vs tabs per step)
  - [ ] Tempo sync (MIDI)
- [X] Reverb FX Bus
  - [ ] More reverb type
  - [ ] More reverb controls
- [X] HTML GUI with websocket communication
  - [ ] Sleek design
- [ ] Saving and loading JACK connections
  - [ ] Controlling connections from GUI
- [ ] MIDI Control
- [ ] Master bus recording
- [ ] Architecture
  - [ ] Bind JACK ports to channel buffer


## Building

### Build dependencies

```
sudo apt install libfftw3-dev libjack-jackd2-

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
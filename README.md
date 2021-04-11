# MckMixer


## Building

### Build dependencies

```

# Debian / Ubuntu

sudo apt install build-essentials nodejs npm
sudo apt install libfftw3-dev libjack-jackd2-dev zlib1g-dev libsndfile1-dev

sudo ld-config


# Fedora

sudo dnf install make automake libtool gcc-c++ nodejs npm
sudo dnf install fftw-devel jack-audio-connection-kit-devel zlib-devel libsndfile-devel

sudo ldconfig -v

```

### Build steps

```
git clone ...
cd MckMixer

make dependencies

make gui

make
```

## Debugging

Open the folder in VS Code and run ```make debug``` and ```cd gui && npm run dev```. Then use the run and debug target.

The svelte gui can be debugged with an webkit enabled browser like epiphany on ```inspector://127.0.0.1:1234```.

## Build issues

If libfreeverb3 is not found, add /usr/local/lib to /etc/ld.conf or in separate .conf file in the directory /etc/ld.conf.d/ and run sudo ldconfig -v.

## Known Issues

- [ ] GUI Directory (www) is relative to executable
- [ ] Install directory for freeverb3 lib on Fedora is wrong

## TODO

- [ ] Cleanup Makefile

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
- [ ] Metering
  - [ ] Pre/Post Meters for Inputs
  - [ ] Master Meter for Outputs
  - [ ] Oscillograph view for output / maybe input

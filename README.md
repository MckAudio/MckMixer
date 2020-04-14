# MckMixer

## Build dependencies

```
sudo apt install libfftw3-dev libjack-jackd2-dev
```

## Build steps

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

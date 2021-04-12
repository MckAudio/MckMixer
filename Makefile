CXX = g++

DEB_FLAGS = -O0 -DDEBUG -ggdb3 -Wall
REL_FLAGS = -O2 -DNDEBUG

OBJS = $(addsuffix .o, $(basename $(notdir $(SOURCES))))

LSRCS = ./src/main.cpp ./src/MckTypes.cpp ./src/MckMixer.cpp ./src/MckDelay.cpp ./src/MckRecorder.cpp ./src/MckLooper.cpp ./src/MckControl.cpp ./helper/JackHelper.cpp ./helper/DspHelper.cpp ./helper/Metronome.cpp ./helper/Transport.cpp ./src/gui/GuiWindow.cpp
LMINCS = -I./src -I./helper -I/usr/local/include/libfreeverb3-3
LMINCS += -I./src/gui -I./src/gui/json/include

LMLIBS = -L/usr/local/lib -lfreeverb3 -ljack -lz -lsndfile -lpthread
LMLIBS += `pkg-config --cflags --libs gtk+-3.0 webkit2gtk-4.0`

release:
	mkdir -p bin/release
	g++ $(REL_FLAGS) --std=c++17 $(LMINCS) $(LSRCS) -o ./bin/release/mck-mixer $(LMLIBS)

production:
	mkdir -p bin/dist
	g++ -DPRODUCTION $(REL_FLAGS) --std=c++17 $(LMINCS) $(LSRCS) -o ./bin/dist/mck-mixer $(LMLIBS)

debug:
	mkdir -p ./bin/debug
	g++ $(DEB_FLAGS) --std=c++17 $(LMINCS) $(LSRCS) -o ./bin/debug/mck-mixer $(LMLIBS)

run:
	WEBKIT_INSPECTOR_SERVER=127.0.0.1:1234 ./bin/release/mck-mixer

install: gui production
	mkdir -p /usr/share/mck-mixer/gui/
	cp ./bin/dist/mck-mixer /usr/bin/
	cp -r ./www/* /usr/share/mck-mixer/gui/
	cp -r ./ressource/*.desktop /usr/share/applications/

test:
	cd gui && ls
	ls
	cd freeverb3

dependencies:
	git submodule update --init --recursive
	cd freeverb3 && ./autogen.sh && ./configure && make && sudo make install
	cd gui && npm install && npm install svelte@3.24.1 && npm run build

.PHONY: gui
gui:
	cd gui && npm run build

#old:
#	g++ ./src/main.cpp -o simplerev --std=c++17 -I/usr/local/include/libfreeverb3-3 -L/usr/local/lib -lfreeverb3 -ljack
#
#%.o: ./src/%.cpp
#	$(CXX) $(CXXFLAGS) -c -o $@ $<
#
#%.o: ./imgui/%.cpp
#	$(CXX) $(CXXFLAGS) -c -o $@ $<
#
#%.o: ./imgui/examples/%.cpp
#	$(CXX) $(CXXFLAGS) -c -o $@ $<
#
#%.o: ./imgui/examples/libs/gl3w/GL/%.c
#	$(CC) $(CXXFLAGS) -c -o $@ $<
#
#$(BIN): $(OBJS)
#	$(CXX) -o $@ $^ $(CXXFLAGS) $(LIBS)

.PHONY: clean
clean:
	rm simplerev || true
	rm wxrev || true
	rm mck-* || true
	rm *.o || true
	rm bin/* || true
	rm uWebSockets/uSockets/*.o || true
	rm uWebSockets/uSockets/*.a || true
	rm www/build/* || true
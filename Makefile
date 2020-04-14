CXX = g++

DEB_FLAGS = -O0 -DDEBUG -ggdb3

BIN = simpleguirev
SOURCES = ./src/guirev.cpp
SOURCES += ./imgui/examples/imgui_impl_glfw.cpp ./imgui/examples/imgui_impl_opengl3.cpp
SOURCES += ./imgui/imgui.cpp ./imgui/imgui_demo.cpp ./imgui/imgui_draw.cpp ./imgui/imgui_widgets.cpp

CXXFLAGS = -I./imgui/ -I./imgui/examples/ -I./src/
CXXFLAGS += -g -Wall -Wformat

# OpenGL loader gl3w
SOURCES += ./imgui/examples/libs/gl3w/GL/gl3w.c
CXXFLAGS += -I./imgui/examples/libs/gl3w -DIMGUI_IMPL_OPENGL_LOADER_GL3W

LIBS = -lGL `pkg-config --static --libs glfw3`
CXXFLAGS += `pkg-config --cflags glfw3` 


# Freeverb
LIBS += -L/usr/local/lib -lfreeverb3
CXXFLAGS += -I/usr/local/include/libfreeverb3-3
# JACK
LIBS += -ljack
# Websockets
LIBS += -lwebsockets

OBJS = $(addsuffix .o, $(basename $(notdir $(SOURCES))))

LSRCS = ./src/main.cpp ./src/MckTypes.cpp ./src/MckMixer.cpp
LMINCS = -I./src -I/usr/local/include/libfreeverb3-3 -I./uWebSockets/src -I./uWebSockets/uSockets/src -I./json/single_include
LMLIBS = -L/usr/local/lib -lfreeverb3 -ljack ./uWebSockets/uSockets/*.o -lz


default:
	cd ./uWebSockets/uSockets && make
	g++ $(LSRCS) -o mck-mixer $(DEB_FLAGS) --std=c++17 $(LMINCS) $(LMLIBS)

old:
	g++ ./src/main.cpp -o simplerev --std=c++17 -I/usr/local/include/libfreeverb3-3 -L/usr/local/lib -lfreeverb3 -ljack

gui: $(BIN)
	@echo Building simple reverb with GUI

%.o: ./src/%.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

%.o: ./imgui/%.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

%.o: ./imgui/examples/%.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

%.o: ./imgui/examples/libs/gl3w/GL/%.c
	$(CC) $(CXXFLAGS) -c -o $@ $<

$(BIN): $(OBJS)
	$(CXX) -o $@ $^ $(CXXFLAGS) $(LIBS)

wxrev:
	g++ ./src/wxrev.cpp -o guirev `wx-config --cppflags` `wx-config --libs`

.PHONY clean:
	rm simplerev || true
	rm wxrev || true
	rm mck-* || true
	rm *.o || true
	rm bin/* || true
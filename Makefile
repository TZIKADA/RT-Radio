# Makefile for the CS-ESP-S0 board (ESP32-WROOM-32D-N16, 16 MB flash)
#
# Settings taken from the Arduino IDE 2 log:
#   core esp32 3.3.12, esptool 5.3.1, port /dev/ttyUSB0, 921600 baud,
#   flash layout: bootloader 0x1000, partitions 0x8000, boot_app0 0xe000, app 0x10000
#
# The IDE log did not include the compile commands (it reused cached objects),
# so compiling is delegated to arduino-cli, which uses the same esp32 core and
# toolchain as the IDE. Flashing uses esptool directly, as in the log.
#
# Usage:
#   make            compile
#   make flash      compile and upload
#   make run        compile, upload, then open the serial monitor
#   make monitor    serial monitor
#   make verbose    clean rebuild with the full compiler commands in build.log
#   make FLASH_SIZE=4M flash     override any variable on the command line

# ---- Settings you may want to change ----
SKETCH     ?= src
NAME       ?= $(notdir $(abspath $(SKETCH)))
BUILD      ?= build
PORT       ?= /dev/ttyUSB0
BAUD       ?= 921600
MONITOR_BAUD ?= 115200

BOARD      ?= esp32:esp32:esp32
FLASH_SIZE ?= 16M
PARTITION  ?= app3M_fat9M_16MB

# ---- Derived values ----
BOARD_OPTS := FlashSize=$(FLASH_SIZE)
ifneq ($(PARTITION),)
BOARD_OPTS := $(BOARD_OPTS),PartitionScheme=$(PARTITION)
endif

DEFAULT_OPTS := --fqbn $(BOARD) --board-options $(BOARD_OPTS)

.PHONY: all build upload monitor run verbose clean

all: build

build:
	arduino-cli compile $(DEFAULT_OPTS) --build-path $(BUILD) $(SKETCH)

upload:
	arduino-cli upload $(DEFAULT_OPTS) --build-path $(BUILD) --port $(PORT) --verify

monitor:
	arduino-cli monitor $(DEFAULT_OPTS) --port $(PORT)

run: build upload monitor

verbose:
	arduino-cli compile $(DEFAULT_OPTS) --build-path $(BUILD) --clean --verbose $(SKETCH) --log-file build.log --log-level debug

clean:
	rm -rf $(BUILD) build.log

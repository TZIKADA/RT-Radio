#include <iostream>
#include <vector>

#define MAX_DEVICES 50
#define MAX_INTERFACES 5

struct Interface;

struct Device {
    short id;
    Interface* interface;
};

struct Interface {
    int port;
    int freq;
    int state;
    std::vector<Device> dev;
};

std::vector<Device> devices;
std::vector<Interface> interfaces;
int freq_field[2];

void setup() {
    devices.reserve(MAX_DEVICES);
    interfaces.reserve(MAX_INTERFACES);

    // Import device list
    // Import frequency list

    //dev_import(&devices, "<ur;>");
    //int_import(&interfaces, "<url>");
}

void loop()  {
    //dev_spread();
}

#include <iostream>
#include <fstream>
#include <string>

#include "node_mapper.h"

int main(int argc, char** argv) {
  sgnodemapper::NodeMapper mapper("../../nodemapper.js");
  for (int i = 1; i < argc; ++i) {
    std::string out;
    mapper.GraphNodeFromURL(argv[i], &out);
    std::cout << out << "\n";
  }
}

#include <iostream>
#include <fstream>
#include <string>

#include "node_mapper.h"

int main(int argc, char** argv) {
  sgnodemapper::NodeMapper mapper("../../nodemapper.js");
  if (argc < 2) {
    std::cerr << "Usage: " << argv[0] << " url [url2 ...]" << std::endl;
  }

  for (int i = 1; i < argc; ++i) {
    std::string out;
    mapper.GraphNodeFromURL(argv[i], &out);
    std::cout << out << "\n";
  }
}

#include <iostream>
#include <fstream>
#include <string>

#include "node_mapper.h"

int main(int argc, char** argv) {
  sgnodemapper::NodeMapper mapper("../../../nodemapper.js");
  if (argc < 2) {
    std::cerr << "Usage: " << argv[0] << " url [url2 ...]" << std::endl;
  }

  for (int i = 1; i < argc; ++i) {
    std::string out;
    mapper.GraphNodeFromURL(argv[i], &out);
    std::cout << argv[i] << " -> " << out << std::endl;

    std::string profileUrl;
    mapper.GraphNodeToURL(out, "profile", &profileUrl);
    std::cout << "profile(" << out << ") = " << profileUrl << std::endl;
  }

  // bonus: demo of PairToGraphNode (not based on user input)
  std::string host = "twitter.com";
  std::string account = "jsmarr";
  std::string sgnUrl;
  mapper.PairToGraphNode(host, account, &sgnUrl);
  std::cout << "PairToGraphNode: " << host << " + " << account << " = " << sgnUrl << std::endl;
}

fn main() {
    let content = std::fs::read_to_string(
        dirs::config_dir().unwrap().join("niri").join("config.kdl")
    ).unwrap();
    let doc: kdl::KdlDocument = content.parse().unwrap();
    for n in doc.nodes() {
        println!("top-level: {:?}", n.name().value());
    }
    println!("OK - parsed {} top-level nodes", doc.nodes().len());
}

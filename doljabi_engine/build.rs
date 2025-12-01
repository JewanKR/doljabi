use std::io::Result;

fn main() -> Result<()> {
    // `GENERATE_PROTO` 환경 변수가 설정되어 있을 때만 .proto 파일을 컴파일합니다.
    // CI나 협업자는 이 변수 설정 없이 `cargo build`를 실행하게 됩니다.
    if std::env::var("GENERATE_PROTO").is_ok() {
        println!("cargo:rerun-if-changed=protobuf/"); // .proto 파일이 변경되면 다시 실행

        prost_build::Config::new()
            // ★ 중요: 생성된 파일의 출력 위치를 src/proto로 지정합니다.
            .out_dir("src/proto")
            // .proto 파일이 있는 경로와 컴파일할 파일을 지정합니다.
            .compile_protos(
                &["protobuf/badukboard.proto"],
                &["protobuf/"]
            )?;
    }

    Ok(())
}
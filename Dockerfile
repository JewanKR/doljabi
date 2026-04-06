# 1단계: Rust 빌드 (musl 정적 바이너리)
FROM rust:1.77-slim AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN rustup target add x86_64-unknown-linux-musl \
    && apt-get update && apt-get install -y musl-tools \
    && cargo build --release --target x86_64-unknown-linux-musl

# 2단계: alpine 실행
FROM alpine:3.19
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/my-app .
USER app
EXPOSE 3000
CMD ["./my-app"]

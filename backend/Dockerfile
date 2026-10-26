# Etapa 1: build
FROM golang:1.27-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /bin/api ./cmd/api

# Etapa 2: imagen final, mínima
FROM alpine:3.22
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/api /bin/api
EXPOSE 8080
ENTRYPOINT ["/bin/api"]
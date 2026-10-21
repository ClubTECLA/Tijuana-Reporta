# Etapa 1: build
FROM golang:1.27-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/multimedia ./cmd/multimedia

# Etapa 2: imagen final, mínima
FROM alpine:3.22
# Usuario sin privilegios con UID fijo; el directorio se crea con su dueño para
# que un volumen nuevo herede el permiso de escritura.
RUN adduser -D -u 10001 multimedia \
    && mkdir -p /data/uploads \
    && chown multimedia /data/uploads
COPY --from=builder /bin/multimedia /bin/multimedia
ENV UPLOADS_DIR=/data/uploads
USER multimedia
EXPOSE 8081
ENTRYPOINT ["/bin/multimedia"]

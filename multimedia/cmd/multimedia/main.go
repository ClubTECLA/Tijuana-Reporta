package main

import (
	"log"

	"github.com/ClubTECLA/cimalert/multimedia/internal/almacenamiento"
	"github.com/ClubTECLA/cimalert/multimedia/internal/api"
	"github.com/ClubTECLA/cimalert/multimedia/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	almacen, err := almacenamiento.Abrir(cfg.UploadsDir, cfg.CuarentenaDir)
	if err != nil {
		log.Fatalf("Failed to open uploads directory: %v", err)
	}
	defer almacen.Cerrar()

	r := api.NewRouter(api.Opciones{
		MaxArchivoBytes: cfg.MaxArchivoBytes,
		MaxFotoBytes:    cfg.MaxFotoBytes,
		MaxVideoBytes:   cfg.MaxVideoBytes,
		Almacen:         almacen,
	})

	log.Printf("multimedia listening on: %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

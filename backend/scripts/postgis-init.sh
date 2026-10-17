#!/bin/sh
# Reemplaza al 10_postgis.sh de la imagen postgis/postgis (ver docker-compose.yml).
# Ese script crea postgis y otras extensiones al iniciar la base, antes de
# migrate: dbcheck ve spatial_ref_sys sin schema_migrations y frena el arranque,
# y postgis_topology/tiger_geocoder impiden el down de 002_postgis. La
# migración 002_postgis es la única que crea la extensión.

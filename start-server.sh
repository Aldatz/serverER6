#!/bin/bash

# Abre una terminal con el log de la conexión al runner de GitHub
gnome-terminal -- bash -c "echo 'Conexión al runner de GitHub'; tail -f /home/Escritorio/EIAS/EIASserver/actions-runner/run.sh; exec bash"

# Abre una terminal con el monitoreo de PM2
gnome-terminal -- bash -c "echo 'Monit de PM2'; pm2 monit; exec bash"

# Abre una terminal para iniciar el servidor
gnome-terminal -- bash -c "echo 'Iniciando servidor'; cd /home/Escritorio/EIAS/EIASserver/ && pm2 start index.js; exec bash"
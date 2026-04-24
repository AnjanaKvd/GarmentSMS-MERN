#!/bin/bash
set -e

# Export container-local MongoDB URI
export MONGO_URI="mongodb://127.0.0.1:27017/gsms"
export PORT="5000"

# Ensure MongoDB data directory permissions
touch /var/log/mongodb/mongod.log
chown -R mongodb:mongodb /data/db || true

# Start Supervisord (which starts MongoDB → Backend → Nginx)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf